/**
 * In-memory bank store for PBX MVP demo (serverless).
 * token -> [{ id, institution_name, institution_id, mask, status, createdAt, access_token }]
 *
 * IMPORTANT: Demo-only. Resets on cold starts.
 */
const bankMap = new Map();

function listBanks(token) {
  if (!token) return [];
  return bankMap.get(token) || [];
}

function addBank(token, bank) {
  if (!token) return null;
  const banks = bankMap.get(token) || [];
  banks.push(bank);
  bankMap.set(token, banks);
  return bank;
}

function removeBank(token, bankId) {
  if (!token) return false;
  const banks = bankMap.get(token) || [];
  const next = banks.filter(b => b.id !== bankId);
  bankMap.set(token, next);
  return next.length !== banks.length;
}

module.exports = { listBanks, addBank, removeBank };
