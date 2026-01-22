exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, headers: { 'content-type': 'application/json' }, body: JSON.stringify({ error: 'Method not allowed' }) };
  }
  const key = (process.env.CIRCLE_API_KEY || '').trim();
  try {
    const res = await fetch('https://api-sandbox.circle.com/v1/configuration', {
      headers: { Accept: 'application/json', Authorization: `Bearer ${key}` },
    });
    const raw = await res.text();
    let circleBody = null;
    try { circleBody = raw ? JSON.parse(raw) : null; } catch (_) {}
    return {
      statusCode: 200,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        statusFromCircle: res.status,
        keyPresent: !!key,
        keyLooksPrefixed: key.startsWith('TEST_API_KEY:'),
        keySample: key.slice(13, 21) || null,
        circleBody,
      }),
    };
  } catch (e) {
    return { statusCode: 500, headers: { 'content-type': 'application/json' }, body: JSON.stringify({ error: 'Circle auth check failed', detail: String(e) }) };
  }
};
