// netlify/functions/pbx-list-institutions.js

const { paymongoRequest } = require('../../paymongoClient');

/**
 * Simple pass-through to PayMongo's "Get Receiving Institutions" endpoint
 * so PBX frontend can show a dropdown of banks / e-wallets.
 */
exports.handler = async (event) => {
  try {
    if (event.httpMethod !== 'GET') {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: 'Method Not Allowed' }),
      };
    }

    // Transfer V2 → Get Receiving Institutions: /v2/receiving_institutions
    const apiResponse = await paymongoRequest(
      'GET',
      '/v2/receiving_institutions'
    );

    return {
      statusCode: 200,
      body: JSON.stringify(apiResponse),
    };
  } catch (err) {
    console.error('pbx-list-institutions error', err);
    return {
      statusCode: err.status || 500,
      body: JSON.stringify({
        error: err.message || 'Unexpected error',
        raw: err.raw || null,
      }),
    };
  }
};
