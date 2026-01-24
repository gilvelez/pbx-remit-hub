// netlify/functions/sessionStore.js
// Session storage for Plaid Link tokens and user sessions

const sessions = new Map();
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

// Clean up expired sessions periodically
setInterval(() => {
  const now = Date.now();
  for (const [sessionId, data] of sessions.entries()) {
    if (data.expiresAt && data.expiresAt < now) {
      sessions.delete(sessionId);
    }
  }
}, 5 * 60 * 1000); // Run every 5 minutes

module.exports = {
  get: (sessionId) => {
    const session = sessions.get(sessionId);
    if (!session) return null;
    
    if (session.expiresAt && session.expiresAt < Date.now()) {
      sessions.delete(sessionId);
      return null;
    }
    
    return session;
  },

  set: (sessionId, data, ttl = SESSION_TIMEOUT) => {
    const expiresAt = ttl ? Date.now() + ttl : null;
    sessions.set(sessionId, {
      ...data,
      expiresAt,
      createdAt: data.createdAt || Date.now(),
      updatedAt: Date.now()
    });
  },

  delete: (sessionId) => {
    return sessions.delete(sessionId);
  },

  has: (sessionId) => {
    const session = sessions.get(sessionId);
    if (!session) return false;
    
    if (session.expiresAt && session.expiresAt < Date.now()) {
      sessions.delete(sessionId);
      return false;
    }
    
    return true;
  },

  touch: (sessionId, ttl = SESSION_TIMEOUT) => {
    const session = sessions.get(sessionId);
    if (session) {
      session.expiresAt = Date.now() + ttl;
      session.updatedAt = Date.now();
    }
  },

  clear: () => {
    sessions.clear();
  },

  size: () => {
    return sessions.size;
  }
};
