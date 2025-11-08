import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid';

const config = new Configuration({
  basePath: PlaidEnvironments[process.env.PLAID_ENV || 'sandbox'],
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
      'PLAID-SECRET': process.env.PLAID_SECRET
    }
  }
});
const plaid = new PlaidApi(config);

export const handler = async () => {
  try {
    const resp = await plaid.linkTokenCreate({
      client_name: 'PBX Plan B',
      language: 'en',
      country_codes: (process.env.PLAID_COUNTRY_CODES || 'US').split(','),
      products: (process.env.PLAID_PRODUCTS || 'auth').split(','),
      user: { client_user_id: 'demo-user-123' }
    });
    return { statusCode: 200, body: JSON.stringify({ link_token: resp.data.link_token }) };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
  }
};
