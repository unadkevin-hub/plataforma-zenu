// Casos de prueba funcionales del prototipo (CP-01 a CP-24), trazados a los requerimientos RF y RNF
const h = require('./helpers');
let app;
let pool;

beforeAll(async () => {
  app = await h.prepararApp();
  pool = require('../src/config/db').pool;
});
afterAll(async () => { await h.cerrar(); });

describe('Registro y autenticación (RF-01, RF-02)', () => {
  test('CP-01 Registro exitoso con alias, rango de edad y aceptación de privacidad', async () => {
    const a = await h.agente();
    const r = await h.registrar(a);
    expect(r.status).toBe(302);
    expect(r.headers.location).toBe('/bienvenida');
    const b = await a.get('/bienvenida');
    expect(b.text).toMatch(/[A-Z0-9]{4}-[A-Z0-9]{4}/);
    const [[c]] = await pool.query(`SELECT COUNT(*) AS n FROM consentimientos c JOIN usuarios u USING (id_usuario) WHERE u.alias = 'tigre_sabanero'`);
    expect(c.n).toBe(2);
  });

  test('CP-02 El registro se rechaza si no se acepta el aviso de privacidad', async () => {
    const a = await h.agente();
    const r = await h.registrar(a, { alias: 'sin_aviso', acepta_privacidad: '' });
    expect(r.status).toBe(400);
    expect(r.text).toContain('aviso de privacidad');
    const [[u]] = await pool.query(`SELECT COUNT(*) AS n FROM usuarios WHERE alias = 'sin_aviso'`);
    expect(u.n).toBe(0);
  });

  test('CP-03 Menor de 15 a 17 años requiere asentimiento del acudiente', async () => {
    const a = await h.agente();
    const r = await h.registrar(a, { alias: 'menor_sin', rango_edad: '15-17' });
    expect(r.status).toBe(400);
    expect(r.text).toContain('acudiente');
    const a2 = await h.agente();
    const r2 = await h.registrar(a2, { alias: 'menor_con', rango_edad: '15-17', asentimiento_menor: 'si' });
    expect(r2.status).toBe(302);
  });

  test('CP-04 Validaciones: alias duplicado, contraseña débil y alias con caracteres no permitidos', async () => {
    const a = await h.agente();
    expect((await h.registrar(a)).text).toContain('ya está en uso');
    expect((await h.registrar(a, { alias: 'otro_alias', contrasena: 'abc', confirmar: 'abc' })).text).toContain('al menos 8 caracteres');
    expect((await h.registrar(a, { alias: '<script>' })).status).toBe(400);
  });

  test('CP-05 La contraseña se almacena cifrada con bcrypt (RNF-05)', async () => {
    const [[u]] = await pool.query(`SELECT hash_contrasena FROM usuarios WHERE alias = 'tigre_sabanero'`);
    expect(u.hash_contrasena).not.toContain('Cana-Rio-27');
    expect(u.hash_contrasena).toMatch(/^\$2[aby]\$10\$/);
  });

  test('CP-06 Ingreso correcto e incorrecto', async () => {
    const a = await h.agente();
    const mal = await h.ingresar(a, 'tigre_sabanero', 'equivocada1');
    expect(mal.status).toBe(401);
    const bien = await h.ingresar(a, 'tigre_sabanero', 'Cana-Rio-27');
    expect(bien.headers.location).toBe('/panel');
  });

  test('CP-07 Recuperación de contraseña con el código de recuperación', async () => {
    const a = await h.agente();
    await h.registrar(a, { alias: 'olvidadizo' });
    const codigo = (await a.get('/bienvenida')).text.match(/([A-Z0-9]{4}-[A-Z0-9]{4})/)[1];
    const b = await h.agente();
    const malo = await b.post('/recuperar').type('form').send({ _csrf: b.csrf, alias: 'olvidadizo', codigo: 'AAAA-BBBB', contrasena: 'NuevaClave9', confirmar: 'NuevaClave9' });
    expect(malo.status).toBe(400);
    const ok = await b.post('/recuperar').type('form').send({ _csrf: b.csrf, alias: 'olvidadizo', codigo, contrasena: 'NuevaClave9', confirmar: 'NuevaClave9' });
    expect(ok.headers.location).toBe('/bienvenida');
    const c = await h.agente();
    expect((await h.ingresar(c, 'olvidadizo', 'NuevaClave9')).headers.location).toBe('/panel');
  });

  test('CP-08 Las peticiones sin token CSRF se rechazan', async () => {
    const request = require('supertest');
    const r = await request(app).post('/ingresar').type('form').send({ alias: 'x', contrasena: 'y' });
    expect(r.status).toBe(403);
  });
});

