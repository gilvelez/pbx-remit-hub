const { Configuration, PlaidApi, PlaidEnvironments } = require('plaid');
const { addBank } = require('./bankStore');
const { isVerified } = require('./sessionStore');

const PLAID_MODE = (process.env.PLAID_MODE || 'SANDBOX').toUpperCase();

function makeId() {
  return `bank_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function plaidClient() {
  const config = new Configuration({
    basePath: PlaidEnvironments[process.env.PLAID_ENV || 'sandbox'],
    baseOptions: {
      headers: {
        'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
        'PLAID-SECRET': process.env.PLAID_SECRET,
      },
    },
  });
  return new PlaidApi(config);
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: { 'content-type': 'application/json' }, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const token = event.headers['x-session-token'] || '';
  const verifiedHeader = (event.headers['x-session-verified'] || '').toLowerCase() === 'true';
  const verified = verifiedHeader || isVerified(token);

  if (!token || !verified) {
    return { statusCode: 403, headers: { 'content-type': 'application/json' }, body: JSON.stringify({ error: 'Verification required before linking bank' }) };
  }

  let body = {};
  try { body = JSON.parse(event.body || '{}'); } catch (_) {}

  // Metadata from Plaid Link
  const public_token = body.public_token;
  const institution_name = body.institution_name || body.institution?.name || 'Linked Bank';
  const institution_id = body.institution_id || body.institution?.institution_id || '';
  const accounts = Array.isArray(body.accounts) ? body.accounts : [];
  const first = accounts[0] || {};
  const mask = first.mask || '0000';

  if (PLAID_MODE === 'MOCK') {
    const bank = addBank(token, {
      id: makeId(),
      institution_name,
      institution_id,
      mask,
      status: 'linked',
      createdAt: Date.now(),
    });
    return { statusCode: 200, headers: { 'content-type': 'application/json' }, body: JSON.stringify({ success: true, bank }) };
  }

  if (!public_token) {
    return { statusCode: 400, headers: { 'content-type': 'application/json' }, body: JSON.stringify({ error: 'public_token required' }) };
  }

  try {
    const client = plaidClient();

    // Exchange public_token for access_token
    const exch = await client.itemPublicTokenExchange({ public_token });
    const access_token = exch.data.access_token;

    // Pull accounts for better display (optional but helpful)
    let resolvedMask = mask;
    try {
      const acctResp = await client.accountsGet({ access_token });
      const a0 = (acctResp.data.accounts || [])[0];
      if (a0 && a0.mask) resolvedMask = a0.mask;
    } catch (_) {}

    const bank = addBank(token, {
      id: makeId(),
      institution_name,
      institution_id,
      mask: resolvedMask,
      status: 'linked',
      createdAt: Date.now(),
      access_token,
    });

    return { statusCode: 200, headers: { 'content-type': 'application/json' }, body: JSON.stringify({ success: true, bank }) };
  } catch (err) {
    console.error('banks-link error', err.response?.data || err);
    return { statusCode: 500, headers: { 'content-type': 'application/json' }, body: JSON.stringify({ error: 'Failed to link bank', detail: err.response?.data || err.message || String(err) }) };
  }
};
