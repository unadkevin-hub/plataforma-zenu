// Configuración de la aplicación Express (capa de lógica de negocio)
require('dotenv').config({ quiet: true });
const path = require('path');
const express = require('express');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const helmet = require('helmet');
const compression = require('compression');
const { pool } = require('./config/db');
const csrf = require('./middleware/csrf');

const app = express();
const produccion = process.env.NODE_ENV === 'production';

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
if (produccion) app.set('trust proxy', 1); // Render entrega HTTPS a través de un proxy

// Seguridad de cabeceras HTTP y compresión (RNF-05, RNF-11)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", 'data:'],
      frameSrc: ['https://www.youtube-nocookie.com'],
      upgradeInsecureRequests: produccion ? [] : null
    }
  }
}));
app.use(compression());

// Recursos estáticos con caché para ahorrar datos móviles (RNF-03, RNF-11)
const cache = { maxAge: produccion ? '7d' : 0 };
app.use('/vendor/bootstrap', express.static(path.join(__dirname, '..', 'node_modules', 'bootstrap', 'dist'), cache));
app.use(express.static(path.join(__dirname, '..', 'public'), cache));

app.use(express.urlencoded({ extended: false, limit: '100kb' }));
app.use(express.json({ limit: '50kb' }));

// Sesiones almacenadas en MySQL
const store = new MySQLStore({ createDatabaseTable: true, clearExpired: true, checkExpirationInterval: 15 * 60 * 1000 }, pool);
app.locals.sessionStore = store;
app.use(session({
  name: 'zenu.sid',
  secret: process.env.SESSION_SECRET || 'clave-solo-para-desarrollo',
  store,
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: 'lax', secure: produccion, maxAge: 1000 * 60 * 60 * 8 }
}));

// Variables disponibles en todas las vistas
app.use((req, res, next) => {
  res.locals.usuario = req.session.usuario || null;
  res.locals.flash = req.session.flash || null;
  res.locals.ruta = req.path;
  delete req.session.flash;
  next();
});
app.use(csrf);

app.use(require('./routes/auth'));
app.use(require('./routes/estudiante'));
app.use(require('./routes/perfil'));
app.use('/facilitador', require('./routes/facilitador'));
app.use('/admin', require('./routes/admin'));

app.get('/salud', async (req, res) => {
  try { await pool.query('SELECT 1'); res.json({ estado: 'ok' }); }
  catch { res.status(503).json({ estado: 'sin base de datos' }); }
});

app.use((req, res) => {
  res.status(404).render('error', { titulo: 'Página no encontrada', mensaje: 'La página que buscas no existe o fue movida.' });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).render('error', { titulo: 'Algo salió mal', mensaje: 'Ocurrió un error inesperado. Intenta de nuevo en unos minutos.' });
});

module.exports = app;
