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

    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      item_id INTEGER NOT NULL,
      sender_id INTEGER NOT NULL,
      recipient_id INTEGER NOT NULL,
      message TEXT NOT NULL,
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
      FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS otps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL,
      code TEXT NOT NULL,
      purpose TEXT DEFAULT 'registration',
      candidate_name TEXT,
      expires_at DATETIME NOT NULL,
      used INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT DEFAULT 'info',
      link TEXT DEFAULT NULL,
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS kyc_verifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      tier INTEGER NOT NULL DEFAULT 2,
      full_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      nin_bvn TEXT NOT NULL,
      id_type TEXT DEFAULT 'NIN',
      id_document_path TEXT,
      business_name TEXT,
      business_address TEXT,
      cac_number TEXT,
      status TEXT DEFAULT 'pending_review',
      rejection_reason TEXT,
      reviewed_by INTEGER,
      reviewed_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS email_settings (
      id TEXT PRIMARY KEY,
      provider TEXT DEFAULT 'smtp',
      smtp_config TEXT,
      resend_api_key TEXT,
      sender_name TEXT DEFAULT 'DFQ Trade Crow Security',
      sender_email TEXT DEFAULT 'no-reply@dfqtradecrow.com',
      subject_line TEXT DEFAULT 'DFQ Trade Crow - Your Verification Code',
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS email_outbox (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      recipient_email TEXT NOT NULL,
      recipient_name TEXT,
      otp_code TEXT,
      subject TEXT,
      status TEXT DEFAULT 'sent',
      provider TEXT DEFAULT 'smtp',
      details TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Safely ensure dual-OTP & escrow columns exist on swap_offers
  try { db.exec(`ALTER TABLE swap_offers ADD COLUMN proposer_otp TEXT;`); } catch (_) {}
  try { db.exec(`ALTER TABLE swap_offers ADD COLUMN owner_otp TEXT;`); } catch (_) {}
  try { db.exec(`ALTER TABLE swap_offers ADD COLUMN proposer_confirmed INTEGER DEFAULT 0;`); } catch (_) {}
  try { db.exec(`ALTER TABLE swap_offers ADD COLUMN owner_confirmed INTEGER DEFAULT 0;`); } catch (_) {}
  try { db.exec(`ALTER TABLE swap_offers ADD COLUMN meetup_hub TEXT DEFAULT 'Ikeja City Mall Public Hub';`); } catch (_) {}
  try { db.exec(`ALTER TABLE swap_offers ADD COLUMN escrow_funded INTEGER DEFAULT 0;`); } catch (_) {}
  try { db.exec(`ALTER TABLE swap_offers ADD COLUMN offered_image TEXT;`); } catch (_) {}
  try { db.exec(`ALTER TABLE swap_offers ADD COLUMN decline_reason TEXT;`); } catch (_) {}

  // Safely ensure tiered KYC & email verification columns exist on users
  try { db.exec(`ALTER TABLE users ADD COLUMN kyc_tier INTEGER DEFAULT 1;`); } catch (_) {}
  try { db.exec(`ALTER TABLE users ADD COLUMN kyc_status TEXT DEFAULT 'unverified';`); } catch (_) {}
  try { db.exec(`ALTER TABLE users ADD COLUMN email_verified INTEGER DEFAULT 0;`); } catch (_) {}
  try { db.exec(`ALTER TABLE users ADD COLUMN nin_bvn TEXT;`); } catch (_) {}
  try { db.exec(`ALTER TABLE users ADD COLUMN business_name TEXT;`); } catch (_) {}
  try { db.exec(`ALTER TABLE users ADD COLUMN business_address TEXT;`); } catch (_) {}
  try { db.exec(`ALTER TABLE users ADD COLUMN avatar TEXT;`); } catch (_) {}
  try { db.exec(`ALTER TABLE users ADD COLUMN is_blocked INTEGER DEFAULT 0;`); } catch (_) {}
  try { db.exec(`ALTER TABLE users ADD COLUMN blocked_reason TEXT;`); } catch (_) {}

  // Safely ensure admin review & pawn columns exist on items
  try { db.exec(`ALTER TABLE items ADD COLUMN admin_review_notes TEXT;`); } catch (_) {}
  try { db.exec(`ALTER TABLE items ADD COLUMN is_liquidated INTEGER DEFAULT 0;`); } catch (_) {}
  try { db.exec(`ALTER TABLE items ADD COLUMN redeemed_at DATETIME;`); } catch (_) {}
  try { db.exec(`ALTER TABLE trader_reviews ADD COLUMN tags TEXT;`); } catch (_) {}

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

function createOtpInDb(email, candidateName = 'Trader', purpose = 'registration') {
  const cleanEmail = String(email || '').trim().toLowerCase();
  // 6-digit random code
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  // Expires in 15 minutes
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

  // Invalidate any existing unused OTPs for this email & purpose
  db.prepare('UPDATE otps SET used = 1 WHERE email = ? AND purpose = ? AND used = 0').run(cleanEmail, purpose);

  db.prepare(`
    INSERT INTO otps (email, code, purpose, candidate_name, expires_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(cleanEmail, code, purpose, candidateName, expiresAt);

  return { code, expiresAt, email: cleanEmail };
}

function verifyOtpInDb(email, code, purpose = 'registration') {
  const cleanEmail = String(email || '').trim().toLowerCase();
  const cleanCode = String(code || '').trim();

  const record = db.prepare(`
    SELECT * FROM otps
    WHERE email = ? AND code = ? AND purpose = ? AND used = 0
    ORDER BY id DESC LIMIT 1
  `).get(cleanEmail, cleanCode, purpose);

  if (!record) {
    return { success: false, error: 'Invalid verification code.' };
  }

  const now = new Date();
  const expires = new Date(record.expires_at);
  if (now > expires) {
    return { success: false, error: 'Verification code has expired. Please request a new one.' };
  }

  // Mark as used
  db.prepare('UPDATE otps SET used = 1 WHERE id = ?').run(record.id);

  // If purpose is registration or email_verify, update users table
  if (purpose === 'registration' || purpose === 'email_verify') {
    db.prepare('UPDATE users SET email_verified = 1 WHERE email = ?').run(cleanEmail);
  }

  return { success: true, message: 'Email successfully verified!' };
}

function createNotification(userId, title, message, type = 'info', link = null) {
  try {
    const res = db.prepare(`
      INSERT INTO notifications (user_id, title, message, type, link)
      VALUES (?, ?, ?, ?, ?)
    `).run(userId, title, message, type, link);
    return res.lastInsertRowid;
  } catch (err) {
    console.error('[Notification Error]', err);
    return null;
  }
}

function getEmailSettingsFromDb() {
  try {
    const row = db.prepare('SELECT * FROM email_settings WHERE id = ?').get('primary');
    if (row) {
      let smtp = { host: 'smtp.gmail.com', port: '587', secure: false, user: '', pass: '', senderName: 'DFQ Trade Crow Security' };
      try {
        if (row.smtp_config) smtp = { ...smtp, ...JSON.parse(row.smtp_config) };
      } catch (_) {}
      return {
        provider: row.provider || 'smtp',
        smtp,
        resendApiKey: row.resend_api_key || '',
        senderName: row.sender_name || 'DFQ Trade Crow Security',
        senderEmail: row.sender_email || 'no-reply@dfqtradecrow.com',
        subjectLine: row.subject_line || 'DFQ Trade Crow - Your Verification Code',
        updatedAt: row.updated_at
      };
    }
  } catch (err) {
    console.error('[DB] getEmailSettingsFromDb error:', err);
  }

  return {
    provider: 'smtp',
    smtp: { host: 'smtp.gmail.com', port: '587', secure: false, user: '', pass: '', senderName: 'DFQ Trade Crow Security' },
    resendApiKey: '',
    senderName: 'DFQ Trade Crow Security',
    senderEmail: 'no-reply@dfqtradecrow.com',
    subjectLine: 'DFQ Trade Crow - Your Verification Code'
  };
}

function saveEmailSettingsToDb(settings) {
  try {
    const existing = db.prepare('SELECT id FROM email_settings WHERE id = ?').get('primary');
    const smtpConfigJson = JSON.stringify(settings.smtp || {});
    const provider = settings.provider || 'smtp';
    const resendApiKey = settings.resendApiKey || '';
    const senderName = settings.senderName || 'DFQ Trade Crow Security';
    const senderEmail = settings.senderEmail || 'no-reply@dfqtradecrow.com';
    const subjectLine = settings.subjectLine || 'DFQ Trade Crow - Your Verification Code';

    if (existing) {
      db.prepare(`
        UPDATE email_settings
        SET provider = ?, smtp_config = ?, resend_api_key = ?, sender_name = ?, sender_email = ?, subject_line = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(provider, smtpConfigJson, resendApiKey, senderName, senderEmail, subjectLine, 'primary');
    } else {
      db.prepare(`
        INSERT INTO email_settings (id, provider, smtp_config, resend_api_key, sender_name, sender_email, subject_line)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run('primary', provider, smtpConfigJson, resendApiKey, senderName, senderEmail, subjectLine);
    }
    return getEmailSettingsFromDb();
  } catch (err) {
    console.error('[DB] saveEmailSettingsToDb error:', err);
    throw err;
  }
}

function saveEmailOutboxLog({ recipientEmail, recipientName = 'Trader', otpCode = '', subject = '', status = 'sent', provider = 'smtp', details = '' }) {
  try {
    const res = db.prepare(`
      INSERT INTO email_outbox (recipient_email, recipient_name, otp_code, subject, status, provider, details)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(recipientEmail, recipientName, otpCode, subject, status, provider, details);
    return res.lastInsertRowid;
  } catch (err) {
    console.error('[DB] saveEmailOutboxLog error:', err);
    return null;
  }
}

function getEmailOutboxLogs(limit = 100) {
  try {
    return db.prepare(`
      SELECT * FROM email_outbox
      ORDER BY id DESC
      LIMIT ?
    `).all(limit);
  } catch (err) {
    console.error('[DB] getEmailOutboxLogs error:', err);
    return [];
  }
}

function deleteEmailOutboxLog(id) {
  try {
    const res = db.prepare('DELETE FROM email_outbox WHERE id = ?').run(id);
    return res.changes > 0;
  } catch (err) {
    console.error('[DB] deleteEmailOutboxLog error:', err);
    return false;
  }
}

function clearEmailOutboxLogs() {
  try {
    db.prepare('DELETE FROM email_outbox').run();
    return true;
  } catch (err) {
    console.error('[DB] clearEmailOutboxLogs error:', err);
    return false;
  }
}

module.exports = {
  db,
  initSchema,
  createOtpInDb,
  verifyOtpInDb,
  createNotification,
  getEmailSettingsFromDb,
  saveEmailSettingsToDb,
  saveEmailOutboxLog,
  getEmailOutboxLogs,
  deleteEmailOutboxLog,
  clearEmailOutboxLogs
};
