const { removeBank } = require('./bankStore');

exports.handler = async (event) => {
  if (event.httpMethod !== 'DELETE') {
    return { statusCode: 405, headers: { 'content-type': 'application/json' }, body: JSON.stringify({ error: 'Method not allowed' }) };
  }
  const token = event.headers['x-session-token'] || '';
  const bankId = (event.queryStringParameters && event.queryStringParameters.bank_id) || '';
  if (!bankId) return { statusCode: 400, headers: { 'content-type': 'application/json' }, body: JSON.stringify({ error: 'bank_id required' }) };

  removeBank(token, bankId);
  return { statusCode: 204, body: '' };
};
