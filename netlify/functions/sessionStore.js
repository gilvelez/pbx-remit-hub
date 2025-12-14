/**
 * In-memory session store for PBX MVP
 * 
 * IMPORTANT: For MVP demo only. This will be reset on serverless cold starts.
 * Replace with DB/Redis/session provider for production.
 * 
 * Structure: token -> { verified: boolean, createdAt: timestamp }
 */

const sessionMap = new Map();

function getSession(token) {
  if (!token) return null;
  return sessionMap.get(token) || null;
}

function createSession(token) {
  if (!token) return false;
  
  sessionMap.set(token, {
    verified: false,
    createdAt: Date.now(),
  });
  
  return true;
}

function setVerified(token) {
  if (!token) return false;
  
  const session = sessionMap.get(token);
  if (session) {
    session.verified = true;
    return true;
  }
  
  // Initialize if doesn't exist
  sessionMap.set(token, {
    verified: true,
    createdAt: Date.now(),
  });
  
  return true;
}

function isVerified(token) {
  const session = getSession(token);
  return session ? session.verified : false;
}

function cleanupOldSessions() {
  // Remove sessions older than 24 hours
  const now = Date.now();
  const maxAge = 24 * 60 * 60 * 1000; // 24 hours
  
  for (const [token, session] of sessionMap.entries()) {
    if (now - session.createdAt > maxAge) {
      sessionMap.delete(token);
    }
  }
}

// Run cleanup every hour (if function is called)
let lastCleanup = Date.now();
function maybeCleanup() {
  const now = Date.now();
  if (now - lastCleanup > 60 * 60 * 1000) {
    cleanupOldSessions();
    lastCleanup = now;
  }
}

module.exports = {
  getSession,
  createSession,
  setVerified,
  isVerified,
  maybeCleanup,
};