describe('Roles y control de acceso (RF-03)', () => {
  test('CP-09 Un visitante sin sesión es redirigido al ingreso', async () => {
    const request = require('supertest');
    const r = await request(app).get('/panel');
    expect(r.status).toBe(302);
    expect(r.headers.location).toBe('/ingresar');
  });

  test('CP-10 Un estudiante no puede entrar al panel del facilitador ni al de administración', async () => {
    const a = await h.agente();
    await h.ingresar(a, 'tigre_sabanero', 'Cana-Rio-27');
    expect((await a.get('/facilitador')).status).toBe(403);
    expect((await a.get('/admin/usuarios')).status).toBe(403);
    expect((await a.get('/admin/exportar.csv')).status).toBe(403);
  });

  test('CP-11 Cada rol llega a su panel después de ingresar', async () => {
    const f = await h.agente();
    expect((await h.ingresar(f, 'facilitador', process.env.FACILITADOR_PASSWORD || 'Facilitador-Zenu-2026')).headers.location).toBe('/facilitador');
    const ad = await h.agente();
    expect((await h.ingresar(ad, 'admin', process.env.ADMIN_PASSWORD || 'Admin-Zenu-2026')).headers.location).toBe('/admin/usuarios');
  });
});

describe('Módulos, lecciones y actividades (RF-04 a RF-08)', () => {
  let a;
  beforeAll(async () => { a = await h.agente(); await h.ingresar(a, 'tigre_sabanero', 'Cana-Rio-27'); });

  test('CP-12 El panel muestra los tres módulos con su avance', async () => {
    const r = await a.get('/panel');
    expect(r.status).toBe(200);
    ['Herramientas ofimáticas', 'Búsqueda y evaluación de información', 'Navegación segura y uso responsable'].forEach((t) => expect(r.text).toContain(t));
    expect(r.text).toContain('0 %');
  });

  test('CP-13 La lección muestra contenido y actividades', async () => {
    const r = await a.get('/lecciones/1');
    expect(r.status).toBe(200);
    expect(r.text).toContain('Tu primer documento');
    expect((r.text.match(/class="tarjeta p-3 mb-3 actividad"/g) || []).length).toBe(3);
  });

  test('CP-14 Responder bien y mal da retroalimentación inmediata y registra intentos', async () => {
    const mal = await a.post('/actividades/1/responder').set('Accept', 'application/json').set('X-CSRF-Token', a.csrf).send({ opcion: 0 });
    expect(mal.body.correcta).toBe(false);
    expect(mal.body.retroalimentacion).toBeTruthy();
    expect(mal.body.estado).toBe('no_aprobada');
    const bien = await a.post('/actividades/1/responder').set('Accept', 'application/json').set('X-CSRF-Token', a.csrf).send({ opcion: 1 });
    expect(bien.body.correcta).toBe(true);
    expect(bien.body.intentos).toBe(2);
    expect(bien.body.estado).toBe('aprobada');
  });

  test('CP-15 Una actividad aprobada no vuelve a quedar no aprobada (se conserva el mejor puntaje)', async () => {
    const r = await a.post('/actividades/1/responder').set('Accept', 'application/json').set('X-CSRF-Token', a.csrf).send({ opcion: 3 });
    expect(r.body.estado).toBe('aprobada');
    expect(r.body.intentos).toBe(3);
  });

  test('CP-16 Funciona sin JavaScript: el formulario normal redirige con la retroalimentación', async () => {
    const r = await a.post('/actividades/2/responder').type('form').send({ _csrf: a.csrf, opcion: 2 });
    expect(r.status).toBe(302);
    const p = await a.get('/lecciones/1');
    expect(p.text).toContain('¡Correcto!');
  });

  test('CP-17 Al responder todas las actividades la lección queda completada y el avance sube', async () => {
    const r = await a.post('/actividades/3/responder').set('Accept', 'application/json').set('X-CSRF-Token', a.csrf).send({ opcion: 0 });
    expect(r.body.leccionCompletada).toBe(true);
    const m = await a.get('/modulos/1');
    expect(m.text).toContain('33 % completado');
  });

  test('CP-18 Opción fuera de rango se rechaza', async () => {
    const r = await a.post('/actividades/4/responder').set('Accept', 'application/json').set('X-CSRF-Token', a.csrf).send({ opcion: 9 });
    expect(r.status).toBe(400);
  });

  test('CP-19 La página de progreso muestra totales y logros', async () => {
    const r = await a.get('/progreso');
    expect(r.text).toContain('Primer acierto');
    expect(r.text).toMatch(/<div class="cifra">3<\/div><div class="small">aprobadas/);
  });

  test('CP-27 Al terminar un módulo se ofrece el paso al siguiente módulo', async () => {
    for (const [id, op] of [[4, 1], [5, 1], [6, 2], [7, 3], [8, 2], [9, 2]]) {
      const [[act]] = await pool.query('SELECT respuesta FROM actividades WHERE id_actividad = ?', [id]);
      await a.post(`/actividades/${id}/responder`).set('Accept', 'application/json').set('X-CSRF-Token', a.csrf).send({ opcion: act.respuesta });
    }
    const ultima = await a.get('/lecciones/3');
    expect(ultima.text).toContain('Siguiente módulo: Búsqueda y evaluación de información');
    expect(ultima.text).toContain('href="/modulos/2"');
    const modulo = await a.get('/modulos/1');
    expect(modulo.text).toContain('¡Completaste este módulo!');
  });
});

