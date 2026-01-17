/**
 * PBX Recipient - FX Conversion API
 * Handles USD → PHP conversion with rate lock
 * Falls back to mock mode when MongoDB is unavailable
 */

// Safely handle MongoDB
let MongoClient = null;
const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URL;
const DB_NAME = process.env.DB_NAME || 'pbx_database';

const DB_MODE = MONGODB_URI ? 'live' : 'mock';
console.log(`[recipient-convert] DB_MODE=${DB_MODE}`);

if (MONGODB_URI) {
  try {
    MongoClient = require('mongodb').MongoClient;
  } catch (e) {
    console.warn('[recipient-convert] MongoDB module not available, using mock mode');
  }
}

// PBX spread configuration
const PBX_SPREAD_BPS = 50; // 0.50% spread
const BANK_SPREAD_BPS = 250; // Typical bank spread ~2.5%
const RATE_LOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes

// Mid-market rate (simulated - would use OpenExchangeRates in production)
const getMidMarketRate = () => {
  const baseRate = 56.25;
  const fluctuation = (Math.random() - 0.5) * 0.3;
  return baseRate + fluctuation;
};

async function getDb() {
  if (!MongoClient || !MONGODB_URI) {
    return null;
  }
  try {
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    return { client, db: client.db(DB_NAME) };
  } catch (e) {
    console.error('[recipient-convert] MongoDB connection failed:', e.message);
    return null;
  }
}

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
    const user_id = sessionToken ? sessionToken.substring(0, 36) : 'demo_user';

    if (event.httpMethod === 'GET') {
      // GET current FX quote - always works (no DB needed)
      const params = event.queryStringParameters || {};
      const amount_usd = parseFloat(params.amount_usd) || 100;

      const midRate = getMidMarketRate();
      const pbxSpread = midRate * (PBX_SPREAD_BPS / 10000);
      const pbxRate = midRate - pbxSpread;
      const bankSpread = midRate * (BANK_SPREAD_BPS / 10000);
      const bankRate = midRate - bankSpread;

      const amountPhpPbx = amount_usd * pbxRate;
      const amountPhpBank = amount_usd * bankRate;
      const savings = amountPhpPbx - amountPhpBank;

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          mid_market_rate: Math.round(midRate * 100) / 100,
          pbx_rate: Math.round(pbxRate * 100) / 100,
          pbx_spread_percent: PBX_SPREAD_BPS / 100,
          bank_rate: Math.round(bankRate * 100) / 100,
          bank_spread_percent: BANK_SPREAD_BPS / 100,
          amount_usd,
          amount_php: Math.round(amountPhpPbx * 100) / 100,
          savings_php: Math.round(savings * 100) / 100,
          lock_duration_seconds: RATE_LOCK_DURATION_MS / 1000,
          timestamp: Date.now(),
          source: 'mock', // Would be 'live' with OpenExchangeRates
        }),
      };
    }

    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}');
      const { action, amount_usd, locked_rate } = body;

      if (action === 'lock_rate') {
        const midRate = getMidMarketRate();
        const pbxSpread = midRate * (PBX_SPREAD_BPS / 10000);
        const pbxRate = locked_rate || (midRate - pbxSpread);

        const lock_id = `lock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const expires_at = new Date(Date.now() + RATE_LOCK_DURATION_MS).toISOString();

        if (DB_MODE === 'live') {
          const connection = await getDb();
          if (connection) {
            const { client, db } = connection;
            try {
              await db.collection('rate_locks').insertOne({
                lock_id,
                user_id,
                rate: pbxRate,
                amount_usd: amount_usd || 0,
                expires_at,
                created_at: new Date().toISOString(),
                status: 'active',
              });
            } finally {
              await client.close();
            }
          }
        }

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            lock_id,
            rate: Math.round(pbxRate * 100) / 100,
            expires_at,
            expires_in_seconds: RATE_LOCK_DURATION_MS / 1000,
            _mode: DB_MODE,
          }),
        };
      }

      if (action === 'convert') {
        const { lock_id } = body;

        if (!amount_usd || amount_usd <= 0) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Invalid amount' }),
          };
        }

        const midRate = getMidMarketRate();
        const pbxSpread = midRate * (PBX_SPREAD_BPS / 10000);
        const rate = locked_rate || (midRate - pbxSpread);
        const amount_php = amount_usd * rate;

        const transaction_id = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        if (DB_MODE === 'live') {
          const connection = await getDb();
          if (connection) {
            const { client, db } = connection;
            try {
              // Record ledger entry
              await db.collection('ledger').insertOne({
                txn_id: transaction_id,
                user_id,
                type: 'fx_conversion',
                category: 'FX Conversion',
                description: `USD → PHP @ ${Math.round(rate * 100) / 100}`,
                currency: 'PHP',
                amount: Math.round(amount_php * 100) / 100,
                metadata: {
                  from_currency: 'USD',
                  from_amount: amount_usd,
                  rate: Math.round(rate * 100) / 100,
                  fx_source: 'mock',
                  lock_id: lock_id || null,
                },
                status: 'completed',
                created_at: new Date().toISOString(),
              });

              // Update wallet balances
              await db.collection('wallets').updateOne(
                { user_id },
                {
                  $inc: {
                    usd_balance: -amount_usd,
                    php_balance: Math.round(amount_php * 100) / 100,
                  },
                  $set: { updated_at: new Date().toISOString() },
                },
                { upsert: true }
              );

              // Mark rate lock as used
              if (lock_id) {
                await db.collection('rate_locks').updateOne(
                  { lock_id },
                  { $set: { status: 'used', used_at: new Date().toISOString() } }
                );
              }
            } finally {
              await client.close();
            }
          }
        }

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            transaction_id,
            from_amount: amount_usd,
            from_currency: 'USD',
            to_amount: Math.round(amount_php * 100) / 100,
            to_currency: 'PHP',
            rate: Math.round(rate * 100) / 100,
            fx_source: 'mock',
            status: 'completed',
            _mode: DB_MODE,
          }),
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
    console.error('[recipient-convert] Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};
