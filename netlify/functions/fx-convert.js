/**
 * FX Convert - Internal USD <-> PHP exchange
 * 
 * Uses OpenExchangeRates for live rates, falls back to fixed rate
 * All conversions are persisted in MongoDB ledger
 * 
 * USES STANDARD WALLET SCHEMA: { userId, usd, php, usdc }
 */

const { getDb } = require("./_mongoClient");
const { getWallet, setWallet } = require("./walletStore");

const OXR_API_KEY = process.env.OPENEXCHANGERATES_API_KEY || process.env.OXR_API_KEY;

// Fallback rate if no API key
const FALLBACK_PHP_RATE = 56.0;

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

// Extract userId from session or token
async function requireSession(db, event) {
  const token = event.headers['x-session-token'] || 
                event.headers['X-Session-Token'] || 
                (event.headers.authorization || '').replace('Bearer ', '');
  
  if (!token) {
    return null;
  }

  // Look up session in DB
  const session = await db.collection('sessions').findOne({ token });
  if (session) {
    return { userId: session.userId, email: session.email };
  }

  // Try to decode token (for MVP signed tokens)
  try {
    const [data] = token.split('.');
    if (data) {
      const payload = JSON.parse(Buffer.from(data, 'base64url').toString('utf8'));
      if (payload.email) {
        return { userId: payload.userId || payload.email, email: payload.email };
      }
    }
  } catch (e) {
    // Not a valid token
  }

  return null;
}

exports.handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, X-Session-Token, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const db = await getDb();
    
    // Require authenticated session
    const user = await requireSession(db, event);
    if (!user) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized' }) };
    }
    
    const { userId } = user;
    
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

    // Get wallet using standard schema
    const wallet = await getWallet(db, userId);
    
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

    // Check balance using standard field names (usd, php)
    const fromField = from.toLowerCase();
    const toField = to.toLowerCase();
    const currentBalance = wallet[fromField] || 0;

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

    // Execute conversion using standard schema
    const newFromBalance = currentBalance - amount;
    const newToBalance = (wallet[toField] || 0) + converted;
    
    const updatedWallet = await setWallet(db, userId, {
      [fromField]: newFromBalance,
      [toField]: newToBalance,
    });

    // Log transaction to transactions collection (for activity feed)
    const txn = {
      transaction_id: `fx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      type: 'fx_conversion',
      from_currency: from,
      to_currency: to,
      amount_from: amount,
      amount_to: Math.round(converted * 100) / 100,
      rate: Math.round(fxRate * 10000) / 10000,
      rate_source: rateSource,
      createdAt: new Date(),
    };
    await db.collection('transactions').insertOne(txn);

    console.log('[fx-convert] Success:', txn);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        transaction_id: txn.transaction_id,
        from_currency: from,
        to_currency: to,
        from_amount: amount,
        to_amount: txn.amount_to,
        fx_rate: txn.rate,
        rate_source: rateSource,
        new_balances: {
          usd: updatedWallet.usd || 0,
          php: updatedWallet.php || 0,
        },
      }),
    };

  } catch (error) {
    console.error('[fx-convert] Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Conversion failed', detail: error.message }),
    };
  }
};
