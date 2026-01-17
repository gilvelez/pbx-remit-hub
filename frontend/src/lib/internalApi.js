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
  
  if (!res.ok && res.status !== 404) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.detail || 'Failed to look up user');
  }
  
  return res.json();
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
  
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.detail || 'Transfer failed');
  }
  
  return res.json();
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
  
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.detail || 'Failed to get incoming transfers');
  }
  
  return res.json();
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
  
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.detail || 'Failed to generate invite');
  }
  
  return res.json();
}
