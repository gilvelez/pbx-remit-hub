/**
 * FX Convert - Internal USD <-> PHP exchange
 * 
 * Uses OpenExchangeRates for live rates, falls back to fixed rate
 * All conversions are persisted in MongoDB ledger
 */

let MongoClient = null;
const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URL;
const DB_NAME = process.env.DB_NAME || 'pbx_database';
const OXR_API_KEY = process.env.OPENEXCHANGERATES_API_KEY || process.env.OXR_API_KEY;

// Fallback rate if no API key
const FALLBACK_PHP_RATE = 56.0;

if (MONGODB_URI) {
  try {
    MongoClient = require('mongodb').MongoClient;
  } catch (e) {
    console.warn('[fx-convert] MongoDB not available');
  }
}

async function getDb() {
  if (!MongoClient || !MONGODB_URI) return null;
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  return { client, db: client.db(DB_NAME) };
}

function getUserId(token) {
  if (!token) return 'anonymous';
  if (token.includes('@')) return token.toLowerCase().trim();
  return token.substring(0, 36);
}

async function getFxRate() {
  // Try to get live rate using built-in fetch (Node 18+)
  if (OXR_API_KEY) {
    try {
      const resp = await fetch(`https://openexchangerates.org/api/latest.json?app_id=${OXR_API_KEY}&symbols=PHP`);
      const data = await resp.json();
      if (data.rates?.PHP) {
        return { rate: data.rates.PHP, source: 'openexchangerates' };
      }
    } catch (e) {
      console.warn('[fx-convert] Failed to fetch live rate:', e.message);
    }
  }
  return { rate: FALLBACK_PHP_RATE, source: 'fallback' };
}

exports.handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, X-Session-Token',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const token = event.headers['x-session-token'] || '';
    const user_id = getUserId(token);
    
    const body = JSON.parse(event.body || '{}');
    const { from, to, amount } = body;

    // Validate inputs
    if (!amount || amount <= 0) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid amount' }) };
    }

    if (!['USD', 'PHP'].includes(from) || !['USD', 'PHP'].includes(to)) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid currency. Use USD or PHP' }) };
    }

    if (from === to) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Cannot convert same currency' }) };
    }

    const connection = await getDb();
    if (!connection) {
      return { statusCode: 503, headers, body: JSON.stringify({ error: 'Database not available' }) };
    }

    const { client, db } = connection;

    try {
      // Get FX rate
      const { rate: phpRate, source: rateSource } = await getFxRate();
      
      // Calculate conversion
      let fxRate, converted;
      if (from === 'USD' && to === 'PHP') {
        fxRate = phpRate;
        converted = amount * fxRate;
      } else {
        fxRate = 1 / phpRate;
        converted = amount * fxRate;
      }

      // Check balance
      const wallet = await db.collection('wallets').findOne({ user_id });
      const fromField = from === 'USD' ? 'usd_balance' : 'php_balance';
      const toField = to === 'USD' ? 'usd_balance' : 'php_balance';
      const currentBalance = wallet?.[fromField] || 0;

      if (currentBalance < amount) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ 
            error: 'Insufficient balance',
            available: currentBalance,
            required: amount,
          }),
        };
      }

      // Execute conversion
      const result = await db.collection('wallets').findOneAndUpdate(
        { user_id },
        {
          $inc: {
            [fromField]: -amount,
            [toField]: converted,
          },
          $set: { updated_at: new Date().toISOString() },
        },
        { returnDocument: 'after' }
      );

      // Log transaction
      const txn = {
        id: `fx_${Date.now()}`,
        user_id,
        type: 'fx_convert',
        from_currency: from,
        to_currency: to,
        from_amount: amount,
        to_amount: converted,
        fx_rate: fxRate,
        rate_source: rateSource,
        created_at: new Date().toISOString(),
      };
      await db.collection('wallet_transactions').insertOne(txn);

      console.log('[fx-convert] Success:', txn);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          transaction_id: txn.id,
          from_currency: from,
          to_currency: to,
          from_amount: amount,
          to_amount: Math.round(converted * 100) / 100,
          fx_rate: Math.round(fxRate * 10000) / 10000,
          rate_source: rateSource,
          new_balances: {
            usd: result.value?.usd_balance || 0,
            php: result.value?.php_balance || 0,
          },
        }),
      };

    } finally {
      await client.close();
    }

  } catch (error) {
    console.error('[fx-convert] Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Conversion failed', detail: error.message }),
    };
  }
};
