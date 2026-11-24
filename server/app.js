const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { 
  db, 
  createOtpInDb, 
  verifyOtpInDb, 
  createNotification,
  getEmailSettingsFromDb,
  saveEmailSettingsToDb,
  saveEmailOutboxLog,
  getEmailOutboxLogs,
  deleteEmailOutboxLog,
  clearEmailOutboxLogs
} = require('./db');
const { 
  dispatchEmail, 
  sendTestEmail,
  buildOtpEmailHtml, 
  buildStatusNotificationHtml 
} = require('./emailDispatcher');

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
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
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
    data,
    ...data
  });
}

// Helper: require authenticated user
function requireAuth(req, res) {
  if (!req.session || !req.session.userId) {
    sendJson(res, false, 'Authentication required. Please log in.', {}, 401);
    return null;
  }
  const userId = Number(req.session.userId);
  const u = db.prepare('SELECT id, is_blocked, blocked_reason FROM users WHERE id = ?').get(userId);
  if (!u) {
    if (req.session) req.session.destroy(() => {});
    sendJson(res, false, 'User account no longer exists.', {}, 401);
    return null;
  }
  if (u.is_blocked === 1) {
    if (req.session) req.session.destroy(() => {});
    sendJson(res, false, `Your account has been suspended by administration. ${u.blocked_reason ? 'Reason: ' + u.blocked_reason : ''}`, {}, 403);
    return null;
  }
  return userId;
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
// AUTHENTICATION & EMAIL OTP ROUTES
// Supports: /api/auth.php?action=... AND /api/auth/...
// ==========================================

async function handleSendOtp(req, res) {
  const body = req.body || {};
  const email = (body.email || '').trim().toLowerCase();
  const name = (body.name || body.full_name || 'Trader').trim();
  const purpose = (body.purpose || 'registration').trim();

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    return sendJson(res, false, 'Valid email address is required.', {}, 400);
  }

  // If registering, check if email is already taken
  if (purpose === 'registration') {
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
      return sendJson(res, false, 'An account with this email already exists. Please log in.', {}, 400);
    }
  }

  const otpRecord = createOtpInDb(email, name, purpose);
  const result = await dispatchEmail({
    to: email,
    recipientName: name,
    otpCode: otpRecord.code,
    purpose
  });

  return sendJson(res, true, `Verification code sent to ${email}`, {
    email,
    delivered: result.delivered,
    devOtpCode: result.devOtpCode, // Provided for instant offline dev/test convenience
    expires_at: otpRecord.expiresAt
  });
}

function handleVerifyOtp(req, res) {
  const body = req.body || {};
  const email = (body.email || '').trim().toLowerCase();
  const code = (body.code || body.otp_code || '').trim();
  const purpose = (body.purpose || 'registration').trim();

  if (!email || !code) {
    return sendJson(res, false, 'Email and 6-digit verification code are required.', {}, 400);
  }

  const result = verifyOtpInDb(email, code, purpose);
  if (!result.success) {
    return sendJson(res, false, result.error, {}, 400);
  }

  return sendJson(res, true, 'Verification code validated successfully!', { email });
}

async function handleRegister(req, res) {
  const body = req.body || {};
  const fullName = (body.full_name || '').trim();
  const email = (body.email || '').trim().toLowerCase();
  const phone = (body.phone || '').trim();
  const location = (body.location || 'Lekki, Lagos').trim();
  const password = body.password || '';
  const refInput = (body.ref_code || '').trim().toUpperCase();
  const otpCode = (body.otp_code || '').trim();

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!fullName || !emailRegex.test(email) || !phone || password.length < 6) {
    return sendJson(res, false, 'Please fill all fields properly: valid name, email, phone, and password (at least 6 characters).', {}, 200);
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) {
    return sendJson(res, false, 'An account with this email already exists. Try logging in instead.', {}, 200);
  }

  // Requirement 2: Email verification via OTP
  if (!otpCode) {
    // Dispatch OTP and instruct client to verify
    const otpRecord = createOtpInDb(email, fullName, 'registration');
    const dispatchRes = await dispatchEmail({
      to: email,
      recipientName: fullName,
      otpCode: otpRecord.code,
      purpose: 'registration'
    });
    return sendJson(res, true, 'Verification OTP sent to your email. Enter the 6-digit code to complete registration.', {
      require_otp: true,
      email,
      devOtpCode: dispatchRes.devOtpCode
    }, 200);
  }

  // Verify the OTP submitted
  const verifyRes = verifyOtpInDb(email, otpCode, 'registration');
  if (!verifyRes.success) {
    return sendJson(res, false, verifyRes.error, { require_otp: true }, 400);
  }

  let referredBy = null;
  if (refInput) {
    const refUser = db.prepare('SELECT id FROM users WHERE referral_code = ?').get(refInput);
    if (refUser) {
      referredBy = refUser.id;
      db.prepare('UPDATE users SET spotlight_credits = spotlight_credits + 1 WHERE id = ?').run(referredBy);
      createNotification(referredBy, 'Referral Reward Unlocked', `New trader ${fullName} joined with your code. 1 Spotlight Credit awarded!`, 'referral');
    }
  }

  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  const isAdmin = userCount === 0 ? 1 : 0;
  const myRefCode = 'DFQ-' + crypto.randomBytes(3).toString('hex').toUpperCase();
  const hash = bcrypt.hashSync(password, 10);

  const insert = db.prepare(`
    INSERT INTO users (full_name, email, phone, location, password_hash, referral_code, referred_by, spotlight_credits, is_admin, email_verified, kyc_status, kyc_tier)
    VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, 1, 'unverified', 1)
  `).run(fullName, email, phone, location, hash, myRefCode, referredBy, isAdmin);

  const userId = Number(insert.lastInsertRowid);
  req.session.userId = userId;
  req.session.userName = fullName;
  req.session.isAdmin = isAdmin;

  // Create welcome notification
  createNotification(userId, 'Welcome to DFQ Trade Crow', 'Your email is verified! Complete your KYC verification (NIN / Government ID) to unlock listing privileges and start trading.', 'kyc');

  const userObj = {
    id: userId,
    full_name: fullName,
    email,
    phone,
    location,
    referral_code: myRefCode,
    spotlight_credits: 1,
    is_admin: isAdmin,
    email_verified: 1,
    kyc_status: 'unverified',
    kyc_tier: 1
  };

  return sendJson(res, true, isAdmin ? 'Admin account created!' : 'Account verified and created! You received 1 free Spotlight Boost.', { user: userObj }, 201);
}

