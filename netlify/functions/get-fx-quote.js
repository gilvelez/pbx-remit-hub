// netlify/functions/get-fx-quote.js

const OXR_URL =
  "https://openexchangerates.org/api/latest.json";

// Free fallback API (no key required for dev)
const FREE_FX_URL = "https://api.exchangerate.host/latest?base=USD&symbols=PHP";

// Simple dynamic spread: 0.75% base, 0.95% small, 0.55% large
const computeSpreadPercent = (amountUsd) => {
  let pct = 0.0075; // 0.75%
  const amt = Number(amountUsd) || 0;

  if (amt < 100) {
    pct += 0.002; // +0.20%
  } else if (amt > 1000) {
    pct -= 0.002; // -0.20%
  }

  if (pct < 0.004) pct = 0.004;   // min 0.40%
  if (pct > 0.015) pct = 0.015;   // max 1.50%
  return pct;
};

// Dev fallback rate
const DEV_FALLBACK_RATE = 56.25;

exports.handler = async (event) => {
  try {
    const params = event.queryStringParameters || {};
    const amountUsd = Number(params.amount_usd || "100");
    
    if (amountUsd <= 0) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          error: "INVALID_AMOUNT",
          message: "amount_usd must be > 0",
        }),
      };
    }

    const key = process.env.OXR_API_KEY;
    let mid = null;
    let source = "dev";
    
    // Try OpenExchangeRates first if key exists
    if (key) {
      try {
        const url = `${OXR_URL}?app_id=${encodeURIComponent(key)}&symbols=PHP`;
        const res = await fetch(url);
        
        if (res.ok) {
          const data = await res.json();
          mid = Number(data?.rates?.PHP);
          source = "openexchangerates";
        }
      } catch (err) {
        console.warn("OXR fetch failed:", err.message);
      }
    }
    
    // Fallback to free API
    if (!mid) {
      try {
        const res = await fetch(FREE_FX_URL);
        if (res.ok) {
          const data = await res.json();
          mid = Number(data?.rates?.PHP);
          source = "exchangerate.host";
        }
      } catch (err) {
        console.warn("Free FX API failed:", err.message);
      }
    }
    
    // Final fallback to dev rate
    if (!mid) {
      mid = DEV_FALLBACK_RATE + (Math.random() - 0.5) * 0.5;
      source = "dev";
    }

    const spreadPct = computeSpreadPercent(amountUsd);
    const spreadPhpPerUsd = mid * spreadPct;
    const pbxRate = mid - spreadPhpPerUsd;
    const amountPhp = amountUsd * pbxRate;

    const quote = {
      rate: Math.round(pbxRate * 100) / 100,
      mid_market: Math.round(mid * 100) / 100,
      amount_usd: amountUsd,
      amount_php: Math.round(amountPhp * 100) / 100,
      spread_percent: Math.round(spreadPct * 10000) / 100,
      source: source,
      timestamp: Math.floor(Date.now() / 1000),
    };

    return {
      statusCode: 200,
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify(quote),
    };
  } catch (err) {
    console.error("get-fx-quote unexpected error:", err);
    
    // Always return something usable
    const fallbackRate = DEV_FALLBACK_RATE + (Math.random() - 0.5) * 0.5;
    const amountUsd = Number(event.queryStringParameters?.amount_usd || 100);
    
    return {
      statusCode: 200,
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        rate: Math.round(fallbackRate * 100) / 100,
        amount_usd: amountUsd,
        amount_php: Math.round(amountUsd * fallbackRate * 100) / 100,
        source: "dev",
        timestamp: Math.floor(Date.now() / 1000),
      }),
    };
  }
};
