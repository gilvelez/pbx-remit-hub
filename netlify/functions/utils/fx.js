// netlify/functions/utils/fx.js
// Shared FX utility for PBX - OpenExchangeRates integration with caching

const OXR_URL = "https://openexchangerates.org/api/latest.json";

const FX_TTL_MS = 60_000; // 60 seconds

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

  // Build URL with only app_id and symbols (no base parameter)
  const url = new URL(OXR_URL);
  url.searchParams.set("app_id", key);
  url.searchParams.set("symbols", "PHP");

  console.log("[OXR] Fetching rates from:", url.toString().replace(key, "***"));

  const res = await fetch(url.toString());
  const text = await res.text();

  if (!res.ok) {
    // Parse OXR error response as per their documentation
    let errMsg = `OXR API HTTP ${res.status}`;
    let errorCode = "unknown";
    
    try {
      const errJson = JSON.parse(text);
      console.error("[OXR] Error response:", JSON.stringify(errJson, null, 2));
      
      // OXR error structure: { error: true, status: 401, message: "invalid_app_id", description: "..." }
      if (errJson) {
        errorCode = errJson.message || "unknown";
        errMsg = `OXR API ${res.status}: ${errorCode}`;
        
        if (errJson.description) {
          console.error("[OXR] Error description:", errJson.description);
        }
      }
    } catch (e) {
      // If JSON parsing fails, log raw text
      console.error("[OXR] Raw error response (non-JSON):", text);
    }
    
    throw new FXError(errMsg);
  }

  // Parse successful response
  let data;
  try {
    data = JSON.parse(text);
  } catch (e) {
    console.error("[OXR] Failed to parse success JSON:", text);
    throw new FXError("Failed to parse OXR JSON response");
  }

  // Validate PHP rate exists
  const rate = data?.rates?.PHP;
  if (!rate) {
    console.error("[OXR] PHP rate missing in response. Full data:", JSON.stringify(data, null, 2));
    throw new FXError("PHP rate not found in OXR response");
  }

  console.log("[OXR] Successfully fetched PHP rate:", rate);
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
    basePercent -= 0.002; // -0.20% big tx (better rate)
  }

  // safety bounds: 0.40% - 1.50%
  if (basePercent < 0.004) basePercent = 0.004;
  if (basePercent > 0.015) basePercent = 0.015;

  const spreadPhp = mid * basePercent;
  return {
    spreadPhp,
    spreadPercent: basePercent * 100,
  };
};

const getFxQuote = async (amountUsd) => {
  const { mid, ts } = await getMidMarket();
  const spread = computeSpread(mid, amountUsd);
  const pbxRate = mid - spread.spreadPhp;
  return {
    midMarket: mid,
    pbxRate,
    spreadPhpPerUsd: spread.spreadPhp,
    spreadPercent: spread.spreadPercent,
    timestamp: ts,
  };
};

module.exports = {
  getFxQuote,
  FXError,
};
