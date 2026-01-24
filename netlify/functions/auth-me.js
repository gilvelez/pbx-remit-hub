const { getDb } = require("./_mongoClient");

function json(statusCode, body) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}

exports.handler = async (event) => {
  try {
    const token = event.headers["x-session-token"] || event.headers["X-Session-Token"];
    if (!token) return json(401, { error: "Missing session token" });

    const db = await getDb();
    const sessions = db.collection("sessions");
    const session = await sessions.findOne({ token });
    if (!session) return json(401, { error: "Invalid session" });

    await sessions.updateOne({ token }, { $set: { lastSeenAt: new Date() } });

    const users = db.collection("users");
    const user = await users.findOne({ userId: session.userId });

    const banks = db.collection("banks");
    const linkedBanks = await banks
      .find({ userId: session.userId })
      .sort({ createdAt: -1 })
      .toArray();

    return json(200, {
      user: {
        userId: session.userId,
        email: session.email,
        displayName: user?.displayName || session.email.split("@")[0],
      },
      linkedBanks: linkedBanks.map((b) => ({
        bank_id: b.bank_id,
        name: b.name,
        mask: b.mask,
        institution_id: b.institution_id,
        institution_name: b.institution_name,
        accounts: b.accounts || [],
        createdAt: b.createdAt,
      })),
    });

  } catch (err) {
    console.error("auth-me error:", err);
    return json(500, { error: "Server error" });
  }
};
