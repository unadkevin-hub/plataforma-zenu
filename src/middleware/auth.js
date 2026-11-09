// Control de acceso por sesión y por rol (RF-03, RNF-05)
const ROLES = { ESTUDIANTE: 1, FACILITADOR: 2, ADMIN: 3 };

function requiereSesion(req, res, next) {
  if (!req.session.usuario) {
    req.session.flash = { tipo: 'warning', texto: 'Inicia sesión para continuar.' };
    return res.redirect('/ingresar');
  }
  next();
}

function requiereRol(...roles) {
  return (req, res, next) => {
    if (!req.session.usuario) return res.redirect('/ingresar');
    if (!roles.includes(req.session.usuario.rol)) {
      return res.status(403).render('error', { titulo: 'Acceso no permitido', mensaje: 'Tu cuenta no tiene permiso para ver esta página.' });
    }
    next();
  };
}

module.exports = { ROLES, requiereSesion, requiereRol };
