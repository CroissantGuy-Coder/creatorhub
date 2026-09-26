require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? process.env.FRONTEND_URL
    : ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { error: 'Too many requests, please try again later' }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many authentication attempts' }
});

app.use(limiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Initialize DB then wire up routes
const { initDb, dbProxy: db } = require('./db');

initDb().then(() => {
  // Routes need db to be ready first
  const authRoutes = require('./routes/auth');
  const userRoutes = require('./routes/users');
  const adRoutes = require('./routes/advertisements');
  const adminRoutes = require('./routes/admin');
  const paymentRoutes = require('./routes/payments');

  app.use('/api/auth', authLimiter, authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/advertisements', adRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/payments', paymentRoutes);

  // ── Auto-expire featured ads ──────────────────────────────────────────────
  // Runs every hour to unfeature ads whose featured_until has passed
  function expireFeaturedAds() {
    try {
      const result = db.prepare(`
        UPDATE advertisements
        SET is_featured = 0
        WHERE is_featured = 1
          AND featured_until IS NOT NULL
          AND featured_until < datetime('now')
      `).run();
      if (result.changes > 0) {
        console.log(`[Expiry] Unfeatured ${result.changes} expired advertisement(s)`);
      }
    } catch (err) {
      console.error('[Expiry] Error expiring featured ads:', err.message);
    }
  }
  expireFeaturedAds(); // run once on startup
  setInterval(expireFeaturedAds, 60 * 60 * 1000); // then every hour

  // Admin promote endpoint
  app.post('/api/admin/promote', (req, res) => {
    const { username, adminSecret } = req.body;
    if (adminSecret !== process.env.ADMIN_SECRET) {
      return res.status(403).json({ error: 'Invalid admin secret' });
    }
    const user = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
    if (!user) return res.status(404).json({ error: 'User not found' });
    db.prepare("UPDATE users SET role = 'admin' WHERE id = ?").run(user.id);
    res.json({ message: `${username} has been promoted to admin` });
  });

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // 404
  app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
  });

  // Error handler
  app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal server error' });
  });

  app.listen(PORT, () => {
    console.log(`CreatorHub API running on http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});

module.exports = app;
