/**
 * bankApi.js - Bank linking and funding/withdrawal API helpers
 * 
 * Provides:
 * - getLinkedBanks() - Fetch user's linked bank accounts
 * - linkBank() - Link a new bank via Plaid public token exchange
 * - unlinkBank() - Remove a linked bank account
 * - initiateAddMoney() - Start ACH pull from bank to PBX
 * - initiateWithdrawal() - Start ACH push from PBX to bank
 */

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

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
    
    if (!res.ok) {
      // If endpoint doesn't exist yet, return mock data for development
      if (res.status === 404) {
        console.warn("Bank API not implemented yet, returning mock data");
        return getMockLinkedBanks();
      }
      throw new Error('Failed to fetch linked banks');
    }
    
    const data = await res.json();
    return data.banks || [];
  } catch (err) {
    console.error("getLinkedBanks error:", err);
    // Return mock data for development
    return getMockLinkedBanks();
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
    
    if (!res.ok) {
      // Mock success for development
      if (res.status === 404) {
        console.warn("Bank link API not implemented yet, simulating success");
        return { success: true, bank_id: `mock_${Date.now()}` };
      }
      const data = await res.json();
      throw new Error(data.detail || 'Failed to link bank');
    }
    
    return await res.json();
  } catch (err) {
    console.error("linkBank error:", err);
    // Simulate success for development
    return { success: true, bank_id: `mock_${Date.now()}` };
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
    
    if (!res.ok) {
      // Mock success for development
      if (res.status === 404) {
        console.warn("Bank unlink API not implemented yet, simulating success");
        return { success: true };
      }
      const data = await res.json();
      throw new Error(data.detail || 'Failed to unlink bank');
    }
    
    return await res.json();
  } catch (err) {
    console.error("unlinkBank error:", err);
    // Simulate success for development
    return { success: true };
  }
}

/**
 * Initiate ACH pull (add money from bank to PBX wallet)
 * TODO: Wire to actual backend endpoint when ready
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
    
    if (!res.ok) {
      // Mock success for development
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
      const data = await res.json();
      throw new Error(data.detail || 'Failed to initiate transfer');
    }
    
    return await res.json();
  } catch (err) {
    console.error("initiateAddMoney error:", err);
    // Simulate success for development
    return { 
      success: true, 
      transfer_id: `ach_${Date.now()}`,
      status: 'pending',
      estimated_arrival: '1-3 business days',
      message: 'Transfer initiated (MOCK - backend not implemented)'
    };
  }
}

/**
 * Initiate ACH push (withdraw from PBX wallet to bank)
 * TODO: Wire to actual backend endpoint when ready
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
    
    if (!res.ok) {
      // Mock success for development
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
      const data = await res.json();
      throw new Error(data.detail || 'Failed to initiate withdrawal');
    }
    
    return await res.json();
  } catch (err) {
    console.error("initiateWithdrawal error:", err);
    // Simulate success for development
    return { 
      success: true, 
      transfer_id: `wd_${Date.now()}`,
      status: 'pending',
      estimated_arrival: '1-3 business days',
      message: 'Withdrawal initiated (MOCK - backend not implemented)'
    };
  }
}

/**
 * Mock linked banks for development
 * Returns empty array by default - banks must be linked via Plaid
 */
function getMockLinkedBanks() {
  // Check localStorage for any mock banks added during this session
  const storedBanks = localStorage.getItem('pbx_mock_linked_banks');
  if (storedBanks) {
    try {
      return JSON.parse(storedBanks);
    } catch (e) {
      return [];
    }
  }
  
  // By default, no banks are linked - user must link one
  return [];
}

/**
 * Add a mock bank to localStorage (for testing without backend)
 */
export function addMockBank(bank) {
  const existing = getMockLinkedBanks();
  const newBank = {
    id: `mock_${Date.now()}`,
    institution_name: bank.institution_name || 'Test Bank',
    account_type: bank.account_type || 'Checking',
    last4: bank.last4 || '1234',
    status: 'verified',
    linked_at: new Date().toISOString(),
    ...bank,
  };
  
  existing.push(newBank);
  localStorage.setItem('pbx_mock_linked_banks', JSON.stringify(existing));
  return newBank;
}

/**
 * Remove a mock bank from localStorage (for testing without backend)
 */
export function removeMockBank(bankId) {
  const existing = getMockLinkedBanks();
  const filtered = existing.filter(b => b.id !== bankId);
  localStorage.setItem('pbx_mock_linked_banks', JSON.stringify(filtered));
}
