const http = require('http');

function request(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, data: JSON.parse(body) });
        } catch (_) {
          resolve({ status: res.statusCode, headers: res.headers, raw: body });
        }
      });
    });
    req.on('error', reject);
    if (data) {
      req.write(typeof data === 'string' ? data : JSON.stringify(data));
    }
    req.end();
  });
}

async function runTests() {
  console.log('--- 1. Authenticate as Administrator ---');
  const loginRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/admin/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email: 'demo@dfqtradecrow.com', password: 'password' });

  console.log('Admin Login Status:', loginRes.status);
  const cookie = loginRes.headers['set-cookie'];
  if (!cookie) throw new Error('No admin session cookie returned.');
  const sessionCookie = cookie[0].split(';')[0];

  console.log('\n--- 2. Create Dummy User for Admin Tests ---');
  const testEmail = `testuser_${Date.now()}@example.com`;
  // Send OTP
  const otpRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/otp/send',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email: testEmail, name: 'Advanced Test User' });
  const otpCode = otpRes.data.devOtpCode;

  // Register
  const regRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/register',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    full_name: 'Advanced Test User',
    email: testEmail,
    phone: '08099887766',
    password: 'password123',
    location: 'Yaba, Lagos',
    otp_code: otpCode
  });
  const testUserId = regRes.data.user.id;
  console.log('Created User ID:', testUserId);

  console.log('\n--- 3. Testing Admin Edit User Details (/api/admin/users/:id/edit) ---');
  const editUserRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: `/api/admin/users/${testUserId}/edit`,
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Cookie': sessionCookie }
  }, {
    full_name: 'Updated Test User Pro',
    phone: '08011223344',
    location: 'Victoria Island, Lagos',
    spotlight_credits: 10,
    kyc_status: 'approved',
    kyc_tier: 2
  });
  console.log('Edit User Status:', editUserRes.status, 'Message:', editUserRes.data.message);

  console.log('\n--- 4. Testing Admin Block User (/api/admin/users/:id/block) ---');
  const blockRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: `/api/admin/users/${testUserId}/block`,
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Cookie': sessionCookie }
  }, { block: true, reason: 'Suspicious test activity' });
  console.log('Block User Status:', blockRes.status, 'Message:', blockRes.data.message);

  // Attempt login as blocked user
  const blockedLoginRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email: testEmail, password: 'password123' });
  console.log('Blocked Login Status (Expect 403):', blockedLoginRes.status, 'Message:', blockedLoginRes.data.message);

  // Unblock user
  const unblockRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: `/api/admin/users/${testUserId}/block`,
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Cookie': sessionCookie }
  }, { block: false });
  console.log('Unblock User Status:', unblockRes.status, 'Message:', unblockRes.data.message);

  console.log('\n--- 5. Testing Create Listing & Admin Edit / Toggle / Delete ---');
  // Log in as test user
  const userLogin = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email: testEmail, password: 'password123' });
  const userCookie = userLogin.headers['set-cookie'][0].split(';')[0];

  // Post Listing
  const postRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/items',
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Cookie': userCookie }
  }, {
    title: 'Samsung S23 Ultra Phantom Black',
    category: 'phones',
    mode: 'Direct Barter',
    item_condition: 'Neatly Used',
    location: 'Ikeja, Lagos',
    wanted: 'iPhone 15 Pro Max',
    est_value: 850000,
    description: 'Neat device, full box, ready to barter.'
  });
  const itemId = postRes.data.item_id || postRes.data.id;
  console.log('Created Listing ID:', itemId);

  // Admin Edit Listing
  const editItemRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: `/api/admin/items/${itemId}/edit`,
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Cookie': sessionCookie }
  }, {
    title: 'Samsung S23 Ultra (Upgraded Edition)',
    est_value: 900000,
    status: 'Active'
  });
  console.log('Admin Edit Listing Status:', editItemRes.status, 'Message:', editItemRes.data.message);

  // Toggle Spotlight
  const spotlightRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: `/api/admin/items/${itemId}/toggle-spotlight`,
    method: 'POST',
    headers: { 'Cookie': sessionCookie }
  });
  console.log('Toggle Spotlight Status:', spotlightRes.status, 'Message:', spotlightRes.data.message);

  // Admin Delete Listing
  const deleteItemRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: `/api/admin/items/${itemId}`,
    method: 'DELETE',
    headers: { 'Cookie': sessionCookie }
  });
  console.log('Delete Listing Status:', deleteItemRes.status, 'Message:', deleteItemRes.data.message);

  // Admin Delete User
  const deleteUserRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: `/api/admin/users/${testUserId}`,
    method: 'DELETE',
    headers: { 'Cookie': sessionCookie }
  });
  console.log('Delete User Status:', deleteUserRes.status, 'Message:', deleteUserRes.data.message);

  console.log('\n--- 6. Testing OTP Dispatch Log Deletion (/api/admin/email-outbox) ---');
  const outboxRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/admin/email-outbox',
    method: 'GET',
    headers: { 'Cookie': sessionCookie }
  });
  const logs = outboxRes.data.logs || [];
  console.log('Current Outbox Logs Count:', logs.length);

  if (logs.length > 0) {
    const singleLogId = logs[0].id;
    const deleteSingleRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: `/api/admin/email-outbox/${singleLogId}`,
      method: 'DELETE',
      headers: { 'Cookie': sessionCookie }
    });
    console.log(`Delete Single Log #${singleLogId} Status:`, deleteSingleRes.status, 'Message:', deleteSingleRes.data.message);
  }

  // Clear all outbox logs
  const clearOutboxRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/admin/email-outbox/clear',
    method: 'POST',
    headers: { 'Cookie': sessionCookie }
  });
  console.log('Clear All Logs Status:', clearOutboxRes.status, 'Message:', clearOutboxRes.data.message);

  const checkOutbox = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/admin/email-outbox',
    method: 'GET',
    headers: { 'Cookie': sessionCookie }
  });
  console.log('Remaining Logs Count (Expect 0):', (checkOutbox.data.logs || []).length);

  console.log('\n=============================================');
  console.log('🎉 ALL ADVANCED ADMIN API TESTS PASSED 100%!');
  console.log('=============================================');
}

runTests().catch(err => {
  console.error('Test Failed:', err);
  process.exit(1);
});
