// Crea la base de datos, las tablas, las cuentas iniciales y los contenidos.
// Uso: npm run db:init
require('dotenv').config({ quiet: true });
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const contenidos = require('./contenidos');

async function init({ dbName = process.env.DB_NAME || 'plataforma_zenu', silencioso = false } = {}) {
  const log = (...a) => { if (!silencioso) console.log(...a); };
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true,
    charset: 'utf8mb4'
  });
  await conn.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  await conn.query(`USE \`${dbName}\``);
  await conn.query(fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8'));
  log('✔ Tablas creadas');

  const cuentas = [
    ['admin', 'adulto', process.env.ADMIN_PASSWORD || 'Admin-Zenu-2026', 3],
    ['facilitador', 'adulto', process.env.FACILITADOR_PASSWORD || 'Facilitador-Zenu-2026', 2]
  ];
  for (const [alias, rango, clave, rol] of cuentas) {
    const [r] = await conn.query(
      'INSERT INTO usuarios (alias, rango_edad, hash_contrasena, hash_recuperacion, id_rol) VALUES (?,?,?,?,?)',
      [alias, rango, await bcrypt.hash(clave, 10), await bcrypt.hash(clave + '-recuperacion', 10), rol]
    );
    await conn.query('INSERT INTO consentimientos (id_usuario, tipo, version_texto) VALUES (?,?,?), (?,?,?)',
      [r.insertId, 'aviso_privacidad', '1.0', r.insertId, 'tratamiento_datos', '1.0']);
  }
  log('✔ Cuentas iniciales: admin y facilitador');

  let mOrden = 1;
  for (const m of contenidos) {
    const [rm] = await conn.query(
      'INSERT INTO modulos (titulo, area_digcomp, descripcion, icono, orden, publicado) VALUES (?,?,?,?,?,1)',
      [m.titulo, m.area_digcomp, m.descripcion, m.icono, mOrden++]
    );
    let lOrden = 1;
    for (const l of m.lecciones) {
      const [rl] = await conn.query(
        'INSERT INTO lecciones (id_modulo, titulo, resumen, contenido, url_video, minutos, orden, publicado) VALUES (?,?,?,?,?,?,?,1)',
        [rm.insertId, l.titulo, l.resumen, l.contenido, l.url_video || null, l.minutos, lOrden++]
      );
      let aOrden = 1;
      for (const a of l.actividades) {
        await conn.query(
          'INSERT INTO actividades (id_leccion, tipo, enunciado, opciones, respuesta, retroalimentacion, orden) VALUES (?,?,?,?,?,?,?)',
          [rl.insertId, a.tipo || 'seleccion', a.enunciado, JSON.stringify(a.opciones), a.respuesta, a.retroalimentacion, aOrden++]
        );
      }
    }
  }
  log('✔ Contenidos cargados: 3 módulos, 9 lecciones, 27 actividades');
  await conn.end();
}

if (require.main === module) {
  init().then(() => process.exit(0)).catch((e) => { console.error('Error inicializando la base de datos:', e.message); process.exit(1); });
}

module.exports = init;
