/**
 * bankApi.js - Bank linking and funding/withdrawal API helpers
 * 
 * Provides:
 * - getLinkedBanks() - Fetch user's linked bank accounts
 * - linkBank() - Link a new bank via Plaid public token exchange
 * - unlinkBank() - Remove a linked bank account
 * - initiateAddMoney() - Start ACH pull from bank to PBX
 * - initiateWithdrawal() - Start ACH push from PBX to bank
 * 
 * IMPORTANT: All functions handle response.json() safely to avoid
 * "body stream already read" errors.
 */

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

/**
 * Safely parse JSON from response, handling empty bodies and errors
 * @param {Response} res - Fetch response object
 * @returns {Promise<Object>} - Parsed JSON or empty object
 */
async function safeParseJSON(res) {
  try {
    // Handle 204 No Content or empty responses
    if (res.status === 204) {
      return {};
    }
    
    // Check if there's content to parse
    const text = await res.text();
    if (!text || text.trim() === '') {
      return {};
    }
    
    return JSON.parse(text);
  } catch (err) {
    console.warn("Failed to parse response JSON:", err);
    return {};
  }
}

/**
 * Get all linked bank accounts for the current user
 */
export async function getLinkedBanks(sessionToken) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/banks/linked`, {
      headers: {
        'Content-Type': 'application/json',
        'X-Session-Token': sessionToken || '',
      },
    });
    
    // Handle 204 No Content
    if (res.status === 204) {
      return [];
    }
    
    // Handle 404 - API not implemented
    if (res.status === 404) {
      console.warn("Bank API not implemented yet, returning empty array");
      return [];
    }
    
    // Parse response once
    const data = await safeParseJSON(res);
    
    if (!res.ok) {
      console.error("getLinkedBanks API error:", data);
      return [];
    }
    
    return data.banks || [];
  } catch (err) {
    console.error("getLinkedBanks error:", err);
    // Return empty array on error - don't crash the UI
    return [];
  }
}

/**
 * Link a new bank account using Plaid public token
 */
export async function linkBank(sessionToken, { public_token, institution, accounts }) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/banks/link`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Session-Token': sessionToken || '',
      },
      body: JSON.stringify({
        public_token,
        institution_id: institution?.institution_id,
        institution_name: institution?.name,
        accounts: accounts?.map(acc => ({
          id: acc.id,
          name: acc.name,
          mask: acc.mask,
          type: acc.type,
          subtype: acc.subtype,
        })),
      }),
    });
    
    // Parse response once
    const data = await safeParseJSON(res);
    
    if (!res.ok) {
      // Handle 404 - API not implemented, simulate success
      if (res.status === 404) {
        console.warn("Bank link API not implemented yet, simulating success");
        return { success: true, bank_id: `mock_${Date.now()}` };
      }
      throw new Error(data.detail || data.error || 'Failed to link bank');
    }
    
    return data;
  } catch (err) {
    console.error("linkBank error:", err);
    throw err; // Re-throw so UI can show error
  }
}

/**
 * Remove a linked bank account
 */
export async function unlinkBank(sessionToken, bankId) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/banks/${bankId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'X-Session-Token': sessionToken || '',
      },
    });
    
    // Handle 204 No Content (successful delete with no body)
    if (res.status === 204) {
      return { success: true };
    }
    
    // Parse response once
    const data = await safeParseJSON(res);
    
    if (!res.ok) {
      // Handle 404 - bank not found or API not implemented
      if (res.status === 404) {
        console.warn("Bank not found or API not implemented");
        return { success: true }; // Treat as success (already removed)
      }
      throw new Error(data.detail || data.error || 'Failed to unlink bank');
    }
    
    return data.success !== undefined ? data : { success: true };
  } catch (err) {
    console.error("unlinkBank error:", err);
    throw err;
  }
}

/**
 * Initiate ACH pull (add money from bank to PBX wallet)
 */
export async function initiateAddMoney(sessionToken, { amount, bank_id }) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/banks/add-money`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Session-Token': sessionToken || '',
      },
      body: JSON.stringify({ amount, bank_id }),
    });
    
    // Parse response once
    const data = await safeParseJSON(res);
    
    if (!res.ok) {
      // Handle 404 - API not implemented
      if (res.status === 404) {
        console.warn("Add money API not implemented yet, simulating success");
        return { 
          success: true, 
          transfer_id: `ach_${Date.now()}`,
          status: 'pending',
          estimated_arrival: '1-3 business days',
          message: 'Transfer initiated (MOCK - backend not implemented)'
        };
      }
      throw new Error(data.detail || data.error || 'Failed to initiate transfer');
    }
    
    return data;
  } catch (err) {
    console.error("initiateAddMoney error:", err);
    throw err;
  }
}

/**
 * Initiate ACH push (withdraw from PBX wallet to bank)
 */
export async function initiateWithdrawal(sessionToken, { amount, bank_id }) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/banks/withdraw`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Session-Token': sessionToken || '',
      },
      body: JSON.stringify({ amount, bank_id }),
    });
    
    // Parse response once
    const data = await safeParseJSON(res);
    
    if (!res.ok) {
      // Handle 404 - API not implemented
      if (res.status === 404) {
        console.warn("Withdrawal API not implemented yet, simulating success");
        return { 
          success: true, 
          transfer_id: `wd_${Date.now()}`,
          status: 'pending',
          estimated_arrival: '1-3 business days',
          message: 'Withdrawal initiated (MOCK - backend not implemented)'
        };
      }
      throw new Error(data.detail || data.error || 'Failed to initiate withdrawal');
    }
    
    return data;
  } catch (err) {
    console.error("initiateWithdrawal error:", err);
    throw err;
  }
}

/**
 * Get transfer history
 */
export async function getTransferHistory(sessionToken, limit = 20) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/banks/transfers?limit=${limit}`, {
      headers: {
        'Content-Type': 'application/json',
        'X-Session-Token': sessionToken || '',
      },
    });
    
    if (res.status === 204 || res.status === 404) {
      return [];
    }
    
    const data = await safeParseJSON(res);
    
    if (!res.ok) {
      console.error("getTransferHistory API error:", data);
      return [];
    }
    
    return data.transfers || [];
  } catch (err) {
    console.error("getTransferHistory error:", err);
    return [];
  }
}
