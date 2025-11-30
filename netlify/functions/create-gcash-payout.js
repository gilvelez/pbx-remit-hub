// netlify/functions/create-gcash-payout.js
exports.handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: "Method Not Allowed" };
    }

    const body = JSON.parse(event.body || "{}");
    const amountUsd = Number(body.amount_usd || 0);
    const recipient = body.recipient_name || "Unknown";
    const gcash = body.gcash_number || "N/A";

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

    // Sandbox payout: pretend it worked and return a fake tx
    const txId =
      "pbx_payout_" +
      Date.now() +
      "_" +
      Math.random().toString(36).slice(2, 8);

    const result = {
      txId,
      status: "COMPLETED",
      provider: "SIMULATED_GCASH",
      amount_usd: amountUsd,
      recipient_name: recipient,
      gcash_number: gcash,
      created_at: new Date().toISOString(),
    };

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(result),
    };
  } catch (err) {
    console.error("create-gcash-payout error:", err);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        error: "PAYOUT_FAILED",
        message: "Sandbox payout failed unexpectedly",
      }),
    };
  }
};
