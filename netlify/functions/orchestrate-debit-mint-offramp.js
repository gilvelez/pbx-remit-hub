import { mockCreateWallet, mockMintUSDC, mockTransfer } from './circle-mock.js';

/**
 * In Plan B, we DO NOT actually hit Circle.
 * We (a) verify we have a Plaid access_token (but skip real ACH),
 * (b) "mint" mock USDC to a new wallet, then
 * (c) "off-ramp" to a mocked PH rail with a quote & receipt.
 */
export const handler = async (event) => {
  try {
    const { access_token, account_id, amount = 25, recipient = { type: 'gcash', handle: '09171234567' } } =
      JSON.parse(event.body || '{}');

    if (!access_token || !account_id) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing access_token or account_id' }) };
    }

    // (1) Fake "debit" pre-check (we just echo)
    const debitCheck = { ok: true, method: 'ACH (sandbox)', account_id, maxDebitAllowed: 2500 };

    // (2) Create a mock "Circle" wallet & mint USDC equal to amount
    const wallet = mockCreateWallet({ ownerTag: 'pbx-user-123' });
    const mint = mockMintUSDC({ walletId: wallet.id, amount });

    // (3) Off-ramp to PH rail (mock quote + delivery)
    const payout = mockTransfer({
      fromWalletId: wallet.id,
      toExternal: recipient,
      amount
    });

    const result = {
      step1_debit_check: debitCheck,
      step2_mint: mint,
      step3_offramp: payout,
      receipt: {
        usd: amount,
        php: Math.round(amount * payout.quoteFx.usdToPhp),
        fx_rate: payout.quoteFx.usdToPhp,
        fees_usd: payout.quoteFx.feesUsd,
        delivered_to: recipient
      }
    };

    return { statusCode: 200, body: JSON.stringify(result) };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
  }
};
