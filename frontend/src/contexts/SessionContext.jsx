import React, { createContext, useContext, useState, useEffect } from 'react';
import { auditLog } from '../lib/auditLog';

const SessionContext = createContext(null);

// Storage key for session data - using localStorage for persistence across tabs/sessions
const STORAGE_KEY = 'pbx_session';

export function SessionProvider({ children }) {
  // CRITICAL: Initialize state with function to avoid reading storage multiple times
  // Using localStorage for durable persistence across browser tabs and sessions
  const [session, setSession] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch (e) {
      console.error('Failed to parse session from storage:', e);
      localStorage.removeItem(STORAGE_KEY);
    }
    // Default state
    return {
      exists: false,
      verified: false,
      token: null,
      user: null,
      role: null,  // 'sender' or 'recipient'
    };
  });

  // Persist to localStorage whenever session changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } catch (e) {
      console.error('Failed to save session to storage:', e);
    }
  }, [session]);

  // Persist role to backend when token becomes available
  // This handles the case where role is set during onboarding before login
  useEffect(() => {
    const persistRoleToBackend = async () => {
      if (session.token && session.role && !session._rolePersisted) {
        try {
          const backendUrl = process.env.REACT_APP_BACKEND_URL || '';
          const response = await fetch(`${backendUrl}/api/users/role`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Session-Token': session.token,
            },
            body: JSON.stringify({ role: session.role }),
          });
          
          if (response.ok) {
            // Mark as persisted to avoid duplicate calls
            setSession(prev => ({ ...prev, _rolePersisted: true }));
            auditLog('ROLE_PERSISTED_TO_BACKEND', { role: session.role });
          }
        } catch (err) {
          console.error('Failed to persist role to backend:', err);
        }
      }
    };
    
    persistRoleToBackend();
  }, [session.token, session.role]);

  const login = (email) => {
    const token = generateUUID();
    // CRITICAL: Preserve existing session fields (especially role set during onboarding)
    setSession((prev) => ({
      ...prev,
      exists: true,
      verified: false,
      token,
      user: { email },
    }));
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
    localStorage.removeItem(STORAGE_KEY);
    setSession({ exists: false, verified: false, token: null, user: null, role: null });
    auditLog('SESSION_LOGOUT');
  };

  // Update user role (also saves to backend)
  const setRole = async (role) => {
    setSession((prev) => ({ ...prev, role }));
    auditLog('ROLE_SET', { role });
    
    // Persist to backend if we have a session token
    if (session.token) {
      try {
        const backendUrl = process.env.REACT_APP_BACKEND_URL || '';
        await fetch(`${backendUrl}/api/users/role`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Session-Token': session.token,
          },
          body: JSON.stringify({ role }),
        });
      } catch (err) {
        console.error('Failed to save role to backend:', err);
        // Continue anyway - role is saved in localStorage
      }
    }
  };

  return (
    <SessionContext.Provider value={{ session, setSession, login, verify, logout, setRole }}>
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
