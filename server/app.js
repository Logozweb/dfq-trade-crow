const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { db } = require('./db');

const app = express();

// Ensure uploads directory exists
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Multer storage setup for image and receipt uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOAD_DIR);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    const prefix = file.fieldname === 'receipt' ? 'receipt_' : 'item_';
    const rand = crypto.randomBytes(8).toString('hex');
    const userId = req.session && req.session.userId ? req.session.userId : 'anon';
    cb(null, `${prefix}${userId}_${rand}${ext}`);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(session({
  secret: 'dfq-trade-crow-secret-key-2026',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    httpOnly: true,
    sameSite: 'lax'
  }
}));

// Serve static assets and uploads
app.use('/uploads', express.static(UPLOAD_DIR));
app.use('/assets', express.static(path.join(__dirname, '..', 'assets')));

// Helper: send standard JSON response
function sendJson(res, success, message, data = {}, code = 200) {
  return res.status(code).json({
    success,
    message,
    ...data
  });
}

// Helper: require authenticated user
function requireAuth(req, res) {
  if (!req.session || !req.session.userId) {
    sendJson(res, false, 'Authentication required. Please log in.', {}, 401);
    return null;
  }
  return Number(req.session.userId);
}

// Helper: check admin
function requireAdmin(req, res) {
  const userId = requireAuth(req, res);
  if (!userId) return null;
  const user = db.prepare('SELECT is_admin FROM users WHERE id = ?').get(userId);
  if (!user || user.is_admin !== 1) {
    sendJson(res, false, 'Admin access required.', {}, 403);
    return null;
  }
  return userId;
}

// ==========================================
// AUTHENTICATION ROUTES
// Supports: /api/auth.php?action=... AND /api/auth/...
// ==========================================

function handleRegister(req, res) {
  const body = req.body || {};
  const fullName = (body.full_name || '').trim();
  const email = (body.email || '').trim().toLowerCase();
  const phone = (body.phone || '').trim();
  const location = (body.location || 'Lekki, Lagos').trim();
  const password = body.password || '';
  const refInput = (body.ref_code || '').trim().toUpperCase();

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!fullName || !emailRegex.test(email) || !phone || password.length < 6) {
    return sendJson(res, false, 'Please fill all fields properly: valid name, email, phone, and password (at least 6 characters).', {}, 200);
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) {
    return sendJson(res, false, 'An account with this email already exists. Try logging in instead.', {}, 200);
  }

  let referredBy = null;
  if (refInput) {
    const refUser = db.prepare('SELECT id FROM users WHERE referral_code = ?').get(refInput);
    if (refUser) {
      referredBy = refUser.id;
      db.prepare('UPDATE users SET spotlight_credits = spotlight_credits + 1 WHERE id = ?').run(referredBy);
    }
  }

  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  const isAdmin = userCount === 0 ? 1 : 0;
  const myRefCode = 'DFQ-' + crypto.randomBytes(3).toString('hex').toUpperCase();
  const hash = bcrypt.hashSync(password, 10);

  const insert = db.prepare(`
    INSERT INTO users (full_name, email, phone, location, password_hash, referral_code, referred_by, spotlight_credits, is_admin)
    VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)
  `).run(fullName, email, phone, location, hash, myRefCode, referredBy, isAdmin);

  const userId = Number(insert.lastInsertRowid);
  req.session.userId = userId;
  req.session.userName = fullName;
  req.session.isAdmin = isAdmin;

  const userObj = {
    id: userId,
    full_name: fullName,
    email,
    phone,
    location,
    referral_code: myRefCode,
    spotlight_credits: 1,
    is_admin: isAdmin
  };

  return sendJson(res, true, isAdmin ? 'Admin account created!' : 'Account created! You received 1 free Spotlight Boost.', { user: userObj }, 201);
}

function handleLogin(req, res) {
  const body = req.body || {};
  const email = (body.email || '').trim().toLowerCase();
  const password = body.password || '';

  const user = db.prepare('SELECT id, full_name, email, phone, location, referral_code, spotlight_credits, password_hash, is_admin FROM users WHERE email = ?').get(email);
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return sendJson(res, false, 'Invalid email or password.', {}, 200);
  }

  req.session.userId = Number(user.id);
  req.session.userName = user.full_name;
  req.session.isAdmin = Number(user.is_admin);

  const safeUser = { ...user };
  delete safeUser.password_hash;

  return sendJson(res, true, `Welcome back, ${user.full_name}!`, { user: safeUser });
}

