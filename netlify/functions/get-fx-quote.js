/**
 * FX Quote - Get exchange rate quote for USD <-> PHP
 */

const OXR_API_KEY = process.env.OPENEXCHANGERATES_API_KEY || process.env.OXR_API_KEY;
const FALLBACK_PHP_RATE = 56.0;

async function getFxRate() {
  if (OXR_API_KEY) {
    try {
      const resp = await fetch(`https://openexchangerates.org/api/latest.json?app_id=${OXR_API_KEY}&symbols=PHP`);
      const data = await resp.json();
      if (data.rates?.PHP) {
        return { rate: data.rates.PHP, source: 'openexchangerates' };
      }
    } catch (e) {
      console.warn('[fx-quote] Failed to fetch live rate:', e.message);
    }
  }
  return { rate: FALLBACK_PHP_RATE, source: 'fallback' };
}

exports.handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, X-Session-Token, Authorization',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const params = event.queryStringParameters || {};
    const amount = parseFloat(params.amount) || 100;
    const from = (params.from || 'USD').toUpperCase();
    const to = (params.to || 'PHP').toUpperCase();

    if (!['USD', 'PHP'].includes(from) || !['USD', 'PHP'].includes(to)) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid currency. Use USD or PHP' }) };
    }

    const { rate: phpRate, source } = await getFxRate();
    
    let fxRate, converted;
    if (from === 'USD' && to === 'PHP') {
      fxRate = phpRate;
      converted = amount * fxRate;
    } else if (from === 'PHP' && to === 'USD') {
      fxRate = 1 / phpRate;
      converted = amount * fxRate;
    } else {
      fxRate = 1;
      converted = amount;
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        from,
        to,
        amount,
        converted: Math.round(converted * 100) / 100,
        rate: Math.round(fxRate * 10000) / 10000,
        source,
        expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 min expiry
      }),
    };

  } catch (error) {
    console.error('[fx-quote] Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Quote failed', detail: error.message }),
    };
  }
};
