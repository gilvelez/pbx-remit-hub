/**
 * PBX Recipient - Wallet API
 * Manages USD (USDC) and PHP balances
 * Uses MongoDB for persistence
 */

const { MongoClient, ObjectId } = require('mongodb');

const MONGO_URI = process.env.MONGO_URL || process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.DB_NAME || 'pbx_database';

// Mock mode toggle
const USE_MOCKS = process.env.USE_MOCKS !== 'false';

// Default wallet for new users
const DEFAULT_WALLET = {
  usd_balance: 1500.00,  // Demo balance
  php_balance: 25000.00, // Demo balance
  sub_wallets: {
    bills: 5000.00,
    savings: 10000.00,
    family: 2500.00,
  },
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

async function getDb() {
  const client = new MongoClient(MONGO_URI);
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
    
    // For demo, derive user_id from session token or use default
    const user_id = sessionToken ? sessionToken.substring(0, 36) : 'demo_user';

    if (event.httpMethod === 'GET') {
      // GET wallet balances
      if (USE_MOCKS) {
        // Return mock wallet
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            user_id,
            usd_balance: DEFAULT_WALLET.usd_balance,
            php_balance: DEFAULT_WALLET.php_balance,
            sub_wallets: DEFAULT_WALLET.sub_wallets,
            updated_at: new Date().toISOString(),
          }),
        };
      }

      // Real MongoDB query
      const { client, db } = await getDb();
      try {
        let wallet = await db.collection('wallets').findOne({ user_id });
        
        if (!wallet) {
          // Create default wallet for new user
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
        // Move funds between PHP wallet and sub-wallets
        const { sub_wallet, amount } = body;
        
        if (!['bills', 'savings', 'family'].includes(sub_wallet)) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Invalid sub-wallet' }),
          };
        }

        if (USE_MOCKS) {
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
            }),
          };
        }

        // Real MongoDB update would go here
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ success: true, message: 'Sub-wallet updated' }),
        };
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
    console.error('Wallet API error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};
