// netlify/functions/sandbox-public-token.js
const { Configuration, PlaidApi, PlaidEnvironments } = require('plaid');

exports.handler = async () => {
  try {
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

    const resp = await client.sandboxPublicTokenCreate({
      institution_id: 'ins_109508', // Plaid Test Institution
      initial_products: ['transactions', 'auth'],
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        public_token: resp.data.public_token,
        request_id: resp.data.request_id,
      }),
    };
  } catch (e) {
    console.error('Sandbox public_token error:', e.response?.data || e);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: e.response?.data || String(e) }),
    };
  }
};
