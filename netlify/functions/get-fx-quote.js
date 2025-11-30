// netlify/functions/get-fx-quote.js

const OXR_URL = "https://openexchangerates.org/api/latest.json";
const FX_TTL_MS = 60_000; // 60 seconds cache

let cache = {
  mid: null,
  ts: 0,
};

class FXError extends Error {}

const fetchMidMarket = async () => {
  const key = process.env.OXR_API_KEY;
  if (!key) {
    throw new FXError("OXR_API_KEY is not set");
  }

  const url = new URL(OXR_URL);
  url.searchParams.set("app_id", key);
  // Free plan: don't set base=, just limit to PHP
  url.searchParams.set("symbols", "PHP");

  const res = await fetch(url.toString());
  const raw = await res.text();

  if (!res.ok) {
    let msg = `FX API error: ${res.status}`;
    try {
      const errJson = JSON.parse(raw);
      console.error("OXR error:", errJson);
      if (errJson && errJson.message) {
        msg += ` - ${errJson.message}`;
      }
    } catch {
      console.error("OXR non-JSON error:", raw);
    }
    throw new FXError(msg);
  }

  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    console.error("Failed to parse FX JSON:", raw);
    throw new FXError("Failed to parse FX JSON");
  }

  const rate = data?.rates?.PHP;
  if (!rate) {
    console.error("PHP rate missing in FX response:", data);
    throw new FXError("PHP rate not found in FX response");
  }

  return Number(rate);
};

const getMidMarket = async () => {
  const now = Date.now();
  if (!cache.mid || now - cache.ts > FX_TTL_MS) {
    const mid = await fetchMidMarket();
    cache.mid = mid;
    cache.ts = now;
  }
  return { mid: cache.mid, ts: cache.ts };
};

const computeSpread = (mid, amountUsd) => {
  let basePercent = 0.0075; // 0.75%
  const amt = Number(amountUsd) || 0;

  if (amt < 100) {
    basePercent += 0.002; // +0.20% small tx
  } else if (amt > 1000) {
    basePercent -= 0.002; // -0.20% large tx
  }

  // clamp between 0.40% and 1.50%
  if (basePercent < 0.004) basePercent = 0.004;
  if (basePercent > 0.015) basePercent = 0.015;

  const spreadPhp = mid * basePercent;
  return {
    spreadPhp,
    spreadPercent: basePercent * 100,
  };
};

const buildQuote = async (amountUsd) => {
  const { mid, ts } = await getMidMarket();
  const { spreadPhp, spreadPercent } = computeSpread(mid, amountUsd);
  const pbxRate = mid - spreadPhp;
  return {
    mid_market: mid,
    pbx_rate: pbxRate,
    spread_php_per_usd: spreadPhp,
    spread_percent: spreadPercent,
    timestamp: ts,
  };
};

exports.handler = async (event) => {
  try {
    const params = event.queryStringParameters || {};
    const amountUsd = Number(params.amount_usd || "100");

    if (!amountUsd || amountUsd <= 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "INVALID_AMOUNT" }),
      };
    }

    const quote = await buildQuote(amountUsd);

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(quote),
    };
  } catch (err) {
    console.error("get-fx-quote error:", err);
    const message =
      err instanceof FXError ? err.message : "Unexpected FX error";
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "FX_UNAVAILABLE", message }),
    };
  }
};