function handleMe(req, res) {
  if (!req.session || !req.session.userId) {
    return sendJson(res, true, 'Guest', { authenticated: false });
  }

  const user = db.prepare('SELECT id, full_name, email, phone, location, referral_code, spotlight_credits, is_admin FROM users WHERE id = ?').get(Number(req.session.userId));
  if (!user) {
    req.session.destroy();
    return sendJson(res, true, 'Guest', { authenticated: false });
  }

  return sendJson(res, true, 'Authenticated', { authenticated: true, user });
}

function handleLogout(req, res) {
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    sendJson(res, true, 'Logged out successfully.');
  });
}

// Router for /api/auth.php
app.all('/api/auth.php', (req, res) => {
  const action = req.query.action || '';
  if (action === 'register' && req.method === 'POST') return handleRegister(req, res);
  if (action === 'login' && req.method === 'POST') return handleLogin(req, res);
  if (action === 'me') return handleMe(req, res);
  if (action === 'logout') return handleLogout(req, res);
  return sendJson(res, false, 'Invalid auth action.', {}, 400);
});

// RESTful aliases for auth
app.post('/api/auth/register', handleRegister);
app.post('/api/auth/login', handleLogin);
app.get('/api/auth/me', handleMe);
app.all('/api/auth/logout', handleLogout);

// ==========================================
// ITEMS API ROUTES
// Supports: /api/items.php?action=... AND /api/items/...
// ==========================================

function handleListItems(req, res) {
  const mode = req.query.mode || 'all';
  const category = req.query.category || 'all';
  const location = req.query.location || 'all';
  const search = (req.query.search || '').trim();
  const mineOnly = req.query.mine === '1';

  let sql = `
    SELECT i.*, u.full_name AS owner_name, u.phone AS owner_phone,
           COALESCE(ROUND((SELECT AVG(rating) FROM trader_reviews WHERE target_user_id = u.id), 1), 5.0) AS owner_rating,
           (SELECT COUNT(*) FROM trader_reviews WHERE target_user_id = u.id) AS review_count
    FROM items i
    JOIN users u ON i.user_id = u.id
    WHERE 1=1
  `;
  const params = [];

  if (mineOnly) {
    const userId = requireAuth(req, res);
    if (!userId) return;
    sql += ` AND i.user_id = ? AND i.status != 'Removed'`;
    params.push(userId);
  } else {
    sql += ` AND i.status IN ('Active', 'In Escrow')`;
  }

  if (mode !== 'all') {
    sql += ` AND i.mode = ?`;
    params.push(mode);
  }
  if (category !== 'all') {
    sql += ` AND i.category = ?`;
    params.push(category);
  }
  if (location !== 'all') {
    sql += ` AND i.location = ?`;
    params.push(location);
  }
  if (search !== '') {
    sql += ` AND (i.title LIKE ? OR i.wanted LIKE ? OR i.description LIKE ? OR i.serial_imei LIKE ?)`;
    const like = `%${search}%`;
    params.push(like, like, like, like);
  }

  sql += ` ORDER BY i.is_featured DESC, i.created_at DESC`;

  const rows = db.prepare(sql).all(...params);

  for (const row of rows) {
    try {
      const parsed = JSON.parse(row.gallery_json || '[]');
      row.gallery = Array.isArray(parsed) && parsed.length > 0 ? parsed : [row.image_path];
    } catch (_) {
      row.gallery = [row.image_path];
    }
  }

  return sendJson(res, true, 'Listings fetched.', { items: rows });
}

