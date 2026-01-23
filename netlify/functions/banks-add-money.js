const { listBanks } = require('./bankStore');

// MongoDB is optional. If configured, we persist wallet + treasury state.
let MongoClient = null;
const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URL;
const DB_NAME = process.env.DB_NAME || 'pbx_database';

if (MONGODB_URI) {
  try {
    MongoClient = require('mongodb').MongoClient;
  } catch (e) {
    console.warn('[banks-add-money] MongoDB module not available, continuing without DB');
  }
}

async function getDb() {
  if (!MongoClient || !MONGODB_URI) return null;
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  return { client, db: client.db(DB_NAME) };
}

function userIdFromSession(token) {
  // Keep consistent with other functions: first 36 chars look like UUID
  return token ? String(token).substring(0, 36) : 'demo_user';
}

async function circleHealth() {
  const useMocks = (process.env.CIRCLE_USE_MOCKS || '').toLowerCase() === 'true';
  const hasKey = !!(process.env.CIRCLE_API_KEY || '').trim();
  const hasTreasury = !!(process.env.CIRCLE_TREASURY_WALLET_ID || process.env.CIRCLE_MERCHANT_WALLET_ID);
  return { useMocks, hasKey, hasTreasury };
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: { 'content-type': 'application/json' }, body: JSON.stringify({ error: 'Method not allowed' }) };
  }
  const token = event.headers['x-session-token'] || '';
  const user_id = userIdFromSession(token);
  let body = {};
  try { body = JSON.parse(event.body || '{}'); } catch (_) {}
  const amount = Number(body.amount);
  const bank_id = body.bank_id;

  if (!amount || amount <= 0) {
    return { statusCode: 400, headers: { 'content-type': 'application/json' }, body: JSON.stringify({ error: 'amount must be > 0' }) };
  }
  if (!bank_id) {
    return { statusCode: 400, headers: { 'content-type': 'application/json' }, body: JSON.stringify({ error: 'bank_id required' }) };
  }

  const banks = listBanks(token);
  const bank = banks.find(b => b.id === bank_id);
  if (!bank) {
    return { statusCode: 404, headers: { 'content-type': 'application/json' }, body: JSON.stringify({ error: 'bank not found' }) };
  }

  // Treasury-backed model: UI shows USD wallet only; backend checks Circle treasury readiness (sandbox)
  const circle = await circleHealth();

  // Demo behavior: if MongoDB is configured, instantly credit the user's USD wallet.
  // This makes the UX work end-to-end while ACH/Transfers are still mocked.
  let wallet_update = null;
  let treasury_update = null;
  const connection = await getDb();
  if (connection) {
    const { client, db } = connection;
    try {
      const now = new Date().toISOString();
      // 1) Credit user's wallet balance
      const walletRes = await db.collection('wallets').findOneAndUpdate(
        { user_id },
        {
          $inc: { usd_balance: amount },
          $setOnInsert: { user_id, php_balance: 0, created_at: now },
          $set: { updated_at: now },
        },
        { upsert: true, returnDocument: 'after' }
      );
      wallet_update = {
        user_id,
        usd_balance: walletRes.value?.usd_balance,
        php_balance: walletRes.value?.php_balance,
        updated_at: walletRes.value?.updated_at,
      };

      // 2) Record treasury backing (USDC) internally (NOT shown in UI)
      const treasuryWalletId = process.env.CIRCLE_TREASURY_WALLET_ID || process.env.CIRCLE_MERCHANT_WALLET_ID || 'treasury_unknown';
      const treasuryRes = await db.collection('treasury_state').findOneAndUpdate(
        { id: 'pbx_treasury', wallet_id: treasuryWalletId },
        {
          $inc: { usdc_backing: amount },
          $setOnInsert: { id: 'pbx_treasury', wallet_id: treasuryWalletId, created_at: now },
          $set: { updated_at: now },
        },
        { upsert: true, returnDocument: 'after' }
      );
      treasury_update = {
        id: treasuryRes.value?.id,
        wallet_id: treasuryRes.value?.wallet_id,
        usdc_backing: treasuryRes.value?.usdc_backing,
        updated_at: treasuryRes.value?.updated_at,
      };

      // 3) Event log (helps debugging / audit later)
      await db.collection('treasury_events').insertOne({
        id: `evt_${Date.now()}`,
        type: 'add_money',
        user_id,
        amount,
        currency: 'USD',
        bank_id,
        bank_name: bank.institution_name,
        created_at: now,
        circle: {
          sandbox: true,
          use_mocks: circle.useMocks,
          has_key: circle.hasKey,
          has_treasury: circle.hasTreasury,
          note: 'USDC backing simulated for demo. Do not treat as on-chain truth.',
        },
      });
    } finally {
      await client.close();
    }
  }

  return {
    statusCode: 200,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      success: true,
      transfer_id: `fund_${Date.now()}`,
      // For demo we credit instantly if DB is present; otherwise keep pending.
      status: connection ? 'completed' : 'pending',
      estimated_arrival: connection ? 'instant (demo)' : '1-3 business days',
      message: connection
        ? 'Funding completed (demo). Your USD wallet was credited; USDC backing recorded internally in treasury.'
        : 'Funding initiated (sandbox). Wallet credit is ledger-based; treasury backing checked server-side.',
      bank: { id: bank.id, institution_name: bank.institution_name, mask: bank.mask },
      treasury: { checked: true, ...circle },
      wallet_update,
      treasury_update,
    }),
  };
};
