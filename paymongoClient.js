// paymongoClient.js

const PAYMONGO_BASE_URL = 'https://api.paymongo.com';

function getAuthHeader() {
  const secretKey = process.env.PAYMONGO_SECRET_KEY;
  if (!secretKey) {
    throw new Error('PAYMONGO_SECRET_KEY is not set in Netlify environment variables');
  }

  // HTTP Basic Auth: base64("sk_xxx:")
  const token = Buffer.from(`${secretKey}:`).toString('base64');
  return `Basic ${token}`;
}

/**
 * Generic helper to call PayMongo API.
 * 
 * @param {'GET'|'POST'|'PUT'|'PATCH'|'DELETE'} method
 * @param {string} path - e.g. "/v1/payment_intents" or "/v2/batch_transfers"
 * @param {object|null} body - raw JSON body (we pass the exact shape PayMongo expects)
 */
async function paymongoRequest(method, path, body = null) {
  const url = `${PAYMONGO_BASE_URL}${path}`;

  const headers = {
    Authorization: getAuthHeader(),
    'Content-Type': 'application/json',
  };

  const options = { method, headers };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const res = await fetch(url, options);
  const text = await res.text();

  let json = null;
  if (text) {
    try {
      json = JSON.parse(text);
    } catch (err) {
      console.error('PayMongo: invalid JSON response', text);
      throw new Error(`PayMongo: Failed to parse JSON. Status ${res.status}`);
    }
  }

  if (!res.ok) {
    const message =
      json?.errors?.[0]?.detail ||
      json?.errors?.[0]?.title ||
      `PayMongo API error (status ${res.status})`;

    const error = new Error(message);
    error.status = res.status;
    error.raw = json;
    throw error;
  }

  return json;
}

module.exports = {
  paymongoRequest,
};
