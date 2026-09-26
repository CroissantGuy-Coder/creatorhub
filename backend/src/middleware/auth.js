const jwt = require('jsonwebtoken');
const { dbProxy: db } = require('../db');

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }

    const user = db.prepare('SELECT id, username, email, role, is_suspended FROM users WHERE id = ?').get(decoded.userId);
    if (!user) {
      return res.status(403).json({ error: 'User not found' });
    }
    if (user.is_suspended) {
      return res.status(403).json({ error: 'Account suspended' });
    }

    req.user = user;
    next();
  });
}

function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    req.user = null;
    return next();
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      req.user = null;
      return next();
    }

    const user = db.prepare('SELECT id, username, email, role, is_suspended FROM users WHERE id = ?').get(decoded.userId);
    req.user = user && !user.is_suspended ? user : null;
    next();
  });
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

module.exports = { authenticateToken, optionalAuth, requireAdmin };
