// netlify/functions/get-fx-quote.js

const OXR_URL =
  "https://openexchangerates.org/api/latest.json";

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

exports.handler = async (event) => {
  try {
    const key = process.env.OXR_API_KEY;
    if (!key) {
      return {
        statusCode: 500,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          error: "NO_API_KEY",
          message: "OXR_API_KEY is not set in env vars",
        }),
      };
    }

    const params = event.queryStringParameters || {};
    const amountUsd = Number(params.amount_usd || "0");
    if (!amountUsd || amountUsd <= 0) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          error: "INVALID_AMOUNT",
          message: "amount_usd must be > 0",
        }),
      };
    }

    const url =
      `${OXR_URL}?app_id=${encodeURIComponent(
        key
      )}&symbols=PHP`;

    const res = await fetch(url);
    const raw = await res.text();

    if (!res.ok) {
      let msg = `FX API error: ${res.status}`;
      try {
        const errJson = JSON.parse(raw);
        if (errJson && errJson.message) {
          msg += ` - ${errJson.message}`;
        }
        console.error("OXR error:", errJson);
      } catch {
        console.error("OXR non-JSON error:", raw);
      }
      return {
        statusCode: 500,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          error: "FX_UNAVAILABLE",
          message: msg,
        }),
      };
    }

    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      console.error("Failed to parse FX JSON:", raw);
      return {
        statusCode: 500,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          error: "FX_PARSE_ERROR",
          message: "Failed to parse FX JSON",
        }),
      };
    }

    const mid = Number(data?.rates?.PHP);
    if (!mid) {
      console.error("PHP rate missing:", data);
      return {
        statusCode: 500,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          error: "NO_PHP_RATE",
          message: "PHP rate not found in FX response",
        }),
      };
    }

    const spreadPct = computeSpreadPercent(amountUsd);
    const spreadPhpPerUsd = mid * spreadPct;
    const pbxRate = mid - spreadPhpPerUsd;

    const quote = {
      mid_market: mid,
      pbx_rate: pbxRate,
      spread_php_per_usd: spreadPhpPerUsd,
      spread_percent: spreadPct * 100,
      timestamp: data.timestamp || Math.floor(Date.now() / 1000),
    };

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(quote),
    };
  } catch (err) {
    console.error("get-fx-quote unexpected error:", err);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        error: "FX_UNAVAILABLE",
        message: "Unexpected FX error",
      }),
    };
  }
};
