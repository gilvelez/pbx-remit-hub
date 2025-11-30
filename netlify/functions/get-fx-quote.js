// netlify/functions/get-fx-quote.js
// Get floating USD→PHP rate with dynamic spread from OpenExchangeRates

export async function handler(event) {
  try {
    // Read amount from query string, default to 100
    const amountUsd = Number(event.queryStringParameters?.amount_usd || 100);

    // Check for OXR API key
    const apiKey = process.env.OXR_API_KEY;
    if (!apiKey) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "OXR_API_KEY not configured" }),
      };
    }

    // Fetch latest rates from OpenExchangeRates
    const oxrUrl = `https://openexchangerates.org/api/latest.json?app_id=${apiKey}&base=USD&symbols=PHP`;
    const response = await fetch(oxrUrl);

    if (!response.ok) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: `OXR API error: ${response.status}` }),
      };
    }

    const data = await response.json();
    const mid = data.rates.PHP;

    if (!mid) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "PHP rate not found in OXR response" }),
      };
    }

    // Apply dynamic spread based on amount
    let basePercent = 0.0075; // 0.75% base spread
    const amt = Number(amountUsd);

    if (amt < 100) {
      basePercent += 0.002; // +0.20% extra for small tx
    } else if (amt > 1000) {
      basePercent -= 0.002; // -0.20% better rate for big tx
    }

    // Clamp between 0.40% and 1.50%
    if (basePercent < 0.004) basePercent = 0.004;
    if (basePercent > 0.015) basePercent = 0.015;

    const spreadPhp = mid * basePercent; // PHP per $1
    const pbxRate = mid - spreadPhp;     // customer-facing rate

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        mid_market: mid,
        pbx_rate: pbxRate,
        spread_php_per_usd: spreadPhp,
        spread_percent: basePercent * 100, // convert to %
        timestamp: Math.floor(Date.now() / 1000),
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: error.message || "Failed to get FX quote",
      }),
    };
  }
}
