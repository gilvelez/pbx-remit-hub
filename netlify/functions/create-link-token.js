const { Configuration, PlaidApi, PlaidEnvironments } = require('plaid');
const { isVerified } = require('./sessionStore');

function parseCsvEnv(name, fallback) {
  const v = (process.env[name] || '').trim();
  if (!v) return fallback;
  return v.split(',').map(s => s.trim()).filter(Boolean);
}

const PLAID_MODE = (process.env.PLAID_MODE || 'SANDBOX').toUpperCase();

function makeMockLinkToken() {
  return `mock-link-token-${Date.now()}`;
}

const config = new Configuration({
  basePath: PlaidEnvironments[process.env.PLAID_ENV || 'sandbox'],
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
      'PLAID-SECRET': process.env.PLAID_SECRET,
    },
  },
});
const plaid = new PlaidApi(config);

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    // SECURITY: Hard gate for Plaid Link token creation
    const token = event.headers["x-session-token"];
    const verifiedHeader = (event.headers["x-session-verified"] || "").toLowerCase() === "true";
    const verified = verifiedHeader || isVerified(token);

    if (!token || !verified) {
      console.log("PLAID_LINK_REQUEST_BLOCKED", { hasToken: !!token, verified, ts: Date.now() });
      return {
        statusCode: 403,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ error: "Verification required before connecting bank" })
      };
    }

    console.log("PLAID_LINK_REQUEST_ALLOWED", { mode: PLAID_MODE, ts: Date.now() });

    if (PLAID_MODE === 'MOCK') {
      return {
        statusCode: 200,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ link_token: makeMockLinkToken(), mode: 'MOCK' })
      };
    }

    const body = JSON.parse(event.body || '{}');
    const client_user_id = body.client_user_id || 'pbx-user-123';

    const products = parseCsvEnv('PLAID_PRODUCTS', ['transactions']);
    const countryCodes = parseCsvEnv('PLAID_COUNTRY_CODE', ['US']);

    const resp = await plaid.linkTokenCreate({
      user: { client_user_id },
      client_name: 'PBX',
      products,
      language: 'en',
      country_codes: countryCodes
    });

    return {
      statusCode: 200,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ link_token: resp.data.link_token, mode: 'SANDBOX' })
    };
  } catch (err) {
    console.error('create-link-token error', err.response?.data || err);
    return { 
      statusCode: 500, 
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ error: 'Error creating link token', detail: err.response?.data || err.message || String(err) })
    };
  }
};