function handleLogin(req, res) {
  const body = req.body || {};
  const email = (body.email || '').trim().toLowerCase();
  const password = body.password || '';

  const user = db.prepare(`
    SELECT id, full_name, email, phone, location, referral_code, spotlight_credits, password_hash, is_admin,
           COALESCE(kyc_tier, 1) AS kyc_tier,
           COALESCE(kyc_status, 'unverified') AS kyc_status,
           COALESCE(email_verified, 0) AS email_verified,
           COALESCE(is_blocked, 0) AS is_blocked,
           blocked_reason
    FROM users WHERE email = ?
  `).get(email);

  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return sendJson(res, false, 'Invalid email or password.', {}, 200);
  }

  if (user.is_blocked === 1) {
    return sendJson(res, false, `Your account has been suspended by administration. ${user.blocked_reason ? 'Reason: ' + user.blocked_reason : 'Please contact support.'}`, {}, 403);
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

  const user = db.prepare(`
    SELECT id, full_name, email, phone, location, referral_code, spotlight_credits, is_admin,
           COALESCE(kyc_tier, 1) AS kyc_tier,
           COALESCE(kyc_status, 'unverified') AS kyc_status,
           COALESCE(email_verified, 0) AS email_verified
    FROM users WHERE id = ?
  `).get(Number(req.session.userId));

  if (!user) {
    req.session.destroy();
    return sendJson(res, true, 'Guest', { authenticated: false });
  }

  return sendJson(res, true, 'Authenticated', { authenticated: true, user });
}

function handleReferralInfo(req, res) {
  const code = (req.query.code || '').trim().toUpperCase();
  if (!code) return sendJson(res, false, 'No referral code provided.', {}, 400);

  const inviter = db.prepare('SELECT id, full_name, location FROM users WHERE referral_code = ?').get(code);
  if (!inviter) {
    return sendJson(res, false, 'Referral code not found.', {}, 404);
  }
  return sendJson(res, true, 'Referral valid.', {
    inviter_name: inviter.full_name,
    code: code,
    reward: '1 Free Spotlight Boost + Verified Member Perks'
  });
}

function handleKycSubmit(req, res) {
  const userId = requireAuth(req, res);
  if (!userId) return;

  const tier = parseInt(req.body.tier || '2', 10);
  const fullName = (req.body.full_name || req.session.userName || 'Trader').trim();
  const phone = (req.body.phone || '').trim();
  const ninBvn = (req.body.nin_bvn || '').trim();
  const idType = (req.body.id_type || 'NIN').trim();
  const businessName = (req.body.business_name || '').trim();
  const businessAddress = (req.body.business_address || '').trim();
  const cacNumber = (req.body.cac_number || '').trim();

  if (!ninBvn) {
    return sendJson(res, false, 'National Identification Number (NIN) or BVN is required for verification.', {}, 400);
  }

  if (tier === 3 && !businessName) {
    return sendJson(res, false, 'Registered business name is required for Pro Storefront status.', {}, 400);
  }

  // Handle uploaded document if any
  let docPath = null;
  if (req.file) {
    docPath = 'uploads/' + req.file.filename;
  } else if (req.body.id_document_data) {
    const matches = req.body.id_document_data.match(/^data:([a-zA-Z0-9/+-]+);base64,(.+)$/);
    if (matches) {
      const mime = (matches[1] || '').toLowerCase();
      let ext = 'jpg';
      if (mime.includes('png')) ext = 'png';
      else if (mime.includes('pdf')) ext = 'pdf';
      else if (mime.includes('webp')) ext = 'webp';
      else if (mime.includes('gif')) ext = 'gif';
      else if (mime.includes('jpeg')) ext = 'jpg';
      const filename = `kyc_${userId}_${Date.now()}_${crypto.randomBytes(4).toString('hex')}.${ext}`;
      try {
        fs.writeFileSync(path.join(UPLOAD_DIR, filename), Buffer.from(matches[2], 'base64'));
        docPath = 'uploads/' + filename;
      } catch (fErr) {
        console.error('[KYC Upload Error]', fErr);
      }
    }
  }

  // Insert or update pending KYC record
  const insert = db.prepare(`
    INSERT INTO kyc_verifications (
      user_id, tier, full_name, phone, nin_bvn, id_type, id_document_path,
      business_name, business_address, cac_number, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending_review')
  `).run(
    userId, tier, fullName, phone, ninBvn, idType, docPath,
    businessName || null, businessAddress || null, cacNumber || null
  );

  // Update user's KYC status to pending review
  db.prepare(`
    UPDATE users
    SET kyc_status = 'pending_review',
        kyc_tier = ?,
        nin_bvn = ?,
        business_name = ?,
        business_address = ?
    WHERE id = ?
  `).run(tier, ninBvn, businessName || null, businessAddress || null, userId);

  // Notify user
  createNotification(userId, 'KYC Submitted for Review', 'Your identity details and NIN have been submitted. An administrator will review your verification before listing is enabled.', 'kyc');

  // Notify all admins
  const admins = db.prepare('SELECT id FROM users WHERE is_admin = 1').all();
  admins.forEach(adm => {
    createNotification(adm.id, 'New KYC Verification Awaiting Review', `${fullName} submitted Tier ${tier} (${idType}) verification for review.`, 'kyc', '/admin?tab=kyc');
  });

  return sendJson(res, true, 'Verification submitted successfully! Our compliance desk will review your details shortly.', {
    kyc_status: 'pending_review',
    tier
  }, 201);
}

function handleKycStatus(req, res) {
  const userId = requireAuth(req, res);
  if (!userId) return;

  const user = db.prepare('SELECT id, full_name, kyc_status, kyc_tier, nin_bvn, is_admin FROM users WHERE id = ?').get(userId);
  const latestVerification = db.prepare('SELECT * FROM kyc_verifications WHERE user_id = ? ORDER BY id DESC LIMIT 1').get(userId);

  return sendJson(res, true, 'KYC status retrieved.', {
    kyc_status: user.is_admin ? 'approved' : (user.kyc_status || 'unverified'),
    kyc_tier: user.kyc_tier || 1,
    is_admin: user.is_admin === 1,
    can_list: user.is_admin === 1 || user.kyc_status === 'approved',
    verification: latestVerification || null
  });
}

function handleKycVerify(req, res) {
  return handleKycSubmit(req, res);
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
  if (action === 'referral_info') return handleReferralInfo(req, res);
  if (action === 'kyc_verify' && req.method === 'POST') return handleKycVerify(req, res);
  return sendJson(res, false, 'Invalid auth action.', {}, 400);
});

