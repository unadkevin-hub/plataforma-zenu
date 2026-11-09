// Panel del estudiante, módulos, lecciones, actividades y progreso (RF-04 a RF-08)
const express = require('express');
const { pool } = require('../config/db');
const { requiereSesion } = require('../middleware/auth');
const { leccionAHtml, barajar } = require('../utils/formato');
const { modulosConProgreso, calcularLogros, actualizarCompletitudLeccion } = require('../models');

const router = express.Router();

function idValido(v) {
  const n = Number(v);
  return Number.isInteger(n) && n > 0 ? n : null;
}

async function siguienteModulo(idModulo) {
  const [[m]] = await pool.query(`
    SELECT s.id_modulo, s.titulo FROM modulos s, modulos a
    WHERE a.id_modulo = ? AND s.publicado = 1 AND (s.orden, s.id_modulo) > (a.orden, a.id_modulo)
    ORDER BY s.orden, s.id_modulo LIMIT 1`, [idModulo]);
  return m || null;
}

router.get('/panel', requiereSesion, async (req, res) => {
  const modulos = await modulosConProgreso(req.session.usuario.id);
  const [[siguiente]] = await pool.query(`
    SELECT l.id_leccion, l.titulo, m.titulo AS modulo
    FROM lecciones l JOIN modulos m ON m.id_modulo = l.id_modulo
    LEFT JOIN progreso_lecciones p ON p.id_leccion = l.id_leccion AND p.id_usuario = ?
    WHERE l.publicado = 1 AND m.publicado = 1 AND p.id_leccion IS NULL
    ORDER BY m.orden, l.orden LIMIT 1`, [req.session.usuario.id]);
  res.render('estudiante/panel', { titulo: 'Mi panel', modulos, siguiente });
});

router.get('/modulos/:id', requiereSesion, async (req, res, next) => {
  const id = idValido(req.params.id);
  if (!id) return next();
  const [[modulo]] = await pool.query('SELECT * FROM modulos WHERE id_modulo = ? AND publicado = 1', [id]);
  if (!modulo) return next();
  const [lecciones] = await pool.query(`
    SELECT l.id_leccion, l.titulo, l.resumen, l.minutos, l.orden, p.completada_en,
      (SELECT COUNT(*) FROM actividades a WHERE a.id_leccion = l.id_leccion) AS total_actividades
    FROM lecciones l
    LEFT JOIN progreso_lecciones p ON p.id_leccion = l.id_leccion AND p.id_usuario = ?
    WHERE l.id_modulo = ? AND l.publicado = 1
    ORDER BY l.orden, l.id_leccion`, [req.session.usuario.id, id]);
  const completadas = lecciones.filter((l) => l.completada_en).length;
  res.render('estudiante/modulo', {
    titulo: modulo.titulo, modulo, lecciones, siguienteModulo: await siguienteModulo(id),
    avance: lecciones.length ? Math.round((completadas / lecciones.length) * 100) : 0
  });
});

router.get('/lecciones/:id', requiereSesion, async (req, res, next) => {
  const id = idValido(req.params.id);
  if (!id) return next();
  const [[leccion]] = await pool.query(`
    SELECT l.*, m.titulo AS modulo, m.id_modulo
    FROM lecciones l JOIN modulos m ON m.id_modulo = l.id_modulo
    WHERE l.id_leccion = ? AND l.publicado = 1 AND m.publicado = 1`, [id]);
  if (!leccion) return next();
  const [actividades] = await pool.query(`
    SELECT a.id_actividad, a.enunciado, a.opciones, a.orden, r.estado, r.intentos
    FROM actividades a
    LEFT JOIN resultados r ON r.id_actividad = a.id_actividad AND r.id_usuario = ?
    WHERE a.id_leccion = ? ORDER BY a.orden, a.id_actividad`, [req.session.usuario.id, id]);
  actividades.forEach((a) => {
    if (typeof a.opciones === 'string') a.opciones = JSON.parse(a.opciones);
    a.orden_opciones = barajar(a.opciones.length, `${req.session.usuario.id}-${a.id_actividad}`);
  });
  const [[completada]] = await pool.query('SELECT 1 AS x FROM progreso_lecciones WHERE id_usuario = ? AND id_leccion = ?', [req.session.usuario.id, id]);
  const [[vecinas]] = await pool.query(`
    SELECT
      (SELECT id_leccion FROM lecciones WHERE id_modulo = ? AND publicado = 1 AND (orden, id_leccion) < (?, ?) ORDER BY orden DESC, id_leccion DESC LIMIT 1) AS anterior,
      (SELECT id_leccion FROM lecciones WHERE id_modulo = ? AND publicado = 1 AND (orden, id_leccion) > (?, ?) ORDER BY orden, id_leccion LIMIT 1) AS siguiente`,
  [leccion.id_modulo, leccion.orden, leccion.id_leccion, leccion.id_modulo, leccion.orden, leccion.id_leccion]);
  const retro = req.session.retro || null;
  delete req.session.retro;
  res.render('estudiante/leccion', {
    titulo: leccion.titulo, leccion, actividades, html: leccionAHtml(leccion.contenido),
    completada: !!completada, vecinas, retro,
    siguienteModulo: vecinas.siguiente ? null : await siguienteModulo(leccion.id_modulo)
  });
});

