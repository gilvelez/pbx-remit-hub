export default async () => {
  const key = (process.env.CIRCLE_API_KEY || "").trim();
  if (!key) {
    return new Response(JSON.stringify({ error: "Missing CIRCLE_API_KEY" }), {
      status: 500, headers: { "content-type": "application/json" }
    });
  }
  const res = await fetch("https://api-sandbox.circle.com/v1/businessAccount/balances", {
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
  });
  const txt = await res.text();
  return new Response(txt, { status: res.status, headers: { "content-type": "application/json" }});
};
