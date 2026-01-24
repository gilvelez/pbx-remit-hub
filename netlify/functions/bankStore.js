/**
 * MongoDB-backed bank store for PBX
 * Persists linked banks across serverless cold starts
 * 
 * Falls back to in-memory for local dev without MongoDB
 */

let MongoClient = null;
const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URL;
const DB_NAME = process.env.DB_NAME || 'pbx_database';

if (MONGODB_URI) {
  try {
    MongoClient = require('mongodb').MongoClient;
  } catch (e) {
    console.warn('[bankStore] MongoDB module not available');
  }
}

// In-memory fallback (demo only)
const bankMap = new Map();

async function getDb() {
  if (!MongoClient || !MONGODB_URI) return null;
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  return { client, db: client.db(DB_NAME) };
}

// Extract user_id from token (first 36 chars or email hash)
function getUserId(token) {
  if (!token) return 'anonymous';
  // If token looks like email, use it directly
  if (token.includes('@')) return token.toLowerCase().trim();
  // Otherwise use first 36 chars (UUID-like)
  return token.substring(0, 36);
}

async function listBanks(token) {
  const user_id = getUserId(token);
  
  // Try MongoDB first
  const connection = await getDb();
  if (connection) {
    const { client, db } = connection;
    try {
      const banks = await db.collection('linked_banks')
        .find({ user_id })
        .project({ access_token: 0 }) // Never expose access_token
        .toArray();
      return banks.map(b => ({
        id: b.id || b._id?.toString(),
        institution_name: b.institution_name,
        institution_id: b.institution_id,
        mask: b.mask,
        last4: b.mask,
        account_type: b.account_type || 'checking',
        status: b.status || 'linked',
        createdAt: b.createdAt,
      }));
    } finally {
      await client.close();
    }
  }
  
  // Fallback to in-memory
  return (bankMap.get(user_id) || []).map(({ access_token, ...safe }) => safe);
}

async function addBank(token, bank) {
  const user_id = getUserId(token);
  
  // Try MongoDB first
  const connection = await getDb();
  if (connection) {
    const { client, db } = connection;
    try {
      const doc = {
        ...bank,
        user_id,
        createdAt: bank.createdAt || Date.now(),
        updatedAt: Date.now(),
      };
      await db.collection('linked_banks').insertOne(doc);
      return { ...doc, access_token: undefined };
    } finally {
      await client.close();
    }
  }
  
  // Fallback to in-memory
  const banks = bankMap.get(user_id) || [];
  banks.push({ ...bank, user_id });
  bankMap.set(user_id, banks);
  return bank;
}

async function removeBank(token, bankId) {
  const user_id = getUserId(token);
  
  // Try MongoDB first
  const connection = await getDb();
  if (connection) {
    const { client, db } = connection;
    try {
      const result = await db.collection('linked_banks').deleteOne({ 
        user_id, 
        id: bankId 
      });
      return result.deletedCount > 0;
    } finally {
      await client.close();
    }
  }
  
  // Fallback to in-memory
  const banks = bankMap.get(user_id) || [];
  const next = banks.filter(b => b.id !== bankId);
  bankMap.set(user_id, next);
  return next.length !== banks.length;
}

async function getBankByAccessToken(token, bankId) {
  const user_id = getUserId(token);
  
  const connection = await getDb();
  if (connection) {
    const { client, db } = connection;
    try {
      return await db.collection('linked_banks').findOne({ user_id, id: bankId });
    } finally {
      await client.close();
    }
  }
  
  // Fallback
  const banks = bankMap.get(user_id) || [];
  return banks.find(b => b.id === bankId);
}

module.exports = { listBanks, addBank, removeBank, getBankByAccessToken, getUserId };
