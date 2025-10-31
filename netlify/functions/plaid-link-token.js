// PBX Function: Plaid Link Token Generator
// Creates a sandbox link_token used to initialize Plaid Link.

exports.handler = async (event) => {
  try {
    const { client_user_id = "pbx-demo-user" } = JSON.parse(event.body || "{}");

    const response = await fetch("https://sandbox.plaid.com/link/token/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: process.env.PLAID_CLIENT_ID,
        secret: process.env.PLAID_SECRET,
        user: { client_user_id },
        client_name: "Philippine Bayani Exchange",
        products: ["auth"],
        language: "en",
        country_codes: ["US"],
        redirect_uri: `${process.env.APP_BASE_URL}/plaid/callback`
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