describe('Facilitador y administrador (RF-09, RF-10, RF-12)', () => {
  let f;
  beforeAll(async () => { f = await h.agente(); await h.ingresar(f, 'facilitador', process.env.FACILITADOR_PASSWORD || 'Facilitador-Zenu-2026'); });

  test('CP-20 El facilitador crea y publica una lección con una actividad, y el estudiante la ve de inmediato', async () => {
    const r = await f.post('/facilitador/modulos/2/lecciones').type('form').send({
      _csrf: f.csrf, titulo: 'Lección de prueba', resumen: 'Resumen corto', contenido: 'Contenido de la lección de prueba con más de veinte caracteres.',
      minutos: 4, orden: 9, publicado: 'si'
    });
    expect(r.status).toBe(302);
    const idL = Number(r.headers.location.split('/').pop());
    const ra = await f.post(`/facilitador/lecciones/${idL}/actividades`).type('form').send({
      _csrf: f.csrf, tipo: 'seleccion', enunciado: '¿Pregunta de prueba válida?', opcion0: 'Sí', opcion1: 'No', respuesta: 0, retroalimentacion: 'Explicación de la respuesta.', orden: 1
    });
    expect(ra.status).toBe(302);
    const e = await h.agente();
    await h.ingresar(e, 'tigre_sabanero', 'Cana-Rio-27');
    expect((await e.get('/modulos/2')).text).toContain('Lección de prueba');
  });

  test('CP-21 Validación de formularios del facilitador (actividad sin respuesta correcta válida)', async () => {
    const r = await f.post('/facilitador/lecciones/1/actividades').type('form').send({ _csrf: f.csrf, enunciado: 'Enunciado suficiente', opcion0: 'A', respuesta: 3, retroalimentacion: 'Retroalimentación' });
    expect(r.status).toBe(400);
    expect(r.text).toContain('al menos dos opciones');
  });

  test('CP-22 El reporte del grupo es agregado y no muestra alias', async () => {
    const r = await f.get('/facilitador/reportes');
    expect(r.status).toBe(200);
    expect(r.text).toContain('Avance por módulo');
    expect(r.text).not.toContain('tigre_sabanero');
  });

  test('CP-23 La exportación CSV del administrador usa seudónimos y no contiene alias', async () => {
    const ad = await h.agente();
    await h.ingresar(ad, 'admin', process.env.ADMIN_PASSWORD || 'Admin-Zenu-2026');
    const r = await ad.get('/admin/exportar.csv');
    expect(r.status).toBe(200);
    expect(r.headers['content-type']).toContain('text/csv');
    expect(r.text).toMatch(/P[0-9A-F]{8},18-20,Herramientas ofimáticas/);
    expect(r.text).not.toContain('tigre_sabanero');
  });
});

