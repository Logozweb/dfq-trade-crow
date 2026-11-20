const http = require('http');
const app = require('./server/app');

const server = app.listen(5099, '127.0.0.1', async () => {
  console.log('[Test] Server listening on port 5099 for automated verification.');
  let cookie = '';

  function request(method, path, body = null, customHeaders = {}) {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: '127.0.0.1',
        port: 5099,
        path,
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(cookie ? { 'Cookie': cookie } : {}),
          ...customHeaders
        }
      };

      const req = http.request(options, (res) => {
        let data = '';
        if (res.headers['set-cookie']) {
          cookie = res.headers['set-cookie'][0].split(';')[0];
        }
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(data) });
          } catch (_) {
            resolve({ status: res.statusCode, raw: data });
          }
        });
      });

      req.on('error', reject);
      if (body) {
        req.write(typeof body === 'string' ? body : JSON.stringify(body));
      }
      req.end();
    });
  }

  try {
    // 1. Check Items List
    console.log('\n--- 1. Testing Items List ---');
    const itemsRes = await request('GET', '/api/items.php?action=list');
    console.log(`Status: ${itemsRes.status}, Items fetched: ${itemsRes.data.items.length}`);
    if (!itemsRes.data.success || itemsRes.data.items.length === 0) throw new Error('Items list failed');

    // 2. Check Serial Verification
    console.log('\n--- 2. Testing Serial / IMEI Verification ---');
    const serialRes = await request('GET', '/api/items.php?action=check_serial&serial=358492019485721');
    console.log(`Status: ${serialRes.status}, Flagged: ${serialRes.data.flagged}, Matches: ${serialRes.data.matches.length}`);
    if (!serialRes.data.success) throw new Error('Serial check failed');

    // 3. Admin Login
    console.log('\n--- 3. Testing Admin Login ---');
    const loginRes = await request('POST', '/api/auth.php?action=login', {
      email: 'demo@dfqtradecrow.com',
      password: 'password'
    });
    console.log(`Status: ${loginRes.status}, Message: ${loginRes.data.message}, Is Admin: ${loginRes.data.user.is_admin}`);
    if (!loginRes.data.success || loginRes.data.user.is_admin !== 1) throw new Error('Admin login failed');

    // 4. Check Auth Session (/api/auth/me)
    console.log('\n--- 4. Testing Auth Session Check ---');
    const meRes = await request('GET', '/api/auth.php?action=me');
    console.log(`Status: ${meRes.status}, Authenticated: ${meRes.data.authenticated}, User: ${meRes.data.user.full_name}`);
    if (!meRes.data.authenticated) throw new Error('Session check failed');

    // 5. Trader Storefront API
    console.log('\n--- 5. Testing Trader Storefront API ---');
    const traderRes = await request('GET', '/api/traders/1');
    console.log(`Status: ${traderRes.status}, Trader: ${traderRes.data.trader.full_name}, Rating: ${traderRes.data.avgRating}, Items: ${traderRes.data.items.length}`);
    if (!traderRes.data.success) throw new Error('Trader API failed');

    // 6. Pawn Ticket API
    console.log('\n--- 6. Testing Pawn Ticket API ---');
    const ticketRes = await request('GET', '/api/tickets/103');
    console.log(`Status: ${ticketRes.status}, Ticket Item: ${ticketRes.data.item.title}, Advance: ₦${ticketRes.data.item.pawn_advance}`);
    if (!ticketRes.data.success) throw new Error('Pawn ticket API failed');

    // 7. Admin Data API
    console.log('\n--- 7. Testing Admin Panel Data ---');
    const adminRes = await request('GET', '/api/admin/data');
    console.log(`Status: ${adminRes.status}, Registered Users: ${adminRes.data.stats.users}, Listings: ${adminRes.data.stats.items}`);
    if (!adminRes.data.success) throw new Error('Admin data API failed');

    // 8. User Registration with Referral Code
    console.log('\n--- 8. Testing User Registration with Referral ---');
    cookie = ''; // clear session
    const regRes = await request('POST', '/api/auth.php?action=register', {
      full_name: 'Test Trader Emeka',
      email: `emeka_${Date.now()}@dfqtrade.test`,
      phone: '08099887766',
      location: 'Ikeja, Lagos',
      password: 'mypassword123',
      ref_code: 'DFQ-MASTER'
    });
    console.log(`Status: ${regRes.status}, Message: ${regRes.data.message}, RefCode: ${regRes.data.user.referral_code}`);
    if (!regRes.data.success) throw new Error('Registration failed');

    // 9. Create New Listing
    console.log('\n--- 9. Testing Create Item Listing ---');
    const createRes = await request('POST', '/api/items.php?action=create', {
      title: 'PlayStation 5 Console (Digital Edition)',
      category: 'Electronics & Phones',
      mode: 'Cash or Swap',
      item_condition: 'Brand New',
      location: 'Ikeja, Lagos',
      wanted: 'Xbox Series X + ₦40,000 Cash',
      est_value: '580000',
      description: 'Brand new in box, sealed with warranty receipt.'
    });
    console.log(`Status: ${createRes.status}, Item Created ID: ${createRes.data.item_id}`);
    if (!createRes.data.success) throw new Error('Create item failed');
    const newItemId = createRes.data.item_id;

    // 10. Propose Trade Offer on Item #101
    console.log('\n--- 10. Testing Swap Offer Creation ---');
    const offerRes = await request('POST', '/api/offers.php?action=create', {
      item_id: 101,
      offered_item: 'PlayStation 5 + 2 DualSense Controllers',
      cash_topup: '₦100,000 cash balance',
      note: 'Can do meetup in Lekki phase 1 today.'
    });
    console.log(`Status: ${offerRes.status}, Offer Created ID: ${offerRes.data.offer_id}`);
    if (!offerRes.data.success) throw new Error('Create offer failed');

    console.log('\n=============================================');
    console.log('🎉 ALL 10 CORE TESTS PASSED WITH 100% SUCCESS!');
    console.log('=============================================');

  } catch (err) {
    console.error('\n❌ TEST FAILED:', err.message);
  } finally {
    server.close();
  }
});
