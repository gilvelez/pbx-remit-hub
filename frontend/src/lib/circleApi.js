/**
 * Circle API Client
 * Handles wallet creation, adding money (USDC minting), and balance queries
 * 
 * Note: User only sees USD amounts - USDC is a hidden implementation detail
 */

const API_BASE = process.env.REACT_APP_BACKEND_URL || '';

function getSessionToken() {
  try {
    const session = localStorage.getItem('pbx_session');
    if (session) {
      return JSON.parse(session).token;
    }
  } catch (e) {
    console.error('Failed to get session token:', e);
  }
  return null;
}

function getHeaders() {
  return {
    'Content-Type': 'application/json',
    'X-Session-Token': getSessionToken() || '',
  };
}

/**
 * Get Circle integration status
 */
export async function getCircleStatus() {
  try {
    const res = await fetch(`${API_BASE}/api/circle/status`, {
      headers: getHeaders(),
    });
    return await res.json();
  } catch (err) {
    console.error('getCircleStatus error:', err);
    return { enabled: false, mock_mode: true };
  }
}

/**
 * Create Circle wallet for user (called automatically on first add money)
 */
export async function createCircleWallet(blockchain = 'MATIC-AMOY') {
  const res = await fetch(`${API_BASE}/api/circle/create-wallet`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ blockchain }),
  });
  
  const data = await res.json();
  
  if (!res.ok) {
    throw new Error(data.detail || data.error || 'Failed to create wallet');
  }
  
  return data;
}

/**
 * Add money to wallet (mints USDC 1:1 with USD)
 * User only sees USD amount - USDC is hidden
 * 
 * @param {number} amount - Amount in USD to add
 * @returns {Promise<object>} Transaction result with new balance
 */
export async function addMoney(amount) {
  if (amount <= 0) {
    throw new Error('Amount must be greater than 0');
  }
  
  if (amount > 10000) {
    throw new Error('Maximum $10,000 per transaction');
  }
  
  const res = await fetch(`${API_BASE}/api/circle/mint-usdc`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ amount }),
  });
  
  const data = await res.json();
  
  if (!res.ok) {
    throw new Error(data.detail || data.error || 'Failed to add money');
  }
  
  return {
    success: data.success,
    transactionId: data.transaction_id,
    amountAdded: data.amount_usd,
    newBalance: data.new_balance_usd,
    message: data.message,
  };
}

/**
 * Get wallet balance
 * Returns USD balance (USDC is hidden from user)
 * 
 * @returns {Promise<object>} Balance info
 */
export async function getWalletBalance() {
  const res = await fetch(`${API_BASE}/api/circle/balance`, {
    headers: getHeaders(),
  });
  
  const data = await res.json();
  
  if (!res.ok) {
    throw new Error(data.detail || data.error || 'Failed to get balance');
  }
  
  return {
    usd: data.usd || 0,
    php: data.php || 0,
    // USDC is hidden from user - they only see USD
    hasWallet: !!data.circle_wallet?.wallet_id,
  };
}

/**
 * Combined add money flow:
 * 1. Creates wallet if needed
 * 2. Mints USDC (1:1 with USD)
 * 3. Returns new balance
 */
export async function addMoneyFlow(amount) {
  try {
    // The mint endpoint handles wallet creation automatically
    const result = await addMoney(amount);
    return result;
  } catch (err) {
    console.error('addMoneyFlow error:', err);
    throw err;
  }
}
