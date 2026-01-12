/**
 * PBX Mock API Layer
 * Structured for easy replacement with real APIs later
 */

// Simulated FX rates (USD to PHP)
const BASE_RATE = 56.25;

// Mock delay to simulate network
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Rate fluctuation simulation
const getFluctuatedRate = () => {
  const fluctuation = (Math.random() - 0.5) * 0.5; // ±0.25
  return BASE_RATE + fluctuation;
};

/**
 * Get current FX quote
 * @returns {Promise<{rate: number, validUntil: Date, quoteId: string}>}
 */
export async function getQuote(amountUsd) {
  await delay(300);
  
  const rate = getFluctuatedRate();
  const validUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
  const quoteId = `quote_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  return {
    quoteId,
    rate: Math.round(rate * 100) / 100,
    amountUsd,
    amountPhp: Math.round(amountUsd * rate * 100) / 100,
    fee: 0, // PBX: No fees for now
    validUntil,
    expiresIn: 15 * 60, // seconds
  };
}

/**
 * Lock the FX rate for a transfer
 * @returns {Promise<{locked: boolean, lockId: string, expiresAt: Date}>}
 */
export async function lockRate(quoteId) {
  await delay(200);
  
  return {
    locked: true,
    lockId: `lock_${Date.now()}`,
    quoteId,
    expiresAt: new Date(Date.now() + 15 * 60 * 1000),
  };
}

/**
 * Create a transfer
 * @returns {Promise<{transferId: string, status: string, eta: string}>}
 */
export async function createTransfer(transferData) {
  await delay(500);
  
  const transferId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  return {
    transferId,
    status: 'processing',
    eta: 'Within minutes',
    recipient: transferData.recipient,
    amountUsd: transferData.amountUsd,
    amountPhp: transferData.amountPhp,
    rate: transferData.rate,
    paymentMethod: transferData.paymentMethod,
    deliveryMethod: transferData.deliveryMethod,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Link funding source (Plaid)
 * @returns {Promise<{linked: boolean, accountId: string, institution: string}>}
 */
export async function linkFundingSource(plaidToken) {
  await delay(800);
  
  return {
    linked: true,
    accountId: `acc_${Date.now()}`,
    institution: 'Chase Bank',
    accountType: 'checking',
    last4: '4567',
  };
}

/**
 * Get transfer history
 * @returns {Promise<Array>}
 */
export async function getTransfers() {
  await delay(300);
  
  // Return from local storage or empty
  const stored = localStorage.getItem('pbx_transfers');
  return stored ? JSON.parse(stored) : [];
}

/**
 * Save transfer to local storage
 */
export function saveTransfer(transfer) {
  const stored = localStorage.getItem('pbx_transfers');
  const transfers = stored ? JSON.parse(stored) : [];
  transfers.unshift(transfer);
  localStorage.setItem('pbx_transfers', JSON.stringify(transfers.slice(0, 50)));
}

/**
 * Get saved recipients
 * @returns {Promise<Array>}
 */
export async function getRecipients() {
  await delay(200);
  
  const stored = localStorage.getItem('pbx_recipients');
  return stored ? JSON.parse(stored) : [];
}

/**
 * Save recipient
 */
export function saveRecipient(recipient) {
  const stored = localStorage.getItem('pbx_recipients');
  const recipients = stored ? JSON.parse(stored) : [];
  
  // Check if already exists
  const exists = recipients.find(r => 
    r.phone === recipient.phone || 
    (r.accountNumber && r.accountNumber === recipient.accountNumber)
  );
  
  if (!exists) {
    recipients.unshift({
      ...recipient,
      id: `rec_${Date.now()}`,
      createdAt: new Date().toISOString(),
    });
    localStorage.setItem('pbx_recipients', JSON.stringify(recipients.slice(0, 20)));
  }
  
  return recipients;
}

/**
 * Get saved payment methods
 */
export async function getPaymentMethods() {
  await delay(200);
  
  const stored = localStorage.getItem('pbx_payment_methods');
  return stored ? JSON.parse(stored) : [];
}

/**
 * Save payment method
 */
export function savePaymentMethod(method) {
  const stored = localStorage.getItem('pbx_payment_methods');
  const methods = stored ? JSON.parse(stored) : [];
  methods.push({
    ...method,
    id: `pm_${Date.now()}`,
    createdAt: new Date().toISOString(),
  });
  localStorage.setItem('pbx_payment_methods', JSON.stringify(methods));
  return methods;
}

// Delivery method options
export const DELIVERY_METHODS = [
  { id: 'gcash', name: 'GCash', icon: '📱', eta: 'Instant' },
  { id: 'maya', name: 'Maya', icon: '📱', eta: 'Instant' },
  { id: 'bank', name: 'Bank Deposit', icon: '🏦', eta: '1-2 hours' },
  { id: 'cash', name: 'Cash Pickup', icon: '💵', eta: 'Same day' },
];

// Bank options (Philippines)
export const PH_BANKS = [
  { id: 'bpi', name: 'BPI' },
  { id: 'bdo', name: 'BDO' },
  { id: 'unionbank', name: 'UnionBank' },
  { id: 'metrobank', name: 'Metrobank' },
  { id: 'landbank', name: 'Landbank' },
  { id: 'pnb', name: 'PNB' },
  { id: 'securitybank', name: 'Security Bank' },
  { id: 'chinabank', name: 'China Bank' },
];

// Payment method options
export const PAYMENT_METHODS = [
  { 
    id: 'bank', 
    name: 'Bank Account', 
    fee: 0, 
    badge: 'Best', 
    description: 'Lowest cost • Fastest',
    requiresPlaid: true,
  },
  { 
    id: 'debit', 
    name: 'Debit Card', 
    fee: 0, 
    description: 'Fast & secure',
    requiresPlaid: false,
  },
  { 
    id: 'credit', 
    name: 'Credit Card', 
    fee: 2.9, 
    description: '+2.9% fee',
    requiresPlaid: false,
  },
  { 
    id: 'apple_pay', 
    name: 'Apple Pay', 
    fee: 0, 
    badge: 'Fast',
    description: 'One-tap payment',
    requiresPlaid: false,
  },
];
