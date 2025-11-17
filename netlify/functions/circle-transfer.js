// netlify/functions/circle-transfer.js

exports.handler = async (event) => {
  // Allow both GET and POST for easy testing
  if (event.httpMethod !== 'GET' && event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  const CIRCLE_BASE_URL = process.env.CIRCLE_BASE_URL;
  const CIRCLE_API_KEY = process.env.CIRCLE_API_KEY;
  const MERCHANT_WALLET_ID = process.env.CIRCLE_MERCHANT_WALLET_ID;
  const USER_WALLET_ID = process.env.CIRCLE_USER_WALLET_ID;

  if (!CIRCLE_BASE_URL || !CIRCLE_API_KEY || !MERCHANT_WALLET_ID || !USER_WALLET_ID) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Missing one or more Circle env vars',
      }),
    };
  }

  // Generate a unique idempotency key (like the long 8e12... one that worked)
  const idempotencyKey =
    'pbx-transfer-' + Date.now().toString(16) + '-' + Math.random().toString(16).slice(2);

  const payload = {
    idempotencyKey,
    source: {
      type: 'wallet',
      id: MERCHANT_WALLET_ID,      // 1017355423 (merchant)
    },
    destination: {
      type: 'wallet',
      id: USER_WALLET_ID,          // 1017355425 (user)
    },
    amount: {
      amount: '1.00',              // move $1.00 USDC for this test
      currency: 'USD',
    },
  };

  try {
    const response = await fetch(`${CIRCLE_BASE_URL}/transfers`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${CIRCLE_API_KEY}`,
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
