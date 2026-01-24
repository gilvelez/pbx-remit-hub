const { getDb } = require("./_mongoClient");
const { Configuration, PlaidApi, PlaidEnvironments } = require("plaid");

function json(statusCode, body) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}

async function requireSession(db, event) {
  const token = event.headers["x-session-token"] || event.headers["X-Session-Token"];
  if (!token) throw new Error("Missing session token");
  const session = await db.collection("sessions").findOne({ token });
  if (!session) throw new Error("Invalid session");
  return session;
}

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") return json(405, { error: "Method not allowed" });

    const db = await getDb();
    const session = await requireSession(db, event);

    const body = JSON.parse(event.body || "{}");
    const public_token = body.public_token;
    const metadata = body.metadata || {};
    
    // Also support direct institution/accounts from frontend
    const institution = metadata.institution || body.institution || {};
    const accounts = metadata.accounts || body.accounts || [];
    
    if (!public_token) return json(400, { error: "Missing public_token" });

    const config = new Configuration({
      basePath: PlaidEnvironments[process.env.PLAID_ENV || "sandbox"],
      baseOptions: {
        headers: {
          "PLAID-CLIENT-ID": process.env.PLAID_CLIENT_ID,
          "PLAID-SECRET": process.env.PLAID_SECRET,
        },
      },
    });

    const plaid = new PlaidApi(config);

    // Exchange public token for access token
    const exchange = await plaid.itemPublicTokenExchange({ public_token });
    const access_token = exchange.data.access_token;
    const item_id = exchange.data.item_id;

    // Create a stable bank_id for UI
    const bank_id = `${institution.institution_id || "inst"}_${item_id}`;

    // Best-effort mask + name for the UI
    const primaryAccount = accounts[0] || {};
    const mask = primaryAccount.mask || "----";
    const name = primaryAccount.name || institution.name || "Bank Account";

    await db.collection("banks").updateOne(
      { userId: session.userId, bank_id },
      {
        $set: {
          userId: session.userId,
          bank_id,
          plaid_item_id: item_id,
          plaid_access_token: access_token,
          institution_id: institution.institution_id || null,
          institution_name: institution.name || null,
          name,
          mask,
          accounts,
          updatedAt: new Date(),
        },
        $setOnInsert: { createdAt: new Date() },
      },
      { upsert: true }
    );

    return json(200, {
      ok: true,
      bank: { bank_id, name, mask, institution_name: institution.name || null, accounts },
    });

  } catch (err) {
    console.error("banks-link error:", err);
    const msg = String(err.message || err);
    const status = msg.includes("session") ? 401 : 500;
    return json(status, { error: msg });
  }
};
