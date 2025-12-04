// netlify/functions/pbx-create-transfer.js

const { paymongoRequest } = require('../../paymongoClient');

/**
 * PBX → PayMongo → PH bank / e-wallet
 *
 * Expected JSON body from frontend:
 * {
 *   "amountPhp": 1000.50,
 *   "institution_code": "BPI",      // from /v2/receiving_institutions
 *   "account_name": "Juan Dela Cruz",
 *   "account_number": "0123456789",
 *   "provider": "instapay",         // "instapay" | "pesonet" | "paymongo"
 *   "description": "PBX cash out",
 *   "reference_number": "PBX-12345", // optional
 *   "metadata": { ... }             // optional
 * }
 */
exports.handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: 'Method Not Allowed' }),
      };
    }

    const payload = JSON.parse(event.body || '{}');

    const {
      amountPhp,
      institution_code,
      account_name,
      account_number,
      provider,
      description,
      reference_number,
      metadata,
    } = payload;

    if (!amountPhp || !institution_code || !account_name || !account_number) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error:
            'amountPhp, institution_code, account_name, and account_number are required',
        }),
      };
    }

    // Convert PHP to centavos as per PayMongo standard (smallest unit)
    const amountInCentavos = Math.round(Number(amountPhp) * 100);

    // Provider: default to "instapay" (can be "pesonet" or "paymongo" depending on institution & config)
    const transferProvider = provider || 'instapay';

    // Build request for Transfer V2 - Create Batch Transfer
    // Endpoint: POST /v2/batch_transfers
    // See "Transfer V2 → Create Batch Transfer" and "Transfer Resource" docs.
    const body = {
      data: {
        attributes: {
          transfers: [
            {
              amount: amountInCentavos,
              currency: 'PHP',
              provider: transferProvider,
              destination_account: {
                number: account_number,
                name: account_name,
                bic: institution_code, // PayMongo uses "bic" as the bank/e-wallet code.
                bank_name: '', // optional; can be filled from institution name later
              },
              purpose: 'remittance',
              description: description || 'PBX transfer',
              reference_number:
                reference_number ||
                `PBX-${Date.now()}-${Math.floor(Math.random() * 9999)}`,
              callback_url: '', // optional: you can set a webhook URL here if needed
              metadata: metadata || {},
            },
          ],
        },
      },
    };

    const apiResponse = await paymongoRequest(
      'POST',
      '/v2/batch_transfers',
      body
    );

    return {
      statusCode: 200,
      body: JSON.stringify(apiResponse),
    };
  } catch (err) {
    console.error('pbx-create-transfer error', err);
    return {
      statusCode: err.status || 500,
      body: JSON.stringify({
        error: err.message || 'Unexpected error',
        raw: err.raw || null,
      }),
    };
  }
};
