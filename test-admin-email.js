const assert = require('assert');

async function runTests() {
  const baseUrl = 'http://localhost:5000';
  let cookie = '';

  console.log('--- 1. Testing Admin Dedicated Login (/api/admin/login) ---');
  // 1a. Test non-admin login rejection
  const regRes = await fetch(`${baseUrl}/api/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'nonexistent_admin@dfq.test', password: 'wrong' })
  });
  const regJson = await regRes.json();
  console.log('Rejection Status:', regRes.status, 'Message:', regJson.message);
  assert.strictEqual(regRes.status, 401);

  // 1b. Test genuine admin login
  const adminRes = await fetch(`${baseUrl}/api/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'demo@dfqtradecrow.com', password: 'password' })
  });
  const adminJson = await adminRes.json();
  const adminUser = adminJson.user || (adminJson.data && adminJson.data.user);
  console.log('Admin Login Status:', adminRes.status, 'Is Admin:', adminUser.is_admin);
  assert.strictEqual(adminRes.status, 200);
  assert.strictEqual(adminUser.is_admin, 1);

  const rawCookie = adminRes.headers.get('set-cookie');
  if (rawCookie) cookie = rawCookie.split(';')[0];

  console.log('\n--- 2. Testing Get Email Dispatcher Settings (/api/admin/email-settings) ---');
  const getSettingsRes = await fetch(`${baseUrl}/api/admin/email-settings`, {
    headers: { Cookie: cookie }
  });
  const getSettingsJson = await getSettingsRes.json();
  const settings = getSettingsJson.settings || (getSettingsJson.data && getSettingsJson.data.settings);
  console.log('Get Settings Status:', getSettingsRes.status, 'Provider:', settings.provider);
  assert.strictEqual(getSettingsRes.status, 200);

  console.log('\n--- 3. Testing Save Email Dispatcher Settings ---');
  const saveRes = await fetch(`${baseUrl}/api/admin/email-settings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({
      provider: 'smtp',
      smtp: {
        host: 'smtp.gmail.com',
        port: '587',
        secure: false,
        user: 'security@dfqtradecrow.com',
        pass: 'app_pwd_secret_123',
        senderName: 'DFQ Security Dispatcher'
      },
      senderName: 'DFQ Security Dispatcher',
      senderEmail: 'security@dfqtradecrow.com',
      subjectLine: 'DFQ Trade Crow Security - One Time Code'
    })
  });
  const saveJson = await saveRes.json();
  const savedSettings = saveJson.settings || (saveJson.data && saveJson.data.settings);
  console.log('Save Status:', saveRes.status, 'Saved User:', savedSettings.smtp.user);
  assert.strictEqual(saveRes.status, 200);
  assert.strictEqual(savedSettings.smtp.user, 'security@dfqtradecrow.com');

  console.log('\n--- 4. Testing Outbox Activity Logs (/api/admin/email-outbox) ---');
  const outboxRes = await fetch(`${baseUrl}/api/admin/email-outbox`, {
    headers: { Cookie: cookie }
  });
  const outboxJson = await outboxRes.json();
  const logs = outboxJson.logs || (outboxJson.data && outboxJson.data.logs);
  console.log('Outbox Status:', outboxRes.status, 'Logs Count:', logs.length);
  assert.strictEqual(outboxRes.status, 200);
  assert.ok(Array.isArray(logs));

  console.log('\n=============================================');
  console.log('🎉 ALL ADMIN & EMAIL DISPATCHER TESTS PASSED!');
  console.log('=============================================');
}

runTests().catch(err => {
  console.error('Test Failed:', err);
  process.exit(1);
});
