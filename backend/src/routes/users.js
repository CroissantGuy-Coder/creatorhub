const express = require('express');
const path = require('path');
const fs = require('fs');
const { dbProxy: db } = require('../db');
const { authenticateToken } = require('../middleware/auth');
const { uploadAvatar } = require('../middleware/upload');
const { scanLinks, buildFlagMessage } = require('../utils/linkScanner');

const router = express.Router();

// GET /api/users/:username - public profile
router.get('/:username', (req, res) => {
  // Skip special dashboard routes handled before this
  if (['dashboard', 'avatar', 'password', 'save'].includes(req.params.username)) {
    return res.status(404).json({ error: 'Not found' });
  }

  const user = db.prepare(
    'SELECT id, username, avatar_url, bio, skills, social_links, created_at FROM users WHERE username = ? AND is_suspended = 0'
  ).get(req.params.username);

  if (!user) return res.status(404).json({ error: 'User not found' });

  const ads = db.prepare(
    'SELECT id, title, category, job_type, payment_amount, payment_currency, payment_type, status, views, created_at, tags FROM advertisements WHERE user_id = ? ORDER BY created_at DESC'
  ).all(user.id);

  res.json({
    ...user,
    skills: JSON.parse(user.skills || '[]'),
    social_links: JSON.parse(user.social_links || '[]'),
    advertisements: ads.map(ad => ({
      ...ad,
      tags: JSON.parse(ad.tags || '[]')
    }))
  });
});

// PUT /api/users/profile/update
router.put('/profile/update', authenticateToken, async (req, res) => {
  const { bio, skills, social_links } = req.body;
  const skillsArr = Array.isArray(skills) ? skills : [];
  const linksArr = Array.isArray(social_links) ? social_links : [];

  // ── Link safety scan on social links ──────────────────────────────────────
  if (linksArr.length > 0) {
    const scan = await scanLinks(linksArr, req.user.id, 'profile', req.user.id);
    if (!scan.safe) {
      return res.status(400).json({
        error: buildFlagMessage(scan.flagged),
        flagged_links: scan.flagged
      });
    }
  }
  // ──────────────────────────────────────────────────────────────────────────

  db.prepare(
    "UPDATE users SET bio = ?, skills = ?, social_links = ?, updated_at = datetime('now') WHERE id = ?"
  ).run(bio || '', JSON.stringify(skillsArr), JSON.stringify(linksArr), req.user.id);

  const updated = db.prepare(
    'SELECT id, username, email, avatar_url, bio, skills, social_links, role, created_at FROM users WHERE id = ?'
  ).get(req.user.id);

  res.json({
    message: 'Profile updated',
    user: {
      ...updated,
      skills: JSON.parse(updated.skills || '[]'),
      social_links: JSON.parse(updated.social_links || '[]')
    }
  });
});

// POST /api/users/avatar/upload
router.post('/avatar/upload', authenticateToken, (req, res) => {
  uploadAvatar(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: 'No image file provided' });

    const current = db.prepare('SELECT avatar_url FROM users WHERE id = ?').get(req.user.id);
    if (current && current.avatar_url) {
      const oldPath = path.join(__dirname, '..', '..', current.avatar_url.replace('/uploads/', 'uploads/'));
      if (fs.existsSync(oldPath)) {
        try { fs.unlinkSync(oldPath); } catch {}
      }
    }

    const avatarUrl = `/uploads/avatars/${req.file.filename}`;
    db.prepare("UPDATE users SET avatar_url = ?, updated_at = datetime('now') WHERE id = ?")
      .run(avatarUrl, req.user.id);

    res.json({ message: 'Avatar updated', avatar_url: avatarUrl });
  });
});

// PUT /api/users/password/change
router.put('/password/change', authenticateToken, async (req, res) => {
  const bcrypt = require('bcryptjs');
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Current and new passwords are required' });
  }
  if (newPassword.length < 8) {
    return res.status(400).json({ error: 'New password must be at least 8 characters' });
  }

  const user = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(req.user.id);
  const valid = await bcrypt.compare(currentPassword, user.password_hash);
  if (!valid) return res.status(400).json({ error: 'Current password is incorrect' });

  const newHash = await bcrypt.hash(newPassword, 12);
  db.prepare("UPDATE users SET password_hash = ?, updated_at = datetime('now') WHERE id = ?")
    .run(newHash, req.user.id);

  res.json({ message: 'Password changed successfully' });
});

