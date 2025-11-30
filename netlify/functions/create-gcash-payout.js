// netlify/functions/create-gcash-payout.js
// PBX actual payout function with FX locking and ledger recording

const { getFxQuote, FXError } = require("./utils/fx.js");

// Simulate Circle USDC burn (to be replaced with real Circle API)
const simulateCircleBurn = async ({ amountUsd, txId }) => {
  // TODO: replace with real Circle call using CIRCLE_API_KEY + wallet id
  console.log(`[Circle Sim] Burning ${amountUsd} USDC for tx ${txId}`);
  return {
    circleStatus: "SIMULATED",
    circleReferenceId: "circle_sim_" + txId,
  };
};

// Simulate GCash payout (to be replaced with real Paymongo/Xendit)
const simulateGcashPayout = async ({ amountPhp, gcashNumber, recipientName, txId }) => {
  // TODO: replace with real Paymongo/Xendit payout using secret key env vars
  console.log(`[GCash Sim] Sending ${amountPhp} PHP to ${gcashNumber} (${recipientName}) for tx ${txId}`);
  return {
    payoutStatus: "SIMULATED",
    payoutProvider: "SIMULATED_GCASH",
    payoutReferenceId: "payout_sim_" + txId,
  };
};

export async function handler(event) {
  // Only accept POST requests
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method Not Allowed" }),
    };
  }

  try {
    // Parse request body
    const body = JSON.parse(event.body || "{}");
    const { amount_usd, gcash_number, recipient_name } = body;

    // Validate required fields
    if (!amount_usd || Number(amount_usd) <= 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "amount_usd must be > 0" }),
      };
    }

    if (!gcash_number || typeof gcash_number !== "string" || gcash_number.trim() === "") {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "gcash_number is required" }),
      };
    }

    if (!recipient_name || typeof recipient_name !== "string" || recipient_name.trim() === "") {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "recipient_name is required" }),
      };
    }

    const amountUsd = Number(amount_usd);

    // Get locked FX quote
    let fx;
    try {
      fx = await getFxQuote(amountUsd);
    } catch (error) {
      console.error("[Payout] FX error:", error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "FX_UNAVAILABLE" }),
      };
    }

    // Compute PHP amount
    const amountPhp = Number((amountUsd * fx.pbxRate).toFixed(2));

    // Generate PBX transaction ID
    const txId = "pbx_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8);

    // Execute Circle burn (simulated)
    const circleResult = await simulateCircleBurn({ amountUsd, txId });

    // Execute GCash payout (simulated)
    const payoutResult = await simulateGcashPayout({
      amountPhp,
      gcashNumber: gcash_number,
      recipientName: recipient_name,
      txId,
    });

    // Create ledger entry
    const ledgerEntry = {
      txId,
      createdAt: new Date().toISOString(),
      type: "GCASH_PAYOUT",
      direction: "OUTBOUND",
      userId: "demo-user", // later replace with real authenticated user id

      // amounts
      amountUsd,
      amountPhp,

      // FX details
      fxMidMarket: fx.midMarket,
      fxPbxRate: fx.pbxRate,
      fxSpreadPhpPerUsd: fx.spreadPhpPerUsd,
      fxSpreadPercent: fx.spreadPercent,

      // recipient
      recipientName: recipient_name,
      gcashNumber: gcash_number,

      // external systems (to be wired later)
      circle: {
        status: circleResult.circleStatus,
        referenceId: circleResult.circleReferenceId,
      },
      payout: {
        status: payoutResult.payoutStatus,
        provider: payoutResult.payoutProvider,
        referenceId: payoutResult.payoutReferenceId,
      },

      status: "PENDING", // can be updated to COMPLETED by webhooks later
    };

    // TODO: Persist ledgerEntry to database
    // For now, just log it
    console.log("[Payout] Ledger entry created:", JSON.stringify(ledgerEntry, null, 2));

    // Return success response
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        txId,
        status: "PENDING",
        amount_usd: amountUsd,
        amount_php: amountPhp,
        pbx_rate: fx.pbxRate,
        mid_market: fx.midMarket,
        spread_php_per_usd: fx.spreadPhpPerUsd,
        spread_percent: fx.spreadPercent,
        recipient_name,
        gcash_number,
      }),
    };
  } catch (error) {
    console.error("[Payout] Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: error.message || "Internal server error",
      }),
    };
  }
}
