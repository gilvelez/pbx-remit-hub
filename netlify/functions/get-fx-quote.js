// netlify/functions/get-fx-quote.js
// Get floating USD→PHP rate with dynamic spread from OpenExchangeRates
// Uses shared FX utility

const { getFxQuote, FXError } = require("./utils/fx.js");

export async function handler(event) {
  try {
    // Read amount from query string, default to 100
    const amountUsd = Number(event.queryStringParameters?.amount_usd || 100);

    // Get FX quote from shared utility
    const fx = await getFxQuote(amountUsd);

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        mid_market: fx.midMarket,
        pbx_rate: fx.pbxRate,
        spread_php_per_usd: fx.spreadPhpPerUsd,
        spread_percent: fx.spreadPercent,
        timestamp: Math.floor(fx.timestamp / 1000),
      }),
    };
  } catch (error) {
    const statusCode = error instanceof FXError ? 500 : 500;
    return {
      statusCode,
      body: JSON.stringify({
        error: error.message || "Failed to get FX quote",
      }),
    };
  }
}
