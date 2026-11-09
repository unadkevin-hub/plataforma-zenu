// Administración: usuarios, roles y exportación anonimizada (RF-03, RF-12)
const express = require('express');
const crypto = require('crypto');
const { pool } = require('../config/db');
const { requiereRol, ROLES } = require('../middleware/auth');

const router = express.Router();
router.use(requiereRol(ROLES.ADMIN));

router.get('/usuarios', async (req, res) => {
  const [usuarios] = await pool.query(`SELECT u.id_usuario, u.alias, u.rango_edad, u.activo, u.creado_en, u.ultimo_ingreso, u.id_rol, r.nombre AS rol,
      (SELECT COUNT(*) FROM resultados x WHERE x.id_usuario = u.id_usuario) AS respuestas
    FROM usuarios u JOIN roles r ON r.id_rol = u.id_rol ORDER BY u.id_rol DESC, u.alias`);
  const [roles] = await pool.query('SELECT * FROM roles ORDER BY id_rol');
  res.render('admin/usuarios', { titulo: 'Usuarios y roles', usuarios, roles });
});

router.post('/usuarios/:id/rol', async (req, res) => {
  const id = Number(req.params.id);
  const rol = Number(req.body.id_rol);
  if (id === req.session.usuario.id) {
    req.session.flash = { tipo: 'warning', texto: 'No puedes cambiar tu propio rol.' };
  } else if (![1, 2, 3].includes(rol)) {
    req.session.flash = { tipo: 'danger', texto: 'Rol no válido.' };
  } else {
    await pool.query('UPDATE usuarios SET id_rol = ? WHERE id_usuario = ?', [rol, id]);
    req.session.flash = { tipo: 'success', texto: 'Rol actualizado.' };
  }
  res.redirect('/admin/usuarios');
});

router.post('/usuarios/:id/estado', async (req, res) => {
  const id = Number(req.params.id);
  if (id === req.session.usuario.id) {
    req.session.flash = { tipo: 'warning', texto: 'No puedes desactivar tu propia cuenta.' };
  } else {
    await pool.query('UPDATE usuarios SET activo = 1 - activo WHERE id_usuario = ?', [id]);
    req.session.flash = { tipo: 'success', texto: 'Estado de la cuenta actualizado.' };
  }
  res.redirect('/admin/usuarios');
});

// Exportación CSV anonimizada: el alias se reemplaza por un código seudónimo irreversible
function seudonimo(id) {
  const sal = process.env.SESSION_SECRET || 'sal';
  return 'P' + crypto.createHmac('sha256', sal).update(String(id)).digest('hex').slice(0, 8).toUpperCase();
}
const csv = (v) => {
  const s = v === null || v === undefined ? '' : String(v);
  return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

router.get('/exportar.csv', async (req, res) => {
  const [filas] = await pool.query(`
    SELECT u.id_usuario, u.rango_edad, m.titulo AS modulo, l.titulo AS leccion, a.id_actividad, r.puntaje, r.intentos, r.estado,
      DATE_FORMAT(r.actualizado_en, '%Y-%m-%d') AS fecha
    FROM resultados r JOIN usuarios u ON u.id_usuario = r.id_usuario
    JOIN actividades a ON a.id_actividad = r.id_actividad
    JOIN lecciones l ON l.id_leccion = a.id_leccion JOIN modulos m ON m.id_modulo = l.id_modulo
    WHERE u.id_rol = 1 ORDER BY u.id_usuario, a.id_actividad`);
  const cab = ['participante', 'rango_edad', 'modulo', 'leccion', 'id_actividad', 'puntaje', 'intentos', 'estado', 'fecha'];
  const cuerpo = filas.map((f) => [seudonimo(f.id_usuario), f.rango_edad, f.modulo, f.leccion, f.id_actividad, f.puntaje, f.intentos, f.estado, f.fecha].map(csv).join(','));
  res.set('Content-Type', 'text/csv; charset=utf-8');
  res.set('Content-Disposition', 'attachment; filename="resultados-anonimizados.csv"');
  res.send('﻿' + [cab.join(','), ...cuerpo].join('\n'));
});

module.exports = router;
