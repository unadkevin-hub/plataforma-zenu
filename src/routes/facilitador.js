// Panel del facilitador: gestión de contenidos y reportes agregados (RF-09, RF-10)
const express = require('express');
const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');
const { requiereRol, ROLES } = require('../middleware/auth');
const { leccionAHtml } = require('../utils/formato');
const { generarCodigoRecuperacion } = require('./auth');

const router = express.Router();
router.use(requiereRol(ROLES.FACILITADOR, ROLES.ADMIN));

const n = (v) => { const x = Number(v); return Number.isInteger(x) && x > 0 ? x : null; };
const texto = (v, max) => String(v || '').trim().slice(0, max);

router.get('/', async (req, res) => {
  const [modulos] = await pool.query(`
    SELECT m.*, (SELECT COUNT(*) FROM lecciones l WHERE l.id_modulo = m.id_modulo) AS n_lecciones,
      (SELECT COUNT(*) FROM actividades a JOIN lecciones l ON l.id_leccion = a.id_leccion WHERE l.id_modulo = m.id_modulo) AS n_actividades
    FROM modulos m ORDER BY m.orden, m.id_modulo`);
  const [[res1]] = await pool.query(`SELECT
      (SELECT COUNT(*) FROM usuarios WHERE id_rol = 1 AND activo = 1) AS estudiantes,
      (SELECT COUNT(DISTINCT id_usuario) FROM resultados) AS con_actividad,
      (SELECT COUNT(*) FROM resultados) AS respuestas,
      (SELECT ROUND(AVG(puntaje)) FROM resultados) AS promedio`);
  res.render('facilitador/panel', { titulo: 'Panel del facilitador', modulos, resumen: res1 });
});

// ---------- Módulos ----------
function datosModulo(body) {
  return {
    titulo: texto(body.titulo, 120),
    area_digcomp: texto(body.area_digcomp, 80),
    descripcion: texto(body.descripcion, 400),
    orden: Number(body.orden) || 1,
    publicado: body.publicado === 'si' ? 1 : 0
  };
}
function erroresModulo(d) {
  const e = [];
  if (d.titulo.length < 3) e.push('El título debe tener al menos 3 caracteres.');
  if (!d.area_digcomp) e.push('Indica el área DigComp.');
  if (d.descripcion.length < 10) e.push('Escribe una descripción de al menos 10 caracteres.');
  return e;
}

router.get('/modulos/nuevo', (req, res) => res.render('facilitador/modulo-form', { titulo: 'Nuevo módulo', m: { orden: 1 }, errores: [], accion: '/facilitador/modulos' }));

router.post('/modulos', async (req, res) => {
  const d = datosModulo(req.body);
  const errores = erroresModulo(d);
  if (errores.length) return res.status(400).render('facilitador/modulo-form', { titulo: 'Nuevo módulo', m: d, errores, accion: '/facilitador/modulos' });
  await pool.query('INSERT INTO modulos SET ?', d);
  req.session.flash = { tipo: 'success', texto: 'Módulo creado.' };
  res.redirect('/facilitador');
});

router.get('/modulos/:id', async (req, res, next) => {
  const id = n(req.params.id); if (!id) return next();
  const [[m]] = await pool.query('SELECT * FROM modulos WHERE id_modulo = ?', [id]);
  if (!m) return next();
  const [lecciones] = await pool.query(`SELECT l.*, (SELECT COUNT(*) FROM actividades a WHERE a.id_leccion = l.id_leccion) AS n_actividades
    FROM lecciones l WHERE l.id_modulo = ? ORDER BY l.orden, l.id_leccion`, [id]);
  res.render('facilitador/modulo', { titulo: m.titulo, m, lecciones });
});

router.get('/modulos/:id/editar', async (req, res, next) => {
  const id = n(req.params.id); if (!id) return next();
  const [[m]] = await pool.query('SELECT * FROM modulos WHERE id_modulo = ?', [id]);
  if (!m) return next();
  res.render('facilitador/modulo-form', { titulo: 'Editar módulo', m, errores: [], accion: `/facilitador/modulos/${id}` });
});

