// netlify/functions/verify-session.js

const { setVerified, maybeCleanup } = require('./sessionStore');

/**
 * Mark a session as verified
 * 
 * Called after demo OTP verification
 */
exports.handler = async (event) => {
  maybeCleanup();
  
  try {
    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: 'Method Not Allowed' }),
      };
    }
    
    const token = event.headers['x-session-token'];
    
    if (!token) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing session token' }),
      };
    }
    
    setVerified(token);
    
    console.log('[SESSION_VERIFIED]', { token, timestamp: new Date().toISOString() });
    
    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true, verified: true }),
    };
  } catch (err) {
    console.error('[verify-session] Error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};
