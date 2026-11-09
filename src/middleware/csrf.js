// Protección contra falsificación de peticiones (CSRF) con token de sesión
const crypto = require('crypto');

function csrf(req, res, next) {
  if (!req.session.csrf) req.session.csrf = crypto.randomBytes(24).toString('hex');
  res.locals.csrf = req.session.csrf;
  if (['POST', 'PUT', 'DELETE'].includes(req.method)) {
    const token = (req.body && req.body._csrf) || req.get('x-csrf-token');
    if (!token || token.length !== req.session.csrf.length ||
        !crypto.timingSafeEqual(Buffer.from(token), Buffer.from(req.session.csrf))) {
      return res.status(403).render('error', { titulo: 'Solicitud no válida', mensaje: 'La página expiró. Vuelve atrás, recarga e intenta de nuevo.' });
    }
  }
  next();
}

module.exports = csrf;
