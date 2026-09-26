const express = require('express');
const { dbProxy: db } = require('../db');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken, requireAdmin);

// GET /api/admin/stats
router.get('/stats', (req, res) => {
  const totalUsers = db.prepare("SELECT COUNT(*) as count FROM users WHERE role != 'admin'").get();
  const totalAds = db.prepare('SELECT COUNT(*) as count FROM advertisements').get();
  const activeAds = db.prepare("SELECT COUNT(*) as count FROM advertisements WHERE status = 'active'").get();
  const pendingReports = db.prepare("SELECT COUNT(*) as count FROM reports WHERE status = 'pending'").get();
  const suspendedUsers = db.prepare('SELECT COUNT(*) as count FROM users WHERE is_suspended = 1').get();
  const flaggedLinks = db.prepare('SELECT COUNT(*) as count FROM flagged_links WHERE reviewed = 0').get();

  const recentUsers = db.prepare(
    "SELECT id, username, email, created_at, is_suspended FROM users WHERE role != 'admin' ORDER BY created_at DESC LIMIT 5"
  ).all();

  const recentAds = db.prepare(
    'SELECT a.id, a.title, a.category, a.status, a.created_at, u.username FROM advertisements a JOIN users u ON a.user_id = u.id ORDER BY a.created_at DESC LIMIT 5'
  ).all();

  res.json({
    stats: {
      total_users: totalUsers.count,
      total_ads: totalAds.count,
      active_ads: activeAds.count,
      pending_reports: pendingReports.count,
      suspended_users: suspendedUsers.count,
      flagged_links: flaggedLinks.count
    },
    recent_users: recentUsers,
    recent_ads: recentAds
  });
});

// GET /api/admin/users
router.get('/users', (req, res) => {
  const { page = 1, limit = 20, search, suspended } = req.query;

  let conditions = ["role != 'admin'"];
  let params = [];

  if (search) {
    conditions.push('(username LIKE ? OR email LIKE ?)');
    params.push(`%${search}%`, `%${search}%`);
  }
  if (suspended === 'true') { conditions.push('is_suspended = 1'); }
  else if (suspended === 'false') { conditions.push('is_suspended = 0'); }

  const where = conditions.join(' AND ');
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, parseInt(limit));

  const users = db.prepare(
    `SELECT id, username, email, role, is_suspended, created_at FROM users WHERE ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`
  ).all(...params, limitNum, (pageNum - 1) * limitNum);

  res.json({ users, page: pageNum, limit: limitNum });
});

// PATCH /api/admin/users/:id/suspend
router.patch('/users/:id/suspend', (req, res) => {
  const { suspended } = req.body;
  const user = db.prepare('SELECT id, role FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  if (user.role === 'admin') return res.status(403).json({ error: 'Cannot suspend admin accounts' });

  db.prepare("UPDATE users SET is_suspended = ?, updated_at = datetime('now') WHERE id = ?")
    .run(suspended ? 1 : 0, req.params.id);

  res.json({ message: `User ${suspended ? 'suspended' : 'unsuspended'} successfully` });
});

// GET /api/admin/advertisements
router.get('/advertisements', (req, res) => {
  const { page = 1, limit = 20, search, status, category } = req.query;

  let conditions = ['1=1'];
  let params = [];

  if (search) { conditions.push('(a.title LIKE ? OR u.username LIKE ?)'); params.push(`%${search}%`, `%${search}%`); }
  if (status) { conditions.push('a.status = ?'); params.push(status); }
  if (category) { conditions.push('LOWER(a.category) = ?'); params.push(category.toLowerCase()); }

  const where = conditions.join(' AND ');
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, parseInt(limit));

  const ads = db.prepare(
    `SELECT a.*, u.username FROM advertisements a JOIN users u ON a.user_id = u.id WHERE ${where} ORDER BY a.created_at DESC LIMIT ? OFFSET ?`
  ).all(...params, limitNum, (pageNum - 1) * limitNum);

  res.json({
    advertisements: ads.map(a => ({
      ...a,
      reference_images: JSON.parse(a.reference_images || '[]'),
      tags: JSON.parse(a.tags || '[]')
    })),
    page: pageNum, limit: limitNum
  });
});

// PATCH /api/admin/advertisements/:id/status
router.patch('/advertisements/:id/status', (req, res) => {
  const { status } = req.body;
  if (!['active', 'closed', 'removed'].includes(status)) return res.status(400).json({ error: 'Invalid status' });

  const ad = db.prepare('SELECT id FROM advertisements WHERE id = ?').get(req.params.id);
  if (!ad) return res.status(404).json({ error: 'Advertisement not found' });

  db.prepare("UPDATE advertisements SET status = ?, updated_at = datetime('now') WHERE id = ?").run(status, req.params.id);
  res.json({ message: `Advertisement status set to ${status}` });
});

// DELETE /api/admin/advertisements/:id
router.delete('/advertisements/:id', (req, res) => {
  const ad = db.prepare('SELECT id FROM advertisements WHERE id = ?').get(req.params.id);
  if (!ad) return res.status(404).json({ error: 'Advertisement not found' });
  db.prepare('DELETE FROM advertisements WHERE id = ?').run(req.params.id);
  res.json({ message: 'Advertisement deleted' });
});

