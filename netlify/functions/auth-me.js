const crypto = require("crypto");

const headers = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "content-type, authorization",
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

  const auth = event.headers?.authorization || event.headers?.Authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  const payload = verify(token);

  if (!payload?.email) {
    return { statusCode: 401, headers, body: JSON.stringify({ error: "Unauthorized" }) };
  }

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ success: true, user: { email: payload.email } }),
  };
};
