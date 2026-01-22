exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, headers: { 'content-type': 'application/json' }, body: JSON.stringify({ error: 'Method not allowed' }) };
  }
  const key = (process.env.CIRCLE_API_KEY || '').trim();
  if (!key) {
    return { statusCode: 500, headers: { 'content-type': 'application/json' }, body: JSON.stringify({ error: 'Missing CIRCLE_API_KEY' }) };
  }
  try {
    const res = await fetch('https://api-sandbox.circle.com/v1/businessAccount/balances', {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
    });
    const text = await res.text();
    return { statusCode: res.status, headers: { 'content-type': 'application/json' }, body: text };
  } catch (e) {
    return { statusCode: 500, headers: { 'content-type': 'application/json' }, body: JSON.stringify({ error: 'Circle balances failed', detail: String(e) }) };
  }
};
