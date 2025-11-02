const { Configuration, PlaidApi, PlaidEnvironments } = require('plaid');

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
    const { public_token } = JSON.parse(event.body || '{}');
    if (!public_token) return { statusCode: 400, body: 'public_token required' };

    const resp = await plaid.itemPublicTokenExchange({ public_token });
    // TODO: Save resp.data.access_token in your DB for this user.
    return {
      statusCode: 200,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(resp.data)
    };
  } catch (err) {
    return { statusCode: 500, body: err.message || 'Error exchanging token' };
  }
};
