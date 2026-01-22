// netlify/functions/circle-transfer.js
// Transfers USDC/USD between Circle wallets (Sandbox)
// NOTE: For demo/testing. In production you will want stronger auth + idempotency control.

function makeIdempotencyKey() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET' && event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: { 'content-type': 'application/json' }, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const apiKey = process.env.CIRCLE_API_KEY;
  const baseUrl = process.env.CIRCLE_BASE_URL || 'https://api-sandbox.circle.com/v1';

  // Prefer explicit treasury wallet id, fallback to merchant wallet id for backwards compatibility
  const treasuryWalletId = process.env.CIRCLE_TREASURY_WALLET_ID || process.env.CIRCLE_MERCHANT_WALLET_ID;
  const userWalletId = process.env.CIRCLE_USER_WALLET_ID;

  const useMocks = (process.env.CIRCLE_USE_MOCKS || '').toLowerCase() === 'true';

  if (useMocks) {
    return {
      statusCode: 200,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ mocked: true, message: 'Circle transfer mocked', ts: Date.now() }),
    };
  }

  if (!apiKey || !treasuryWalletId || !userWalletId) {
    return {
      statusCode: 500,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        error: 'Missing required environment variables',
        has: {
          CIRCLE_API_KEY: !!apiKey,
          CIRCLE_TREASURY_WALLET_ID: !!process.env.CIRCLE_TREASURY_WALLET_ID,
          CIRCLE_MERCHANT_WALLET_ID: !!process.env.CIRCLE_MERCHANT_WALLET_ID,
          CIRCLE_USER_WALLET_ID: !!userWalletId,
          CIRCLE_BASE_URL: !!process.env.CIRCLE_BASE_URL,
        },
      }),
    };
  }

  let amount = '1.00';
  let currency = 'USD';
  let destination = userWalletId;
  let source = treasuryWalletId;

  if (event.httpMethod === 'POST') {
    try {
      const body = JSON.parse(event.body || '{}');
      if (body.amount) amount = String(body.amount);
      if (body.currency) currency = String(body.currency);
      if (body.destination_wallet_id) destination = String(body.destination_wallet_id);
      if (body.source_wallet_id) source = String(body.source_wallet_id);
    } catch (_) {}
  }

  const idempotencyKey = makeIdempotencyKey();

  const payload = {
    idempotencyKey,
    source: { type: 'wallet', id: source },
    destination: { type: 'wallet', id: destination },
    amount: { amount, currency },
  };

  try {
    const response = await fetch(`${baseUrl}/transfers`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    return {
      statusCode: response.status,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ circleStatus: response.status, idempotencyKey, requestBodyWeSent: payload, circleResponse: data }, null, 2),
    };
  } catch (err) {
    return { statusCode: 500, headers: { 'content-type': 'application/json' }, body: JSON.stringify({ error: 'Circle call failed', detail: err.message }) };
  }
};
