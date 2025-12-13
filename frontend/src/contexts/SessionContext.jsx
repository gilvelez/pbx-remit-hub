import React, { createContext, useContext, useState, useEffect } from 'react';
import { auditLog } from '../lib/auditLog';

const SessionContext = createContext(null);

export function SessionProvider({ children }) {
  const [session, setSession] = useState(() => {
    // Load from sessionStorage on mount
    const stored = sessionStorage.getItem('pbx_session');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        return { exists: false, verified: false, token: null, user: null };
      }
    }
    return { exists: false, verified: false, token: null, user: null };
  });

  // Persist to sessionStorage whenever session changes
  useEffect(() => {
    sessionStorage.setItem('pbx_session', JSON.stringify(session));
  }, [session]);

  const login = (email) => {
    const token = generateUUID();
    setSession({
      exists: true,
      verified: false,
      token,
      user: { email },
    });
    auditLog('SESSION_CREATED', { email, token });
  };

  const verify = async () => {
    if (!session.token) {
      throw new Error('No session token');
    }

    // Call backend to mark session as verified
    const res = await fetch('/.netlify/functions/verify-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Session-Token': session.token,
      },
    });

    if (!res.ok) {
      throw new Error('Verification failed');
    }

    setSession((prev) => ({ ...prev, verified: true }));
    auditLog('SESSION_VERIFIED', { token: session.token });
  };

  const logout = () => {
    sessionStorage.removeItem('pbx_session');
    setSession({ exists: false, verified: false, token: null, user: null });
    auditLog('SESSION_LOGOUT');
  };

  return (
    <SessionContext.Provider value={{ session, login, verify, logout }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within SessionProvider');
  }
  return context;
}

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
