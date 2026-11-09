// Utilidades para las pruebas: base de datos de pruebas y agente con sesión + token CSRF
process.env.NODE_ENV = 'test';
process.env.DB_NAME = process.env.DB_NAME_TEST || 'plataforma_zenu_test';
require('dotenv').config({ quiet: true });
const request = require('supertest');
const init = require('../database/init');

let app;
async function prepararApp() {
  await init({ dbName: process.env.DB_NAME, silencioso: true });
  app = require('../src/app');
  // esperar a que el almacén de sesiones cree su tabla antes de las primeras peticiones
  if (app.locals.sessionStore.onReady) await app.locals.sessionStore.onReady();
  return app;
}

async function cerrar() {
  const { pool } = require('../src/config/db');
  if (app && app.locals.sessionStore) await app.locals.sessionStore.close().catch(() => {});
  await pool.end();
}

function token(html) {
  const m = html.match(/name="_csrf" value="([a-f0-9]+)"/);
  return m && m[1];
}

async function agente() {
  const a = request.agent(app);
  const r = await a.get('/ingresar');
  a.csrf = token(r.text);
  return a;
}

async function refrescar(a) {
  const r = await a.get('/privacidad');
  a.csrf = token(r.text) || token((await a.get('/ingresar')).text) || a.csrf;
}

async function registrar(a, datos = {}) {
  const r = await a.post('/registro').type('form').send({
    _csrf: a.csrf, alias: 'tigre_sabanero', rango_edad: '18-20', contrasena: 'Cana-Rio-27', confirmar: 'Cana-Rio-27',
    acepta_privacidad: 'si', acepta_tratamiento: 'si', ...datos
  });
  await refrescar(a);
  return r;
}

async function ingresar(a, alias, contrasena) {
  const r = await a.post('/ingresar').type('form').send({ _csrf: a.csrf, alias, contrasena });
  await refrescar(a);
  return r;
}

module.exports = { prepararApp, cerrar, agente, registrar, ingresar, token };
