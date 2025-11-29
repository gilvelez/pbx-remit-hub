// netlify/functions/quote-remittance.js
// Sandbox remittance quote: USD -> PHP with flat fee

export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const body = JSON.parse(event.body || "{}");
    const amountUsd = Number(body.amountUsd || 0);
    const payoutMethod = body.payoutMethod || "gcash";

    if (!amountUsd || amountUsd <= 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ ok: false, error: "amountUsd must be > 0" }),
      };
    }

    const FX = 55;     // sandbox rate
    const feeUsd = 2;  // sandbox flat fee
    const totalChargeUsd = amountUsd + feeUsd;
    const amountPhp = amountUsd * FX;

    const quote = {
      id: `qt_${Date.now()}`,
      payoutMethod,
      amountUsd,
      feeUsd,
      totalChargeUsd,
      fxRate: FX,
      amountPhp,
      currencyFrom: "USD",
      currencyTo: "PHP",
      expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    };

    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true, quote }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        ok: false,
        error: err.message || "quote failed",
      }),
    };
  }
}
