// Pruebas unitarias (PU-01 a PU-14): funciones y componentes aislados, sin servidor ni base de datos
const { escapar, leccionAHtml, ALIAS_RE, validarContrasena, barajar } = require('../src/utils/formato');
const { calcularLogros } = require('../src/models');
const { generarCodigoRecuperacion } = require('../src/routes/auth');
const { requiereSesion, requiereRol, ROLES } = require('../src/middleware/auth');
const csrf = require('../src/middleware/csrf');

afterAll(async () => { await require('../src/config/db').pool.end(); });

function resFalsa() {
  const r = { estado: 200, vista: null, destino: null, locals: {} };
  r.status = (c) => { r.estado = c; return r; };
  r.render = (v) => { r.vista = v; return r; };
  r.redirect = (d) => { r.destino = d; return r; };
  return r;
}

describe('Utilidades de formato y validación', () => {
  test('PU-01 escapar() neutraliza los caracteres especiales de HTML', () => {
    expect(escapar('<a href="x">\'&')).toBe('&lt;a href=&quot;x&quot;&gt;&#39;&amp;');
  });
  test('PU-02 leccionAHtml() convierte subtítulos, viñetas y párrafos', () => {
    const html = leccionAHtml('Primer párrafo\n\n## Subtítulo\n- uno\n- dos\n\nSegundo párrafo');
    expect(html).toContain('<p>Primer párrafo</p>');
    expect(html).toContain('<h2 class="h5 mt-4">Subtítulo</h2>');
    expect(html).toContain('<ul><li>uno</li><li>dos</li></ul>');
    expect(html).toContain('<p>Segundo párrafo</p>');
  });
  test('PU-03 leccionAHtml() une en un solo párrafo las líneas consecutivas', () => {
    expect(leccionAHtml('línea uno\nlínea dos')).toBe('<p>línea uno línea dos</p>');
  });
  test('PU-04 ALIAS_RE acepta alias válidos y rechaza los inválidos', () => {
    ['tigre_sabanero', 'garza.azul', 'ñeque-07'].forEach((a) => expect(ALIAS_RE.test(a)).toBe(true));
    ['ab', 'con espacio', '<script>', 'x'.repeat(31)].forEach((a) => expect(ALIAS_RE.test(a)).toBe(false));
  });
  test('PU-05 validarContrasena() exige 8 caracteres con letras y números', () => {
    expect(validarContrasena('Cana-Rio-27')).toBe(true);
    expect(validarContrasena('corta1')).toBe(false);
    expect(validarContrasena('solamenteletras')).toBe(false);
    expect(validarContrasena('1234567890')).toBe(false);
  });
});

describe('Orden de las opciones', () => {
  test('PU-15 barajar() devuelve una permutación estable por estudiante y no deja la correcta siempre en el mismo lugar', () => {
    const a = barajar(4, '7-12');
    expect([...a].sort()).toEqual([0, 1, 2, 3]);
    expect(barajar(4, '7-12')).toEqual(a);
    const posiciones = new Set(Array.from({ length: 40 }, (_, u) => barajar(4, `${u}-1`).indexOf(0)));
    expect(posiciones.size).toBe(4);
  });
});

describe('Código de recuperación', () => {
  test('PU-06 tiene el formato XXXX-XXXX sin caracteres confusos (0, O, 1, I)', () => {
    for (let i = 0; i < 200; i++) {
      const c = generarCodigoRecuperacion();
      expect(c).toMatch(/^[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/);
    }
  });
  test('PU-07 genera códigos distintos en cada llamada', () => {
    const codigos = new Set(Array.from({ length: 500 }, generarCodigoRecuperacion));
    expect(codigos.size).toBe(500);
  });
});

describe('Cálculo de logros', () => {
  const mod = (o) => ({ titulo: 'Módulo', total_lecciones: 3, avance: 0, total_actividades: 9, actividades_aprobadas: 0, ...o });
  test('PU-08 sin actividades aprobadas no hay logros', () => {
    expect(calcularLogros([mod({})])).toEqual([]);
  });
  test('PU-09 una actividad aprobada otorga el logro «Primer acierto»', () => {
    expect(calcularLogros([mod({ actividades_aprobadas: 1 })]).map((l) => l.titulo)).toEqual(['Primer acierto']);
  });
  test('PU-10 completar el módulo y aprobar todo otorga tres logros', () => {
    const l = calcularLogros([mod({ avance: 100, actividades_aprobadas: 9 })]);
    expect(l).toHaveLength(3);
    expect(l[1].titulo).toContain('Módulo completado');
    expect(l[2].titulo).toContain('Todo correcto');
  });
});

describe('Componentes de control de acceso', () => {
  test('PU-11 requiereSesion() redirige al ingreso cuando no hay sesión', () => {
    const req = { session: {} }; const res = resFalsa(); const next = jest.fn();
    requiereSesion(req, res, next);
    expect(res.destino).toBe('/ingresar');
    expect(next).not.toHaveBeenCalled();
  });
  test('PU-12 requiereRol() responde 403 a un rol no autorizado y deja pasar al autorizado', () => {
    const mw = requiereRol(ROLES.FACILITADOR, ROLES.ADMIN);
    const res = resFalsa(); const next = jest.fn();
    mw({ session: { usuario: { rol: ROLES.ESTUDIANTE } } }, res, next);
    expect(res.estado).toBe(403);
    expect(next).not.toHaveBeenCalled();
    mw({ session: { usuario: { rol: ROLES.FACILITADOR } } }, resFalsa(), next);
    expect(next).toHaveBeenCalledTimes(1);
  });
  test('PU-13 csrf() crea un token por sesión y deja pasar las peticiones GET', () => {
    const req = { method: 'GET', session: {}, body: {}, get: () => undefined }; const res = resFalsa(); const next = jest.fn();
    csrf(req, res, next);
    expect(req.session.csrf).toMatch(/^[a-f0-9]{48}$/);
    expect(res.locals.csrf).toBe(req.session.csrf);
    expect(next).toHaveBeenCalled();
  });
  test('PU-14 csrf() rechaza un POST con token incorrecto y acepta el correcto', () => {
    const session = { csrf: 'a'.repeat(48) };
    const malo = resFalsa(); const next = jest.fn();
    csrf({ method: 'POST', session, body: { _csrf: 'b'.repeat(48) }, get: () => undefined }, malo, next);
    expect(malo.estado).toBe(403);
    csrf({ method: 'POST', session, body: { _csrf: 'a'.repeat(48) }, get: () => undefined }, resFalsa(), next);
    expect(next).toHaveBeenCalledTimes(1);
  });
});