// Responder una actividad: devuelve retroalimentación inmediata (JSON) o redirige si no hay JavaScript
router.post('/actividades/:id/responder', requiereSesion, async (req, res, next) => {
  const id = idValido(req.params.id);
  if (!id) return next();
  const [[act]] = await pool.query(`
    SELECT a.*, l.id_leccion FROM actividades a
    JOIN lecciones l ON l.id_leccion = a.id_leccion
    JOIN modulos m ON m.id_modulo = l.id_modulo
    WHERE a.id_actividad = ? AND l.publicado = 1 AND m.publicado = 1`, [id]);
  if (!act) return next();
  const opciones = typeof act.opciones === 'string' ? JSON.parse(act.opciones) : act.opciones;
  const elegida = Number(req.body.opcion);
  const quiereJson = req.is('application/json') || (req.get('accept') || '').includes('application/json');
  if (!Number.isInteger(elegida) || elegida < 0 || elegida >= opciones.length) {
    if (quiereJson) return res.status(400).json({ error: 'Selecciona una opción.' });
    req.session.flash = { tipo: 'warning', texto: 'Selecciona una opción antes de enviar.' };
    return res.redirect(`/lecciones/${act.id_leccion}#actividad-${id}`);
  }
  const correcta = elegida === act.respuesta;
  const uid = req.session.usuario.id;
  await pool.query(`
    INSERT INTO resultados (id_usuario, id_actividad, puntaje, intentos, estado) VALUES (?, ?, ?, 1, ?)
    ON DUPLICATE KEY UPDATE
      intentos = intentos + 1,
      puntaje = GREATEST(puntaje, VALUES(puntaje)),
      estado = IF(estado = 'aprobada' OR VALUES(estado) = 'aprobada', 'aprobada', 'no_aprobada')`,
  [uid, id, correcta ? 100 : 0, correcta ? 'aprobada' : 'no_aprobada']);
  const leccionCompletada = await actualizarCompletitudLeccion(uid, act.id_leccion);
  const [[r]] = await pool.query('SELECT intentos, estado FROM resultados WHERE id_usuario = ? AND id_actividad = ?', [uid, id]);
  const cuerpo = {
    correcta,
    respuestaCorrecta: opciones[act.respuesta],
    retroalimentacion: act.retroalimentacion,
    intentos: r.intentos,
    estado: r.estado,
    leccionCompletada
  };
  if (quiereJson) return res.json(cuerpo);
  req.session.retro = { id, ...cuerpo };
  res.redirect(`/lecciones/${act.id_leccion}#actividad-${id}`);
});

// Lecciones sin actividades se completan manualmente
router.post('/lecciones/:id/completar', requiereSesion, async (req, res, next) => {
  const id = idValido(req.params.id);
  if (!id) return next();
  const [[l]] = await pool.query(`SELECT l.id_leccion, (SELECT COUNT(*) FROM actividades a WHERE a.id_leccion = l.id_leccion) AS n
    FROM lecciones l WHERE l.id_leccion = ? AND l.publicado = 1`, [id]);
  if (!l) return next();
  if (Number(l.n) === 0) {
    await pool.query('INSERT IGNORE INTO progreso_lecciones (id_usuario, id_leccion) VALUES (?, ?)', [req.session.usuario.id, id]);
    req.session.flash = { tipo: 'success', texto: 'Lección completada.' };
  } else {
    req.session.flash = { tipo: 'info', texto: 'Responde todas las actividades para completar la lección.' };
  }
  res.redirect(`/lecciones/${id}`);
});

router.get('/progreso', requiereSesion, async (req, res) => {
  const modulos = await modulosConProgreso(req.session.usuario.id);
  const [[tot]] = await pool.query(`SELECT COUNT(*) AS respondidas, COALESCE(SUM(estado='aprobada'),0) AS aprobadas, COALESCE(SUM(intentos),0) AS intentos
    FROM resultados WHERE id_usuario = ?`, [req.session.usuario.id]);
  res.render('estudiante/progreso', { titulo: 'Mi progreso', modulos, logros: calcularLogros(modulos), tot });
});

module.exports = router;
