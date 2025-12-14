// netlify/functions/session-status.js

const { getSession, createSession, maybeCleanup } = require('./sessionStore');

/**
 * Check session status by token
 * 
 * Returns:
 * { exists: true/false, verified: true/false }
 */
exports.handler = async (event) => {
  maybeCleanup();
  
  try {
    const token = event.headers['x-session-token'];
    
    if (!token) {
      return {
        statusCode: 200,
        body: JSON.stringify({ exists: false, verified: false }),
      };
    }
    
    let session = getSession(token);
    
    // If token doesn't exist in map but was sent, initialize it
    if (!session) {
      createSession(token);
      session = getSession(token);
    }
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        exists: true,
        verified: session.verified,
      }),
    };
  } catch (err) {
    console.error('[session-status] Error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};
