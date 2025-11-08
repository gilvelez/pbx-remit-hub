export default async () => {
  const key = (process.env.CIRCLE_API_KEY || "").trim();
  const res = await fetch("https://api-sandbox.circle.com/v1/configuration", {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${key}`,
    },
  });

  // Redact sensitive bits; never echo the key
  const ok = res.status;
  const body = await res.text();
  return new Response(JSON.stringify({
    statusFromCircle: ok,
    keyPresent: !!key,
    keyLooksPrefixed: key.startsWith("TEST_API_KEY:"),
    // show first 8 chars of the secret part only for sanity (still safe)
    keySample: key.slice(13, 21) || null,
    circleBody: body ? JSON.parse(body) : null,
  }), { status: 200, headers: { "content-type": "application/json" }});
};
