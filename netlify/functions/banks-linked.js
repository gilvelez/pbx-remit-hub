const { listBanks } = require('./bankStore');

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, headers: { 'content-type': 'application/json' }, body: JSON.stringify({ error: 'Method not allowed' }) };
  }
  const token = event.headers['x-session-token'] || '';
  const banks = listBanks(token).map(({ access_token, ...safe }) => safe);
  return { statusCode: 200, headers: { 'content-type': 'application/json' }, body: JSON.stringify({ banks }) };
};
