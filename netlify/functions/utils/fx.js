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

  const url = new URL(OXR_URL);
  url.searchParams.set("app_id", key);
  url.searchParams.set("base", "USD");
  url.searchParams.set("symbols", "PHP");

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new FXError(`FX API error: ${res.status}`);
  }
  const data = await res.json();
  const rate = data?.rates?.PHP;
  if (!rate) {
    throw new FXError("PHP rate missing in FX response");
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
