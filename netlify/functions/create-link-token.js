const { Configuration, PlaidApi, PlaidEnvironments } = require('plaid');
const { isVerified, maybeCleanup } = require('./sessionStore');

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
  maybeCleanup();
  
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }
  
  try {
    // SECURITY: Check session verification before creating Plaid link token
    // MVP sandbox-only gate. Replace with real server-side session validation later.
    const token = event.headers['x-session-token'];
    const verified = event.headers['x-session-verified'] === 'true';
    
    if (!token || !verified) {
      console.log('[PLAID_LINK_REQUEST_BLOCKED]', { 
        token: token ? 'present' : 'missing',
        verified: verified,
        timestamp: new Date().toISOString()
      });
      
      return {
        statusCode: 403,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ 
          error: 'Verification required before connecting bank' 
        })
      };
    }
    
    console.log('[PLAID_LINK_REQUEST_ALLOWED]', { 
      token: token.substring(0, 8) + '...',
      verified: verified,
      timestamp: new Date().toISOString()
    });
    
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
