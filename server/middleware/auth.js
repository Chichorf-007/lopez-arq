const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'lopez_arq_secret_key_2026_guaranies';

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Acceso no autorizado: Token requerido' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token inválido o expirado' });
    }
    req.user = user;
    next();
  });
}

function requireAdmin(req, res, next) {
  if (req.user && req.user.role === 'ADMIN') {
    next();
  } else {
    res.status(403).json({ error: 'Acceso denegado: Se requieren permisos de Administrador (Maru López)' });
  }
}

module.exports = {
  JWT_SECRET,
  authenticateToken,
  requireAdmin
};
