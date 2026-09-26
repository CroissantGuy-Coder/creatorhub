/**
 * PayPal REST API v2 helper
 * Handles OAuth token, order creation and capture.
 * Uses only Node's built-in https — no extra dependencies.
 *
 * Set these in backend/.env:
 *   PAYPAL_CLIENT_ID=...
 *   PAYPAL_CLIENT_SECRET=...
 *   PAYPAL_MODE=sandbox   (or "live" for production)
 */

const https = require('https');

function getBaseUrl() {
  return process.env.PAYPAL_MODE === 'live'
    ? 'api-m.paypal.com'
    : 'api-m.sandbox.paypal.com';
}

// ── HTTP helper ───────────────────────────────────────────────────────────────

function httpsRequest(options, body = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : {};
          if (res.statusCode >= 400) {
            const err = new Error(parsed.message || `PayPal API error ${res.statusCode}`);
            err.statusCode = res.statusCode;
            err.details = parsed;
            return reject(err);
          }
          resolve(parsed);
        } catch {
          reject(new Error('Invalid JSON from PayPal'));
        }
      });
    });
    req.on('error', reject);
    req.setTimeout(10000, () => { req.destroy(); reject(new Error('PayPal request timed out')); });
    if (body) req.write(body);
    req.end();
  });
}

// ── OAuth token ───────────────────────────────────────────────────────────────

let _cachedToken = null;
let _tokenExpiry = 0;

async function getAccessToken() {
  if (_cachedToken && Date.now() < _tokenExpiry) return _cachedToken;

  const clientId = process.env.PAYPAL_CLIENT_ID;
  const secret   = process.env.PAYPAL_CLIENT_SECRET;

  if (!clientId || !secret) {
    throw new Error('PayPal credentials not configured. Add PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET to .env');
  }

  const credentials = Buffer.from(`${clientId}:${secret}`).toString('base64');
  const body = 'grant_type=client_credentials';

  const result = await httpsRequest({
    hostname: getBaseUrl(),
    path: '/v1/oauth2/token',
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(body),
    }
  }, body);

  _cachedToken = result.access_token;
  _tokenExpiry = Date.now() + (result.expires_in - 60) * 1000; // refresh 1 min early
  return _cachedToken;
}

// ── Create Order ──────────────────────────────────────────────────────────────

/**
 * Creates a PayPal order for featuring an advertisement.
 * @param {string} adId - The advertisement ID
 * @param {string} adTitle - Short title shown in PayPal checkout
 * @param {number} amount - Amount in USD (e.g. 5.00)
 * @param {string} returnUrl - URL PayPal redirects to after approval
 * @param {string} cancelUrl - URL PayPal redirects to on cancel
 * @returns {Promise<{orderId: string, approvalUrl: string}>}
 */
async function createOrder(adId, adTitle, amount, returnUrl, cancelUrl) {
  const token = await getAccessToken();

  const body = JSON.stringify({
    intent: 'CAPTURE',
    purchase_units: [{
      reference_id: adId,
      description: `Featured Advertisement: ${adTitle.substring(0, 120)}`,
      amount: {
        currency_code: 'USD',
        value: amount.toFixed(2),
      },
      custom_id: adId,
    }],
    application_context: {
      brand_name: 'CreatorHub',
      landing_page: 'NO_PREFERENCE',
      user_action: 'PAY_NOW',
      return_url: returnUrl,
      cancel_url: cancelUrl,
    }
  });

  const result = await httpsRequest({
    hostname: getBaseUrl(),
    path: '/v2/checkout/orders',
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body),
      'PayPal-Request-Id': `creatorhub-${adId}-${Date.now()}`,
    }
  }, body);

  const approvalUrl = result.links.find(l => l.rel === 'approve')?.href;
  return { orderId: result.id, approvalUrl };
}

// ── Capture Order ─────────────────────────────────────────────────────────────

/**
 * Captures (charges) an approved PayPal order.
 * Call this after the user returns from PayPal approval.
 * @param {string} orderId - The PayPal order ID
 * @returns {Promise<{captureId: string, status: string, amount: string}>}
 */
async function captureOrder(orderId) {
  const token = await getAccessToken();

  const result = await httpsRequest({
    hostname: getBaseUrl(),
    path: `/v2/checkout/orders/${orderId}/capture`,
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Content-Length': '0',
    }
  }, '');

  const capture = result.purchase_units?.[0]?.payments?.captures?.[0];
  return {
    captureId: capture?.id,
    status: result.status,
    amount: capture?.amount?.value,
    adId: result.purchase_units?.[0]?.custom_id,
  };
}

// ── Verify Order Status ───────────────────────────────────────────────────────

async function getOrderDetails(orderId) {
  const token = await getAccessToken();
  return httpsRequest({
    hostname: getBaseUrl(),
    path: `/v2/checkout/orders/${orderId}`,
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  });
}

module.exports = { createOrder, captureOrder, getOrderDetails };
