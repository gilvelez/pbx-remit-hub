/**
 * Link Bank - Exchange Plaid public_token and store linked bank
 * 
 * Flow:
 * 1. Receive public_token + metadata from Plaid Link
 * 2. Exchange for access_token (if not MOCK mode)
 * 3. Store bank in MongoDB with user_id
 * 4. Return success with bank details (no access_token)
 */
const { Configuration, PlaidApi, PlaidEnvironments } = require('plaid');
const { addBank, getUserId } = require('./bankStore');

const PLAID_MODE = (process.env.PLAID_MODE || 'SANDBOX').toUpperCase();

// MongoDB connection
let MongoClient = null;
const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URL;
const DB_NAME = process.env.DB_NAME || 'pbx_database';

if (MONGODB_URI) {
  try {
    MongoClient = require('mongodb').MongoClient;
  } catch (e) {
    console.warn('[banks-link] MongoDB not available');
  }
}

async function getDb() {
  if (!MongoClient || !MONGODB_URI) return null;
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  return { client, db: client.db(DB_NAME) };
}

function makeId() {
  return `bank_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function plaidClient() {
  const config = new Configuration({
    basePath: PlaidEnvironments[process.env.PLAID_ENV || 'sandbox'],
    baseOptions: {
      headers: {
        'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
        'PLAID-SECRET': process.env.PLAID_SECRET,
      },
    },
  });
  return new PlaidApi(config);
}

exports.handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, X-Session-Token, X-Session-Verified',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const token = event.headers['x-session-token'] || '';
  const verifiedHeader = (event.headers['x-session-verified'] || '').toLowerCase() === 'true';
  const user_id = getUserId(token);

  // In production, verify session from DB
  // For now, trust the header if passed
  if (!token) {
    return { statusCode: 403, headers, body: JSON.stringify({ error: 'Session token required' }) };
  }

  let body = {};
  try { body = JSON.parse(event.body || '{}'); } catch (_) {}

  // Extract metadata from Plaid Link callback
  const public_token = body.public_token;
  const institution = body.institution || {};
  const institution_name = body.institution_name || institution.name || 'Linked Bank';
  const institution_id = body.institution_id || institution.institution_id || '';
  const accounts = Array.isArray(body.accounts) ? body.accounts : [];
  const firstAccount = accounts[0] || {};
  const mask = firstAccount.mask || '0000';
  const account_type = firstAccount.subtype || firstAccount.type || 'checking';
  const account_name = firstAccount.name || '';

  console.log('[banks-link] Linking bank:', { 
    user_id, 
    institution_name, 
    mode: PLAID_MODE,
    hasPublicToken: !!public_token 
  });

  // Build bank record
  const bankRecord = {
    id: makeId(),
    user_id,
    institution_name,
    institution_id,
    mask,
    last4: mask,
    account_type,
    account_name,
    status: 'linked',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  // MOCK mode - skip Plaid exchange, just store
  if (PLAID_MODE === 'MOCK') {
    console.log('[banks-link] MOCK mode - storing without Plaid exchange');
    
    // Store in MongoDB
    const connection = await getDb();
    if (connection) {
      const { client, db } = connection;
      try {
        await db.collection('linked_banks').insertOne(bankRecord);
      } finally {
        await client.close();
      }
    }
    
    // Also use addBank for fallback
    await addBank(token, bankRecord);
    
    return { 
      statusCode: 200, 
      headers, 
      body: JSON.stringify({ 
        success: true, 
        bank: {
          id: bankRecord.id,
          institution_name: bankRecord.institution_name,
          mask: bankRecord.mask,
          account_type: bankRecord.account_type,
          status: 'linked',
        },
        mode: 'MOCK'
      }) 
    };
  }

  // SANDBOX/PRODUCTION - require public_token
  if (!public_token) {
    return { 
      statusCode: 400, 
      headers, 
      body: JSON.stringify({ error: 'public_token required for bank linking' }) 
    };
  }

  try {
    const client = plaidClient();

    // Exchange public_token for access_token
    console.log('[banks-link] Exchanging public_token...');
    const exchangeResp = await client.itemPublicTokenExchange({ public_token });
    const access_token = exchangeResp.data.access_token;
    const item_id = exchangeResp.data.item_id;

    // Get account details for better display
    let resolvedMask = mask;
    let resolvedType = account_type;
    try {
      const acctResp = await client.accountsGet({ access_token });
      const acc = (acctResp.data.accounts || [])[0];
      if (acc) {
        resolvedMask = acc.mask || mask;
        resolvedType = acc.subtype || acc.type || account_type;
      }
    } catch (e) {
      console.warn('[banks-link] Could not fetch account details:', e.message);
    }

    // Update bank record with Plaid data
    bankRecord.mask = resolvedMask;
    bankRecord.last4 = resolvedMask;
    bankRecord.account_type = resolvedType;
    bankRecord.access_token = access_token; // Stored securely in DB
    bankRecord.item_id = item_id;
    bankRecord.status = 'verified';

    // Store in MongoDB
    const connection = await getDb();
    if (connection) {
      const { db: database, client: mongoClient } = connection;
      try {
        await database.collection('linked_banks').insertOne(bankRecord);
        console.log('[banks-link] Bank stored in MongoDB');
      } finally {
        await mongoClient.close();
      }
    }

    // Also use addBank for fallback
    await addBank(token, bankRecord);

    return { 
      statusCode: 200, 
      headers, 
      body: JSON.stringify({ 
        success: true, 
        bank: {
          id: bankRecord.id,
          institution_name: bankRecord.institution_name,
          mask: bankRecord.mask,
          account_type: bankRecord.account_type,
          status: 'verified',
        },
        mode: 'SANDBOX'
      }) 
    };

  } catch (err) {
    console.error('[banks-link] Error:', err.response?.data || err.message);
    return { 
      statusCode: 500, 
      headers, 
      body: JSON.stringify({ 
        error: 'Failed to link bank', 
        detail: err.response?.data?.error_message || err.message 
      }) 
    };
  }
};