// RESTful aliases for auth & KYC
app.post('/api/auth/register', handleRegister);
app.post('/api/auth/login', handleLogin);
app.get('/api/auth/me', handleMe);
app.get('/api/auth/referral-info', handleReferralInfo);
app.all('/api/auth/logout', handleLogout);
app.post('/api/kyc/verify', handleKycVerify);

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
           COALESCE(u.kyc_tier, 1) AS owner_kyc_tier,
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

  const user = db.prepare('SELECT id, is_admin, kyc_status, full_name FROM users WHERE id = ?').get(userId);
  if (!user) return sendJson(res, false, 'User account not found.', {}, 404);

  // Requirement 3: Until user's details, NIN and other verifications has been reviewed by an admin, they can't list
  const isApprovedOrUpgrading = user.kyc_status === 'approved' || (user.kyc_tier >= 2 && user.kyc_status === 'pending_review');
  if (!user.is_admin && !isApprovedOrUpgrading) {
    return sendJson(res, false, 'Identity Verification Required: Your details, NIN and verification documents must be reviewed and approved by an administrator before you can list items.', {
      kyc_required: true,
      kyc_status: user.kyc_status || 'unverified'
    }, 403);
  }

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
  const photoList = (req.files && (req.files.photos || req.files['photos[]'] || req.files.photo)) || [];
  if (photoList.length > 0) {
    savedPaths = photoList.map(f => 'uploads/' + f.filename);
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

  // Requirement 4: Listings done by users should be reviewed by an admin before it is live
  const initialStatus = user.is_admin ? 'Active' : 'pending_review';

  const insert = db.prepare(`
    INSERT INTO items (
      user_id, title, category, mode, item_condition, location, wanted,
      est_value, pawn_advance, pawn_buyback, pawn_due_date, serial_imei,
      receipt_path, image_path, gallery_json, description, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    userId, title, category, mode, condition, location, wanted,
    estValue, pawnAdvance, pawnBuyback, pawnDueDate, serialImei || null,
    receiptPath, savedPaths[0], JSON.stringify(savedPaths), desc, initialStatus
  );

  const itemId = Number(insert.lastInsertRowid);
  console.log(`[Item] New item #${itemId} (${initialStatus}) created by user #${userId}: ${title}`);

  if (initialStatus === 'pending_review') {
    createNotification(userId, 'Listing Awaiting Admin Approval', `Your listing "${title}" was submitted and is pending review by our compliance team before going live.`, 'listing');
    const admins = db.prepare('SELECT id FROM users WHERE is_admin = 1').all();
    admins.forEach(adm => {
      createNotification(adm.id, 'New Listing Needs Review', `Trader ${user.full_name} submitted "${title}" for listing review.`, 'listing', '/admin?tab=listings');
    });
    return sendJson(res, true, 'Item submitted successfully! Your listing is pending administrative review before going live.', { item_id: itemId, status: 'pending_review' }, 201);
  }

  return sendJson(res, true, 'Item posted live to DFQ Trade Crow!', { item_id: itemId, status: 'Active' }, 201);
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

  let newStatus = req.body.status;
  if (!newStatus) {
    newStatus = item.status === 'Active' ? 'Hidden' : 'Active';
  }

  const allowed = ['Active', 'Hidden', 'Swapped'];
  if (!allowed.includes(newStatus)) {
    return sendJson(res, false, 'Invalid status specified.', {}, 400);
  }

  db.prepare('UPDATE items SET status = ? WHERE id = ?').run(newStatus, itemId);
  return sendJson(res, true, `Listing visibility updated to ${newStatus}.`, { status: newStatus });
}

function handleEditItem(req, res) {
  const userId = requireAuth(req, res);
  if (!userId) return;

  const itemId = parseInt(req.body.item_id || req.params.id || '0', 10);
  const item = db.prepare('SELECT id, user_id, status FROM items WHERE id = ?').get(itemId);
  if (!item) return sendJson(res, false, 'Item not found.', {}, 404);
  if (Number(item.user_id) !== userId) {
    return sendJson(res, false, 'Forbidden: You can only edit your own listings.', {}, 403);
  }

  const body = req.body || {};
  const title = (body.title || '').trim();
  const category = (body.category || '').trim();
  const mode = (body.mode || '').trim();
  const condition = (body.item_condition || 'Neatly Used').trim();
  const location = (body.location || '').trim();
  const wanted = (body.wanted || '').trim();
  const estValue = parseFloat(String(body.est_value || '0').replace(/[^0-9.]/g, '')) || 0;
  const desc = (body.description || '').trim();

  if (!title || !category || !location || !wanted) {
    return sendJson(res, false, 'Title, Category, Location, and Wanted item are required.', {}, 400);
  }

  db.prepare(`
    UPDATE items
    SET title = ?, category = ?, mode = ?, item_condition = ?, location = ?, wanted = ?, est_value = ?, description = ?
    WHERE id = ?
  `).run(title, category, mode, condition, location, wanted, estValue, desc, itemId);

  return sendJson(res, true, 'Listing updated successfully!');
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
app.all('/api/items.php', upload.fields([
  { name: 'photos', maxCount: 10 },
  { name: 'photos[]', maxCount: 10 },
  { name: 'photo', maxCount: 10 },
  { name: 'receipt', maxCount: 1 }
]), (req, res) => {
  const action = req.query.action || (req.method === 'GET' ? 'list' : '');
  if (req.method === 'GET' && action === 'list') return handleListItems(req, res);
  if (req.method === 'POST' && action === 'create') return handleCreateItem(req, res);
  if (req.method === 'POST' && action === 'boost') return handleBoostItem(req, res);
  if (req.method === 'POST' && action === 'report') return handleReportItem(req, res);
  if (req.method === 'GET' && action === 'check_serial') return handleCheckSerial(req, res);
  if (req.method === 'POST' && action === 'edit') return handleEditItem(req, res);
  if (req.method === 'POST' && action === 'toggle_status') return handleToggleStatus(req, res);
  if (req.method === 'POST' && action === 'delete') return handleDeleteItem(req, res);
  if (action === 'wishlist') return handleWishlist(req, res);
  return sendJson(res, false, 'Invalid items endpoint request.', {}, 400);
});

// RESTful aliases for items
app.get('/api/items', handleListItems);
app.post('/api/items', upload.fields([
  { name: 'photos', maxCount: 10 },
  { name: 'photos[]', maxCount: 10 },
  { name: 'photo', maxCount: 10 },
  { name: 'receipt', maxCount: 1 }
]), handleCreateItem);
app.post('/api/items/edit', handleEditItem);
app.post('/api/items/:id/edit', handleEditItem);
app.post('/api/items/toggle_status', handleToggleStatus);
app.post('/api/items/delete', handleDeleteItem);
app.delete('/api/items/:id', handleDeleteItem);
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
    // Generate 4-digit OTPs when entering Escrow or Accepted
    let proposerOtp = Math.floor(1000 + Math.random() * 9000).toString();
    let ownerOtp = Math.floor(1000 + Math.random() * 9000).toString();
    let declineReason = (decision === 'Declined') ? (req.body.decline_reason || 'Value mismatch') : null;

    db.prepare('UPDATE swap_offers SET status = ?, proposer_otp = COALESCE(proposer_otp, ?), owner_otp = COALESCE(owner_otp, ?), decline_reason = COALESCE(?, decline_reason) WHERE id = ?')
      .run(decision, proposerOtp, ownerOtp, declineReason, offerId);

    if (decision === 'In Escrow') {
      db.prepare(`UPDATE items SET status = 'In Escrow' WHERE id = ?`).run(offer.item_id);
    } else if (decision === 'Accepted') {
      db.prepare(`UPDATE items SET status = 'Swapped' WHERE id = ?`).run(offer.item_id);
    } else if (decision === 'Pending') {
      db.prepare(`UPDATE items SET status = 'Active' WHERE id = ?`).run(offer.item_id);
    }

    return sendJson(res, true, `Swap status updated to ${decision}.`, { proposer_otp: proposerOtp, owner_otp: ownerOtp });
  }

  return sendJson(res, false, 'Invalid decision action.', {}, 400);
}

