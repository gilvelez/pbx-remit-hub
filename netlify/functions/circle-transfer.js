// netlify/functions/circle-transfer.js

// UUID-ish idempotency key generator (no pbx-transfer prefix)
function makeIdempotencyKey() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

exports.handler = async (event) => {
  // Allow GET for quick browser testing, POST for real use
  if (event.httpMethod !== 'GET' && event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  const apiKey = process.env.CIRCLE_API_KEY;
  const baseUrl = process.env.CIRCLE_BASE_URL || 'https://api-sandbox.circle.com/v1';
  const merchantWalletId = process.env.CIRCLE_MERCHANT_WALLET_ID; // 1017355423
  const userWalletId = process.env.CIRCLE_USER_WALLET_ID;        // 1017355425

  if (!apiKey || !merchantWalletId || !userWalletId) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Missing required environment variables',
        has: {
          CIRCLE_API_KEY: !!apiKey,
          CIRCLE_MERCHANT_WALLET_ID: !!merchantWalletId,
          CIRCLE_USER_WALLET_ID: !!userWalletId,
          CIRCLE_BASE_URL: !!process.env.CIRCLE_BASE_URL,
        },
      }),
    };
  }

  const idempotencyKey = makeIdempotencyKey();

  const payload = {
    idempotencyKey,
    source: {
      type: 'wallet',
      id: merchantWalletId,
    },
    destination: {
      type: 'wallet',
      id: userWalletId,
    },
    amount: {
      amount: '1.00',
      currency: 'USD',
    },
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
      body: JSON.stringify(
        {
          circleStatus: response.status,
          idempotencyKey,
          requestBodyWeSent: payload,
          circleResponse: data,
        },
        null,
        2
      ),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Circle call failed', detail: err.message }),
    };
  }
};
