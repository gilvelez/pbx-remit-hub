// PBX Function: Plaid Link Token Generator
// Creates a sandbox link_token used to initialize Plaid Link.

exports.handler = async (event) => {
  try {
    // Extract environment variables (Netlify injects these)
    const PLAID_CLIENT_ID = process.env.PLAID_CLIENT_ID;
    const PLAID_SECRET = process.env.PLAID_SECRET;
    const PLAID_ENV = process.env.PLAID_ENV || 'sandbox';
    const APP_BASE_URL = process.env.APP_BASE_URL;
    
    // Validate required environment variables
    if (!PLAID_CLIENT_ID || !PLAID_SECRET) {
      throw new Error('Missing required Plaid credentials in environment variables');
    }

    const { client_user_id = "pbx-demo-user" } = JSON.parse(event.body || "{}");

    // Construct Plaid API URL based on environment
    const plaidApiUrl = PLAID_ENV === 'production' 
      ? 'https://production.plaid.com/link/token/create'
      : 'https://sandbox.plaid.com/link/token/create';

    const response = await fetch(plaidApiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: PLAID_CLIENT_ID,
        secret: PLAID_SECRET,
        user: { client_user_id },
        client_name: "Philippine Bayani Exchange",
        products: ["auth"],
        language: "en",
        country_codes: ["US"],
        redirect_uri: `${APP_BASE_URL}/plaid/callback`
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(`Plaid error: ${JSON.stringify(data)}`);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ link_token: data.link_token }),
      headers: { "Content-Type": "application/json" }
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
      headers: { "Content-Type": "application/json" }
    };
  }
};
