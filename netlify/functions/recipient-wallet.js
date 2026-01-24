/**
 * PBX Wallet API
 * 
 * Manages USD and PHP wallet balances
 * Uses MongoDB for persistence - NO hardcoded demo balances
 * 
 * Circle Integration:
 * - If CIRCLE_USE_MOCKS=true: Uses MongoDB ledger
 * - If false: Reads from Circle sandbox (future)
 * 
 * IMPORTANT: New users start with $0 balance
 */

let MongoClient = null;
const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URL;
const DB_NAME = process.env.DB_NAME || 'pbx_database';
const CIRCLE_USE_MOCKS = (process.env.CIRCLE_USE_MOCKS || 'true').toLowerCase() === 'true';

if (MONGODB_URI) {
  try {
    MongoClient = require('mongodb').MongoClient;
  } catch (e) {
    console.warn('[wallet] MongoDB module not available');
  }
}

async function getDb() {
  if (!MongoClient || !MONGODB_URI) return null;
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  return { client, db: client.db(DB_NAME) };
}

// Extract user_id from token - must match bankStore logic
function getUserId(token) {
  if (!token) return 'anonymous';
  if (token.includes('@')) return token.toLowerCase().trim();
  return token.substring(0, 36);
}

// Default wallet for NEW users - starts at $0
const INITIAL_WALLET = {
  usd_balance: 0,
  php_balance: 0,
  usdc_balance: 0,
  sub_wallets: {
    bills: 0,
    savings: 0,
    family: 0,
  },
};

exports.handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, X-Session-Token',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const sessionToken = event.headers['x-session-token'] || event.headers['X-Session-Token'];
    const user_id = getUserId(sessionToken);

    console.log('[wallet] Request:', event.httpMethod, 'user:', user_id);

    // GET - Fetch wallet balances
    if (event.httpMethod === 'GET') {
      const connection = await getDb();
      
      if (!connection) {
        // No MongoDB - return zeros with warning
        console.warn('[wallet] No MongoDB connection - returning empty wallet');
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            user_id,
            ...INITIAL_WALLET,
            updated_at: new Date().toISOString(),
            _mode: 'no_db',
            _warning: 'Database not connected - balances will not persist',
          }),
        };
      }

      const { client, db } = connection;
      try {
        // Find or create wallet for this user
        let wallet = await db.collection('wallets').findOne({ user_id });
        
        if (!wallet) {
          // New user - create wallet with $0
          wallet = {
            user_id,
            ...INITIAL_WALLET,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          await db.collection('wallets').insertOne(wallet);
          console.log('[wallet] Created new wallet for user:', user_id);
        }

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            user_id: wallet.user_id,
            usd_balance: wallet.usd_balance || 0,
            php_balance: wallet.php_balance || 0,
            usdc_balance: wallet.usdc_balance || 0,
            sub_wallets: wallet.sub_wallets || INITIAL_WALLET.sub_wallets,
            updated_at: wallet.updated_at,
            _mode: CIRCLE_USE_MOCKS ? 'mock_ledger' : 'circle',
          }),
        };
      } finally {
        await client.close();
      }
    }

    // POST - Wallet actions
    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}');
      const { action } = body;

      const connection = await getDb();
      if (!connection) {
        return {
          statusCode: 503,
          headers,
          body: JSON.stringify({ error: 'Database not available' }),
        };
      }

      const { client, db } = connection;

      try {
        // FUND action - Add money to wallet
        if (action === 'fund' || action === 'mock_credit' || action === 'mint_usdc') {
          const { amount, currency = 'USD' } = body;
          
          if (!amount || amount <= 0) {
            return {
              statusCode: 400,
              headers,
              body: JSON.stringify({ error: 'Invalid amount' }),
            };
          }

          if (amount > 10000) {
            return {
              statusCode: 400,
              headers,
              body: JSON.stringify({ error: 'Maximum $10,000 per transaction' }),
            };
          }

          const field = currency.toUpperCase() === 'PHP' ? 'php_balance' : 'usd_balance';
          
          const result = await db.collection('wallets').findOneAndUpdate(
            { user_id },
            {
              $inc: { [field]: amount },
              $set: { updated_at: new Date().toISOString() },
              $setOnInsert: { 
                user_id, 
                created_at: new Date().toISOString(),
                usd_balance: 0,
                php_balance: 0,
              },
            },
            { upsert: true, returnDocument: 'after' }
          );

          // Log the transaction
          await db.collection('wallet_transactions').insertOne({
            user_id,
            type: action,
            amount,
            currency,
            balance_after: result.value?.[field] || amount,
            created_at: new Date().toISOString(),
          });

          console.log('[wallet] Funded:', { user_id, amount, currency, new_balance: result.value?.[field] });

          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
              success: true,
              transaction_id: `txn_${Date.now()}`,
              amount,
              currency,
              new_balance: result.value?.[field] || amount,
              message: `Added ${currency === 'PHP' ? '₱' : '$'}${amount} to wallet`,
            }),
          };
        }

        // CONVERT action - USD to PHP or vice versa
        if (action === 'convert') {
          const { from, to, amount } = body;
          
          if (!amount || amount <= 0) {
            return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid amount' }) };
          }

          if (!['USD', 'PHP'].includes(from) || !['USD', 'PHP'].includes(to) || from === to) {
            return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid currency pair' }) };
          }

          // Get current wallet
          const wallet = await db.collection('wallets').findOne({ user_id });
          const fromBalance = from === 'USD' ? (wallet?.usd_balance || 0) : (wallet?.php_balance || 0);

          if (fromBalance < amount) {
            return {
              statusCode: 400,
              headers,
              body: JSON.stringify({ error: 'Insufficient balance', available: fromBalance }),
            };
          }

          // Use FX rate (hardcoded for MVP, later fetch from API)
          const fxRate = from === 'USD' ? 56.0 : (1 / 56.0);
          const converted = amount * fxRate;

          const fromField = from === 'USD' ? 'usd_balance' : 'php_balance';
          const toField = to === 'USD' ? 'usd_balance' : 'php_balance';

          await db.collection('wallets').updateOne(
            { user_id },
            {
              $inc: { 
                [fromField]: -amount,
                [toField]: converted,
              },
              $set: { updated_at: new Date().toISOString() },
            }
          );

          // Log conversion
          await db.collection('wallet_transactions').insertOne({
            user_id,
            type: 'convert',
            from_currency: from,
            to_currency: to,
            from_amount: amount,
            to_amount: converted,
            fx_rate: fxRate,
            created_at: new Date().toISOString(),
          });

          console.log('[wallet] Converted:', { user_id, from, to, amount, converted, fxRate });

          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
              success: true,
              from_amount: amount,
              from_currency: from,
              to_amount: converted,
              to_currency: to,
              fx_rate: fxRate,
            }),
          };
        }

        // ALLOCATE sub-wallet
        if (action === 'allocate_sub_wallet') {
          const { sub_wallet, amount } = body;
          
          if (!['bills', 'savings', 'family'].includes(sub_wallet)) {
            return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid sub-wallet' }) };
          }

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
            body: JSON.stringify({ success: true, message: `Allocated to ${sub_wallet}` }),
          };
        }

        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Invalid action' }),
        };

      } finally {
        await client.close();
      }
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };

  } catch (error) {
    console.error('[wallet] Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error', detail: error.message }),
    };
  }
};
