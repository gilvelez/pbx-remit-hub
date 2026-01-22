const { listBanks } = require('./bankStore');

async function circleHealth() {
  const useMocks = (process.env.CIRCLE_USE_MOCKS || '').toLowerCase() === 'true';
  const hasKey = !!(process.env.CIRCLE_API_KEY || '').trim();
  const hasTreasury = !!(process.env.CIRCLE_TREASURY_WALLET_ID || process.env.CIRCLE_MERCHANT_WALLET_ID);
  return { useMocks, hasKey, hasTreasury };
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: { 'content-type': 'application/json' }, body: JSON.stringify({ error: 'Method not allowed' }) };
  }
  const token = event.headers['x-session-token'] || '';
  let body = {};
  try { body = JSON.parse(event.body || '{}'); } catch (_) {}
  const amount = Number(body.amount);
  const bank_id = body.bank_id;

  if (!amount || amount <= 0) {
    return { statusCode: 400, headers: { 'content-type': 'application/json' }, body: JSON.stringify({ error: 'amount must be > 0' }) };
  }
  if (!bank_id) {
    return { statusCode: 400, headers: { 'content-type': 'application/json' }, body: JSON.stringify({ error: 'bank_id required' }) };
  }

  const banks = listBanks(token);
  const bank = banks.find(b => b.id === bank_id);
  if (!bank) {
    return { statusCode: 404, headers: { 'content-type': 'application/json' }, body: JSON.stringify({ error: 'bank not found' }) };
  }

  // Treasury-backed model: UI shows USD wallet only; backend checks Circle treasury readiness (sandbox)
  const circle = await circleHealth();

  return {
    statusCode: 200,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      success: true,
      transfer_id: `fund_${Date.now()}`,
      status: 'pending',
      estimated_arrival: '1-3 business days',
      message: 'Funding initiated (sandbox). Wallet credit is ledger-based; treasury backing checked server-side.',
      bank: { id: bank.id, institution_name: bank.institution_name, mask: bank.mask },
      treasury: { checked: true, ...circle },
    }),
  };
};