function handleFundEscrow(req, res) {
  const userId = requireAuth(req, res);
  if (!userId) return;

  const offerId = parseInt(req.body.offer_id || '0', 10);
  const offer = db.prepare('SELECT id, proposer_id, owner_id FROM swap_offers WHERE id = ?').get(offerId);
  if (!offer || (Number(offer.proposer_id) !== userId && Number(offer.owner_id) !== userId)) {
    return sendJson(res, false, 'Offer not found or unauthorized.', {}, 403);
  }

  db.prepare(`UPDATE swap_offers SET escrow_funded = 1 WHERE id = ?`).run(offerId);
  return sendJson(res, true, 'Cash balance funded into DFQ Escrow Hold! Funds are protected until dual-OTP handover is confirmed.');
}

function handleRedeemPawn(req, res) {
  const userId = requireAuth(req, res);
  if (!userId) return;

  const itemId = parseInt(req.body.item_id || '0', 10);
  const item = db.prepare('SELECT id, user_id, title, mode, pawn_buyback FROM items WHERE id = ? AND user_id = ?').get(itemId, userId);
  if (!item || item.mode !== 'Pawn / Quick Sale') {
    return sendJson(res, false, 'Pawn item not found or unauthorized.', {}, 404);
  }

  db.prepare(`UPDATE items SET status = 'Active', redeemed_at = CURRENT_TIMESTAMP WHERE id = ?`).run(itemId);
  return sendJson(res, true, `Collateral "${item.title}" successfully redeemed! Official digital pawn receipt cleared and full ownership returned to you.`, {
    item_id: itemId,
    redeemed: true
  });
}

function handleLiquidatePawn(req, res) {
  const userId = requireAuth(req, res);
  if (!userId) return;

  const itemId = parseInt(req.body.item_id || '0', 10);
  const item = db.prepare('SELECT id, user_id, title, mode FROM items WHERE id = ? AND user_id = ?').get(itemId, userId);
  if (!item) return sendJson(res, false, 'Item not found.', {}, 404);

  db.prepare(`UPDATE items SET mode = 'Cash or Swap', is_liquidated = 1, status = 'Active', wanted = 'Quick Sale Cash Clearance' WHERE id = ?`).run(itemId);
  return sendJson(res, true, `Item converted to Quick Sale / Liquidated Collateral on marketplace feed.`);
}

function handleVerifyHandoverOtp(req, res) {
  const userId = requireAuth(req, res);
  if (!userId) return;

  const offerId = parseInt(req.body.offer_id || '0', 10);
  const enteredOtp = (req.body.otp || '').trim();

  const offer = db.prepare(`SELECT * FROM swap_offers WHERE id = ?`).get(offerId);
  if (!offer) {
    return sendJson(res, false, 'Swap offer not found.', {}, 404);
  }

  const isOwner = Number(offer.owner_id) === userId;
  const isProposer = Number(offer.proposer_id) === userId;

  if (!isOwner && !isProposer) {
    return sendJson(res, false, 'Unauthorized for this trade offer.', {}, 403);
  }

  // The partner's OTP that this user must provide
  const expectedOtp = isOwner ? offer.proposer_otp : offer.owner_otp;
  if (!enteredOtp || enteredOtp !== expectedOtp) {
    return sendJson(res, false, 'Invalid verification code. Please check the 4-digit code shown on the partner\'s device.', {}, 400);
  }

  // Successfully verified! Mark as Swapped & Accepted
  db.prepare(`UPDATE swap_offers SET status = 'Accepted' WHERE id = ?`).run(offerId);
  db.prepare(`UPDATE items SET status = 'Swapped' WHERE id = ?`).run(offer.item_id);

  return sendJson(res, true, 'Dual-OTP Handover Verified! Escrow released and trade marked as successfully completed.', {
    status: 'Accepted'
  });
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

  const tags = Array.isArray(req.body.tags) ? req.body.tags.join(', ') : (req.body.tags || '').trim();

  // SQLite upsert with attributes tags
  db.prepare(`
    INSERT INTO trader_reviews (offer_id, reviewer_id, target_user_id, rating, comment, tags)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(offer_id, reviewer_id) DO UPDATE SET
      rating = excluded.rating,
      comment = excluded.comment,
      tags = excluded.tags
  `).run(offerId, reviewerId, targetId, rating, comment, tags);

  return sendJson(res, true, 'Trader rating & review tags submitted! Thank you.');
}

// Router for /api/offers.php
app.all('/api/offers.php', (req, res) => {
  const action = req.query.action || '';
  if (req.method === 'POST' && action === 'create') return handleCreateOffer(req, res);
  if (req.method === 'GET' && action === 'incoming') return handleIncomingOffers(req, res);
  if (req.method === 'POST' && action === 'respond') return handleRespondOffer(req, res);
  if (req.method === 'POST' && action === 'fund_escrow') return handleFundEscrow(req, res);
  if (req.method === 'POST' && action === 'verify_otp') return handleVerifyHandoverOtp(req, res);
  if (req.method === 'POST' && action === 'redeem_pawn') return handleRedeemPawn(req, res);
  if (req.method === 'POST' && action === 'liquidate_pawn') return handleLiquidatePawn(req, res);
  if (req.method === 'POST' && action === 'rate') return handleRateTrader(req, res);
  return sendJson(res, false, 'Invalid offers endpoint request.', {}, 400);
});