function handleCreateItem(req, res) {
  const userId = requireAuth(req, res);
  if (!userId) return;

  const body = req.body || {};
  const title = (body.title || '').trim();
  const category = (body.category || '').trim();
  const mode = (body.mode || '').trim();
  const condition = (body.item_condition || 'Neatly Used').trim();
  const location = (body.location || '').trim();
  const wanted = (body.wanted || '').trim();
  const estValue = parseFloat(String(body.est_value || '0').replace(/[^0-9.]/g, '')) || 0;
  const serialImei = (body.serial_imei || '').trim();
  const desc = (body.description || '').trim();

  if (serialImei !== '') {
    const check = db.prepare(`SELECT id FROM items WHERE serial_imei = ? AND (is_reported = 1 OR status = 'Removed')`).get(serialImei);
    if (check) {
      return sendJson(res, false, 'Security Alert: This Serial/IMEI has been flagged on DFQ Trade Crow and cannot be listed.', {}, 403);
    }
  }

  let pawnAdvance = null;
  let pawnBuyback = null;
  let pawnDueDate = null;

  if (mode === 'Pawn / Quick Sale') {
    const advRaw = parseFloat(String(body.pawn_advance || '0').replace(/[^0-9.]/g, '')) || 0;
    const days = Math.max(7, Math.min(60, parseInt(body.pawn_days || '14', 10)));
    if (advRaw > 0) {
      pawnAdvance = advRaw;
      pawnBuyback = Math.round(advRaw * 1.10 * 100) / 100;
      const d = new Date();
      d.setDate(d.getDate() + days);
      pawnDueDate = d.toISOString().split('T')[0];
    }
  }

  if (!title || !category || !mode || !location || !wanted || !desc) {
    return sendJson(res, false, 'All required item fields must be filled.', {}, 400);
  }

  // Handle uploaded images
  let savedPaths = [];
  if (req.files && req.files.photos && req.files.photos.length > 0) {
    savedPaths = req.files.photos.map(f => 'uploads/' + f.filename);
  } else if (body.image_data) {
    // base64 fallback
    const matches = body.image_data.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
    if (matches) {
      const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
      const filename = `item_${userId}_${crypto.randomBytes(8).toString('hex')}.${ext}`;
      fs.writeFileSync(path.join(UPLOAD_DIR, filename), Buffer.from(matches[2], 'base64'));
      savedPaths = ['uploads/' + filename];
    }
  }

  if (savedPaths.length === 0) {
    // If no file uploaded, provide default category image
    const fallbackImgs = {
      'Electronics & Phones': 'assets/img/phone.svg',
      'Furniture': 'assets/img/couch.svg',
      'Home Appliances': 'assets/img/systems.svg',
      'Vehicles & Bikes': 'assets/img/car.svg',
      'Fashion & Watches': 'assets/img/watch.svg'
    };
    savedPaths = [fallbackImgs[category] || 'assets/img/phone.svg'];
  }

  let receiptPath = null;
  if (req.files && req.files.receipt && req.files.receipt.length > 0) {
    receiptPath = 'uploads/' + req.files.receipt[0].filename;
  }

  const insert = db.prepare(`
    INSERT INTO items (
      user_id, title, category, mode, item_condition, location, wanted,
      est_value, pawn_advance, pawn_buyback, pawn_due_date, serial_imei,
      receipt_path, image_path, gallery_json, description
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    userId, title, category, mode, condition, location, wanted,
    estValue, pawnAdvance, pawnBuyback, pawnDueDate, serialImei || null,
    receiptPath, savedPaths[0], JSON.stringify(savedPaths), desc
  );

  const itemId = Number(insert.lastInsertRowid);
  console.log(`[Item] New item #${itemId} created by user #${userId}: ${title}`);

  return sendJson(res, true, 'Item posted live to DFQ Trade Crow!', { item_id: itemId }, 201);
}

function handleBoostItem(req, res) {
  const userId = requireAuth(req, res);
  if (!userId) return;

  const itemId = parseInt(req.body.item_id || '0', 10);
  const user = db.prepare('SELECT spotlight_credits FROM users WHERE id = ?').get(userId);
  if (!user || user.spotlight_credits < 1) {
    return sendJson(res, false, 'No Spotlight Credits left. Invite a friend with your referral link to earn free boosts!', {}, 400);
  }

  const result = db.prepare('UPDATE items SET is_featured = 1 WHERE id = ? AND user_id = ?').run(itemId, userId);
  if (result.changes > 0) {
    db.prepare('UPDATE users SET spotlight_credits = spotlight_credits - 1 WHERE id = ?').run(userId);
    return sendJson(res, true, 'Listing pinned to Featured Spotlight!');
  }
  return sendJson(res, false, 'Unable to boost item.', {}, 400);
}

function handleReportItem(req, res) {
  const itemId = parseInt(req.body.item_id || '0', 10);
  const reason = (req.body.reason || 'Suspicious listing').trim();
  if (itemId) {
    db.prepare('UPDATE items SET is_reported = 1, report_reason = ? WHERE id = ?').run(reason, itemId);
    return sendJson(res, true, 'Listing flagged for Admin review. Thank you for keeping DFQ Trade Crow safe.');
  }
  return sendJson(res, false, 'Invalid item ID.', {}, 400);
}

function handleCheckSerial(req, res) {
  const q = (req.query.serial || '').trim();
  if (!q) {
    return sendJson(res, false, 'Enter a Serial number or IMEI to verify.', {}, 400);
  }

  const matches = db.prepare('SELECT id, title, status, is_reported, report_reason, receipt_path FROM items WHERE serial_imei = ?').all(q);
  const flagged = matches.some(m => m.is_reported === 1 || m.status === 'Removed');

  return sendJson(res, true, flagged ? 'WARNING: Flagged serial/IMEI found!' : 'Serial/IMEI check complete.', {
    flagged,
    matches
  });
}

function handleToggleStatus(req, res) {
  const userId = requireAuth(req, res);
  if (!userId) return;

  const itemId = parseInt(req.body.item_id || '0', 10);
  const item = db.prepare('SELECT id, status FROM items WHERE id = ? AND user_id = ?').get(itemId, userId);
  if (!item) {
    return sendJson(res, false, 'Item not found or unauthorized.', {}, 403);
  }

  const newStatus = item.status === 'Active' ? 'Swapped' : 'Active';
  db.prepare('UPDATE items SET status = ? WHERE id = ?').run(newStatus, itemId);
  return sendJson(res, true, `Listing marked as ${newStatus}.`, { status: newStatus });
}

function handleDeleteItem(req, res) {
  const userId = requireAuth(req, res);
  if (!userId) return;

  const itemId = parseInt(req.body.item_id || '0', 10);
  const item = db.prepare('SELECT id, image_path, gallery_json, receipt_path FROM items WHERE id = ? AND user_id = ?').get(itemId, userId);
  if (!item) {
    return sendJson(res, false, 'Item not found or unauthorized.', {}, 403);
  }

  db.prepare('DELETE FROM items WHERE id = ?').run(itemId);

  // Clean files if in uploads/
  try {
    let gallery = [];
    try { gallery = JSON.parse(item.gallery_json || '[]'); } catch (_) { gallery = [item.image_path]; }
    for (const f of gallery) {
      if (f && f.startsWith('uploads/')) {
        const p = path.join(__dirname, '..', f);
        if (fs.existsSync(p)) fs.unlinkSync(p);
      }
    }
  } catch (_) {}

  return sendJson(res, true, 'Listing deleted permanently.');
}

function handleWishlist(req, res) {
  const userId = requireAuth(req, res);
  if (!userId) return;

  if (req.method === 'GET') {
    const keywords = db.prepare('SELECT id, keyword FROM wishlists WHERE user_id = ? ORDER BY id DESC').all(userId);
    return sendJson(res, true, 'Wishlist fetched.', { keywords });
  }

  if (req.method === 'POST') {
    const sub = req.body.sub || 'add';
    if (sub === 'add') {
      const kw = (req.body.keyword || '').trim();
      if (kw) {
        db.prepare('INSERT INTO wishlists (user_id, keyword) VALUES (?, ?)').run(userId, kw);
      }
      return sendJson(res, true, 'Wishlist alert saved!');
    }
    if (sub === 'remove') {
      const wid = parseInt(req.body.id || '0', 10);
      db.prepare('DELETE FROM wishlists WHERE id = ? AND user_id = ?').run(wid, userId);
      return sendJson(res, true, 'Wishlist keyword removed.');
    }
  }
}

// Router for /api/items.php
app.all('/api/items.php', upload.fields([{ name: 'photos', maxCount: 4 }, { name: 'receipt', maxCount: 1 }]), (req, res) => {
  const action = req.query.action || (req.method === 'GET' ? 'list' : '');
  if (req.method === 'GET' && action === 'list') return handleListItems(req, res);
  if (req.method === 'POST' && action === 'create') return handleCreateItem(req, res);
  if (req.method === 'POST' && action === 'boost') return handleBoostItem(req, res);
  if (req.method === 'POST' && action === 'report') return handleReportItem(req, res);
  if (req.method === 'GET' && action === 'check_serial') return handleCheckSerial(req, res);
  if (req.method === 'POST' && action === 'toggle_status') return handleToggleStatus(req, res);
  if (req.method === 'POST' && action === 'delete') return handleDeleteItem(req, res);
  if (action === 'wishlist') return handleWishlist(req, res);
  return sendJson(res, false, 'Invalid items endpoint request.', {}, 400);
});

// RESTful aliases for items
app.get('/api/items', handleListItems);
app.post('/api/items', upload.fields([{ name: 'photos', maxCount: 4 }, { name: 'receipt', maxCount: 1 }]), handleCreateItem);
app.post('/api/items/boost', handleBoostItem);
app.post('/api/items/report', handleReportItem);
app.get('/api/items/check_serial', handleCheckSerial);
app.all('/api/items/wishlist', handleWishlist);

// ==========================================
// OFFERS API ROUTES
// Supports: /api/offers.php?action=... AND /api/offers/...
// ==========================================

function handleCreateOffer(req, res) {
  const proposerId = requireAuth(req, res);
  if (!proposerId) return;

  const itemId = parseInt(req.body.item_id || '0', 10);
  const offeredItem = (req.body.offered_item || '').trim();
  const cashTopup = (req.body.cash_topup || '₦0 (Straight Swap)').trim();
  const note = (req.body.note || '').trim();

  if (!itemId || !offeredItem) {
    return sendJson(res, false, 'Specify the item you are offering in exchange.', {}, 400);
  }

  const item = db.prepare(`SELECT user_id, title FROM items WHERE id = ? AND status = 'Active'`).get(itemId);
  if (!item) {
    return sendJson(res, false, 'This listing is no longer available.', {}, 404);
  }
  if (Number(item.user_id) === proposerId) {
    return sendJson(res, false, 'You cannot propose a swap on your own listing.', {}, 400);
  }

  const insert = db.prepare(`
    INSERT INTO swap_offers (item_id, proposer_id, owner_id, offered_item, cash_topup, note)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(itemId, proposerId, Number(item.user_id), offeredItem, cashTopup, note);

  console.log(`[Offer] Offer #${insert.lastInsertRowid} created on item #${itemId} by user #${proposerId}`);
  return sendJson(res, true, 'Swap proposal sent & owner notified!', { offer_id: Number(insert.lastInsertRowid) }, 201);
}

function handleIncomingOffers(req, res) {
  const userId = requireAuth(req, res);
  if (!userId) return;

  const sql = `
    SELECT o.*,
           i.title AS my_item_title, i.est_value AS my_item_value, i.image_path AS my_item_img,
           u.full_name AS proposer_name, u.phone AS proposer_phone, u.location AS proposer_location,
           (SELECT COUNT(*) FROM trader_reviews tr WHERE tr.offer_id = o.id AND tr.reviewer_id = ?) AS already_reviewed
    FROM swap_offers o
    JOIN items i ON o.item_id = i.id
    JOIN users u ON o.proposer_id = u.id
    WHERE o.owner_id = ?
    ORDER BY o.created_at DESC
  `;

  const offers = db.prepare(sql).all(userId, userId);
  return sendJson(res, true, 'Incoming offers fetched.', { offers });
}

function handleRespondOffer(req, res) {
  const ownerId = requireAuth(req, res);
  if (!ownerId) return;

  const offerId = parseInt(req.body.offer_id || '0', 10);
  const decision = req.body.decision || '';
  const cashTopup = (req.body.cash_topup || '').trim();
  const note = (req.body.note || '').trim();

  const offer = db.prepare(`
    SELECT o.id, o.item_id, o.offered_item, i.title AS item_title
    FROM swap_offers o
    JOIN items i ON o.item_id = i.id
    WHERE o.id = ? AND o.owner_id = ?
  `).get(offerId, ownerId);

  if (!offer) {
    return sendJson(res, false, 'Offer not found or unauthorized.', {}, 403);
  }

  if (decision === 'Counter') {
    db.prepare(`UPDATE swap_offers SET cash_topup = ?, note = ?, status = 'Pending' WHERE id = ?`).run('Counter: ' + cashTopup, note, offerId);
    return sendJson(res, true, 'Counter-offer sent & proposer notified!');
  }

  if (['In Escrow', 'Accepted', 'Declined', 'Pending'].includes(decision)) {
    db.prepare('UPDATE swap_offers SET status = ? WHERE id = ?').run(decision, offerId);

    if (decision === 'In Escrow') {
      db.prepare(`UPDATE items SET status = 'In Escrow' WHERE id = ?`).run(offer.item_id);
    } else if (decision === 'Accepted') {
      db.prepare(`UPDATE items SET status = 'Swapped' WHERE id = ?`).run(offer.item_id);
    } else if (decision === 'Pending') {
      db.prepare(`UPDATE items SET status = 'Active' WHERE id = ?`).run(offer.item_id);
    }

    return sendJson(res, true, `Swap status updated to ${decision}.`);
  }

  return sendJson(res, false, 'Invalid decision action.', {}, 400);
}

function handleRateTrader(req, res) {
  const reviewerId = requireAuth(req, res);
  if (!reviewerId) return;

  const offerId = parseInt(req.body.offer_id || '0', 10);
  const rating = Math.max(1, Math.min(5, parseInt(req.body.rating || '5', 10)));
  const comment = (req.body.comment || '').trim();

  const offer = db.prepare('SELECT id, proposer_id, owner_id, status FROM swap_offers WHERE id = ?').get(offerId);
  if (!offer || offer.status !== 'Accepted') {
    return sendJson(res, false, 'You can only rate completed/accepted swaps.', {}, 400);
  }

  const targetId = Number(offer.owner_id) === reviewerId ? Number(offer.proposer_id) : Number(offer.owner_id);
  if (Number(offer.owner_id) !== reviewerId && Number(offer.proposer_id) !== reviewerId) {
    return sendJson(res, false, 'Unauthorized to rate this swap.', {}, 403);
  }

  // SQLite upsert
  db.prepare(`
    INSERT INTO trader_reviews (offer_id, reviewer_id, target_user_id, rating, comment)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(offer_id, reviewer_id) DO UPDATE SET
      rating = excluded.rating,
      comment = excluded.comment
  `).run(offerId, reviewerId, targetId, rating, comment);

  return sendJson(res, true, 'Trader rating submitted! Thank you.');
}

// Router for /api/offers.php
app.all('/api/offers.php', (req, res) => {
  const action = req.query.action || '';
  if (req.method === 'POST' && action === 'create') return handleCreateOffer(req, res);
  if (req.method === 'GET' && action === 'incoming') return handleIncomingOffers(req, res);
  if (req.method === 'POST' && action === 'respond') return handleRespondOffer(req, res);
  if (req.method === 'POST' && action === 'rate') return handleRateTrader(req, res);
  return sendJson(res, false, 'Invalid offers endpoint request.', {}, 400);
});

// RESTful aliases for offers
app.post('/api/offers', handleCreateOffer);
app.get('/api/offers/incoming', handleIncomingOffers);
app.post('/api/offers/respond', handleRespondOffer);
app.post('/api/offers/rate', handleRateTrader);

// ==========================================
// TRADER STOREFRONT API
// ==========================================
app.get('/api/traders/:id', (req, res) => {
  const traderId = parseInt(req.params.id, 10);
  const trader = db.prepare('SELECT id, full_name, location, created_at FROM users WHERE id = ?').get(traderId);
  if (!trader) {
    return sendJson(res, false, 'Trader profile not found.', {}, 404);
  }

  const items = db.prepare(`SELECT * FROM items WHERE user_id = ? AND status IN ('Active', 'In Escrow') ORDER BY created_at DESC`).all(traderId);
  const swappedCount = db.prepare(`SELECT COUNT(*) as count FROM items WHERE user_id = ? AND status = 'Swapped'`).get(traderId).count;

  const reviews = db.prepare(`
    SELECT r.*, u.full_name AS reviewer_name
    FROM trader_reviews r
    JOIN users u ON r.reviewer_id = u.id
    WHERE r.target_user_id = ?
    ORDER BY r.created_at DESC
  `).all(traderId);

  let avgRating = '5.0';
  if (reviews.length > 0) {
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    avgRating = (sum / reviews.length).toFixed(1);
  }

  return sendJson(res, true, 'Trader profile fetched.', {
    trader,
    items,
    reviews,
    avgRating,
    swappedCount
  });
});

// ==========================================
// PAWN TICKET API
// ==========================================
app.get('/api/tickets/:id', (req, res) => {
  const itemId = parseInt(req.params.id, 10);
  const item = db.prepare(`
    SELECT i.*, u.full_name, u.phone, u.email
    FROM items i
    JOIN users u ON i.user_id = u.id
    WHERE i.id = ? AND i.mode = 'Pawn / Quick Sale'
  `).get(itemId);

  if (!item) {
    return sendJson(res, false, 'Pawn ticket not found or item is not a Pawn listing.', {}, 404);
  }

  return sendJson(res, true, 'Pawn ticket details.', { item });
});

// ==========================================
// ADMIN DASHBOARD API
// ==========================================
app.get('/api/admin/data', (req, res) => {
  const adminId = requireAdmin(req, res);
  if (!adminId) return;

  const stats = {
    users: db.prepare('SELECT COUNT(*) as count FROM users').get().count,
    items: db.prepare('SELECT COUNT(*) as count FROM items').get().count,
    reported: db.prepare(`SELECT COUNT(*) as count FROM items WHERE is_reported = 1 AND status != 'Removed'`).get().count,
    swapped: db.prepare(`SELECT COUNT(*) as count FROM items WHERE status = 'Swapped'`).get().count
  };

  const allItems = db.prepare(`
    SELECT i.*, u.full_name AS owner_name, u.email AS owner_email
    FROM items i
    JOIN users u ON i.user_id = u.id
    ORDER BY i.is_reported DESC, i.created_at DESC
  `).all();

  const allUsers = db.prepare(`
    SELECT id, full_name, email, phone, location, referral_code, spotlight_credits, is_admin, created_at
    FROM users
    ORDER BY created_at DESC
  `).all();

  return sendJson(res, true, 'Admin data fetched.', { stats, allItems, allUsers });
});

app.post('/api/admin/action', (req, res) => {
  const adminId = requireAdmin(req, res);
  if (!adminId) return;

  const act = req.body.act || '';
  const targetId = parseInt(req.body.id || '0', 10);

  if (act === 'remove_item' && targetId) {
    db.prepare(`UPDATE items SET status = 'Removed' WHERE id = ?`).run(targetId);
    return sendJson(res, true, `Listing #${targetId} removed from public feed.`);
  }

  if (act === 'restore_item' && targetId) {
    db.prepare(`UPDATE items SET status = 'Active', is_reported = 0, report_reason = NULL WHERE id = ?`).run(targetId);
    return sendJson(res, true, `Listing #${targetId} cleared and restored to Active.`);
  }

  if (act === 'toggle_admin' && targetId && targetId !== adminId) {
    db.prepare('UPDATE users SET is_admin = 1 - is_admin WHERE id = ?').run(targetId);
    return sendJson(res, true, `User #${targetId} admin role updated.`);
  }

  if (act === 'add_credits' && targetId) {
    const credits = parseInt(req.body.credits || '5', 10);
    db.prepare('UPDATE users SET spotlight_credits = spotlight_credits + ? WHERE id = ?').run(credits, targetId);
    return sendJson(res, true, `Added ${credits} spotlight credits to User #${targetId}.`);
  }

  return sendJson(res, false, 'Invalid admin action.', {}, 400);
});

module.exports = app;
