/**
 * PBX Recipient - Wallet API
 * Manages USD (USDC) and PHP balances
 * Uses MongoDB for persistence when available, falls back to mock mode
 */

// Safely handle MongoDB - only import if we have a connection string
let MongoClient = null;
const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URL;
const DB_NAME = process.env.DB_NAME || 'pbx_database';

// Determine DB mode based on environment
const DB_MODE = MONGODB_URI ? 'live' : 'mock';

// Log mode at function cold start
console.log(`[recipient-wallet] DB_MODE=${DB_MODE}`);

// Only require MongoDB if we have a connection URI
if (MONGODB_URI) {
  try {
    MongoClient = require('mongodb').MongoClient;
  } catch (e) {
    console.warn('[recipient-wallet] MongoDB module not available, using mock mode');
  }
}

// Default wallet for demo/mock mode
const DEFAULT_WALLET = {
  usd_balance: 1500.00,
  php_balance: 25000.00,
  sub_wallets: {
    bills: 5000.00,
    savings: 10000.00,
    family: 2500.00,
  },
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

async function getDb() {
  if (!MongoClient || !MONGODB_URI) {
    return null;
  }
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  return { client, db: client.db(DB_NAME) };
}

exports.handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, X-Session-Token',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  };

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const sessionToken = event.headers['x-session-token'] || event.headers['X-Session-Token'];
    const user_id = sessionToken ? sessionToken.substring(0, 36) : 'demo_user';

    if (event.httpMethod === 'GET') {
      // If no MongoDB connection, return mock data
      if (DB_MODE === 'mock') {
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            user_id,
            usd_balance: DEFAULT_WALLET.usd_balance,
            php_balance: DEFAULT_WALLET.php_balance,
            sub_wallets: DEFAULT_WALLET.sub_wallets,
            updated_at: new Date().toISOString(),
            _mode: 'mock',
          }),
        };
      }

      // Real MongoDB query
      const connection = await getDb();
      if (!connection) {
        // Fallback to mock if connection fails
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            user_id,
            usd_balance: DEFAULT_WALLET.usd_balance,
            php_balance: DEFAULT_WALLET.php_balance,
            sub_wallets: DEFAULT_WALLET.sub_wallets,
            updated_at: new Date().toISOString(),
            _mode: 'mock',
          }),
        };
      }

      const { client, db } = connection;
      try {
        let wallet = await db.collection('wallets').findOne({ user_id });
        
        if (!wallet) {
          wallet = { user_id, ...DEFAULT_WALLET };
          await db.collection('wallets').insertOne(wallet);
        }

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            user_id: wallet.user_id,
            usd_balance: wallet.usd_balance,
            php_balance: wallet.php_balance,
            sub_wallets: wallet.sub_wallets || DEFAULT_WALLET.sub_wallets,
            updated_at: wallet.updated_at,
            _mode: 'live',
          }),
        };
      } finally {
        await client.close();
      }
    }

    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}');
      const { action } = body;

      if (action === 'allocate_sub_wallet') {
        const { sub_wallet, amount } = body;
        
        if (!['bills', 'savings', 'family'].includes(sub_wallet)) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Invalid sub-wallet' }),
          };
        }

        // Mock mode response
        if (DB_MODE === 'mock') {
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
              success: true,
              message: `Allocated ₱${amount} to ${sub_wallet}`,
              sub_wallets: {
                ...DEFAULT_WALLET.sub_wallets,
                [sub_wallet]: DEFAULT_WALLET.sub_wallets[sub_wallet] + amount,
              },
              _mode: 'mock',
            }),
          };
        }

        // Real MongoDB update
        const connection = await getDb();
        if (!connection) {
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
              success: true,
              message: `Allocated ₱${amount} to ${sub_wallet} (mock)`,
              _mode: 'mock',
            }),
          };
        }

        const { client, db } = connection;
        try {
          await db.collection('wallets').updateOne(
            { user_id },
            {
              $inc: { [`sub_wallets.${sub_wallet}`]: amount },
              $set: { updated_at: new Date().toISOString() },
            }
          );
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ success: true, message: 'Sub-wallet updated', _mode: 'live' }),
          };
        } finally {
          await client.close();
        }
      }

      // Fund wallet simulation
      if (action === 'fund') {
        const { amount } = body;
        
        if (!amount || amount <= 0 || amount > 5000) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Invalid amount (max $5,000)' }),
          };
        }

        if (DB_MODE === 'mock') {
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
              success: true,
              transaction_id: `fund_${Date.now()}`,
              amount,
              new_balance: DEFAULT_WALLET.usd_balance + amount,
              is_simulation: true,
              message: 'Test funding completed (simulation only)',
              _mode: 'mock',
            }),
          };
        }

        const connection = await getDb();
        if (!connection) {
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
              success: true,
              transaction_id: `fund_${Date.now()}`,
              amount,
              is_simulation: true,
              message: 'Test funding completed (mock mode)',
              _mode: 'mock',
            }),
          };
        }

        const { client, db } = connection;
        try {
          const result = await db.collection('wallets').findOneAndUpdate(
            { user_id },
            {
              $inc: { usd_balance: amount },
              $set: { updated_at: new Date().toISOString() },
            },
            { returnDocument: 'after', upsert: true }
          );

          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
              success: true,
              transaction_id: `fund_${Date.now()}`,
              amount,
              new_balance: result.value?.usd_balance || amount,
              is_simulation: true,
              message: 'Test funding completed',
              _mode: 'live',
            }),
          };
        } finally {
          await client.close();
        }
      }

      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid action' }),
      };
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };

  } catch (error) {
    console.error('[recipient-wallet] Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};
