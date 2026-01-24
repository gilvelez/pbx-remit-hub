/**
 * List Linked Banks - Fetch user's linked bank accounts
 * 
 * Returns banks from MongoDB (or in-memory fallback)
 * Never exposes access_token to frontend
 */
const { listBanks, getUserId } = require('./bankStore');

// MongoDB connection for direct query
let MongoClient = null;
const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URL;
const DB_NAME = process.env.DB_NAME || 'pbx_database';

if (MONGODB_URI) {
  try {
    MongoClient = require('mongodb').MongoClient;
  } catch (e) {
    console.warn('[banks-linked] MongoDB not available');
  }
}

async function getDb() {
  if (!MongoClient || !MONGODB_URI) return null;
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  return { client, db: client.db(DB_NAME) };
}

exports.handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, X-Session-Token',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const token = event.headers['x-session-token'] || '';
  const user_id = getUserId(token);

  console.log('[banks-linked] Fetching banks for user:', user_id);

  // Try MongoDB first
  const connection = await getDb();
  if (connection) {
    const { client, db } = connection;
    try {
      const banks = await db.collection('linked_banks')
        .find({ user_id })
        .project({ 
          access_token: 0,  // Never expose
          item_id: 0,
          _id: 0
        })
        .sort({ createdAt: -1 })
        .toArray();
      
      console.log('[banks-linked] Found', banks.length, 'banks in MongoDB');
      
      return { 
        statusCode: 200, 
        headers, 
        body: JSON.stringify({ 
          banks: banks.map(b => ({
            id: b.id,
            institution_name: b.institution_name,
            institution_id: b.institution_id,
            mask: b.mask,
            last4: b.mask || b.last4,
            account_type: b.account_type || 'checking',
            account_name: b.account_name,
            status: b.status || 'linked',
            createdAt: b.createdAt,
          })),
          _source: 'mongodb'
        }) 
      };
    } finally {
      await client.close();
    }
  }

  // Fallback to in-memory store
  const banks = await listBanks(token);
  console.log('[banks-linked] Found', banks.length, 'banks in memory');
  
  return { 
    statusCode: 200, 
    headers, 
    body: JSON.stringify({ 
      banks,
      _source: 'memory'
    }) 
  };
};