router.post('/modulos/:id', async (req, res, next) => {
  const id = n(req.params.id); if (!id) return next();
  const d = datosModulo(req.body);
  const errores = erroresModulo(d);
  if (errores.length) return res.status(400).render('facilitador/modulo-form', { titulo: 'Editar módulo', m: { ...d, id_modulo: id }, errores, accion: `/facilitador/modulos/${id}` });
  await pool.query('UPDATE modulos SET ? WHERE id_modulo = ?', [d, id]);
  req.session.flash = { tipo: 'success', texto: 'Módulo actualizado.' };
  res.redirect(`/facilitador/modulos/${id}`);
});

router.post('/modulos/:id/eliminar', async (req, res, next) => {
  const id = n(req.params.id); if (!id) return next();
  await pool.query('DELETE FROM modulos WHERE id_modulo = ?', [id]);
  req.session.flash = { tipo: 'success', texto: 'Módulo eliminado con sus lecciones y actividades.' };
  res.redirect('/facilitador');
});

// ---------- Lecciones ----------
function datosLeccion(body) {
  const url = texto(body.url_video, 255);
  return {
    titulo: texto(body.titulo, 150),
    resumen: texto(body.resumen, 300),
    contenido: String(body.contenido || '').slice(0, 20000),
    url_video: url || null,
    minutos: Math.min(60, Math.max(1, Number(body.minutos) || 5)),
    orden: Number(body.orden) || 1,
    publicado: body.publicado === 'si' ? 1 : 0
  };
}
function erroresLeccion(d) {
  const e = [];
  if (d.titulo.length < 3) e.push('El título debe tener al menos 3 caracteres.');
  if (d.resumen.length < 5) e.push('Escribe un resumen corto.');
  if (d.contenido.trim().length < 20) e.push('El contenido de la lección es muy corto.');
  if (d.url_video && !/^https:\/\/(www\.)?(youtube\.com|youtu\.be|youtube-nocookie\.com)\//.test(d.url_video)) e.push('El video debe ser un enlace https de YouTube.');
  return e;
}

router.get('/modulos/:id/lecciones/nueva', async (req, res, next) => {
  const id = n(req.params.id); if (!id) return next();
  const [[m]] = await pool.query('SELECT id_modulo, titulo FROM modulos WHERE id_modulo = ?', [id]);
  if (!m) return next();
  const [[o]] = await pool.query('SELECT COALESCE(MAX(orden),0)+1 AS sig FROM lecciones WHERE id_modulo = ?', [id]);
  res.render('facilitador/leccion-form', { titulo: 'Nueva lección', m, l: { orden: o.sig, minutos: 5 }, errores: [], accion: `/facilitador/modulos/${id}/lecciones`, vista: null });
});

router.post('/modulos/:id/lecciones', async (req, res, next) => {
  const id = n(req.params.id); if (!id) return next();
  const [[m]] = await pool.query('SELECT id_modulo, titulo FROM modulos WHERE id_modulo = ?', [id]);
  if (!m) return next();
  const d = datosLeccion(req.body);
  const errores = erroresLeccion(d);
  if (errores.length) return res.status(400).render('facilitador/leccion-form', { titulo: 'Nueva lección', m, l: d, errores, accion: `/facilitador/modulos/${id}/lecciones`, vista: null });
  const [r] = await pool.query('INSERT INTO lecciones SET ?', { ...d, id_modulo: id });
  req.session.flash = { tipo: 'success', texto: d.publicado ? 'Lección publicada. Ya la ven los estudiantes.' : 'Lección guardada como borrador.' };
  res.redirect(`/facilitador/lecciones/${r.insertId}`);
});

router.get('/lecciones/:id', async (req, res, next) => {
  const id = n(req.params.id); if (!id) return next();
  const [[l]] = await pool.query('SELECT l.*, m.titulo AS modulo FROM lecciones l JOIN modulos m ON m.id_modulo = l.id_modulo WHERE l.id_leccion = ?', [id]);
  if (!l) return next();
  const [actividades] = await pool.query('SELECT * FROM actividades WHERE id_leccion = ? ORDER BY orden, id_actividad', [id]);
  actividades.forEach((a) => { if (typeof a.opciones === 'string') a.opciones = JSON.parse(a.opciones); });
  res.render('facilitador/leccion', { titulo: l.titulo, l, actividades, html: leccionAHtml(l.contenido) });
});

router.get('/lecciones/:id/editar', async (req, res, next) => {
  const id = n(req.params.id); if (!id) return next();
  const [[l]] = await pool.query('SELECT * FROM lecciones WHERE id_leccion = ?', [id]);
  if (!l) return next();
  const [[m]] = await pool.query('SELECT id_modulo, titulo FROM modulos WHERE id_modulo = ?', [l.id_modulo]);
  res.render('facilitador/leccion-form', { titulo: 'Editar lección', m, l, errores: [], accion: `/facilitador/lecciones/${id}`, vista: null });
});

router.post('/lecciones/:id', async (req, res, next) => {
  const id = n(req.params.id); if (!id) return next();
  const [[l0]] = await pool.query('SELECT id_modulo FROM lecciones WHERE id_leccion = ?', [id]);
  if (!l0) return next();
  const d = datosLeccion(req.body);
  const errores = erroresLeccion(d);
  if (errores.length) {
    const [[m]] = await pool.query('SELECT id_modulo, titulo FROM modulos WHERE id_modulo = ?', [l0.id_modulo]);
    return res.status(400).render('facilitador/leccion-form', { titulo: 'Editar lección', m, l: { ...d, id_leccion: id }, errores, accion: `/facilitador/lecciones/${id}`, vista: null });
  }
  await pool.query('UPDATE lecciones SET ? WHERE id_leccion = ?', [d, id]);
  req.session.flash = { tipo: 'success', texto: 'Lección actualizada.' };
  res.redirect(`/facilitador/lecciones/${id}`);
});

router.post('/lecciones/:id/eliminar', async (req, res, next) => {
  const id = n(req.params.id); if (!id) return next();
  const [[l]] = await pool.query('SELECT id_modulo FROM lecciones WHERE id_leccion = ?', [id]);
  if (!l) return next();
  await pool.query('DELETE FROM lecciones WHERE id_leccion = ?', [id]);
  req.session.flash = { tipo: 'success', texto: 'Lección eliminada.' };
  res.redirect(`/facilitador/modulos/${l.id_modulo}`);
});

// ---------- Actividades ----------
function datosActividad(body) {
  const opciones = [body.opcion0, body.opcion1, body.opcion2, body.opcion3].map((o) => texto(o, 200)).filter(Boolean);
  return {
    tipo: ['seleccion', 'caso', 'tarea_guiada'].includes(body.tipo) ? body.tipo : 'seleccion',
    enunciado: texto(body.enunciado, 600),
    opciones,
    respuesta: Number(body.respuesta),
    retroalimentacion: texto(body.retroalimentacion, 600),
    orden: Number(body.orden) || 1
  };
}
function erroresActividad(d) {
  const e = [];
  if (d.enunciado.length < 10) e.push('El enunciado es muy corto.');
  if (d.opciones.length < 2) e.push('Escribe al menos dos opciones.');
  if (!Number.isInteger(d.respuesta) || d.respuesta < 0 || d.respuesta >= d.opciones.length) e.push('Marca cuál opción es la correcta (debe tener texto).');
  if (d.retroalimentacion.length < 10) e.push('Escribe la retroalimentación que verá el estudiante.');
  return e;
}

router.get('/lecciones/:id/actividades/nueva', async (req, res, next) => {
  const id = n(req.params.id); if (!id) return next();
  const [[l]] = await pool.query('SELECT id_leccion, titulo FROM lecciones WHERE id_leccion = ?', [id]);
  if (!l) return next();
  const [[o]] = await pool.query('SELECT COALESCE(MAX(orden),0)+1 AS sig FROM actividades WHERE id_leccion = ?', [id]);
  res.render('facilitador/actividad-form', { titulo: 'Nueva actividad', l, a: { opciones: [], orden: o.sig, respuesta: 0 }, errores: [], accion: `/facilitador/lecciones/${id}/actividades` });
});

router.post('/lecciones/:id/actividades', async (req, res, next) => {
  const id = n(req.params.id); if (!id) return next();
  const [[l]] = await pool.query('SELECT id_leccion, titulo FROM lecciones WHERE id_leccion = ?', [id]);
  if (!l) return next();
  const d = datosActividad(req.body);
  const errores = erroresActividad(d);
  if (errores.length) return res.status(400).render('facilitador/actividad-form', { titulo: 'Nueva actividad', l, a: d, errores, accion: `/facilitador/lecciones/${id}/actividades` });
  await pool.query('INSERT INTO actividades (id_leccion, tipo, enunciado, opciones, respuesta, retroalimentacion, orden) VALUES (?,?,?,?,?,?,?)',
    [id, d.tipo, d.enunciado, JSON.stringify(d.opciones), d.respuesta, d.retroalimentacion, d.orden]);
  req.session.flash = { tipo: 'success', texto: 'Actividad creada.' };
  res.redirect(`/facilitador/lecciones/${id}`);
});

router.get('/actividades/:id/editar', async (req, res, next) => {
  const id = n(req.params.id); if (!id) return next();
  const [[a]] = await pool.query('SELECT * FROM actividades WHERE id_actividad = ?', [id]);
  if (!a) return next();
  if (typeof a.opciones === 'string') a.opciones = JSON.parse(a.opciones);
  const [[l]] = await pool.query('SELECT id_leccion, titulo FROM lecciones WHERE id_leccion = ?', [a.id_leccion]);
  res.render('facilitador/actividad-form', { titulo: 'Editar actividad', l, a, errores: [], accion: `/facilitador/actividades/${id}` });
});

router.post('/actividades/:id', async (req, res, next) => {
  const id = n(req.params.id); if (!id) return next();
  const [[a0]] = await pool.query('SELECT id_leccion FROM actividades WHERE id_actividad = ?', [id]);
  if (!a0) return next();
  const d = datosActividad(req.body);
  const errores = erroresActividad(d);
  if (errores.length) {
    const [[l]] = await pool.query('SELECT id_leccion, titulo FROM lecciones WHERE id_leccion = ?', [a0.id_leccion]);
    return res.status(400).render('facilitador/actividad-form', { titulo: 'Editar actividad', l, a: { ...d, id_actividad: id }, errores, accion: `/facilitador/actividades/${id}` });
  }
  await pool.query('UPDATE actividades SET tipo=?, enunciado=?, opciones=?, respuesta=?, retroalimentacion=?, orden=? WHERE id_actividad=?',
    [d.tipo, d.enunciado, JSON.stringify(d.opciones), d.respuesta, d.retroalimentacion, d.orden, id]);
  req.session.flash = { tipo: 'success', texto: 'Actividad actualizada.' };
  res.redirect(`/facilitador/lecciones/${a0.id_leccion}`);
});

router.post('/actividades/:id/eliminar', async (req, res, next) => {
  const id = n(req.params.id); if (!id) return next();
  const [[a]] = await pool.query('SELECT id_leccion FROM actividades WHERE id_actividad = ?', [id]);
  if (!a) return next();
  await pool.query('DELETE FROM actividades WHERE id_actividad = ?', [id]);
  req.session.flash = { tipo: 'success', texto: 'Actividad eliminada.' };
  res.redirect(`/facilitador/lecciones/${a.id_leccion}`);
});

// ---------- Reportes agregados, sin datos identificables (RF-10) ----------
router.get('/reportes', async (req, res) => {
  const [[general]] = await pool.query(`SELECT
      (SELECT COUNT(*) FROM usuarios WHERE id_rol = 1 AND activo = 1) AS estudiantes,
      (SELECT COUNT(*) FROM usuarios WHERE id_rol = 1 AND rango_edad = '15-17') AS r1517,
      (SELECT COUNT(*) FROM usuarios WHERE id_rol = 1 AND rango_edad = '18-20') AS r1820`);
  const [modulos] = await pool.query(`
    SELECT m.id_modulo, m.titulo,
      (SELECT COUNT(*) FROM lecciones l WHERE l.id_modulo = m.id_modulo AND l.publicado = 1) AS lecciones,
      (SELECT COUNT(DISTINCT p.id_usuario) FROM progreso_lecciones p JOIN lecciones l ON l.id_leccion = p.id_leccion
         JOIN usuarios u ON u.id_usuario = p.id_usuario WHERE l.id_modulo = m.id_modulo AND u.id_rol = 1) AS iniciaron,
      (SELECT ROUND(AVG(r.puntaje)) FROM resultados r JOIN actividades a ON a.id_actividad = r.id_actividad
         JOIN lecciones l ON l.id_leccion = a.id_leccion WHERE l.id_modulo = m.id_modulo) AS promedio,
      (SELECT ROUND(AVG(r.intentos),1) FROM resultados r JOIN actividades a ON a.id_actividad = r.id_actividad
         JOIN lecciones l ON l.id_leccion = a.id_leccion WHERE l.id_modulo = m.id_modulo) AS intentos
    FROM modulos m ORDER BY m.orden`);
  // Estudiantes que completaron todas las lecciones publicadas de cada módulo
  const [completos] = await pool.query(`
    SELECT l.id_modulo, p.id_usuario, COUNT(*) AS hechas
    FROM progreso_lecciones p JOIN lecciones l ON l.id_leccion = p.id_leccion
    JOIN usuarios u ON u.id_usuario = p.id_usuario
    WHERE l.publicado = 1 AND u.id_rol = 1
    GROUP BY l.id_modulo, p.id_usuario`);
  modulos.forEach((m) => {
    m.completaron = completos.filter((c) => c.id_modulo === m.id_modulo && Number(c.hechas) === Number(m.lecciones) && m.lecciones > 0).length;
  });
  const [dificiles] = await pool.query(`
    SELECT a.id_actividad, a.enunciado, l.titulo AS leccion, COUNT(r.id_resultado) AS respuestas,
      ROUND(100 * SUM(r.estado = 'aprobada') / COUNT(r.id_resultado)) AS pct_aprobacion, ROUND(AVG(r.intentos),1) AS intentos
    FROM actividades a JOIN lecciones l ON l.id_leccion = a.id_leccion
    JOIN resultados r ON r.id_actividad = a.id_actividad
    GROUP BY a.id_actividad, a.enunciado, l.titulo
    ORDER BY pct_aprobacion ASC, intentos DESC LIMIT 5`);
  res.render('facilitador/reportes', { titulo: 'Reportes del grupo', general, modulos, dificiles });
});

// ---------- Estudiantes: restablecer contraseña ----------
router.get('/estudiantes', async (req, res) => {
  const [estudiantes] = await pool.query(`SELECT id_usuario, alias, rango_edad, creado_en, ultimo_ingreso
    FROM usuarios WHERE id_rol = 1 AND activo = 1 ORDER BY alias`);
  const temporal = req.session.temporal || null;
  delete req.session.temporal;
  res.render('facilitador/estudiantes', { titulo: 'Estudiantes', estudiantes, temporal });
});

router.post('/estudiantes/:id/restablecer', async (req, res, next) => {
  const id = n(req.params.id); if (!id) return next();
  const [[u]] = await pool.query('SELECT alias FROM usuarios WHERE id_usuario = ? AND id_rol = 1', [id]);
  if (!u) return next();
  const temporal = 'Zenu-' + generarCodigoRecuperacion().replace('-', '') + '7';
  await pool.query('UPDATE usuarios SET hash_contrasena = ? WHERE id_usuario = ?', [await bcrypt.hash(temporal, 10), id]);
  req.session.temporal = { alias: u.alias, clave: temporal };
  res.redirect('/facilitador/estudiantes');
});

module.exports = router;
