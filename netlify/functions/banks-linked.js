const { getDb } = require("./_mongoClient");

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

    const banks = await db
      .collection("banks")
      .find({ userId: session.userId })
      .sort({ createdAt: -1 })
      .toArray();

    return json(200, {
      banks: banks.map((b) => ({
        id: b.bank_id,
        bank_id: b.bank_id,
        name: b.name,
        mask: b.mask,
        last4: b.mask,
        institution_name: b.institution_name || null,
        institution_id: b.institution_id || null,
        account_type: b.accounts?.[0]?.subtype || 'checking',
        accounts: b.accounts || [],
        status: 'linked',
        createdAt: b.createdAt,
      })),
    });

  } catch (err) {
    console.error("banks-linked error:", err);
    const msg = String(err.message || err);
    const status = msg.includes("session") ? 401 : 500;
    return json(status, { error: msg, banks: [] });
  }
};
