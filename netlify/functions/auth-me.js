const crypto = require("crypto");
const { getDb } = require("./_mongoClient");

const headers = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "content-type, authorization, x-session-token",
  "access-control-allow-methods": "GET, OPTIONS",
  "content-type": "application/json",
};

function verify(token) {
  const secret = process.env.AUTH_SECRET || "dev-secret-change-me";
  const [data, sig] = (token || "").split(".");
  if (!data || !sig) return null;

  const expected = crypto.createHmac("sha256", secret).update(data).digest("base64url");
  if (expected !== sig) return null;

  try {
    return JSON.parse(Buffer.from(data, "base64url").toString("utf8"));
  } catch {
    return null;
  }
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers, body: "" };
  if (event.httpMethod !== "GET")
    return { statusCode: 405, headers, body: JSON.stringify({ error: "Method not allowed" }) };

  // Get token from Authorization header or X-Session-Token
  const auth = event.headers?.authorization || event.headers?.Authorization || "";
  const xSessionToken = event.headers?.["x-session-token"] || event.headers?.["X-Session-Token"] || "";
  
  let token = "";
  if (auth.startsWith("Bearer ")) {
    token = auth.slice(7);
  } else if (xSessionToken) {
    token = xSessionToken;
  }

  const payload = verify(token);

  if (!payload?.email) {
    return { statusCode: 401, headers, body: JSON.stringify({ error: "Unauthorized" }) };
  }

  try {
    const db = await getDb();
    const now = new Date();
    const userId = payload.userId || payload.email;

    // Upsert/refresh session record
    await db.collection("sessions").updateOne(
      { userId },
      {
        $set: {
          token,
          userId,
          email: payload.email,
          lastSeenAt: now,
        },
        $setOnInsert: {
          createdAt: now,
        },
      },
      { upsert: true }
    );

    // Ensure wallet exists (heal missing wallets)
    const existingWallet = await db.collection("wallets").findOne({ userId });
    if (!existingWallet) {
      await db.collection("wallets").insertOne({
        userId,
        usd: 500,
        php: 28060,
        usdc: 0,
        demoSeeded: true,
        createdAt: now,
        updatedAt: now,
      });
    }

    // Get linked banks for response
    const linkedBanks = await db.collection("banks").find({ userId }).toArray();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        user: {
          email: payload.email,
          userId,
          displayName: payload.email.split("@")[0],
        },
        linkedBanks: linkedBanks.map(b => ({
          bank_id: b.bank_id,
          name: b.name,
          mask: b.mask,
          institution_name: b.institution_name,
        })),
      }),
    };
  } catch (err) {
    console.error("Auth me error:", err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Server error", detail: err.message }),
    };
  }
};
