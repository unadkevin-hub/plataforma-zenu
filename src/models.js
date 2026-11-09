// Consultas reutilizables sobre módulos, lecciones, actividades y progreso
const { pool } = require('./config/db');

async function modulosConProgreso(idUsuario, soloPublicados = true) {
  const [rows] = await pool.query(`
    SELECT m.*,
      (SELECT COUNT(*) FROM lecciones l WHERE l.id_modulo = m.id_modulo AND l.publicado = 1) AS total_lecciones,
      (SELECT COUNT(*) FROM progreso_lecciones p JOIN lecciones l ON l.id_leccion = p.id_leccion
        WHERE l.id_modulo = m.id_modulo AND l.publicado = 1 AND p.id_usuario = ?) AS lecciones_completadas,
      (SELECT COUNT(*) FROM actividades a JOIN lecciones l ON l.id_leccion = a.id_leccion
        WHERE l.id_modulo = m.id_modulo AND l.publicado = 1) AS total_actividades,
      (SELECT COUNT(*) FROM resultados r JOIN actividades a ON a.id_actividad = r.id_actividad
        JOIN lecciones l ON l.id_leccion = a.id_leccion
        WHERE l.id_modulo = m.id_modulo AND l.publicado = 1 AND r.id_usuario = ? AND r.estado = 'aprobada') AS actividades_aprobadas
    FROM modulos m
    ${soloPublicados ? 'WHERE m.publicado = 1' : ''}
    ORDER BY m.orden, m.id_modulo`, [idUsuario, idUsuario]);
  return rows.map((m) => ({
    ...m,
    avance: m.total_lecciones ? Math.round((m.lecciones_completadas / m.total_lecciones) * 100) : 0
  }));
}

function calcularLogros(modulos) {
  const logros = [];
  const totalAprob = modulos.reduce((s, m) => s + Number(m.actividades_aprobadas), 0);
  if (totalAprob >= 1) logros.push({ icono: 'logro-inicio.svg', titulo: 'Primer acierto', detalle: 'Respondiste bien tu primera actividad.' });
  for (const m of modulos) {
    if (m.total_lecciones && m.avance === 100) logros.push({ icono: 'logro-modulo.svg', titulo: `Módulo completado: ${m.titulo}`, detalle: 'Terminaste todas las lecciones del módulo.' });
    if (m.total_actividades && Number(m.actividades_aprobadas) === Number(m.total_actividades)) logros.push({ icono: 'logro-estrella.svg', titulo: `Todo correcto en ${m.titulo}`, detalle: 'Aprobaste todas las actividades del módulo.' });
  }
  return logros;
}

async function actualizarCompletitudLeccion(idUsuario, idLeccion) {
  const [[c]] = await pool.query(`
    SELECT COUNT(a.id_actividad) AS total, COUNT(r.id_resultado) AS respondidas
    FROM actividades a
    LEFT JOIN resultados r ON r.id_actividad = a.id_actividad AND r.id_usuario = ?
    WHERE a.id_leccion = ?`, [idUsuario, idLeccion]);
  if (c.total > 0 && c.respondidas === c.total) {
    await pool.query('INSERT IGNORE INTO progreso_lecciones (id_usuario, id_leccion) VALUES (?, ?)', [idUsuario, idLeccion]);
    return true;
  }
  return false;
}

module.exports = { modulosConProgreso, calcularLogros, actualizarCompletitudLeccion };
