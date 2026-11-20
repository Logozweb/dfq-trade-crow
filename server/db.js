const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

const DATA_DIR = path.join(__dirname, '..', 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const dbPath = path.join(DATA_DIR, 'dfqtrade.db');
const db = new DatabaseSync(dbPath);

// Enable WAL mode and foreign keys for performance and integrity
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      phone TEXT NOT NULL,
      location TEXT DEFAULT 'Lekki, Lagos',
      password_hash TEXT NOT NULL,
      referral_code TEXT NOT NULL UNIQUE,
      referred_by INTEGER DEFAULT NULL,
      spotlight_credits INTEGER NOT NULL DEFAULT 0,
      is_admin INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (referred_by) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      mode TEXT NOT NULL,
      item_condition TEXT NOT NULL,
      location TEXT NOT NULL,
      wanted TEXT NOT NULL,
      est_value REAL NOT NULL DEFAULT 0.00,
      pawn_advance REAL DEFAULT NULL,
      pawn_buyback REAL DEFAULT NULL,
      pawn_due_date TEXT DEFAULT NULL,
      serial_imei TEXT DEFAULT NULL,
      receipt_path TEXT DEFAULT NULL,
      is_featured INTEGER NOT NULL DEFAULT 0,
      is_reported INTEGER NOT NULL DEFAULT 0,
      report_reason TEXT DEFAULT NULL,
      image_path TEXT NOT NULL,
      gallery_json TEXT DEFAULT NULL,
      description TEXT NOT NULL,
      status TEXT DEFAULT 'Active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS swap_offers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      item_id INTEGER NOT NULL,
      proposer_id INTEGER NOT NULL,
      owner_id INTEGER NOT NULL,
      offered_item TEXT NOT NULL,
      cash_topup TEXT DEFAULT '₦0 (Straight Swap)',
      note TEXT,
      status TEXT DEFAULT 'Pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
      FOREIGN KEY (proposer_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS trader_reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      offer_id INTEGER NOT NULL,
      reviewer_id INTEGER NOT NULL,
      target_user_id INTEGER NOT NULL,
      rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
      comment TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE (offer_id, reviewer_id),
      FOREIGN KEY (offer_id) REFERENCES swap_offers(id) ON DELETE CASCADE,
      FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (target_user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS wishlists (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      keyword TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // Seed demo user if not exists
  const userCheck = db.prepare('SELECT id FROM users WHERE email = ?').get('demo@dfqtradecrow.com');
  let demoUserId = userCheck ? userCheck.id : null;

  if (!demoUserId) {
    const defaultPasswordHash = bcrypt.hashSync('password', 10);
    const userInsert = db.prepare(`
      INSERT INTO users (full_name, email, phone, location, password_hash, referral_code, spotlight_credits, is_admin)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'DFQ Demo Trader',
      'demo@dfqtradecrow.com',
      '08030001111',
      'Lekki, Lagos',
      defaultPasswordHash,
      'DFQ-MASTER',
      5,
      1
    );
    demoUserId = Number(userInsert.lastInsertRowid);
    console.log(`[DB] Created default admin demo user: demo@dfqtradecrow.com (password: 'password') with ID: ${demoUserId}`);
  }

  // Seed items if items table is empty
  const itemCount = db.prepare('SELECT COUNT(*) as count FROM items').get().count;
  if (itemCount === 0) {
    const seedPath = path.join(__dirname, 'seeds', 'items.json');
    if (fs.existsSync(seedPath)) {
      const seedItems = JSON.parse(fs.readFileSync(seedPath, 'utf8'));
      const insertItem = db.prepare(`
        INSERT INTO items (
          id, user_id, title, category, mode, item_condition, location, wanted,
          est_value, pawn_advance, pawn_buyback, pawn_due_date, serial_imei,
          receipt_path, is_featured, image_path, gallery_json, description, status
        ) VALUES (
          ?, ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?
        )
      `);

      for (const it of seedItems) {
        insertItem.run(
          it.id,
          demoUserId,
          it.title,
          it.category,
          it.mode,
          it.item_condition,
          it.location,
          it.wanted,
          it.est_value || 0,
          it.pawn_advance || null,
          it.pawn_buyback || null,
          it.pawn_due_date || null,
          it.serial_imei || null,
          it.receipt_path || null,
          it.is_featured ? 1 : 0,
          it.image_path,
          JSON.stringify(it.gallery || [it.image_path]),
          it.description,
          it.status || 'Active'
        );
      }
      console.log(`[DB] Seeded ${seedItems.length} marketplace items.`);
    }
  }
}

initSchema();

module.exports = {
  db,
  initSchema
};
