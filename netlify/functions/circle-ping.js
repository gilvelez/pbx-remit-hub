exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, headers: { 'content-type': 'application/json' }, body: JSON.stringify({ error: 'Method not allowed' }) };
  }
  try {
    const res = await fetch('https://api-sandbox.circle.com/v1/configuration', { headers: { Accept: 'application/json' } });
    const text = await res.text();
    return { statusCode: res.status, headers: { 'content-type': 'application/json' }, body: text };
  } catch (e) {
    return { statusCode: 500, headers: { 'content-type': 'application/json' }, body: JSON.stringify({ error: 'Circle ping failed', detail: String(e) }) };
  }
};
