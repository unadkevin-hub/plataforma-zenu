// Simulación de uso con 25 participantes virtuales sobre el prototipo real (datos simulados, no corresponden a personas).
// Uso: node scripts/simulacion-uso.js   (crea y usa la base de datos plataforma_zenu_simulacion)
process.env.DB_NAME = 'plataforma_zenu_simulacion';
process.env.NODE_ENV = 'test';
require('dotenv').config({ quiet: true });
const request = require('supertest');
const init = require('../database/init');

let semilla = 20261116;
const azar = () => { semilla = (semilla * 1103515245 + 12345) % 2147483648; return semilla / 2147483648; };

(async () => {
  await init({ dbName: process.env.DB_NAME, silencioso: true });
  const app = require('../src/app');
  await app.locals.sessionStore.onReady();
  const { pool } = require('../src/config/db');
  const [acts] = await pool.query('SELECT id_actividad, respuesta, JSON_LENGTH(opciones) AS n FROM actividades ORDER BY id_actividad');
  const token = (html) => (html.match(/name="_csrf" value="([a-f0-9]+)"/) || [])[1];
  for (let i = 1; i <= 25; i++) {
    const a = request.agent(app);
    const t0 = token((await a.get('/registro')).text);
    const rango = i <= 13 ? '15-17' : '18-20';
    await a.post('/registro').type('form').send({ _csrf: t0, alias: `participante_${String(i).padStart(2, '0')}`, rango_edad: rango,
      contrasena: 'Simulacion-2026', confirmar: 'Simulacion-2026', acepta_privacidad: 'si', acepta_tratamiento: 'si', asentimiento_menor: 'si' });
    const t = token((await a.get('/privacidad')).text);
    const habilidad = 0.45 + azar() * 0.45;          // probabilidad de acertar en el primer intento
    const abandona = azar() < 0.12 ? 18 + Math.floor(azar() * 6) : 99; // algunos no terminan
    for (const [k, act] of acts.entries()) {
      if (k >= abandona) break;
      let ok = false;
      for (let intento = 0; intento < 3 && !ok; intento++) {
        const p = Math.min(0.97, habilidad + intento * 0.25);
        const elegida = azar() < p ? act.respuesta : (act.respuesta + 1 + Math.floor(azar() * (act.n - 1))) % act.n;
        const r = await a.post(`/actividades/${act.id_actividad}/responder`).set('Accept', 'application/json').set('X-CSRF-Token', t).send({ opcion: elegida });
        ok = r.body.correcta;
      }
    }
  }
  const [[g]] = await pool.query(`SELECT COUNT(*) AS respuestas, ROUND(AVG(puntaje),1) AS puntaje, ROUND(AVG(intentos),2) AS intentos,
    ROUND(100*AVG(estado='aprobada'),1) AS aprobacion FROM resultados`);
  const [mods] = await pool.query(`SELECT m.titulo, COUNT(DISTINCT p.id_usuario) AS iniciaron,
      SUM(1) AS lecc_completadas FROM modulos m JOIN lecciones l ON l.id_modulo=m.id_modulo
      LEFT JOIN progreso_lecciones p ON p.id_leccion=l.id_leccion GROUP BY m.id_modulo ORDER BY m.orden`);
  const [comp] = await pool.query(`SELECT l.id_modulo, p.id_usuario, COUNT(*) c FROM progreso_lecciones p JOIN lecciones l USING(id_leccion) GROUP BY l.id_modulo, p.id_usuario`);
  const [porMod] = await pool.query(`SELECT l.id_modulo, ROUND(100*AVG(r.estado='aprobada'),1) aprob, ROUND(AVG(r.intentos),2) intentos,
      ROUND(100*AVG(r.intentos=1 AND r.estado='aprobada'),1) primer_intento
    FROM resultados r JOIN actividades a USING(id_actividad) JOIN lecciones l USING(id_leccion) GROUP BY l.id_modulo ORDER BY l.id_modulo`);
  const salida = { general: g, modulos: porMod.map((m, i) => ({ ...m, titulo: mods[i].titulo,
    completaron: comp.filter((c) => c.id_modulo === m.id_modulo && c.c === 3).length })) };
  console.log(JSON.stringify(salida, null, 1));
  require('fs').writeFileSync('docs/evidencias/simulacion-uso.json', JSON.stringify(salida, null, 1));
  await app.locals.sessionStore.close(); await pool.end();
})();