// GET /api/users/dashboard/my-ads
router.get('/dashboard/my-ads', authenticateToken, (req, res) => {
  const ads = db.prepare('SELECT * FROM advertisements WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id);
  res.json(ads.map(ad => ({
    ...ad,
    reference_images: JSON.parse(ad.reference_images || '[]'),
    contact_links: JSON.parse(ad.contact_links || '[]'),
    required_skills: JSON.parse(ad.required_skills || '[]'),
    tags: JSON.parse(ad.tags || '[]')
  })));
});

// GET /api/users/dashboard/saved
router.get('/dashboard/saved', authenticateToken, (req, res) => {
  const ads = db.prepare(`
    SELECT a.*, u.username, u.avatar_url
    FROM saved_advertisements sa
    JOIN advertisements a ON sa.advertisement_id = a.id
    JOIN users u ON a.user_id = u.id
    WHERE sa.user_id = ? AND a.status != 'removed'
    ORDER BY sa.created_at DESC
  `).all(req.user.id);

  res.json(ads.map(ad => ({
    ...ad,
    reference_images: JSON.parse(ad.reference_images || '[]'),
    contact_links: JSON.parse(ad.contact_links || '[]'),
    required_skills: JSON.parse(ad.required_skills || '[]'),
    tags: JSON.parse(ad.tags || '[]')
  })));
});

// POST /api/users/save/:adId
router.post('/save/:adId', authenticateToken, (req, res) => {
  const { v4: uuidv4 } = require('uuid');
  const { adId } = req.params;

  const ad = db.prepare('SELECT id FROM advertisements WHERE id = ?').get(adId);
  if (!ad) return res.status(404).json({ error: 'Advertisement not found' });

  const existing = db.prepare('SELECT id FROM saved_advertisements WHERE user_id = ? AND advertisement_id = ?')
    .get(req.user.id, adId);

  if (existing) {
    db.prepare('DELETE FROM saved_advertisements WHERE user_id = ? AND advertisement_id = ?')
      .run(req.user.id, adId);
    return res.json({ saved: false, message: 'Advertisement unsaved' });
  }

  db.prepare('INSERT INTO saved_advertisements (id, user_id, advertisement_id) VALUES (?, ?, ?)')
    .run(uuidv4(), req.user.id, adId);

  res.json({ saved: true, message: 'Advertisement saved' });
});

// DELETE /api/users/account/delete — permanently delete account and ALL data
router.delete('/account/delete', authenticateToken, async (req, res) => {
  const bcrypt = require('bcryptjs');
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({ error: 'Password is required to delete your account' });
  }

  // Verify password before deleting
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const validPassword = await bcrypt.compare(password, user.password_hash);
  if (!validPassword) {
    return res.status(401).json({ error: 'Incorrect password' });
  }

  // Cannot delete an admin account this way
  if (user.role === 'admin') {
    return res.status(403).json({ error: 'Admin accounts cannot be self-deleted' });
  }

  try {
    // Delete avatar image file if exists
    if (user.avatar_url) {
      const avatarPath = path.join(__dirname, '..', '..', user.avatar_url.replace('/uploads/', 'uploads/'));
      if (fs.existsSync(avatarPath)) {
        try { fs.unlinkSync(avatarPath); } catch {}
      }
    }

    // Delete all reference images from this user's advertisements
    const userAds = db.prepare('SELECT reference_images FROM advertisements WHERE user_id = ?').all(user.id);
    userAds.forEach(ad => {
      const images = JSON.parse(ad.reference_images || '[]');
      images.forEach(imgUrl => {
        const imgPath = path.join(__dirname, '..', '..', imgUrl.replace('/uploads/', 'uploads/'));
        if (fs.existsSync(imgPath)) {
          try { fs.unlinkSync(imgPath); } catch {}
        }
      });
    });

    // Delete all data from database — CASCADE handles related records
    // Order matters: delete dependent tables first
    db.prepare('DELETE FROM saved_advertisements WHERE user_id = ?').run(user.id);
    db.prepare('DELETE FROM password_reset_tokens WHERE user_id = ?').run(user.id);
    db.prepare('DELETE FROM reports WHERE reporter_id = ?').run(user.id);
    db.prepare('DELETE FROM flagged_links WHERE user_id = ?').run(user.id);
    db.prepare('DELETE FROM payments WHERE user_id = ?').run(user.id);
    db.prepare('DELETE FROM advertisements WHERE user_id = ?').run(user.id);
    db.prepare('DELETE FROM users WHERE id = ?').run(user.id);

    res.json({
      message: 'Your account and all associated data has been permanently deleted.'
    });
  } catch (err) {
    console.error('Delete account error:', err);
    res.status(500).json({ error: 'Failed to delete account. Please try again.' });
  }
});

module.exports = router;