// RESTful aliases for offers & pawn
app.post('/api/offers', handleCreateOffer);
app.get('/api/offers/incoming', handleIncomingOffers);
app.post('/api/offers/respond', handleRespondOffer);
app.post('/api/offers/fund-escrow', handleFundEscrow);
app.post('/api/offers/verify-otp', handleVerifyHandoverOtp);
app.post('/api/offers/rate', handleRateTrader);
app.post('/api/pawn/redeem', handleRedeemPawn);
app.post('/api/pawn/liquidate', handleLiquidatePawn);

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
    pending_items: db.prepare(`SELECT COUNT(*) as count FROM items WHERE status = 'pending_review'`).get().count,
    pending_kyc: db.prepare(`SELECT COUNT(*) as count FROM kyc_verifications WHERE status = 'pending_review'`).get().count,
    reported: db.prepare(`SELECT COUNT(*) as count FROM items WHERE is_reported = 1 AND status != 'Removed'`).get().count,
    swapped: db.prepare(`SELECT COUNT(*) as count FROM items WHERE status = 'Swapped'`).get().count,
    active_swaps: db.prepare(`SELECT COUNT(*) as count FROM swap_offers WHERE status IN ('Pending', 'Countered', 'In Escrow')`).get().count
  };

  const allItems = db.prepare(`
    SELECT i.*, u.full_name AS owner_name, u.email AS owner_email, u.phone AS owner_phone
    FROM items i
    JOIN users u ON i.user_id = u.id
    ORDER BY (CASE WHEN i.status = 'pending_review' THEN 0 WHEN i.is_reported = 1 THEN 1 ELSE 2 END), i.created_at DESC
  `).all();

  const allUsers = db.prepare(`
    SELECT id, full_name, email, phone, location, referral_code, spotlight_credits, is_admin,
           COALESCE(kyc_tier, 1) AS kyc_tier,
           COALESCE(kyc_status, 'unverified') AS kyc_status,
           COALESCE(email_verified, 0) AS email_verified,
           COALESCE(is_blocked, 0) AS is_blocked,
           blocked_reason,
           nin_bvn, business_name, created_at
    FROM users
    ORDER BY created_at DESC
  `).all();

  const pendingKyc = db.prepare(`
    SELECT k.*, u.email, u.location, u.created_at AS user_joined_at
    FROM kyc_verifications k
    JOIN users u ON k.user_id = u.id
    WHERE k.status = 'pending_review'
    ORDER BY k.created_at ASC
  `).all();

  const pendingItems = db.prepare(`
    SELECT i.*, u.full_name AS owner_name, u.email AS owner_email, u.phone AS owner_phone,
           COALESCE(u.kyc_tier, 1) AS owner_kyc_tier
    FROM items i
    JOIN users u ON i.user_id = u.id
    WHERE i.status = 'pending_review'
    ORDER BY i.created_at ASC
  `).all();

  const allOffers = db.prepare(`
    SELECT o.*, i.title AS item_title, i.image_path AS item_image,
           u1.full_name AS proposer_name, u1.phone AS proposer_phone,
           u2.full_name AS owner_name, u2.phone AS owner_phone
    FROM swap_offers o
    JOIN items i ON o.item_id = i.id
    JOIN users u1 ON o.proposer_id = u1.id
    JOIN users u2 ON o.owner_id = u2.id
    ORDER BY o.created_at DESC LIMIT 50
  `).all();

  return sendJson(res, true, 'Admin data fetched.', {
    stats,
    allItems,
    allUsers,
    pendingKyc,
    pendingItems,
    allOffers
  });
});

// Admin Review: Approve / Reject KYC
app.post('/api/admin/kyc/:id/approve', (req, res) => {
  const adminId = requireAdmin(req, res);
  if (!adminId) return;

  const kycId = parseInt(req.params.id, 10);
  const kyc = db.prepare('SELECT * FROM kyc_verifications WHERE id = ?').get(kycId);
  if (!kyc) return sendJson(res, false, 'KYC submission not found.', {}, 404);

  db.prepare(`UPDATE kyc_verifications SET status = 'approved', reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP WHERE id = ?`).run(adminId, kycId);
  db.prepare(`UPDATE users SET kyc_status = 'approved', kyc_tier = ? WHERE id = ?`).run(kyc.tier, kyc.user_id);

  createNotification(
    kyc.user_id,
    'KYC Identity Verification Approved!',
    `Congratulations! Your identity details and NIN have been approved by compliance. You now have the ${kyc.tier === 3 ? 'Gold Seal Merchant' : 'Blue Shield Trader'} badge and can post listings freely.`,
    'kyc'
  );

  return sendJson(res, true, `KYC application #${kycId} approved successfully for ${kyc.full_name}!`);
});

app.post('/api/admin/kyc/:id/reject', (req, res) => {
  const adminId = requireAdmin(req, res);
  if (!adminId) return;

  const kycId = parseInt(req.params.id, 10);
  const reason = (req.body.reason || 'Information provided did not match official records.').trim();
  const kyc = db.prepare('SELECT * FROM kyc_verifications WHERE id = ?').get(kycId);
  if (!kyc) return sendJson(res, false, 'KYC submission not found.', {}, 404);

  db.prepare(`UPDATE kyc_verifications SET status = 'rejected', rejection_reason = ?, reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP WHERE id = ?`).run(reason, adminId, kycId);
  db.prepare(`UPDATE users SET kyc_status = 'rejected' WHERE id = ?`).run(kyc.user_id);

  createNotification(
    kyc.user_id,
    'KYC Verification Requires Attention',
    `Your identity verification was not approved. Reason: ${reason}. Please update your details and re-submit.`,
    'kyc'
  );

  return sendJson(res, true, `KYC application #${kycId} rejected.`);
});

// Admin Review: Approve / Reject Listing
app.post('/api/admin/items/:id/approve', (req, res) => {
  const adminId = requireAdmin(req, res);
  if (!adminId) return;

  const itemId = parseInt(req.params.id, 10);
  const item = db.prepare('SELECT id, user_id, title FROM items WHERE id = ?').get(itemId);
  if (!item) return sendJson(res, false, 'Item not found.', {}, 404);

  db.prepare(`UPDATE items SET status = 'Active', admin_review_notes = 'Approved' WHERE id = ?`).run(itemId);

  createNotification(
    item.user_id,
    'Listing Approved & Live!',
    `Great news! Your listing "${item.title}" has been reviewed by our compliance desk and is now live on the marketplace.`,
    'listing',
    `/item/${itemId}`
  );

  return sendJson(res, true, `Listing #${itemId} "${item.title}" is now approved and live on DFQ Trade Crow!`);
});

