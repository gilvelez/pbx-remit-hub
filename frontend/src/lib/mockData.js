export const initialRecipients = [
  {
    id: "r1",
    name: "Maria Santos",
    handle: "@maria",
    country: "PH",
    payoutMethod: "GCASH",
    gcashNumber: "09171234567", // Added for real payout
  },
  {
    id: "r2",
    name: "Juan Dela Cruz",
    handle: "@juan",
    country: "PH",
    payoutMethod: "PBX_WALLET",
  },
  {
    id: "r3",
    name: "Ate Liza",
    handle: "@liza",
    country: "PH",
    payoutMethod: "BANK",
  },
  {
    id: "r4",
    name: "Tito Ben",
    handle: "@ben",
    country: "US",
    payoutMethod: "PBX_WALLET",
  },
];

export const initialBalances = {
  usd: 250.0,
  usdc: 120.0,
  pendingUsd: 0.0,
  php: 50000.0,  // PBX Wallet balance in PHP
};

export const initialTransfers = [
  {
    id: "t1",
    recipientId: "r1",
    amountUsd: 35,
    note: "Groceries",
    status: "completed",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: "t2",
    recipientId: "r3",
    amountUsd: 50,
    note: "School",
    status: "completed",
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
];
