/**
 * PBX Recipient - API Client
 * Handles all API calls for the recipient dashboard
 */

const API_BASE = '/.netlify/functions';

// Get session token from storage
const getSessionToken = () => {
  try {
    const session = sessionStorage.getItem('pbx_session');
    if (session) {
      const parsed = JSON.parse(session);
      return parsed.token;
    }
  } catch (e) {
    console.error('Failed to get session token:', e);
  }
  return null;
};

// Common headers
const getHeaders = () => ({
  'Content-Type': 'application/json',
  'X-Session-Token': getSessionToken() || '',
});

// === WALLET API ===
export async function getWalletBalances() {
  const res = await fetch(`${API_BASE}/recipient-wallet`, {
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch wallet');
  return res.json();
}

export async function allocateSubWallet(subWallet, amount) {
  const res = await fetch(`${API_BASE}/recipient-wallet`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ action: 'allocate_sub_wallet', sub_wallet: subWallet, amount }),
  });
  if (!res.ok) throw new Error('Failed to allocate sub-wallet');
  return res.json();
}

// === FX CONVERSION API ===
export async function getFxQuote(amountUsd = 100) {
  const res = await fetch(`${API_BASE}/recipient-convert?amount_usd=${amountUsd}`, {
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch FX quote');
  return res.json();
}

export async function lockFxRate(amountUsd, rate) {
  const res = await fetch(`${API_BASE}/recipient-convert`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ action: 'lock_rate', amount_usd: amountUsd, locked_rate: rate }),
  });
  if (!res.ok) throw new Error('Failed to lock rate');
  return res.json();
}

export async function convertCurrency(amountUsd, lockedRate, lockId) {
  const res = await fetch(`${API_BASE}/recipient-convert`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ 
      action: 'convert', 
      amount_usd: amountUsd, 
      locked_rate: lockedRate,
      lock_id: lockId,
    }),
  });
  if (!res.ok) throw new Error('Failed to convert');
  return res.json();
}

// === BILLS API ===
export async function getBillers() {
  const res = await fetch(`${API_BASE}/recipient-bills?type=billers`, {
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch billers');
  return res.json();
}

export async function getSavedBillers() {
  const res = await fetch(`${API_BASE}/recipient-bills?type=saved`, {
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch saved billers');
  return res.json();
}

export async function getBillPaymentHistory() {
  const res = await fetch(`${API_BASE}/recipient-bills?type=history`, {
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch bill history');
  return res.json();
}

export async function payBill(billerCode, accountNo, amount, saveBiller = false, nickname = '') {
  const res = await fetch(`${API_BASE}/recipient-bills`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ 
      action: 'pay', 
      biller_code: billerCode, 
      account_no: accountNo, 
      amount,
      save_biller: saveBiller,
      nickname,
    }),
  });
  if (!res.ok) throw new Error('Failed to pay bill');
  return res.json();
}

export async function saveBiller(billerCode, accountNo, nickname) {
  const res = await fetch(`${API_BASE}/recipient-bills`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ action: 'save_biller', biller_code: billerCode, account_no: accountNo, nickname }),
  });
  if (!res.ok) throw new Error('Failed to save biller');
  return res.json();
}

// === TRANSFERS API ===
export async function getTransferMethods() {
  const res = await fetch(`${API_BASE}/recipient-transfers?type=methods`, {
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch transfer methods');
  return res.json();
}

export async function getTransferHistory() {
  const res = await fetch(`${API_BASE}/recipient-transfers?type=history`, {
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch transfer history');
  return res.json();
}

export async function createTransfer(method, amount, recipientAccount, recipientName, bankCode = null) {
  const res = await fetch(`${API_BASE}/recipient-transfers`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ 
      action: 'transfer', 
      method, 
      amount, 
      recipient_account: recipientAccount,
      recipient_name: recipientName,
      bank_code: bankCode,
    }),
  });
  if (!res.ok) throw new Error('Failed to create transfer');
  return res.json();
}

// === STATEMENTS API ===
export async function getStatements(options = {}) {
  const params = new URLSearchParams();
  if (options.startDate) params.set('start_date', options.startDate);
  if (options.endDate) params.set('end_date', options.endDate);
  if (options.type) params.set('type', options.type);
  if (options.currency) params.set('currency', options.currency);
  if (options.limit) params.set('limit', options.limit);

  const res = await fetch(`${API_BASE}/recipient-statements?${params}`, {
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch statements');
  return res.json();
}

export async function exportStatementPdf(startDate, endDate) {
  const res = await fetch(`${API_BASE}/recipient-statements`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ action: 'export_pdf', start_date: startDate, end_date: endDate }),
  });
  if (!res.ok) throw new Error('Failed to export PDF');
  return res.json();
}
