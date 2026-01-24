/**
 * MongoDB-backed session store for PBX
 * Persists sessions across serverless cold starts
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
    console.warn('[sessionStore] MongoDB module not available');
  }
}

// In-memory fallback
const sessionMap = new Map();

async function getDb() {
  if (!MongoClient || !MONGODB_URI) return null;
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  return { client, db: client.db(DB_NAME) };
}

// Extract user_id consistently
function getUserId(token) {
  if (!token) return 'anonymous';
  if (token.includes('@')) return token.toLowerCase().trim();
  return token.substring(0, 36);
}

async function getSession(token) {
  if (!token) return null;
  const user_id = getUserId(token);
  
  const connection = await getDb();
  if (connection) {
    const { client, db } = connection;
    try {
      return await db.collection('sessions').findOne({ user_id });
    } finally {
      await client.close();
    }
  }
  
  return sessionMap.get(user_id) || null;
}

async function createSession(token, email = null) {
  if (!token) return false;
  const user_id = getUserId(token);
  
  const session = {
    user_id,
    email: email?.toLowerCase().trim() || null,
    verified: false,
    createdAt: Date.now(),
  };
  
  const connection = await getDb();
  if (connection) {
    const { client, db } = connection;
    try {
      await db.collection('sessions').updateOne(
        { user_id },
        { $setOnInsert: session },
        { upsert: true }
      );
      return true;
    } finally {
      await client.close();
    }
  }
  
  sessionMap.set(user_id, session);
  return true;
}

async function setVerified(token) {
  if (!token) return false;
  const user_id = getUserId(token);
  
  const connection = await getDb();
  if (connection) {
    const { client, db } = connection;
    try {
      await db.collection('sessions').updateOne(
        { user_id },
        { 
          $set: { verified: true, verifiedAt: Date.now() },
          $setOnInsert: { user_id, createdAt: Date.now() }
        },
        { upsert: true }
      );
      return true;
    } finally {
      await client.close();
    }
  }
  
  // Fallback
  const session = sessionMap.get(user_id);
  if (session) {
    session.verified = true;
    return true;
  }
  sessionMap.set(user_id, { user_id, verified: true, createdAt: Date.now() });
  return true;
}

async function isVerified(token) {
  const session = await getSession(token);
  return session ? session.verified : false;
}

// Sync version for backwards compatibility
function isVerifiedSync(token) {
  if (!token) return false;
  const user_id = getUserId(token);
  const session = sessionMap.get(user_id);
  return session ? session.verified : false;
}

module.exports = {
  getSession,
  createSession,
  setVerified,
  isVerified,
  isVerifiedSync,
  getUserId,
};
