import React, { createContext, useContext, useState, useEffect } from 'react';
import { auditLog } from '../lib/auditLog';

const SessionContext = createContext(null);

export function SessionProvider({ children }) {
  // CRITICAL: Initialize state with function to avoid reading storage multiple times
  const [session, setSession] = useState(() => {
    try {
      const raw = sessionStorage.getItem('pbx_session');
      if (raw) {
        return JSON.parse(raw);
      }
    } catch (e) {
      console.error('Failed to parse session from storage:', e);
      sessionStorage.removeItem('pbx_session');
    }
    // Default state
    return {
      exists: false,
      verified: false,
      token: null,
      user: null,
    };
  });

  // Persist to sessionStorage whenever session changes
  useEffect(() => {
    try {
      sessionStorage.setItem('pbx_session', JSON.stringify(session));
    } catch (e) {
      console.error('Failed to save session to storage:', e);
    }
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
    <SessionContext.Provider value={{ session, setSession, login, verify, logout }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error('useSession must be used inside SessionProvider');
  }
  return ctx;
}

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
