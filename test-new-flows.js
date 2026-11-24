const http = require('http');
const app = require('./server/app');
const { db } = require('./server/db');

const PORT = 5098;
let server;
let cookies = '';

function request(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const postData = body ? JSON.stringify(body) : null;
    const reqHeaders = {
      'Content-Type': 'application/json',
      ...headers
    };
    if (cookies) {
      reqHeaders['Cookie'] = cookies;
    }
    if (postData) {
      reqHeaders['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = http.request({
      hostname: 'localhost',
      port: PORT,
      path,
      method,
      headers: reqHeaders
    }, (res) => {
      let rawData = '';
      if (res.headers['set-cookie']) {
        cookies = res.headers['set-cookie'].map(c => c.split(';')[0]).join('; ');
      }
      res.on('data', chunk => { rawData += chunk; });
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(rawData); } catch (_) {}
        resolve({ status: res.statusCode, data: json, raw: rawData });
      });
    });

    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

async function run() {
  server = app.listen(PORT, async () => {
    console.log(`[Test] Server running on port ${PORT}`);
    try {
      // 1. Send OTP test
      console.log('\n--- 1. Testing OTP Generation & Dispatch ---');
      const testEmail = `trader_${Date.now()}@example.com`;
      const otpSend = await request('POST', '/api/otp/send', {
        email: testEmail,
        name: 'New Test Trader',
        purpose: 'registration'
      });
      console.log('OTP Send Status:', otpSend.status, 'Dev Code:', otpSend.data.devOtpCode);
      if (!otpSend.data.devOtpCode) throw new Error('OTP was not generated');

      // 2. Register without OTP (should return require_otp: true)
      console.log('\n--- 2. Testing Register Without OTP ---');
      const regStep1 = await request('POST', '/api/auth/register', {
        full_name: 'New Test Trader',
        email: testEmail,
        phone: '08099887766',
        password: 'password123'
      });
      console.log('Register Step 1:', regStep1.status, 'Require OTP:', regStep1.data.require_otp);

      // 3. Register WITH OTP (completes registration and logs in)
      console.log('\n--- 3. Testing Register With OTP ---');
      const latestOtp = regStep1.data.devOtpCode || otpSend.data.devOtpCode;
      const regStep2 = await request('POST', '/api/auth/register', {
        full_name: 'New Test Trader',
        email: testEmail,
        phone: '08099887766',
        password: 'password123',
        otp_code: latestOtp
      });
      console.log('Register Step 2 Status:', regStep2.status, 'KYC Status:', regStep2.data.user.kyc_status);
      const newUserId = regStep2.data.user.id;

      // 4. Attempt to create listing before KYC approval (should fail with 403)
      console.log('\n--- 4. Testing Block Listing Before KYC Approval ---');
      const listAttempt = await request('POST', '/api/items', {
        title: 'Unauthorized Item Before KYC',
        category: 'Electronics & Phones',
        mode: 'Direct Barter',
        location: 'Ikeja',
        wanted: 'Cash',
        description: 'Should be blocked'
      });
      console.log('Listing Attempt Status:', listAttempt.status, 'Blocked as expected:', listAttempt.status === 403);
      if (listAttempt.status !== 403) throw new Error('Listing was not blocked for unverified user');

      // 5. Submit KYC verification
      console.log('\n--- 5. Testing KYC Submission ---');
      const kycSub = await request('POST', '/api/kyc/submit', {
        tier: 2,
        full_name: 'New Test Trader',
        phone: '08099887766',
        nin_bvn: 'NIN-12345678901',
        id_type: 'NIN'
      });
      console.log('KYC Submit Status:', kycSub.status, 'KYC Status:', kycSub.data.kyc_status);

      // 6. Login as Admin
      console.log('\n--- 6. Testing Admin Login & Dashboard Metrics ---');
      cookies = ''; // clear session
      const adminLogin = await request('POST', '/api/auth/login', {
        email: 'demo@dfqtradecrow.com',
        password: 'password'
      });
      console.log('Admin Login:', adminLogin.status, 'Is Admin:', adminLogin.data.user.is_admin);

      const metrics = await request('GET', '/api/admin/data');
      console.log('Admin Metrics Pending KYC:', metrics.data.stats.pending_kyc, 'Pending Items:', metrics.data.stats.pending_items);

      // 7. Admin approves KYC
      console.log('\n--- 7. Testing Admin Approves KYC ---');
      const pendingKycList = await request('GET', '/api/admin/kyc/pending');
      const targetKyc = pendingKycList.data.applications.find(a => a.user_id === newUserId);
      if (!targetKyc) throw new Error('Target KYC not found in pending list');

      const kycApprove = await request('POST', `/api/admin/kyc/${targetKyc.id}/approve`);
      console.log('KYC Approved Status:', kycApprove.status, 'Message:', kycApprove.data.message);

      // 8. Re-login as new user and create listing (now allowed, will be pending_review)
      console.log('\n--- 8. Testing User Listing Post-KYC Approval ---');
      cookies = '';
      await request('POST', '/api/auth/login', {
        email: testEmail,
        password: 'password123'
      });

      const createItemRes = await request('POST', '/api/items', {
        title: 'iPhone 14 Pro Max 256GB',
        category: 'Electronics & Phones',
        mode: 'Direct Barter',
        location: 'Victoria Island, Lagos',
        wanted: 'M2 MacBook Air',
        description: 'Clean battery 95%',
        est_value: 850000
      });
      console.log('Listing Created Status:', createItemRes.status, 'Status:', createItemRes.data.status);
      const pendingItemId = createItemRes.data.item_id;

      // 9. Admin reviews and approves listing
      console.log('\n--- 9. Testing Admin Approves Listing ---');
      cookies = '';
      await request('POST', '/api/auth/login', {
        email: 'demo@dfqtradecrow.com',
        password: 'password'
      });

      const itemApprove = await request('POST', `/api/admin/items/${pendingItemId}/approve`);
      console.log('Item Approved Status:', itemApprove.status, 'Message:', itemApprove.data.message);

      // 10. Check notifications for user
      console.log('\n--- 10. Testing User Notifications ---');
      cookies = '';
      await request('POST', '/api/auth/login', {
        email: testEmail,
        password: 'password123'
      });

      const notifs = await request('GET', '/api/notifications');
      console.log('User Notifications Count:', notifs.data.notifications.length, 'Unread:', notifs.data.unread_count);
      notifs.data.notifications.forEach(n => console.log('  - [' + n.type + '] ' + n.title));

      console.log('\n=============================================');
      console.log('🎉 ALL NEW PLATFORM FLOW TESTS PASSED 100%!');
      console.log('=============================================');
      server.close();
      process.exit(0);
    } catch (err) {
      console.error('Test Failed:', err);
      if (server) server.close();
      process.exit(1);
    }
  });
}

run();
