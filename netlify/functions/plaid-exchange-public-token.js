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

export const handler = async (event) => {
  try {
    const { public_token } = JSON.parse(event.body || '{}');
    const tokenResp = await plaid.itemPublicTokenExchange({ public_token });
    // Choose first account deterministically (sandbox returns fake accounts)
    const auth = await plaid.authGet({ access_token: tokenResp.data.access_token });
    const account_id = auth.data.accounts?.[0]?.account_id || 'acct-demo-1';

    return {
      statusCode: 200,
      body: JSON.stringify({
        access_token: tokenResp.data.access_token,
        item_id: tokenResp.data.item_id,
        account_id
      })
    };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
  }
};
