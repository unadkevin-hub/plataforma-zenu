// Registro, ingreso, recuperación de contraseña y aviso de privacidad (RF-01, RF-02)
const express = require('express');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const { pool } = require('../config/db');
const { ALIAS_RE, validarContrasena } = require('../utils/formato');
const { ROLES } = require('../middleware/auth');

const router = express.Router();
const VERSION_AVISO = '1.0';

const limiteIngreso = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: process.env.NODE_ENV === 'test' ? 1000 : 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: (req, res) => res.status(429).render('error', { titulo: 'Demasiados intentos', mensaje: 'Espera 15 minutos antes de intentar de nuevo.' })
});

function destinoSegunRol(rol) {
  if (rol === ROLES.ADMIN) return '/admin/usuarios';
  if (rol === ROLES.FACILITADOR) return '/facilitador';
  return '/panel';
}

function generarCodigoRecuperacion() {
  // 8 caracteres legibles (sin 0/O ni 1/I) en dos grupos: ABCD-EFGH
  const alfabeto = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = crypto.randomBytes(8);
  const c = Array.from(bytes, (b) => alfabeto[b % alfabeto.length]).join('');
  return `${c.slice(0, 4)}-${c.slice(4)}`;
}

function iniciarSesion(req, u) {
  return new Promise((resolve, reject) => {
    req.session.regenerate((err) => {
      if (err) return reject(err);
      req.session.usuario = { id: u.id_usuario, alias: u.alias, rol: u.id_rol };
      resolve();
    });
  });
}

router.get('/', (req, res) => {
  if (req.session.usuario) return res.redirect(destinoSegunRol(req.session.usuario.rol));
  res.render('inicio', { titulo: 'Inicio' });
});

router.get('/privacidad', (req, res) => res.render('privacidad', { titulo: 'Aviso de privacidad', version: VERSION_AVISO }));

router.get('/registro', (req, res) => res.render('registro', { titulo: 'Crear cuenta', errores: [], datos: {} }));

router.post('/registro', limiteIngreso, async (req, res) => {
  const { alias = '', rango_edad = '', contrasena = '', confirmar = '' } = req.body;
  const datos = { alias: alias.trim(), rango_edad };
  const errores = [];
  if (!ALIAS_RE.test(datos.alias)) errores.push('El alias debe tener entre 3 y 30 caracteres: letras, números, punto, guion o guion bajo. No uses tu nombre completo.');
  if (!['15-17', '18-20'].includes(rango_edad)) errores.push('Selecciona tu rango de edad.');
  if (!validarContrasena(contrasena)) errores.push('La contraseña debe tener al menos 8 caracteres, con letras y números.');
  if (contrasena !== confirmar) errores.push('Las contraseñas no coinciden.');
  if (req.body.acepta_privacidad !== 'si') errores.push('Debes leer y aceptar el aviso de privacidad.');
  if (req.body.acepta_tratamiento !== 'si') errores.push('Debes autorizar el tratamiento de datos para fines académicos.');
  if (rango_edad === '15-17' && req.body.asentimiento_menor !== 'si') errores.push('Si tienes entre 15 y 17 años, confirma que tu madre, padre o acudiente firmó el consentimiento informado.');

  if (!errores.length) {
    const [[existe]] = await pool.query('SELECT 1 AS x FROM usuarios WHERE alias = ?', [datos.alias]);
    if (existe) errores.push('Ese alias ya está en uso. Prueba con otro.');
  }
  if (errores.length) return res.status(400).render('registro', { titulo: 'Crear cuenta', errores, datos });

  const codigo = generarCodigoRecuperacion();
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [r] = await conn.query(
      'INSERT INTO usuarios (alias, rango_edad, hash_contrasena, hash_recuperacion, id_rol) VALUES (?,?,?,?,?)',
      [datos.alias, rango_edad, await bcrypt.hash(contrasena, 10), await bcrypt.hash(codigo, 10), ROLES.ESTUDIANTE]
    );
    const tipos = ['aviso_privacidad', 'tratamiento_datos'];
    if (rango_edad === '15-17') tipos.push('asentimiento_menor');
    for (const t of tipos) {
      await conn.query('INSERT INTO consentimientos (id_usuario, tipo, version_texto) VALUES (?,?,?)', [r.insertId, t, VERSION_AVISO]);
    }
    await conn.commit();
    await iniciarSesion(req, { id_usuario: r.insertId, alias: datos.alias, id_rol: ROLES.ESTUDIANTE });
    req.session.codigoRecuperacion = codigo;
    res.redirect('/bienvenida');
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
});

router.get('/bienvenida', (req, res) => {
  if (!req.session.usuario) return res.redirect('/ingresar');
  const codigo = req.session.codigoRecuperacion;
  delete req.session.codigoRecuperacion;
  if (!codigo) return res.redirect('/panel');
  res.render('bienvenida', { titulo: 'Bienvenida', codigo });
});

router.get('/ingresar', (req, res) => res.render('ingresar', { titulo: 'Ingresar', error: null, alias: '' }));

router.post('/ingresar', limiteIngreso, async (req, res) => {
  const alias = String(req.body.alias || '').trim();
  const contrasena = String(req.body.contrasena || '');
  const [[u]] = await pool.query('SELECT * FROM usuarios WHERE alias = ?', [alias]);
  const valido = u && u.activo && await bcrypt.compare(contrasena, u.hash_contrasena);
  if (!valido) {
    return res.status(401).render('ingresar', { titulo: 'Ingresar', error: 'Alias o contraseña incorrectos.', alias });
  }
  await pool.query('UPDATE usuarios SET ultimo_ingreso = NOW() WHERE id_usuario = ?', [u.id_usuario]);
  await iniciarSesion(req, u);
  res.redirect(destinoSegunRol(u.id_rol));
});

router.post('/salir', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('zenu.sid');
    res.redirect('/');
  });
});

router.get('/recuperar', (req, res) => res.render('recuperar', { titulo: 'Recuperar contraseña', error: null, alias: '' }));

router.post('/recuperar', limiteIngreso, async (req, res) => {
  const alias = String(req.body.alias || '').trim();
  const codigo = String(req.body.codigo || '').trim().toUpperCase();
  const { contrasena = '', confirmar = '' } = req.body;
  const render = (error) => res.status(400).render('recuperar', { titulo: 'Recuperar contraseña', error, alias });
  if (!validarContrasena(contrasena)) return render('La nueva contraseña debe tener al menos 8 caracteres, con letras y números.');
  if (contrasena !== confirmar) return render('Las contraseñas no coinciden.');
  const [[u]] = await pool.query('SELECT * FROM usuarios WHERE alias = ? AND activo = 1', [alias]);
  if (!u || !(await bcrypt.compare(codigo, u.hash_recuperacion))) {
    return render('El alias o el código de recuperación no son correctos. Si perdiste el código, pide al facilitador que restablezca tu contraseña.');
  }
  const nuevoCodigo = generarCodigoRecuperacion();
  await pool.query('UPDATE usuarios SET hash_contrasena = ?, hash_recuperacion = ? WHERE id_usuario = ?',
    [await bcrypt.hash(contrasena, 10), await bcrypt.hash(nuevoCodigo, 10), u.id_usuario]);
  await iniciarSesion(req, u);
  req.session.codigoRecuperacion = nuevoCodigo;
  res.redirect('/bienvenida');
});

module.exports = router;
module.exports.generarCodigoRecuperacion = generarCodigoRecuperacion;
