/**
 * Link Safety Scanner
 *
 * Two layers of protection:
 * 1. Local pattern matching — catches obviously bad/inappropriate links instantly, no API needed
 * 2. Google Safe Browsing API — checks for malware, phishing, unwanted software
 *    Set GOOGLE_SAFE_BROWSING_API_KEY in .env to enable (free, 10k req/day)
 *    Get a key at: https://developers.google.com/safe-browsing/v4/get-started
 *
 * Usage:
 *   const { scanLinks } = require('./utils/linkScanner')
 *   const results = await scanLinks(arrayOfUrlStrings, userId, sourceType, sourceId)
 */

const https = require('https');
const { v4: uuidv4 } = require('uuid');
const { dbProxy: db } = require('../db');

// ─── Local pattern blacklists ────────────────────────────────────────────────

// Domains/patterns known to host malware, scams, or inappropriate content
const MALICIOUS_PATTERNS = [
  /bit\.ly\/[a-z0-9]+/i,         // Generic shorteners can hide destinations
  /tinyurl\.com/i,
  /grabify\.link/i,               // IP grabber
  /iplogger\.(org|ru|co)/i,       // IP logger
  /blasze\.tk/i,
  /pulsed\.pro/i,
  /trackurl\.it/i,
  /2no\.co/i,
  /ezstat\.ru/i,
  /lovebird\.me/i,
  /freegiftcards?\.(com|net|org)/i,
  /freerobux\.(com|net|org|xyz)/i,
  /robux-generator/i,
  /free-robux/i,
  /robuxgenerator/i,
  /getrobux/i,
  /roblox-gift/i,
  /robloxhack/i,
  /nitro-generator/i,
  /discord-nitro-free/i,
  /steamgift-free/i,
  /virus-total-check/i,            // Fake antivirus
];

// Patterns that indicate inappropriate/adult content
const INAPPROPRIATE_PATTERNS = [
  /\bporn\b/i,
  /\bxxx\b/i,
  /\bsex\b/i,
  /\bnude(s)?\b/i,
  /\bonlyfans\.com/i,
  /\bfansly\.com/i,
  /adult-?content/i,
  /18\+content/i,
];

// Patterns that look like phishing attempts
const PHISHING_PATTERNS = [
  /roblox-login/i,
  /roblox\.com-[a-z]/i,
  /discord\.com-[a-z]/i,
  /\bverify-discord\b/i,
  /\bdiscord-verify\b/i,
  /free-nitro/i,
  /account-verify/i,
  /login-verify/i,
  /\bstearnpowered\.com/i,        // Fake Steam
  /\bstorecommunity\b/i,
  /paypa1\.com/i,                  // Typosquatting
  /\bpaypa[^l]/i,
];

// Suspicious TLDs that are commonly abused
const SUSPICIOUS_TLDS = /\.(tk|ml|ga|cf|gq|pw|top|click|download|zip|review|country|kim|science|work|party|date|stream|faith|loan|racing|win|webcam|accountant|men|cricket|trade|bid|online|space|website|site)(\/.+)?$/i;

// ─── URL extraction ───────────────────────────────────────────────────────────

function extractUrls(links) {
  if (!Array.isArray(links)) return [];
  return links
    .map(l => {
      if (typeof l === 'string') return l.trim();
      if (typeof l === 'object' && l.url) return l.url.trim();
      return null;
    })
    .filter(u => u && u.length > 3);
}

function normalizeUrl(url) {
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return 'https://' + url;
  }
  return url;
}

// ─── Local scan ──────────────────────────────────────────────────────────────

function localScan(url) {
  const threats = [];

  for (const pattern of MALICIOUS_PATTERNS) {
    if (pattern.test(url)) {
      threats.push({ type: 'MALWARE_OR_SCAM', detail: `Matched suspicious pattern: ${pattern}` });
      break;
    }
  }

  for (const pattern of INAPPROPRIATE_PATTERNS) {
    if (pattern.test(url)) {
      threats.push({ type: 'INAPPROPRIATE_CONTENT', detail: `Matched adult/inappropriate pattern: ${pattern}` });
      break;
    }
  }

  for (const pattern of PHISHING_PATTERNS) {
    if (pattern.test(url)) {
      threats.push({ type: 'PHISHING', detail: `Matched phishing pattern: ${pattern}` });
      break;
    }
  }

  if (SUSPICIOUS_TLDS.test(url)) {
    threats.push({ type: 'SUSPICIOUS_DOMAIN', detail: 'Uses a TLD commonly associated with malicious sites' });
  }

  return threats;
}

