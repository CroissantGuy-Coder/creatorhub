const express = require('express');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { dbProxy: db } = require('../db');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const { uploadReferences } = require('../middleware/upload');
const { scanLinks, buildFlagMessage } = require('../utils/linkScanner');

const router = express.Router();

const VALID_CATEGORIES = ['roblox', 'blender', 'coding'];
const VALID_JOB_TYPES = {
  roblox: ['Builder', 'Scripter', 'Animator', 'UI Designer', 'VFX Artist', '3D Modeler', 'Game Developer', 'Other'],
  blender: ['3D Modeler', 'Animator', 'Rigging Artist', 'Texture Artist', 'Environment Artist', 'Character Artist', 'Other'],
  coding: ['Web Developer', 'Game Developer', 'Python Developer', 'JavaScript Developer', 'Lua Developer', 'C++ Developer', 'Backend Developer', 'Frontend Developer', 'Other']
};
const VALID_PAYMENT_TYPES = ['Fixed Price', 'Negotiable', 'Per Hour', 'Per Project'];
const VALID_CURRENCIES = { roblox: ['Robux', 'USD'], blender: ['USD'], coding: ['USD'] };

// GET /api/advertisements
router.get('/', optionalAuth, (req, res) => {
  const { category, job_type, payment_type, min_payment, max_payment, sort = 'newest', page = 1, limit = 20, status = 'active' } = req.query;

  let conditions = ['a.status = ?'];
  let params = [status];

  if (category) { conditions.push('LOWER(a.category) = ?'); params.push(category.toLowerCase()); }
  if (job_type) { conditions.push('LOWER(a.job_type) = LOWER(?)'); params.push(job_type); }
  if (payment_type) { conditions.push('a.payment_type = ?'); params.push(payment_type); }
  if (min_payment) { conditions.push('a.payment_amount >= ?'); params.push(parseFloat(min_payment)); }
  if (max_payment) { conditions.push('a.payment_amount <= ?'); params.push(parseFloat(max_payment)); }

  const where = conditions.join(' AND ');

  const sortMap = {
    newest: 'a.created_at DESC',
    oldest: 'a.created_at ASC',
    highest_pay: 'a.payment_amount DESC',
    lowest_pay: 'a.payment_amount ASC',
    most_viewed: 'a.views DESC'
  };
  const orderBy = sortMap[sort] || sortMap.newest;

  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
  const offset = (pageNum - 1) * limitNum;

  const query = `SELECT a.*, u.username, u.avatar_url FROM advertisements a JOIN users u ON a.user_id = u.id WHERE ${where} ORDER BY a.is_featured DESC, ${orderBy} LIMIT ? OFFSET ?`;
  const ads = db.prepare(query).all(...params, limitNum, offset);

  const countQuery = `SELECT COUNT(*) as total FROM advertisements a WHERE ${where}`;
  const { total } = db.prepare(countQuery).get(...params);

  res.json({
    advertisements: ads.map(formatAd),
    pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) }
  });
});

// GET /api/advertisements/search
router.get('/search', (req, res) => {
  const { q, category, job_type, payment_type, min_payment, max_payment, sort = 'newest', page = 1, limit = 20 } = req.query;

  if (!q || q.trim().length < 2) {
    return res.status(400).json({ error: 'Search query must be at least 2 characters' });
  }

  const searchTerm = `%${q.trim()}%`;
  let conditions = ["a.status = 'active'", "(a.title LIKE ? OR a.description LIKE ? OR a.category LIKE ? OR a.job_type LIKE ? OR a.tags LIKE ?)"];
  let params = [searchTerm, searchTerm, searchTerm, searchTerm, searchTerm];

  if (category) { conditions.push('LOWER(a.category) = ?'); params.push(category.toLowerCase()); }
  if (job_type) { conditions.push('LOWER(a.job_type) = LOWER(?)'); params.push(job_type); }
  if (payment_type) { conditions.push('a.payment_type = ?'); params.push(payment_type); }
  if (min_payment) { conditions.push('a.payment_amount >= ?'); params.push(parseFloat(min_payment)); }
  if (max_payment) { conditions.push('a.payment_amount <= ?'); params.push(parseFloat(max_payment)); }

  const where = conditions.join(' AND ');
  const sortMap = { newest: 'a.created_at DESC', oldest: 'a.created_at ASC', highest_pay: 'a.payment_amount DESC', lowest_pay: 'a.payment_amount ASC' };
  const orderBy = sortMap[sort] || sortMap.newest;

  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(50, Math.max(1, parseInt(limit)));

  const query = `SELECT a.*, u.username, u.avatar_url FROM advertisements a JOIN users u ON a.user_id = u.id WHERE ${where} ORDER BY ${orderBy} LIMIT ? OFFSET ?`;
  const ads = db.prepare(query).all(...params, limitNum, (pageNum - 1) * limitNum);

  res.json({ query: q, advertisements: ads.map(formatAd), total: ads.length, page: pageNum });
});

