export default async () => {
  const apiKey = process.env.CIRCLE_API_KEY; // MUST include TEST_API_KEY: prefix
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'Missing CIRCLE_API_KEY' }), {
      status: 500,
      headers: { 'content-type': 'application/json' }
    });
  }

  const res = await fetch('https://api-sandbox.circle.com/v1/businessAccount/balances', {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
  });

  const text = await res.text(); // pass-through for debugging
  return new Response(text, { status: res.status, headers: { 'content-type': 'application/json' } });
};
