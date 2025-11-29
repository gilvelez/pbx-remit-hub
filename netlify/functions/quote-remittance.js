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
        body: JSON.stringify({ error: "amountUsd must be > 0" }),
      };
    }

    // Sandbox FX + fee (mock)
    const FX = 55;          // 1 USD = 55 PHP
    const feeUsd = 2;       // flat $2 fee for demo
    const totalChargeUsd = amountUsd + feeUsd;
    const amountPhp = amountUsd * FX;

    const quoteId = `qt_${Date.now()}_${Math.random()
      .toString(36)
      .slice(2, 8)}`;

    const quote = {
      id: quoteId,
      payoutMethod,
      amountUsd,
      feeUsd,
      totalChargeUsd,
      fxRate: FX,
      amountPhp,
      currencyFrom: "USD",
      currencyTo: "PHP",
      expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 min
    };

    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true, quote }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message || "quote failed" }),
    };
  }
}
