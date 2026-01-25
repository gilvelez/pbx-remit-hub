// === PBX Unified API Bridge ===
// Works for all Netlify functions (Plaid, Circle, etc.)

const API_BASE = process.env.REACT_APP_NETLIFY_URL || process.env.REACT_APP_BACKEND_URL || '';

export async function api(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: options.method || "POST",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  
  // Read body ONCE
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch (e) {
    data = { error: text };
  }
  
  if (!res.ok) {
    throw new Error(data.error || data.message || text || 'Request failed');
  }
  
  return data;
}

// Example helper to get a Plaid link token
export async function getPlaidLinkToken(userId = "pbx-demo-user") {
  return api("/.netlify/functions/plaid-link-token", {
    body: { client_user_id: userId }
  });
}

// Example helper to exchange public token
export async function exchangePublicToken(public_token) {
  return api("/.netlify/functions/plaid-exchange-public-token", {
    body: { public_token }
  });
}

// Example helper to create a Circle payment
export async function createCirclePayment(payload) {
  return api("/.netlify/functions/circle-create-payment", {
    body: payload
  });
}

// Lead management helpers
export async function createLead(email) {
  return api("/.netlify/functions/create-lead", {
    body: { email }
  });
}

export async function getLeads() {
  return api("/.netlify/functions/get-leads", {
    method: "GET"
  });
}
