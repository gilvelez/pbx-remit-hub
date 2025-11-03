// netlify/functions/accounts-auth.js
const { Configuration, PlaidApi, PlaidEnvironments } = require('plaid');

exports.handler = async (event) => {
  try {
    const { access_token } = JSON.parse(event.body || '{}');
    if (!access_token) {
      return { statusCode: 400, body: JSON.stringify({ error: 'access_token required' }) };
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

    const client = new PlaidApi(config);
    const resp = await client.authGet({ access_token }); // routing/account numbers

    return { statusCode: 200, body: JSON.stringify(resp.data) };
  } catch (e) {
    console.error('auth error', e.response?.data || e);
    return { statusCode: 500, body: JSON.stringify({ error: e.response?.data || String(e) }) };
  }
};
