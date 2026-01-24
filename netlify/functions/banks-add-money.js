const { getDb } = require("./_mongoClient");
const { getWallet, setWallet } = require("./walletStore");

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
    const amount = Number(body.amount || 0);
    if (!Number.isFinite(amount) || amount <= 0) return json(400, { error: "Invalid amount" });

    const w = await getWallet(db, session.userId);
    const nextUsd = Number(w.usd || 0) + amount;
    const updated = await setWallet(db, session.userId, { usd: nextUsd });

    return json(200, { ok: true, wallet: { usd: updated.usd, php: updated.php } });

  } catch (err) {
    console.error("banks-add-money error:", err);
    const msg = String(err.message || err);
    const status = msg.includes("session") ? 401 : 500;
    return json(status, { error: msg });
  }
};
