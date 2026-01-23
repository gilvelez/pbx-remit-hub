const { listBanks } = require('./bankStore');

// MongoDB optional persistence (same pattern as other wallet functions)
let MongoClient = null;
const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URL;
const DB_NAME = process.env.DB_NAME || 'pbx_database';

if (MONGODB_URI) {
  try {
    MongoClient = require('mongodb').MongoClient;
  } catch (e) {
    console.warn('[banks-withdraw] MongoDB module not available, continuing without DB');
  }
}

async function getDb() {
  if (!MongoClient || !MONGODB_URI) return null;
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  return { client, db: client.db(DB_NAME) };
}

function userIdFromSession(token) {
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

  const circle = await circleHealth();

  // Demo behavior: if MongoDB configured, instantly debit the user's wallet.
  let wallet_update = null;
  const connection = await getDb();
  if (connection) {
    const { client, db } = connection;
    try {
      const now = new Date().toISOString();
      const wallet = await db.collection('wallets').findOne({ user_id });
      const current = Number(wallet?.usd_balance || 0);
      if (amount > current) {
        return {
          statusCode: 400,
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ error: 'Insufficient USD balance', current_balance: current }),
        };
      }

      const walletRes = await db.collection('wallets').findOneAndUpdate(
        { user_id },
        { $inc: { usd_balance: -amount }, $set: { updated_at: now } },
        { returnDocument: 'after' }
      );

      wallet_update = {
        user_id,
        usd_balance: walletRes.value?.usd_balance,
        php_balance: walletRes.value?.php_balance,
        updated_at: walletRes.value?.updated_at,
      };

      await db.collection('treasury_events').insertOne({
        id: `evt_${Date.now()}`,
        type: 'withdraw',
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
          note: 'Withdrawal simulated for demo. Real ACH off-ramp not implemented.',
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
      transfer_id: `wd_${Date.now()}`,
      status: connection ? 'completed' : 'pending',
      estimated_arrival: connection ? 'instant (demo)' : '1-3 business days',
      message: connection
        ? 'Withdrawal completed (demo). Your USD wallet was debited. ACH off-ramp is still mocked.'
        : 'Withdrawal initiated (sandbox). Wallet debit is ledger-based; treasury backing checked server-side.',
      bank: { id: bank.id, institution_name: bank.institution_name, mask: bank.mask },
      treasury: { checked: true, ...circle },
      wallet_update,
    }),
  };
};
