/**
 * PBX Internal Transfers API Client
 * Handles PBX-to-PBX closed-loop transfers
 */

const API_BASE = process.env.REACT_APP_BACKEND_URL || '';

// Get session token from localStorage
const getSessionToken = () => {
  try {
    const session = localStorage.getItem('pbx_session');
    if (session) {
      const parsed = JSON.parse(session);
      return parsed.token;
    }
  } catch (e) {
    console.error('Failed to get session token:', e);
  }
  return null;
};

const getHeaders = () => ({
  'Content-Type': 'application/json',
  'X-Session-Token': getSessionToken() || '',
});


/**
 * Look up a PBX user by email or phone number
 * @param {string} identifier - Email or phone (E.164 format)
 * @returns {Promise<{found: boolean, user?: object, message?: string}>}
 */
export async function lookupPbxUser(identifier) {
  const res = await fetch(`${API_BASE}/api/internal/lookup`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ identifier }),
  });
  
  // Read body ONCE
  const data = await res.json().catch(() => ({}));
  
  if (!res.ok && res.status !== 404) {
    throw new Error(data.detail || 'Failed to look up user');
  }
  
  return data;
}


/**
 * Execute a PBX-to-PBX internal transfer
 * @param {object} params
 * @param {string} params.recipient_identifier - Recipient email or phone
 * @param {number} params.amount_usd - Amount in USD
 * @param {string} [params.note] - Optional note
 * @returns {Promise<object>} Transfer result
 */
export async function createInternalTransfer({ recipient_identifier, amount_usd, note }) {
  const res = await fetch(`${API_BASE}/api/internal/transfer`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ recipient_identifier, amount_usd, note }),
  });
  
  // Read body ONCE
  const data = await res.json().catch(() => ({}));
  
  if (!res.ok) {
    throw new Error(data.detail || 'Transfer failed');
  }
  
  return data;
}


/**
 * Get incoming PBX-to-PBX transfers
 * @param {number} [limit=10] - Number of transfers to fetch
 * @returns {Promise<{transfers: array}>}
 */
export async function getIncomingTransfers(limit = 10) {
  const res = await fetch(`${API_BASE}/api/internal/incoming?limit=${limit}`, {
    headers: getHeaders(),
  });
  
  // Read body ONCE
  const data = await res.json().catch(() => ({}));
  
  if (!res.ok) {
    throw new Error(data.detail || 'Failed to get incoming transfers');
  }
  
  return data;
}


/**
 * Generate an invite message for a non-PBX user
 * @param {string} identifier - Email or phone of person to invite
 * @returns {Promise<{success: boolean, message: string, invite_link: string}>}
 */
export async function generateInvite(identifier) {
  const res = await fetch(`${API_BASE}/api/internal/invite`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ identifier }),
  });
  
  // Read body ONCE
  const data = await res.json().catch(() => ({}));
  
  if (!res.ok) {
    throw new Error(data.detail || 'Failed to generate invite');
  }
  
  return data;
}


/**
 * Send an invite to a non-PBX user via SMS or Email
 * @param {string} method - 'sms' or 'email'
 * @param {string} identifier - Phone number or email address
 * @returns {Promise<{success: boolean, message: string}>}
 */
export async function inviteToPbx(method, identifier) {
  // First generate the invite message
  const inviteData = await generateInvite(identifier);
  
  // In production, this would trigger actual SMS/email
  // For now, log and return success (mock mode)
  console.log(`Invite via ${method}:`, inviteData.message);
  
  return {
    success: true,
    method,
    identifier,
    message: inviteData.message,
    invite_link: inviteData.invite_link,
  };
}


/**
 * Search PBX users by name, username, phone, or email
 * @param {string} query - Search query
 * @returns {Promise<{users: array}>}
 */
export async function searchPbxUsers(query) {
  const res = await fetch(`${API_BASE}/api/users/search?q=${encodeURIComponent(query)}`, {
    headers: getHeaders(),
  });
  
  if (!res.ok) {
    // If endpoint doesn't exist yet, fall back to lookup
    return { users: [] };
  }
  
  return res.json();
}
