export function mockCreateWallet({ ownerTag = 'pbx-user-123' }) {
  const id = 'wlt_' + Buffer.from(ownerTag).toString('hex').slice(0,12);
  return { id, ownerTag, balances: { USDC: '0' }, createdAt: new Date().toISOString() };
}

export function mockMintUSDC({ walletId, amount }) {
  return {
    id: 'mint_' + walletId.slice(-6),
    walletId,
    amount: String(amount),
    asset: 'USDC',
    txHash: '0x' + (walletId + amount).padStart(20, '0').slice(-20),
    status: 'confirmed',
    createdAt: new Date().toISOString()
  };
}

export function mockTransfer({ fromWalletId, toExternal, amount }) {
  return {
    id: 'xfer_' + fromWalletId.slice(-6),
    route: toExternal.type, // e.g., "gcash" | "ph_bank"
    amount: String(amount),
    asset: 'USDC',
    quoteFx: { usdToPhp: 56.25, feesUsd: 0.50, feesPhp: Math.round(0.50 * 56.25) },
    status: 'delivered',
    reference: 'PBX-' + Date.now()
  };
}
