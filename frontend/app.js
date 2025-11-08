const logEl = document.getElementById('log');
const log = (...a) => (logEl.textContent += a.join(' ') + '\n');

async function createLink() {
  const r = await fetch('/api/plaid-create-link-token');
  const { link_token } = await r.json();
  return link_token;
}

async function exchange(public_token) {
  const r = await fetch('/api/plaid-exchange-public-token', {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({ public_token })
  });
  return r.json(); // { access_token, item_id, account_id }
}

async function runOrchestrator({ access_token, account_id, amount = 50 }) {
  const r = await fetch('/api/orchestrate-debit-mint-offramp', {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({ access_token, account_id, amount })
  });
  return r.json();
}

document.getElementById('link-btn').onclick = async () => {
  log('Creating link token…');
  const linkToken = await createLink();

  const handler = Plaid.create({
    token: linkToken,
    onSuccess: async (public_token, metadata) => {
      log('Public token:', public_token);
      log('Selected account:', metadata.accounts?.[0]?.id || '(none)');
      const x = await exchange(public_token);
      log('Exchanged for access_token (truncated):', (x.access_token||'').slice(0,8)+'…');
      const res = await runOrchestrator({ access_token: x.access_token, account_id: x.account_id, amount: 50 });
      log('Flow result:\n' + JSON.stringify(res, null, 2));
    },
    onExit: (err) => err && log('Exit error:', err)
  });

  handler.open();
};
