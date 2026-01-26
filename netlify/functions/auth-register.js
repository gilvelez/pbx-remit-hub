const crypto = require("crypto");
const { getDb } = require("./_mongoClient");

const headers = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "content-type, authorization, x-session-token",
  "access-control-allow-methods": "POST, OPTIONS",
  "content-type": "application/json",
};

function sign(payload) {
  const secret = process.env.AUTH_SECRET || "dev-secret-change-me";
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = crypto.createHmac("sha256", secret).update(data).digest("base64url");
  return `${data}.${sig}`;
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers, body: "" };
  if (event.httpMethod !== "POST")
    return { statusCode: 405, headers, body: JSON.stringify({ error: "Method not allowed" }) };

  try {
    const body = JSON.parse(event.body || "{}");
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    const displayName = String(body.displayName || "").trim() || email.split("@")[0];

    if (!email) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: "Email required" }) };
    }

    // Use email as stable userId for MVP
    const userId = email;
    const now = new Date();

    // Generate signed token
    const token = sign({ email, userId, iat: Date.now() });

    // Connect to MongoDB
    const db = await getDb();

    // Upsert session record
    await db.collection("sessions").updateOne(
      { token },
      {
        $set: {
          token,
          userId,
          email,
          lastSeenAt: now,
        },
        $setOnInsert: {
          createdAt: now,
        },
      },
      { upsert: true }
    );

    // Ensure wallet exists with demo seeding (only if not already seeded)
    const existingWallet = await db.collection("wallets").findOne({ userId });
    
    if (!existingWallet) {
      // Create new wallet with demo amounts
      await db.collection("wallets").insertOne({
        userId,
        usd: 500,
        php: 28060,
        usdc: 0,
        demoSeeded: true,
        createdAt: now,
        updatedAt: now,
      });
    } else if (!existingWallet.demoSeeded) {
      // Seed demo amounts if not already seeded
      await db.collection("wallets").updateOne(
        { userId },
        {
          $set: {
            usd: 500,
            php: 28060,
            demoSeeded: true,
            updatedAt: now,
          },
        }
      );
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        token,
        user: { email, displayName, userId },
      }),
    };
  } catch (err) {
    console.error("Register error:", err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Registration failed", detail: err.message || String(err) }),
    };
  }
};