// ─── Google Safe Browsing API ─────────────────────────────────────────────────

async function googleSafeBrowsingCheck(urls) {
  const apiKey = process.env.GOOGLE_SAFE_BROWSING_API_KEY;
  if (!apiKey) return []; // Skip if no key configured

  const body = JSON.stringify({
    client: { clientId: 'creatorhub', clientVersion: '1.0.0' },
    threatInfo: {
      threatTypes: ['MALWARE', 'SOCIAL_ENGINEERING', 'UNWANTED_SOFTWARE', 'POTENTIALLY_HARMFUL_APPLICATION'],
      platformTypes: ['ANY_PLATFORM'],
      threatEntryTypes: ['URL'],
      threatEntries: urls.map(u => ({ url: u }))
    }
  });

  return new Promise((resolve) => {
    const options = {
      hostname: 'safebrowsing.googleapis.com',
      path: `/v4/threatMatches:find?key=${apiKey}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          const matches = parsed.matches || [];
          resolve(matches.map(m => ({
            url: m.threat.url,
            type: m.threatType,
            detail: `Google Safe Browsing: ${m.threatType} on ${m.platformType}`
          })));
        } catch {
          resolve([]);
        }
      });
    });

    req.on('error', () => resolve([])); // Don't block on API failure
    req.setTimeout(5000, () => { req.destroy(); resolve([]); });
    req.write(body);
    req.end();
  });
}

// ─── Main scanner ─────────────────────────────────────────────────────────────

/**
 * Scans an array of link objects/strings for threats.
 * Logs any findings to the flagged_links table.
 *
 * @param {Array} links - Array of {platform, url} objects or plain URL strings
 * @param {string} userId - ID of the user who owns this content
 * @param {string} sourceType - 'advertisement' | 'profile'
 * @param {string} sourceId - ID of the advertisement or user profile
 * @returns {Promise<{safe: boolean, flagged: Array}>}
 */
async function scanLinks(links, userId, sourceType, sourceId) {
  const urls = extractUrls(links);
  if (urls.length === 0) return { safe: true, flagged: [] };

  const flagged = [];

  // Layer 1 — instant local scan
  for (const rawUrl of urls) {
    const url = normalizeUrl(rawUrl);
    const localThreats = localScan(url);
    for (const threat of localThreats) {
      flagged.push({ url: rawUrl, ...threat, source: 'local' });
    }
  }

  // Layer 2 — Google Safe Browsing (async, non-blocking on failure)
  try {
    const normalizedUrls = urls.map(normalizeUrl);
    const googleThreats = await googleSafeBrowsingCheck(normalizedUrls);
    for (const threat of googleThreats) {
      // Avoid double-flagging the same URL
      if (!flagged.find(f => f.url === threat.url)) {
        flagged.push({ url: threat.url, type: threat.type, detail: threat.detail, source: 'google' });
      }
    }
  } catch {
    // Safe Browsing failure never blocks a submission
  }

  // Log all flagged links to DB
  for (const item of flagged) {
    try {
      db.prepare(`
        INSERT INTO flagged_links (id, url, source_type, source_id, user_id, threat_type, threat_detail)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(uuidv4(), item.url, sourceType, sourceId, userId, item.type, item.detail);
    } catch {
      // Don't crash if logging fails
    }
  }

  if (flagged.length > 0) {
    console.warn(`[LinkScanner] Flagged ${flagged.length} link(s) from ${sourceType} ${sourceId}:`, flagged.map(f => `${f.url} (${f.type})`));
  }

  return {
    safe: flagged.length === 0,
    flagged: flagged.map(f => ({ url: f.url, type: f.type, detail: f.detail }))
  };
}

/**
 * Returns a user-friendly error message listing which links were flagged.
 */
function buildFlagMessage(flagged) {
  const lines = flagged.map(f => {
    const typeLabel = {
      MALWARE_OR_SCAM: 'malware/scam',
      INAPPROPRIATE_CONTENT: 'inappropriate content',
      PHISHING: 'phishing attempt',
      SUSPICIOUS_DOMAIN: 'suspicious domain',
      MALWARE: 'malware',
      SOCIAL_ENGINEERING: 'phishing/social engineering',
      UNWANTED_SOFTWARE: 'unwanted software',
      POTENTIALLY_HARMFUL_APPLICATION: 'harmful application',
    }[f.type] || 'unsafe content';
    return `"${f.url}" — ${typeLabel}`;
  });
  return `The following link(s) were flagged as unsafe and cannot be saved:\n${lines.join('\n')}`;
}

module.exports = { scanLinks, buildFlagMessage, extractUrls };