// GET /api/admin/reports
router.get('/reports', (req, res) => {
  const { page = 1, limit = 20, status } = req.query;

  let conditions = ['1=1'];
  let params = [];
  if (status) { conditions.push('r.status = ?'); params.push(status); }

  const where = conditions.join(' AND ');
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, parseInt(limit));

  const reports = db.prepare(`
    SELECT r.*, a.title as ad_title, a.category, reporter.username as reporter_username
    FROM reports r
    JOIN advertisements a ON r.advertisement_id = a.id
    JOIN users reporter ON r.reporter_id = reporter.id
    WHERE ${where}
    ORDER BY r.created_at DESC LIMIT ? OFFSET ?
  `).all(...params, limitNum, (pageNum - 1) * limitNum);

  res.json({ reports, page: pageNum });
});

// PATCH /api/admin/reports/:id/resolve
router.patch('/reports/:id/resolve', (req, res) => {
  const { status } = req.body;
  if (!['resolved', 'dismissed'].includes(status)) return res.status(400).json({ error: 'Status must be resolved or dismissed' });

  const report = db.prepare('SELECT id FROM reports WHERE id = ?').get(req.params.id);
  if (!report) return res.status(404).json({ error: 'Report not found' });

  db.prepare('UPDATE reports SET status = ? WHERE id = ?').run(status, req.params.id);
  res.json({ message: `Report ${status}` });
});

// GET /api/admin/flagged-links
router.get('/flagged-links', (req, res) => {
  const { page = 1, limit = 20, reviewed } = req.query;

  let conditions = ['1=1'];
  let params = [];

  if (reviewed === 'false' || reviewed === undefined) {
    conditions.push('f.reviewed = 0');
  } else if (reviewed === 'true') {
    conditions.push('f.reviewed = 1');
  }

  const where = conditions.join(' AND ');
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, parseInt(limit));

  const links = db.prepare(`
    SELECT f.*, u.username as flagged_username
    FROM flagged_links f
    JOIN users u ON f.user_id = u.id
    WHERE ${where}
    ORDER BY f.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, limitNum, (pageNum - 1) * limitNum);

  const { total } = db.prepare(
    `SELECT COUNT(*) as total FROM flagged_links f WHERE ${where}`
  ).get(...params);

  res.json({ flagged_links: links, total, page: pageNum });
});

// PATCH /api/admin/flagged-links/:id/review
router.patch('/flagged-links/:id/review', (req, res) => {
  const { action } = req.body;
  const validActions = ['dismissed', 'warned_user', 'removed_content', 'banned_user'];

  if (!validActions.includes(action)) {
    return res.status(400).json({ error: `Action must be one of: ${validActions.join(', ')}` });
  }

  const link = db.prepare('SELECT * FROM flagged_links WHERE id = ?').get(req.params.id);
  if (!link) return res.status(404).json({ error: 'Flagged link not found' });

  db.prepare('UPDATE flagged_links SET reviewed = 1, action_taken = ? WHERE id = ?')
    .run(action, req.params.id);

  // If action is to remove content, mark the source as removed
  if (action === 'removed_content' && link.source_type === 'advertisement') {
    db.prepare("UPDATE advertisements SET status = 'removed', updated_at = datetime('now') WHERE id = ?")
      .run(link.source_id);
  }

  // If action is to ban the user, suspend their account
  if (action === 'banned_user') {
    db.prepare("UPDATE users SET is_suspended = 1, updated_at = datetime('now') WHERE id = ?")
      .run(link.user_id);
  }

  res.json({ message: `Flagged link marked as: ${action}` });
});

// GET /api/admin/stats — update to include flagged link count
// (This is an additional endpoint; stats route already exists above)
router.get('/flagged-links/count', (req, res) => {
  const { count } = db.prepare('SELECT COUNT(*) as count FROM flagged_links WHERE reviewed = 0').get();
  res.json({ unreviewed: count });
});

module.exports = router;

// ── Featured Ads Management ───────────────────────────────────────────────────

// GET /api/admin/payments
router.get('/payments', (req, res) => {
  const { page = 1, limit = 20, status } = req.query

  let conditions = ['1=1']
  let params = []

  if (status) { conditions.push('p.status = ?'); params.push(status) }

  const where = conditions.join(' AND ')
  const pageNum = Math.max(1, parseInt(page))
  const limitNum = Math.min(100, parseInt(limit))

  const payments = db.prepare(`
    SELECT p.*, u.username, a.title as ad_title, a.category, a.is_featured, a.featured_until
    FROM payments p
    JOIN users u ON p.user_id = u.id
    JOIN advertisements a ON p.advertisement_id = a.id
    WHERE ${where}
    ORDER BY p.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, limitNum, (pageNum - 1) * limitNum)

  const { total } = db.prepare(`
    SELECT COUNT(*) as total FROM payments p WHERE ${where}
  `).get(...params)

  const revenue = db.prepare(
    "SELECT SUM(amount) as total FROM payments WHERE status = 'completed'"
  ).get()

  res.json({ payments, total, page: pageNum, total_revenue: revenue.total || 0 })
})

// PATCH /api/admin/payments/:adId/unfeature
router.patch('/payments/:adId/unfeature', (req, res) => {
  const ad = db.prepare('SELECT id FROM advertisements WHERE id = ?').get(req.params.adId)
  if (!ad) return res.status(404).json({ error: 'Advertisement not found' })

  db.prepare("UPDATE advertisements SET is_featured = 0, featured_until = NULL, updated_at = datetime('now') WHERE id = ?")
    .run(req.params.adId)

  res.json({ message: 'Advertisement unfeatured successfully' })
})
