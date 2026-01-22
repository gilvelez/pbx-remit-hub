exports.handler = async () => {
  const mode = (process.env.PLAID_MODE || 'SANDBOX').toUpperCase();
  const env = process.env.PLAID_ENV || 'sandbox';
  return {
    statusCode: 200,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      plaid: {
        mode,
        env,
        has_client_id: !!process.env.PLAID_CLIENT_ID,
        has_secret: !!process.env.PLAID_SECRET,
        products: process.env.PLAID_PRODUCTS || 'transactions',
        country_code: process.env.PLAID_COUNTRY_CODE || 'US',
      }
    })
  };
};
