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

    const response = await client.sandboxPublicTokenCreate({
      institution_id: 'ins_109508', // Plaid Test Institution
      initial_products: ['transactions', 'auth'],
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        public_token: response.data.public_token,
        request_id: response.data.request_id,
      }),
    };
  } catch (error) {
    console.error('Sandbox public_token error:', error.response?.data || error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: error.response?.data || String(error),
      }),
    };
  }
};
