// netlify/functions/circle-transfer.js

// Simple UUID v4 generator (so we don't need extra libraries)
function makeIdempotencyKey() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

exports.handler = async () => {
  const apiKey = process.env.CIRCLE_API_KEY;
  const baseUrl = process.env.CIRCLE_BASE_URL || 'https://api-sandbox.circle.com/v1';
  const merchantWalletId = process.env.CIRCLE_MERCHANT_WALLET_ID; // 1017355423
  const userWalletId = process.env.CIRCLE_USER_WALLET_ID;        // 1017355425

  // Safety check so we can see if env vars are missing
  if (!apiKey || !merchantWalletId || !userWalletId) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Missing required environment variables',
        has: {
          CIRCLE_API_KEY: !!apiKey,
          CIRCLE_MERCHANT_WALLET_ID: !!merchantWalletId,
          CIRCLE_USER_WALLET_ID: !!userWalletId
        }
      })
    };
  }

  const idempotencyKey = makeIdempotencyKey(); // <-- NO "pbx-transfer" prefix

  const payload = {
    idempotencyKey,
    source: {
      type: 'wallet',
      id: merchantWalletId
    },
    destination: {
      type: 'wallet',
      id: userWalletId
    },
    amount: {
      amount: '1.00',
      currency: 'USD'
    }
  };

  try {
    const response = await fetch(`${baseUrl}/transfers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    return {
      statusCode: response.status,
      body: JSON.stringify(
        {
          circleStatus: response.status,
          idempotencyKey,
          requestBodyWeSent: payload,   // so we can see exactly what went up
          circleResponse: data
        },
        null,
        2
      )
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
