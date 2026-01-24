const { getDb } = require("./_mongoClient");
const { getWallet } = require("./walletStore");

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
    const db = await getDb();
    const session = await requireSession(db, event);

    const w = await getWallet(db, session.userId);
    return json(200, { usd: Number(w.usd || 0), php: Number(w.php || 0) });

  } catch (err) {
    console.error("wallet-balance error:", err);
    const msg = String(err.message || err);
    const status = msg.includes("session") ? 401 : 500;
    return json(status, { error: msg });
  }
};