// GET /api/advertisements/:id
router.get('/:id', optionalAuth, (req, res) => {
  const ad = db.prepare(`
    SELECT a.*, u.username, u.avatar_url, u.bio, u.social_links as poster_links
    FROM advertisements a JOIN users u ON a.user_id = u.id
    WHERE a.id = ? AND a.status != 'removed'
  `).get(req.params.id);

  if (!ad) return res.status(404).json({ error: 'Advertisement not found' });

  db.prepare('UPDATE advertisements SET views = views + 1 WHERE id = ?').run(req.params.id);

  let isSaved = false;
  if (req.user) {
    const saved = db.prepare('SELECT id FROM saved_advertisements WHERE user_id = ? AND advertisement_id = ?')
      .get(req.user.id, req.params.id);
    isSaved = !!saved;
  }

  res.json({
    ...formatAd(ad),
    poster_links: JSON.parse(ad.poster_links || '[]'),
    views: (ad.views || 0) + 1,
    is_saved: isSaved
  });
});

// POST /api/advertisements
router.post('/', authenticateToken, (req, res) => {
  uploadReferences(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message });

    try {
      const { title, category, job_type, description, payment_amount, payment_currency, payment_type, contact_links, required_skills, tags } = req.body;

      if (!title || !title.trim()) return res.status(400).json({ error: 'Title is required' });
      if (title.trim().length < 10) return res.status(400).json({ error: 'Title must be at least 10 characters' });
      if (!category || !VALID_CATEGORIES.includes(category.toLowerCase())) return res.status(400).json({ error: 'Invalid category' });
      if (!job_type || !VALID_JOB_TYPES[category.toLowerCase()].includes(job_type)) return res.status(400).json({ error: `Invalid job type for ${category}` });
      if (!description || description.trim().length < 20) return res.status(400).json({ error: 'Description must be at least 20 characters' });
      if (!payment_type || !VALID_PAYMENT_TYPES.includes(payment_type)) return res.status(400).json({ error: 'Invalid payment type' });

      const validCurrencies = VALID_CURRENCIES[category.toLowerCase()];
      if (payment_currency && !validCurrencies.includes(payment_currency)) return res.status(400).json({ error: `Invalid currency for ${category}` });

      const currency = payment_currency || validCurrencies[0];
      const uploadedImages = req.files ? req.files.map(f => `/uploads/references/${f.filename}`) : [];

      let parsedLinks = []; try { parsedLinks = JSON.parse(contact_links || '[]'); } catch {}
      let parsedSkills = []; try { parsedSkills = JSON.parse(required_skills || '[]'); } catch {}
      let parsedTags = []; try { parsedTags = JSON.parse(tags || '[]'); } catch {}

      // ── Link safety scan ──────────────────────────────────────────────────
      const adId = uuidv4();
      if (parsedLinks.length > 0) {
        const scan = await scanLinks(parsedLinks, req.user.id, 'advertisement', adId);
        if (!scan.safe) {
          // Delete any uploaded images since we're rejecting the submission
          uploadedImages.forEach(imgPath => {
            const full = path.join(__dirname, '..', '..', imgPath.replace('/uploads/', 'uploads/'));
            if (fs.existsSync(full)) { try { fs.unlinkSync(full); } catch {} }
          });
          return res.status(400).json({
            error: buildFlagMessage(scan.flagged),
            flagged_links: scan.flagged
          });
        }
      }
      // ─────────────────────────────────────────────────────────────────────

      db.prepare(`
        INSERT INTO advertisements (id, user_id, title, category, job_type, description, payment_amount, payment_currency, payment_type, reference_images, contact_links, required_skills, tags)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        adId, req.user.id, title.trim(), category.toLowerCase(), job_type, description.trim(),
        payment_amount ? parseFloat(payment_amount) : null, currency, payment_type,
        JSON.stringify(uploadedImages), JSON.stringify(parsedLinks), JSON.stringify(parsedSkills), JSON.stringify(parsedTags)
      );

      const ad = db.prepare('SELECT * FROM advertisements WHERE id = ?').get(adId);
      res.status(201).json({ message: 'Advertisement published successfully', advertisement: formatAd(ad) });
    } catch (err) {
      console.error('Create ad error:', err);
      res.status(500).json({ error: 'Server error creating advertisement' });
    }
  });
});

// PUT /api/advertisements/:id
router.put('/:id', authenticateToken, (req, res) => {
  uploadReferences(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message });

    try {
      const ad = db.prepare('SELECT * FROM advertisements WHERE id = ?').get(req.params.id);
      if (!ad) return res.status(404).json({ error: 'Advertisement not found' });
      if (ad.user_id !== req.user.id && req.user.role !== 'admin') return res.status(403).json({ error: 'You can only edit your own advertisements' });

      const { title, description, payment_amount, payment_currency, payment_type, contact_links, required_skills, tags, remove_images } = req.body;

      let currentImages = JSON.parse(ad.reference_images || '[]');
      let imagesToRemove = []; try { imagesToRemove = JSON.parse(remove_images || '[]'); } catch {}

      imagesToRemove.forEach(imgUrl => {
        const filePath = path.join(__dirname, '..', '..', imgUrl.replace('/uploads/', 'uploads/'));
        if (fs.existsSync(filePath)) { try { fs.unlinkSync(filePath); } catch {} }
      });
      currentImages = currentImages.filter(img => !imagesToRemove.includes(img));
      if (req.files && req.files.length > 0) {
        currentImages = [...currentImages, ...req.files.map(f => `/uploads/references/${f.filename}`)];
      }

      let parsedLinks = JSON.parse(ad.contact_links || '[]'); try { if (contact_links) parsedLinks = JSON.parse(contact_links); } catch {}
      let parsedSkills = JSON.parse(ad.required_skills || '[]'); try { if (required_skills) parsedSkills = JSON.parse(required_skills); } catch {}
      let parsedTags = JSON.parse(ad.tags || '[]'); try { if (tags) parsedTags = JSON.parse(tags); } catch {}

      // ── Link safety scan on updated links ─────────────────────────────────
      if (parsedLinks.length > 0) {
        const scan = await scanLinks(parsedLinks, req.user.id, 'advertisement', req.params.id);
        if (!scan.safe) {
          return res.status(400).json({
            error: buildFlagMessage(scan.flagged),
            flagged_links: scan.flagged
          });
        }
      }
      // ─────────────────────────────────────────────────────────────────────

      db.prepare(`
        UPDATE advertisements SET title=?, description=?, payment_amount=?, payment_currency=?, payment_type=?, reference_images=?, contact_links=?, required_skills=?, tags=?, updated_at=datetime('now') WHERE id=?
      `).run(
        title || ad.title, description || ad.description,
        payment_amount !== undefined ? parseFloat(payment_amount) : ad.payment_amount,
        payment_currency || ad.payment_currency, payment_type || ad.payment_type,
        JSON.stringify(currentImages), JSON.stringify(parsedLinks), JSON.stringify(parsedSkills), JSON.stringify(parsedTags),
        req.params.id
      );

      const updated = db.prepare('SELECT * FROM advertisements WHERE id = ?').get(req.params.id);
      res.json({ message: 'Advertisement updated', advertisement: formatAd(updated) });
    } catch (err) {
      console.error('Update ad error:', err);
      res.status(500).json({ error: 'Server error updating advertisement' });
    }
  });
});

// PATCH /api/advertisements/:id/status
router.patch('/:id/status', authenticateToken, (req, res) => {
  const { status } = req.body;
  if (!['active', 'closed', 'filled'].includes(status)) return res.status(400).json({ error: 'Invalid status' });

  const ad = db.prepare('SELECT user_id FROM advertisements WHERE id = ?').get(req.params.id);
  if (!ad) return res.status(404).json({ error: 'Advertisement not found' });
  if (ad.user_id !== req.user.id && req.user.role !== 'admin') return res.status(403).json({ error: 'Not authorized' });

  db.prepare("UPDATE advertisements SET status = ?, updated_at = datetime('now') WHERE id = ?").run(status, req.params.id);
  res.json({ message: `Advertisement marked as ${status}` });
});

// DELETE /api/advertisements/:id
router.delete('/:id', authenticateToken, (req, res) => {
  const ad = db.prepare('SELECT * FROM advertisements WHERE id = ?').get(req.params.id);
  if (!ad) return res.status(404).json({ error: 'Advertisement not found' });
  if (ad.user_id !== req.user.id && req.user.role !== 'admin') return res.status(403).json({ error: 'You can only delete your own advertisements' });

  const images = JSON.parse(ad.reference_images || '[]');
  images.forEach(imgUrl => {
    const filePath = path.join(__dirname, '..', '..', imgUrl.replace('/uploads/', 'uploads/'));
    if (fs.existsSync(filePath)) { try { fs.unlinkSync(filePath); } catch {} }
  });

  db.prepare('DELETE FROM advertisements WHERE id = ?').run(req.params.id);
  res.json({ message: 'Advertisement deleted successfully' });
});

// POST /api/advertisements/:id/report
router.post('/:id/report', authenticateToken, (req, res) => {
  const { reason, details } = req.body;
  if (!reason || !reason.trim()) return res.status(400).json({ error: 'Reason is required' });

  const ad = db.prepare("SELECT id FROM advertisements WHERE id = ? AND status != 'removed'").get(req.params.id);
  if (!ad) return res.status(404).json({ error: 'Advertisement not found' });

  const existing = db.prepare('SELECT id FROM reports WHERE advertisement_id = ? AND reporter_id = ?').get(req.params.id, req.user.id);
  if (existing) return res.status(409).json({ error: 'You have already reported this advertisement' });

  db.prepare('INSERT INTO reports (id, advertisement_id, reporter_id, reason, details) VALUES (?, ?, ?, ?, ?)')
    .run(uuidv4(), req.params.id, req.user.id, reason.trim(), details || '');

  res.json({ message: 'Report submitted. Thank you for keeping the community safe.' });
});

function formatAd(ad) {
  return {
    ...ad,
    reference_images: JSON.parse(ad.reference_images || '[]'),
    contact_links: JSON.parse(ad.contact_links || '[]'),
    required_skills: JSON.parse(ad.required_skills || '[]'),
    tags: JSON.parse(ad.tags || '[]')
  };
}

module.exports = router;