app.post('/api/admin/items/:id/reject', (req, res) => {
  const adminId = requireAdmin(req, res);
  if (!adminId) return;

  const itemId = parseInt(req.params.id, 10);
  const reason = (req.body.reason || 'Listing does not comply with community trade standards.').trim();
  const item = db.prepare('SELECT id, user_id, title FROM items WHERE id = ?').get(itemId);
  if (!item) return sendJson(res, false, 'Item not found.', {}, 404);

  db.prepare(`UPDATE items SET status = 'rejected', admin_review_notes = ? WHERE id = ?`).run(reason, itemId);

  createNotification(
    item.user_id,
    'Listing Rejected by Review Desk',
    `Your listing "${item.title}" was rejected. Reason: ${reason}.`,
    'listing'
  );

  return sendJson(res, true, `Listing #${itemId} rejected.`);
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

// ==========================================
// ADMIN USER MANAGEMENT (Requirement 1)
// ==========================================
app.post('/api/admin/users/:id/edit', (req, res) => {
  const adminId = requireAdmin(req, res);
  if (!adminId) return;

  const targetId = parseInt(req.params.id, 10);
  const user = db.prepare('SELECT id FROM users WHERE id = ?').get(targetId);
  if (!user) return sendJson(res, false, 'User not found.', {}, 404);

  const {
    full_name,
    email,
    phone,
    location,
    spotlight_credits,
    kyc_status,
    kyc_tier,
    is_admin,
    is_blocked,
    blocked_reason
  } = req.body || {};

  if (email) {
    const existing = db.prepare('SELECT id FROM users WHERE email = ? AND id != ?').get(email.trim().toLowerCase(), targetId);
    if (existing) {
      return sendJson(res, false, 'Another user is already registered with this email address.', {}, 400);
    }
  }

  db.prepare(`
    UPDATE users
    SET full_name = COALESCE(?, full_name),
        email = COALESCE(?, email),
        phone = COALESCE(?, phone),
        location = COALESCE(?, location),
        spotlight_credits = COALESCE(?, spotlight_credits),
        kyc_status = COALESCE(?, kyc_status),
        kyc_tier = COALESCE(?, kyc_tier),
        is_admin = COALESCE(?, is_admin),
        is_blocked = COALESCE(?, is_blocked),
        blocked_reason = COALESCE(?, blocked_reason)
    WHERE id = ?
  `).run(
    full_name ? full_name.trim() : null,
    email ? email.trim().toLowerCase() : null,
    phone ? phone.trim() : null,
    location ? location.trim() : null,
    spotlight_credits !== undefined && spotlight_credits !== '' ? parseInt(spotlight_credits, 10) : null,
    kyc_status || null,
    kyc_tier !== undefined && kyc_tier !== '' ? parseInt(kyc_tier, 10) : null,
    is_admin !== undefined ? (is_admin ? 1 : 0) : null,
    is_blocked !== undefined ? (is_blocked ? 1 : 0) : null,
    blocked_reason !== undefined ? blocked_reason : null,
    targetId
  );

  return sendJson(res, true, `Trader details for User #${targetId} updated successfully.`);
});

app.post('/api/admin/users/:id/block', (req, res) => {
  const adminId = requireAdmin(req, res);
  if (!adminId) return;

  const targetId = parseInt(req.params.id, 10);
  if (targetId === adminId) {
    return sendJson(res, false, 'You cannot block your own administrative account.', {}, 400);
  }

  const user = db.prepare('SELECT id, full_name, is_blocked FROM users WHERE id = ?').get(targetId);
  if (!user) return sendJson(res, false, 'User not found.', {}, 404);

  const shouldBlock = req.body.block !== undefined ? (req.body.block ? 1 : 0) : (user.is_blocked ? 0 : 1);
  const reason = (req.body.reason || 'Account suspended by DFQ Compliance desk.').trim();

  db.prepare('UPDATE users SET is_blocked = ?, blocked_reason = ? WHERE id = ?').run(
    shouldBlock,
    shouldBlock ? reason : null,
    targetId
  );

  return sendJson(res, true, `Trader "${user.full_name}" #${targetId} has been ${shouldBlock ? 'blocked' : 'unblocked'}.`);
});

app.delete('/api/admin/users/:id', (req, res) => {
  const adminId = requireAdmin(req, res);
  if (!adminId) return;

  const targetId = parseInt(req.params.id, 10);
  if (targetId === adminId) {
    return sendJson(res, false, 'You cannot delete your own administrative account.', {}, 400);
  }

  const user = db.prepare('SELECT id, full_name FROM users WHERE id = ?').get(targetId);
  if (!user) return sendJson(res, false, 'User not found.', {}, 404);

  db.prepare('DELETE FROM users WHERE id = ?').run(targetId);
  return sendJson(res, true, `Trader "${user.full_name}" (#${targetId}) and associated listings have been permanently deleted.`);
});

// ==========================================
// ADMIN LISTING MANAGEMENT (Requirement 2)
// ==========================================
app.post('/api/admin/items/:id/edit', (req, res) => {
  const adminId = requireAdmin(req, res);
  if (!adminId) return;

  const itemId = parseInt(req.params.id, 10);
  const item = db.prepare('SELECT id, title FROM items WHERE id = ?').get(itemId);
  if (!item) return sendJson(res, false, 'Listing not found.', {}, 404);

  const {
    title,
    category,
    mode,
    item_condition,
    location,
    wanted,
    est_value,
    pawn_advance,
    pawn_buyback,
    serial_imei,
    description,
    status,
    is_featured,
    is_reported
  } = req.body || {};

  db.prepare(`
    UPDATE items
    SET title = COALESCE(?, title),
        category = COALESCE(?, category),
        mode = COALESCE(?, mode),
        item_condition = COALESCE(?, item_condition),
        location = COALESCE(?, location),
        wanted = COALESCE(?, wanted),
        est_value = COALESCE(?, est_value),
        pawn_advance = COALESCE(?, pawn_advance),
        pawn_buyback = COALESCE(?, pawn_buyback),
        serial_imei = COALESCE(?, serial_imei),
        description = COALESCE(?, description),
        status = COALESCE(?, status),
        is_featured = COALESCE(?, is_featured),
        is_reported = COALESCE(?, is_reported)
    WHERE id = ?
  `).run(
    title ? title.trim() : null,
    category || null,
    mode || null,
    item_condition || null,
    location ? location.trim() : null,
    wanted ? wanted.trim() : null,
    est_value !== undefined && est_value !== '' ? parseFloat(est_value) : null,
    pawn_advance !== undefined && pawn_advance !== '' ? parseFloat(pawn_advance) : null,
    pawn_buyback !== undefined && pawn_buyback !== '' ? parseFloat(pawn_buyback) : null,
    serial_imei !== undefined ? serial_imei : null,
    description ? description.trim() : null,
    status || null,
    is_featured !== undefined ? (is_featured ? 1 : 0) : null,
    is_reported !== undefined ? (is_reported ? 1 : 0) : null,
    itemId
  );

  return sendJson(res, true, `Listing #${itemId} "${title || item.title}" updated successfully.`);
});

app.delete('/api/admin/items/:id', (req, res) => {
  const adminId = requireAdmin(req, res);
  if (!adminId) return;

  const itemId = parseInt(req.params.id, 10);
  const item = db.prepare('SELECT id, title FROM items WHERE id = ?').get(itemId);
  if (!item) return sendJson(res, false, 'Listing not found.', {}, 404);

  db.prepare('DELETE FROM items WHERE id = ?').run(itemId);
  return sendJson(res, true, `Listing #${itemId} "${item.title}" permanently deleted.`);
});

app.post('/api/admin/items/:id/toggle-spotlight', (req, res) => {
  const adminId = requireAdmin(req, res);
  if (!adminId) return;

  const itemId = parseInt(req.params.id, 10);
  const item = db.prepare('SELECT id, title, is_featured FROM items WHERE id = ?').get(itemId);
  if (!item) return sendJson(res, false, 'Listing not found.', {}, 404);

  const newVal = item.is_featured === 1 ? 0 : 1;
  db.prepare('UPDATE items SET is_featured = ? WHERE id = ?').run(newVal, itemId);
  return sendJson(res, true, `Listing #${itemId} spotlight ${newVal ? 'activated' : 'removed'}.`);
});

// ==========================================
// ADMIN OTP OUTBOX LOG DELETION (Requirement 3)
// ==========================================
app.delete('/api/admin/email-outbox/:id', (req, res) => {
  const adminId = requireAdmin(req, res);
  if (!adminId) return;

  const logId = parseInt(req.params.id, 10);
  const deleted = deleteEmailOutboxLog(logId);
  if (!deleted) return sendJson(res, false, 'Dispatch log entry not found or already deleted.', {}, 404);
  return sendJson(res, true, `Dispatch log #${logId} deleted.`);
});

app.post('/api/admin/email-outbox/clear', (req, res) => {
  const adminId = requireAdmin(req, res);
  if (!adminId) return;

  clearEmailOutboxLogs();
  return sendJson(res, true, 'All email dispatch logs cleared successfully.');
});

app.delete('/api/admin/email-outbox', (req, res) => {
  const adminId = requireAdmin(req, res);
  if (!adminId) return;

  clearEmailOutboxLogs();
  return sendJson(res, true, 'All email dispatch logs cleared successfully.');
});

// ==========================================
// IN-APP MESSAGES & DIRECT INQUIRIES API
// ==========================================

function handleSendMessage(req, res) {
  const senderId = requireAuth(req, res);
  if (!senderId) return;

  const itemId = parseInt(req.body.item_id || '0', 10);
  const messageText = (req.body.message || '').trim();

  if (!itemId || !messageText) {
    return sendJson(res, false, 'Item reference and message text are required.', {}, 400);
  }

  const item = db.prepare('SELECT id, user_id, title FROM items WHERE id = ?').get(itemId);
  if (!item) {
    return sendJson(res, false, 'Listing not found.', {}, 404);
  }

  // Recipient is the owner if current user is inquirer, or specified user if owner is replying
  let recipientId = parseInt(req.body.recipient_id || '0', 10);
  if (!recipientId) {
    recipientId = Number(item.user_id);
  }

  if (senderId === recipientId) {
    return sendJson(res, false, 'You cannot send inquiries to your own listing.', {}, 400);
  }

  const insert = db.prepare(`
    INSERT INTO messages (item_id, sender_id, recipient_id, message)
    VALUES (?, ?, ?, ?)
  `).run(itemId, senderId, recipientId, messageText);

  // Notify recipient of incoming message
  const senderUser = db.prepare('SELECT full_name FROM users WHERE id = ?').get(senderId);
  createNotification(
    recipientId,
    `New message from ${senderUser ? senderUser.full_name : 'Trader'}`,
    `Regarding "${item.title}": ${messageText.length > 60 ? messageText.substring(0, 57) + '...' : messageText}`,
    'chat',
    `/chat?item_id=${itemId}&partner_id=${senderId}`
  );

  return sendJson(res, true, 'Message sent successfully!', {
    message_id: Number(insert.lastInsertRowid),
    created_at: new Date().toISOString()
  }, 201);
}

function handleGetThread(req, res) {
  const currentUserId = requireAuth(req, res);
  if (!currentUserId) return;

  const itemId = parseInt(req.query.item_id || '0', 10);
  const item = db.prepare(`
    SELECT i.id, i.user_id, i.title, i.category, i.mode, i.item_condition, i.location,
           i.wanted, i.est_value, i.image_path, u.full_name AS owner_name, u.phone AS owner_phone
    FROM items i
    JOIN users u ON i.user_id = u.id
    WHERE i.id = ?
  `).get(itemId);

  if (!item) {
    return sendJson(res, false, 'Item not found.', {}, 404);
  }

  let otherUserId = parseInt(req.query.other_user_id || '0', 10);
  if (!otherUserId) {
    if (currentUserId === Number(item.user_id)) {
      // Find the most recent person who sent a message about this item
      const latestMsg = db.prepare(`
        SELECT CASE WHEN sender_id = ? THEN recipient_id ELSE sender_id END AS partner_id
        FROM messages WHERE item_id = ? AND (sender_id = ? OR recipient_id = ?)
        ORDER BY id DESC LIMIT 1
      `).get(currentUserId, itemId, currentUserId, currentUserId);
      otherUserId = latestMsg ? Number(latestMsg.partner_id) : 0;
    } else {
      otherUserId = Number(item.user_id);
    }
  }

  // Fetch all messages for this item between current user and other user
  const messages = db.prepare(`
    SELECT m.*, u.full_name AS sender_name
    FROM messages m
    JOIN users u ON m.sender_id = u.id
    WHERE m.item_id = ?
      AND ((m.sender_id = ? AND m.recipient_id = ?) OR (m.sender_id = ? AND m.recipient_id = ?))
    ORDER BY m.created_at ASC
  `).all(itemId, currentUserId, otherUserId, otherUserId, currentUserId);

  // Mark messages sent to current user as read
  db.prepare(`
    UPDATE messages SET is_read = 1
    WHERE item_id = ? AND recipient_id = ? AND sender_id = ? AND is_read = 0
  `).run(itemId, currentUserId, otherUserId);

  const otherUser = otherUserId ? db.prepare(`
    SELECT u.id, u.full_name, u.location,
           COALESCE(ROUND((SELECT AVG(rating) FROM trader_reviews WHERE target_user_id = u.id), 1), 5.0) AS rating,
           (SELECT COUNT(*) FROM trader_reviews WHERE target_user_id = u.id) AS review_count
    FROM users u WHERE u.id = ?
  `).get(otherUserId) : null;

  return sendJson(res, true, 'Message thread loaded.', {
    item,
    otherUser,
    messages
  });
}

function handleGetConversations(req, res) {
  const userId = requireAuth(req, res);
  if (!userId) return;

  const sql = `
    SELECT 
      m.item_id,
      CASE WHEN m.sender_id = ? THEN m.recipient_id ELSE m.sender_id END AS partner_id,
      u.full_name AS partner_name,
      i.title AS item_title,
      i.image_path AS item_image,
      i.mode AS item_mode,
      m.message AS last_message,
      m.created_at AS last_message_at,
      (SELECT COUNT(*) FROM messages m2 
       WHERE m2.item_id = m.item_id 
         AND m2.recipient_id = ? 
         AND m2.sender_id = (CASE WHEN m.sender_id = ? THEN m.recipient_id ELSE m.sender_id END) 
         AND m2.is_read = 0) AS unread_count
    FROM messages m
    JOIN items i ON m.item_id = i.id
    JOIN users u ON u.id = (CASE WHEN m.sender_id = ? THEN m.recipient_id ELSE m.sender_id END)
    WHERE m.id IN (
      SELECT MAX(id) FROM messages
      WHERE sender_id = ? OR recipient_id = ?
      GROUP BY item_id, CASE WHEN sender_id = ? THEN recipient_id ELSE sender_id END
    )
    ORDER BY m.created_at DESC
  `;

  const convos = db.prepare(sql).all(userId, userId, userId, userId, userId, userId, userId);
  return sendJson(res, true, 'Conversations loaded.', { conversations: convos });
}

function handleUnreadCount(req, res) {
  if (!req.session || !req.session.userId) {
    return sendJson(res, true, 'Unread count', { count: 0 });
  }

  const userId = Number(req.session.userId);
  const row = db.prepare('SELECT COUNT(*) as count FROM messages WHERE recipient_id = ? AND is_read = 0').get(userId);
  return sendJson(res, true, 'Unread count', { count: row ? row.count : 0 });
}

// Router for /api/messages.php
app.all('/api/messages.php', (req, res) => {
  const action = req.query.action || '';
  if (req.method === 'POST' && action === 'send') return handleSendMessage(req, res);
  if (req.method === 'GET' && action === 'thread') return handleGetThread(req, res);
  if (req.method === 'GET' && action === 'conversations') return handleGetConversations(req, res);
  if (req.method === 'GET' && action === 'unread_count') return handleUnreadCount(req, res);
  return sendJson(res, false, 'Invalid messages endpoint request.', {}, 400);
});

// RESTful aliases for messages
app.post('/api/messages/send', handleSendMessage);
app.get('/api/messages/thread', handleGetThread);
app.get('/api/messages/conversations', handleGetConversations);
app.get('/api/messages/unread-count', handleUnreadCount);

// ==========================================
// NOTIFICATIONS API
// ==========================================
function handleGetNotifications(req, res) {
  const userId = requireAuth(req, res);
  if (!userId) return;

  const rows = db.prepare(`
    SELECT * FROM notifications
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT 50
  `).all(userId);

  const unreadCount = db.prepare(`
    SELECT COUNT(*) as count FROM notifications
    WHERE user_id = ? AND is_read = 0
  `).get(userId).count;

  return sendJson(res, true, 'Notifications fetched.', {
    notifications: rows,
    unread_count: unreadCount
  });
}

function handleMarkNotificationRead(req, res) {
  const userId = requireAuth(req, res);
  if (!userId) return;

  const notifId = parseInt(req.params.id, 10);
  if (notifId) {
    db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?').run(notifId, userId);
  }

  return sendJson(res, true, 'Notification marked as read.');
}

function handleMarkAllNotificationsRead(req, res) {
  const userId = requireAuth(req, res);
  if (!userId) return;

  db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?').run(userId);
  return sendJson(res, true, 'All notifications marked as read.');
}

// RESTful aliases for notifications
app.get('/api/notifications', handleGetNotifications);
app.post('/api/notifications/read-all', handleMarkAllNotificationsRead);
app.post('/api/notifications/:id/read', handleMarkNotificationRead);

// RESTful aliases for OTP
app.post('/api/otp/send', handleSendOtp);
app.post('/api/otp/verify', handleVerifyOtp);

// RESTful aliases for KYC
app.post('/api/kyc/submit', upload.single('id_document'), handleKycSubmit);
app.get('/api/kyc/status', handleKycStatus);

// Message notification enhancement in handleSendMessage
// Also add REST aliases for admin items and kyc pending lists
app.get('/api/admin/items/pending', (req, res) => {
  const adminId = requireAdmin(req, res);
  if (!adminId) return;

  const items = db.prepare(`
    SELECT i.*, u.full_name AS owner_name, u.email AS owner_email, u.phone AS owner_phone
    FROM items i
    JOIN users u ON i.user_id = u.id
    WHERE i.status = 'pending_review'
    ORDER BY i.created_at ASC
  `).all();

  return sendJson(res, true, 'Pending items fetched.', { items });
});

app.get('/api/admin/kyc/pending', (req, res) => {
  const adminId = requireAdmin(req, res);
  if (!adminId) return;

  const applications = db.prepare(`
    SELECT k.*, u.email, u.location, u.created_at AS user_joined_at
    FROM kyc_verifications k
    JOIN users u ON k.user_id = u.id
    WHERE k.status = 'pending_review'
    ORDER BY k.created_at ASC
  `).all();

  return sendJson(res, true, 'Pending KYC applications fetched.', { applications });
});

// Dedicated Administrator Login Endpoint
app.post('/api/admin/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return sendJson(res, false, 'Admin email and password are required.', null, 400);
  }

  const cleanEmail = email.trim().toLowerCase();
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(cleanEmail);
  if (!user) {
    return sendJson(res, false, 'Invalid administrator credentials.', null, 401);
  }

  const matches = bcrypt.compareSync(password, user.password_hash);
  if (!matches) {
    return sendJson(res, false, 'Invalid administrator credentials.', null, 401);
  }

  if (user.is_admin !== 1) {
    return sendJson(res, false, 'Access denied: This portal is strictly restricted to authorized platform administrators.', null, 403);
  }

  req.session.userId = user.id;
  const safeUser = { ...user };
  delete safeUser.password_hash;
  return sendJson(res, true, 'Administrator authenticated successfully.', {
    user: safeUser,
    redirect: '/admin'
  });
});

