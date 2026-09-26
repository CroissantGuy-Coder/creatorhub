const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { dbProxy: db } = require('../db');
const { authenticateToken } = require('../middleware/auth');
const { createOrder, captureOrder } = require('../utils/paypal');

const router = express.Router();

const FEATURE_PRICE = 5.00;        // USD
const FEATURE_DAYS  = 7;           // How long the ad stays featured

// ── POST /api/payments/feature/:adId ─────────────────────────────────────────
// Creates a PayPal order and returns the approval URL to redirect the user to.
router.post('/feature/:adId', authenticateToken, async (req, res) => {
  try {
    const { adId } = req.params;

    // Verify the ad exists and belongs to this user
    const ad = db.prepare('SELECT * FROM advertisements WHERE id = ? AND status != ?').get(adId, 'removed');
    if (!ad) {
      return res.status(404).json({ error: 'Advertisement not found' });
    }
    if (ad.user_id !== req.user.id) {
      return res.status(403).json({ error: 'You can only feature your own advertisements' });
    }

    // Check if ad is already featured and still active
    if (ad.featured_until && new Date(ad.featured_until) > new Date()) {
      return res.status(400).json({
        error: 'This advertisement is already featured',
        featured_until: ad.featured_until
      });
    }

    // Check for an existing pending payment to avoid duplicates
    const existingPending = db.prepare(
      "SELECT id FROM payments WHERE advertisement_id = ? AND status = 'pending' AND created_at > datetime('now', '-1 hour')"
    ).get(adId);
    if (existingPending) {
      return res.status(400).json({ error: 'A payment for this advertisement is already in progress' });
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const returnUrl = `${frontendUrl}/payment/success?adId=${adId}`;
    const cancelUrl = `${frontendUrl}/payment/cancel?adId=${adId}`;

    // Create PayPal order
    const { orderId, approvalUrl } = await createOrder(
      adId,
      ad.title,
      FEATURE_PRICE,
      returnUrl,
      cancelUrl
    );

    // Save pending payment record
    const paymentId = uuidv4();
    db.prepare(`
      INSERT INTO payments (id, user_id, advertisement_id, paypal_order_id, amount, currency, status, feature_days)
      VALUES (?, ?, ?, ?, ?, 'USD', 'pending', ?)
    `).run(paymentId, req.user.id, adId, orderId, FEATURE_PRICE, FEATURE_DAYS);

    res.json({
      payment_id: paymentId,
      paypal_order_id: orderId,
      approval_url: approvalUrl,
      amount: FEATURE_PRICE,
      feature_days: FEATURE_DAYS,
    });
  } catch (err) {
    console.error('Create payment error:', err);
    if (err.message?.includes('not configured')) {
      return res.status(503).json({ error: 'Payment system not configured yet. Please try again later.' });
    }
    res.status(500).json({ error: 'Failed to create payment. Please try again.' });
  }
});

// ── POST /api/payments/capture ────────────────────────────────────────────────
// Called after the user approves on PayPal and is redirected back.
// The frontend sends the PayPal orderId here to complete the capture.
router.post('/capture', authenticateToken, async (req, res) => {
  try {
    const { paypal_order_id } = req.body;
    if (!paypal_order_id) {
      return res.status(400).json({ error: 'paypal_order_id is required' });
    }

    // Find the pending payment
    const payment = db.prepare(
      "SELECT * FROM payments WHERE paypal_order_id = ? AND status = 'pending'"
    ).get(paypal_order_id);

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found or already processed' });
    }

    // Verify ownership
    if (payment.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Capture the payment with PayPal
    const result = await captureOrder(paypal_order_id);

    if (result.status !== 'COMPLETED') {
      db.prepare("UPDATE payments SET status = 'failed' WHERE id = ?").run(payment.id);
      return res.status(400).json({ error: `Payment not completed. Status: ${result.status}` });
    }

    // Calculate featured_until date
    const featuredUntil = new Date();
    featuredUntil.setDate(featuredUntil.getDate() + payment.feature_days);
    const featuredUntilStr = featuredUntil.toISOString();

    // Update payment record
    db.prepare(`
      UPDATE payments
      SET status = 'completed', paypal_capture_id = ?, completed_at = datetime('now')
      WHERE id = ?
    `).run(result.captureId, payment.id);

    // Mark the advertisement as featured
    db.prepare(`
      UPDATE advertisements
      SET is_featured = 1, featured_until = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(featuredUntilStr, payment.advertisement_id);

    const ad = db.prepare('SELECT id, title, is_featured, featured_until FROM advertisements WHERE id = ?')
      .get(payment.advertisement_id);

    res.json({
      message: `Your advertisement is now featured until ${featuredUntil.toLocaleDateString()}!`,
      advertisement: ad,
      payment_id: payment.id,
      featured_until: featuredUntilStr,
    });
  } catch (err) {
    console.error('Capture payment error:', err);
    res.status(500).json({ error: 'Failed to capture payment. Please contact support.' });
  }
});

// ── GET /api/payments/my-payments ────────────────────────────────────────────
// Returns the current user's payment history
router.get('/my-payments', authenticateToken, (req, res) => {
  const payments = db.prepare(`
    SELECT p.*, a.title as ad_title, a.category, a.is_featured, a.featured_until
    FROM payments p
    JOIN advertisements a ON p.advertisement_id = a.id
    WHERE p.user_id = ?
    ORDER BY p.created_at DESC
  `).all(req.user.id);

  res.json({ payments });
});

// ── GET /api/payments/status/:adId ───────────────────────────────────────────
// Returns whether an ad is currently featured
router.get('/status/:adId', (req, res) => {
  const ad = db.prepare('SELECT id, is_featured, featured_until FROM advertisements WHERE id = ?')
    .get(req.params.adId);

  if (!ad) return res.status(404).json({ error: 'Advertisement not found' });

  const isCurrentlyFeatured = ad.is_featured && ad.featured_until && new Date(ad.featured_until) > new Date();

  // Auto-expire if past the date
  if (ad.is_featured && !isCurrentlyFeatured) {
    db.prepare("UPDATE advertisements SET is_featured = 0 WHERE id = ?").run(ad.id);
  }

  res.json({
    is_featured: isCurrentlyFeatured,
    featured_until: isCurrentlyFeatured ? ad.featured_until : null,
  });
});

module.exports = router;
