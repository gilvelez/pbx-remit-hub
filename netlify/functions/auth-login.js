const crypto = require("crypto");
const { getDb } = require("./_mongoClient");

function json(statusCode, body) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}

function normEmail(email) {
  return String(email || "").trim().toLowerCase();
}

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") return json(405, { error: "Method not allowed" });

    const { email } = JSON.parse(event.body || "{}");
    const e = normEmail(email);
    if (!e || !e.includes("@")) return json(400, { error: "Valid email required" });

    const db = await getDb();

    // upsert user
    const users = db.collection("users");
    const existing = await users.findOne({ email: e });
    let userId;
    let displayName;

    if (existing) {
      userId = existing.userId;
      displayName = existing.displayName || e.split("@")[0];
    } else {
      userId = crypto.randomUUID();
      displayName = e.split("@")[0];
      await users.insertOne({
        userId,
        email: e,
        displayName,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    // create session token
    const token = crypto.randomUUID();
    const sessions = db.collection("sessions");
    await sessions.insertOne({
      token,
      userId,
      email: e,
      verified: true,
      createdAt: new Date(),
      lastSeenAt: new Date(),
    });

    return json(200, { token, user: { userId, email: e, displayName } });

  } catch (err) {
    console.error("auth-login error:", err);
    return json(500, { error: "Server error" });
  }
};
