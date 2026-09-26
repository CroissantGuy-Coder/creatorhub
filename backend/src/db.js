/**
 * Database layer using sql.js (pure WebAssembly SQLite — no native compilation needed).
 * The database is loaded from disk on start and saved to disk after every write.
 */

const path = require('path');
const fs = require('fs');

// On Railway, use the mounted volume path so data persists across deploys.
// RAILWAY_VOLUME_MOUNT_PATH is set automatically when you attach a volume.
// Locally it falls back to the backend/data folder.
const DB_DIR = process.env.RAILWAY_VOLUME_MOUNT_PATH
  ? path.join(process.env.RAILWAY_VOLUME_MOUNT_PATH, 'data')
  : path.join(__dirname, '..', 'data');

const DB_PATH = path.join(DB_DIR, 'creatorhub.db');

if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

let sqljs = null;
let dbInstance = null;

// Synchronous-style wrapper so existing code that uses db.prepare().run()/.get()/.all() keeps working
class Statement {
  constructor(db, sql) {
    this._db = db;
    this._sql = sql;
  }

  _exec(params = []) {
    const normalized = this._normalize(params);
    return this._db.exec(this._sql, normalized);
  }

  _normalize(params) {
    if (!params || (Array.isArray(params) && params.length === 0)) return undefined;
    if (Array.isArray(params)) return params;
    return params;
  }

  run(...params) {
    const flat = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
    this._db.run(this._sql, flat.length ? flat : undefined);
    saveDb();
    return { changes: this._db.getRowsModified() };
  }

  get(...params) {
    const flat = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
    const results = this._db.exec(this._sql, flat.length ? flat : undefined);
    if (!results || results.length === 0 || results[0].values.length === 0) return undefined;
    const { columns, values } = results[0];
    return rowToObject(columns, values[0]);
  }

  all(...params) {
    const flat = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
    const results = this._db.exec(this._sql, flat.length ? flat : undefined);
    if (!results || results.length === 0) return [];
    const { columns, values } = results[0];
    return values.map(row => rowToObject(columns, row));
  }
}

function rowToObject(columns, row) {
  const obj = {};
  columns.forEach((col, i) => { obj[col] = row[i]; });
  return obj;
}

function saveDb() {
  if (!dbInstance) return;
  const data = dbInstance.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

// Proxy object that mirrors the better-sqlite3 API
const dbProxy = {
  prepare(sql) {
    return new Statement(dbInstance, sql);
  },
  exec(sql) {
    dbInstance.run(sql);
    saveDb();
  },
  pragma(pragma) {
    // sql.js pragmas are set differently; handle key ones
    if (pragma === 'journal_mode = WAL') {
      try { dbInstance.run('PRAGMA journal_mode = WAL'); } catch {}
    } else if (pragma === 'foreign_keys = ON') {
      dbInstance.run('PRAGMA foreign_keys = ON');
    }
  },
  transaction(fn) {
    return (...args) => {
      dbInstance.run('BEGIN');
      try {
        const result = fn(...args);
        dbInstance.run('COMMIT');
        saveDb();
        return result;
      } catch (e) {
        dbInstance.run('ROLLBACK');
        throw e;
      }
    };
  }
};

function initializeDatabase() {
  dbInstance.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      avatar_url TEXT,
      bio TEXT DEFAULT '',
      skills TEXT DEFAULT '[]',
      social_links TEXT DEFAULT '[]',
      role TEXT DEFAULT 'user',
      is_suspended INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);

  dbInstance.run(`
    CREATE TABLE IF NOT EXISTS advertisements (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      job_type TEXT NOT NULL,
      description TEXT NOT NULL,
      payment_amount REAL,
      payment_currency TEXT DEFAULT 'USD',
      payment_type TEXT DEFAULT 'Fixed Price',
      reference_images TEXT DEFAULT '[]',
      contact_links TEXT DEFAULT '[]',
      required_skills TEXT DEFAULT '[]',
      tags TEXT DEFAULT '[]',
      status TEXT DEFAULT 'active',
      views INTEGER DEFAULT 0,
      is_featured INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  dbInstance.run(`
    CREATE TABLE IF NOT EXISTS reports (
      id TEXT PRIMARY KEY,
      advertisement_id TEXT NOT NULL,
      reporter_id TEXT NOT NULL,
      reason TEXT NOT NULL,
      details TEXT DEFAULT '',
      status TEXT DEFAULT 'pending',
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (advertisement_id) REFERENCES advertisements(id) ON DELETE CASCADE,
      FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  dbInstance.run(`
    CREATE TABLE IF NOT EXISTS saved_advertisements (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      advertisement_id TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (advertisement_id) REFERENCES advertisements(id) ON DELETE CASCADE,
      UNIQUE(user_id, advertisement_id)
    )
  `);

  dbInstance.run(`
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      token TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      used INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  dbInstance.run(`
    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      advertisement_id TEXT NOT NULL,
      paypal_order_id TEXT,
      paypal_capture_id TEXT,
      amount REAL NOT NULL,
      currency TEXT DEFAULT 'USD',
      status TEXT DEFAULT 'pending',
      feature_days INTEGER DEFAULT 7,
      created_at TEXT DEFAULT (datetime('now')),
      completed_at TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (advertisement_id) REFERENCES advertisements(id) ON DELETE CASCADE
    )
  `);

  dbInstance.run(`
    CREATE TABLE IF NOT EXISTS flagged_links (
      id TEXT PRIMARY KEY,
      url TEXT NOT NULL,
      source_type TEXT NOT NULL,
      source_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      threat_type TEXT NOT NULL,
      threat_detail TEXT DEFAULT '',
      reviewed INTEGER DEFAULT 0,
      action_taken TEXT DEFAULT 'none',
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Indexes
  const indexes = [
    "CREATE INDEX IF NOT EXISTS idx_ads_category ON advertisements(category)",
    "CREATE INDEX IF NOT EXISTS idx_ads_job_type ON advertisements(job_type)",
    "CREATE INDEX IF NOT EXISTS idx_ads_status ON advertisements(status)",
    "CREATE INDEX IF NOT EXISTS idx_ads_user_id ON advertisements(user_id)",
    "CREATE INDEX IF NOT EXISTS idx_ads_created_at ON advertisements(created_at)",
    "CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status)",
    "CREATE INDEX IF NOT EXISTS idx_flagged_links_reviewed ON flagged_links(reviewed)",
    "CREATE INDEX IF NOT EXISTS idx_flagged_links_source ON flagged_links(source_type, source_id)",
    "CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status)",
  ];
  indexes.forEach(idx => dbInstance.run(idx));

  // Safe column migrations — add new columns to existing tables if they don't exist
  try { dbInstance.run("ALTER TABLE advertisements ADD COLUMN featured_until TEXT"); } catch {}
  try { dbInstance.run("ALTER TABLE advertisements ADD COLUMN is_featured INTEGER DEFAULT 0"); } catch {}

  saveDb();
  console.log('Database initialized successfully');
}

// Initialize is async because sql.js requires loading WASM
async function initDb() {
  const initSqlJs = require('sql.js');
  sqljs = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    dbInstance = new sqljs.Database(fileBuffer);
    console.log('Database loaded from disk');
  } else {
    dbInstance = new sqljs.Database();
    console.log('New database created');
  }

  dbInstance.run('PRAGMA foreign_keys = ON');
  initializeDatabase();
}

module.exports = { dbProxy, initDb };