describe('Derechos del titular (RF-11) y seguridad (RNF-05)', () => {
  test('CP-24 El estudiante descarga sus datos, actualiza su alias y elimina su cuenta con todos sus datos', async () => {
    const a = await h.agente();
    await h.registrar(a, { alias: 'para_borrar' });
    const d = await a.get('/perfil/mis-datos');
    expect(d.body.usuario.alias).toBe('para_borrar');
    expect(d.headers['content-disposition']).toContain('attachment');
    const up = await a.post('/perfil').type('form').send({ _csrf: a.csrf, alias: 'para_borrar2', rango_edad: '18-20' });
    expect(up.status).toBe(302);
    await a.post('/actividades/1/responder').set('Accept', 'application/json').set('X-CSRF-Token', a.csrf).send({ opcion: 1 });
    const [[u]] = await pool.query(`SELECT id_usuario FROM usuarios WHERE alias = 'para_borrar2'`);
    const del = await a.post('/perfil/eliminar').type('form').send({ _csrf: a.csrf, confirmar_alias: 'para_borrar2', contrasena: 'Cana-Rio-27' });
    expect(del.text).toContain('Cuenta eliminada');
    const [[c]] = await pool.query('SELECT (SELECT COUNT(*) FROM usuarios WHERE id_usuario = ?) AS u, (SELECT COUNT(*) FROM resultados WHERE id_usuario = ?) AS r, (SELECT COUNT(*) FROM consentimientos WHERE id_usuario = ?) AS c', [u.id_usuario, u.id_usuario, u.id_usuario]);
    expect([c.u, c.r, c.c]).toEqual([0, 0, 0]);
  });

  test('CP-25 Cabeceras de seguridad y compresión presentes', async () => {
    const request = require('supertest');
    const r = await request(app).get('/').set('Accept-Encoding', 'gzip');
    expect(r.headers['content-security-policy']).toBeDefined();
    expect(r.headers['x-content-type-options']).toBe('nosniff');
    const css = await request(app).get('/vendor/bootstrap/css/bootstrap.min.css').set('Accept-Encoding', 'gzip');
    expect(css.headers['content-encoding']).toBe('gzip');
  });

  test('CP-26 El contenido de las lecciones se escapa (sin inyección de HTML)', () => {
    const { leccionAHtml } = require('../src/utils/formato');
    const html = leccionAHtml('Hola <script>alert(1)</script>\n\n## Título\n- viñeta');
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
    expect(html).toContain('<h2');
    expect(html).toContain('<li>viñeta</li>');
  });
});
