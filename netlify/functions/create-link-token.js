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
    const body = JSON.parse(event.body || '{}');
    const client_user_id = body.client_user_id || 'pbx-user-123';

    const resp = await plaid.linkTokenCreate({
      user: { client_user_id },
      client_name: 'PBX',
      products: ['transactions'],
      language: 'en',
      country_codes: ['US']
    });

    return {
      statusCode: 200,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ link_token: resp.data.link_token })
    };
  } catch (err) {
    return { statusCode: 500, body: err.message || 'Error creating link token' };
  }
};
