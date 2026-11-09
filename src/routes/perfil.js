// Perfil y derechos del titular de los datos: consultar, actualizar y eliminar (RF-11, Ley 1581 de 2012)
const express = require('express');
const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');
const { requiereSesion } = require('../middleware/auth');
const { ALIAS_RE, validarContrasena } = require('../utils/formato');

const router = express.Router();

async function datosPerfil(id) {
  const [[u]] = await pool.query(`SELECT u.id_usuario, u.alias, u.rango_edad, u.creado_en, u.ultimo_ingreso, r.nombre AS rol
    FROM usuarios u JOIN roles r ON r.id_rol = u.id_rol WHERE u.id_usuario = ?`, [id]);
  const [consentimientos] = await pool.query('SELECT tipo, version_texto, aceptado_en FROM consentimientos WHERE id_usuario = ? ORDER BY aceptado_en', [id]);
  return { u, consentimientos };
}

router.get('/perfil', requiereSesion, async (req, res) => {
  const { u, consentimientos } = await datosPerfil(req.session.usuario.id);
  res.render('perfil', { titulo: 'Mi perfil', perfil: u, consentimientos, errores: [] });
});

router.post('/perfil', requiereSesion, async (req, res) => {
  const alias = String(req.body.alias || '').trim();
  const rango = req.body.rango_edad;
  const errores = [];
  const id = req.session.usuario.id;
  if (!ALIAS_RE.test(alias)) errores.push('El alias debe tener entre 3 y 30 caracteres: letras, números, punto, guion o guion bajo.');
  const rangosPermitidos = req.session.usuario.rol === 1 ? ['15-17', '18-20'] : ['15-17', '18-20', 'adulto'];
  if (!rangosPermitidos.includes(rango)) errores.push('Rango de edad no válido.');
  if (!errores.length) {
    const [[otro]] = await pool.query('SELECT 1 AS x FROM usuarios WHERE alias = ? AND id_usuario <> ?', [alias, id]);
    if (otro) errores.push('Ese alias ya está en uso.');
  }
  if (errores.length) {
    const { u, consentimientos } = await datosPerfil(id);
    return res.status(400).render('perfil', { titulo: 'Mi perfil', perfil: u, consentimientos, errores });
  }
  await pool.query('UPDATE usuarios SET alias = ?, rango_edad = ? WHERE id_usuario = ?', [alias, rango, id]);
  req.session.usuario.alias = alias;
  req.session.flash = { tipo: 'success', texto: 'Datos actualizados.' };
  res.redirect('/perfil');
});

router.post('/perfil/contrasena', requiereSesion, async (req, res) => {
  const { actual = '', nueva = '', confirmar = '' } = req.body;
  const [[u]] = await pool.query('SELECT hash_contrasena FROM usuarios WHERE id_usuario = ?', [req.session.usuario.id]);
  let texto = null;
  if (!(await bcrypt.compare(actual, u.hash_contrasena))) texto = 'La contraseña actual no es correcta.';
  else if (!validarContrasena(nueva)) texto = 'La nueva contraseña debe tener al menos 8 caracteres, con letras y números.';
  else if (nueva !== confirmar) texto = 'Las contraseñas nuevas no coinciden.';
  if (texto) {
    req.session.flash = { tipo: 'danger', texto };
  } else {
    await pool.query('UPDATE usuarios SET hash_contrasena = ? WHERE id_usuario = ?', [await bcrypt.hash(nueva, 10), req.session.usuario.id]);
    req.session.flash = { tipo: 'success', texto: 'Contraseña actualizada.' };
  }
  res.redirect('/perfil');
});

// Descarga de todos los datos personales que guarda la plataforma
router.get('/perfil/mis-datos', requiereSesion, async (req, res) => {
  const id = req.session.usuario.id;
  const { u, consentimientos } = await datosPerfil(id);
  const [resultados] = await pool.query(`SELECT m.titulo AS modulo, l.titulo AS leccion, a.enunciado AS actividad, r.puntaje, r.intentos, r.estado, r.actualizado_en
    FROM resultados r JOIN actividades a ON a.id_actividad = r.id_actividad JOIN lecciones l ON l.id_leccion = a.id_leccion
    JOIN modulos m ON m.id_modulo = l.id_modulo WHERE r.id_usuario = ? ORDER BY r.actualizado_en`, [id]);
  const [lecciones] = await pool.query(`SELECT l.titulo AS leccion, p.completada_en FROM progreso_lecciones p
    JOIN lecciones l ON l.id_leccion = p.id_leccion WHERE p.id_usuario = ?`, [id]);
  res.set('Content-Disposition', `attachment; filename="mis-datos-${u.alias}.json"`);
  res.json({ usuario: u, consentimientos, lecciones_completadas: lecciones, resultados });
});

router.post('/perfil/eliminar', requiereSesion, async (req, res) => {
  const id = req.session.usuario.id;
  const [[u]] = await pool.query('SELECT alias, hash_contrasena, id_rol FROM usuarios WHERE id_usuario = ?', [id]);
  if (u.id_rol === 3) {
    req.session.flash = { tipo: 'warning', texto: 'La cuenta de administrador no se puede eliminar desde aquí.' };
    return res.redirect('/perfil');
  }
  if (req.body.confirmar_alias !== u.alias || !(await bcrypt.compare(req.body.contrasena || '', u.hash_contrasena))) {
    req.session.flash = { tipo: 'danger', texto: 'Para eliminar la cuenta escribe tu alias exacto y tu contraseña.' };
    return res.redirect('/perfil');
  }
  // ON DELETE CASCADE borra consentimientos, progreso y resultados del usuario
  await pool.query('DELETE FROM usuarios WHERE id_usuario = ?', [id]);
  req.session.destroy(() => {
    res.clearCookie('zenu.sid');
    res.render('mensaje', { titulo: 'Cuenta eliminada', mensaje: 'Tu cuenta y todos tus datos fueron eliminados de la plataforma.', usuario: null, flash: null });
  });
});

module.exports = router;