// Admin Email Settings - Get Current Config
app.get('/api/admin/email-settings', (req, res) => {
  const adminId = requireAdmin(req, res);
  if (!adminId) return;

  const settings = getEmailSettingsFromDb();
  return sendJson(res, true, 'Email dispatcher settings fetched.', { settings });
});

// Admin Email Settings - Save Config
app.post('/api/admin/email-settings', (req, res) => {
  const adminId = requireAdmin(req, res);
  if (!adminId) return;

  const { provider, smtp, resendApiKey, senderName, senderEmail, subjectLine } = req.body || {};
  const updated = saveEmailSettingsToDb({
    provider,
    smtp,
    resendApiKey,
    senderName,
    senderEmail,
    subjectLine
  });

  return sendJson(res, true, 'Email dispatcher configuration saved successfully.', { settings: updated });
});

// Admin Email Settings - Test Dispatch
app.post('/api/admin/email-settings/test', async (req, res) => {
  const adminId = requireAdmin(req, res);
  if (!adminId) return;

  const { to, smtp, senderName, senderEmail } = req.body || {};
  if (!to) {
    return sendJson(res, false, 'Recipient email address is required for testing.', null, 400);
  }

  const result = await sendTestEmail({
    to,
    smtpConfig: smtp || {},
    senderName,
    senderEmail
  });

  if (result.success) {
    return sendJson(res, true, result.message, result);
  } else {
    return sendJson(res, false, result.error, result, 400);
  }
});

// Admin Email Outbox - Activity Log
app.get('/api/admin/email-outbox', (req, res) => {
  const adminId = requireAdmin(req, res);
  if (!adminId) return;

  const limit = Math.min(100, Math.max(10, parseInt(req.query.limit) || 50));
  const logs = getEmailOutboxLogs(limit);
  return sendJson(res, true, 'Email outbox logs fetched.', { logs });
});

module.exports = app;
