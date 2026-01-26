import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { auditLog } from '../lib/auditLog';

const SessionContext = createContext(null);

// Storage keys
const TOKEN_KEY = 'pbx_token';
const ACTIVE_PROFILE_KEY = 'pbx_active_profile_id';

// Get API base URL
const getApiBase = () => {
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return '';
  }
  return process.env.REACT_APP_BACKEND_URL || '';
};
const API_BASE = getApiBase();

/**
 * Safe JSON parse from response - reads body ONCE to avoid "body disturbed" errors
 */
async function safeParseResponse(res) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return { error: text || 'Unknown error' };
  }
}

/**
 * Authenticated fetch helper - automatically adds JWT Authorization header
 */
export async function authFetch(url, options = {}) {
  const token = localStorage.getItem(TOKEN_KEY);
  const headers = { 
    ...(options.headers || {}), 
    'Content-Type': 'application/json' 
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  
  const fullUrl = url.startsWith('http') ? url : `${API_BASE}${url}`;
  return fetch(fullUrl, { ...options, headers });
}

export function SessionProvider({ children }) {
  const [session, setSession] = useState(() => {
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const savedActiveProfileId = localStorage.getItem(ACTIVE_PROFILE_KEY);
      
      if (token) {
        return {
          exists: true,
          verified: true,
          token,
          user: null, // Will be loaded from /api/auth/me
          role: null,
          profiles: [],
          activeProfile: null,
          activeProfileId: savedActiveProfileId || null,
          _meLoaded: false,
        };
      }
    } catch (e) {
      console.error('Failed to load session from storage:', e);
      localStorage.removeItem(TOKEN_KEY);
    }
    
    // Default state - not logged in
    return {
      exists: false,
      verified: false,
      token: null,
      user: null,
      role: null,
      profiles: [],
      activeProfile: null,
      activeProfileId: null,
    };
  });

  // Persist active profile ID when it changes
  useEffect(() => {
    if (session.activeProfileId) {
      localStorage.setItem(ACTIVE_PROFILE_KEY, session.activeProfileId);
    }
  }, [session.activeProfileId]);

  // Restore session from JWT on mount
  const restore = useCallback(async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return;

    try {
      const res = await fetch(`${API_BASE}/api/auth/me`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await safeParseResponse(res);

      if (!res.ok) {
        console.log('Session invalid, clearing...');
        localStorage.removeItem(TOKEN_KEY);
        setSession({
          exists: false,
          verified: false,
          token: null,
          user: null,
          role: null,
          profiles: [],
          activeProfile: null,
          activeProfileId: null,
        });
        return;
      }

      setSession((prev) => ({
        ...prev,
        exists: true,
        verified: true,
        token,
        user: {
          userId: data.user?.userId,
          email: data.user?.email,
          displayName: data.user?.displayName,
        },
        linkedBanks: data.linkedBanks || [],
        _meLoaded: true,
      }));
      auditLog('SESSION_RESTORED', { email: data.user?.email });
    } catch (e) {
      console.error('Failed to restore session:', e);
      localStorage.removeItem(TOKEN_KEY);
      setSession({
        exists: false,
        verified: false,
        token: null,
        user: null,
        role: null,
        profiles: [],
        activeProfile: null,
        activeProfileId: null,
      });
    }
  }, []);

  // Load user data on mount if token exists
  useEffect(() => {
    if (session.token && !session._meLoaded) {
      restore();
    }
  }, [session.token, session._meLoaded, restore]);

  /**
   * LOGIN with email and password
   */
  const login = async (email, password) => {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    
    if (!res.ok) {
      throw new Error(data?.error || data?.detail || 'Login failed');
    }

    // Store JWT token
    localStorage.setItem(TOKEN_KEY, data.token);
    
    setSession({
      exists: true,
      verified: true,
      token: data.token,
      user: {
        userId: data.user.userId,
        email: data.user.email,
        displayName: data.user.displayName,
      },
      role: null,
      profiles: [],
      activeProfile: null,
      activeProfileId: null,
      _meLoaded: true,
    });
    
    auditLog('SESSION_LOGIN', { email: data.user.email });
    return data;
  };

  /**
   * REGISTER new user with email, password, and optional display name
   */
  const register = async (email, password, displayName) => {
    const res = await fetch(`${API_BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, displayName }),
    });

    const data = await res.json();
    
    if (!res.ok) {
      throw new Error(data?.error || data?.detail || 'Registration failed');
    }

    // Store JWT token
    localStorage.setItem(TOKEN_KEY, data.token);
    
    setSession({
      exists: true,
      verified: true,
      token: data.token,
      user: {
        userId: data.user.userId,
        email: data.user.email,
        displayName: data.user.displayName,
      },
      role: null,
      profiles: [],
      activeProfile: null,
      activeProfileId: null,
      _meLoaded: true,
    });
    
    auditLog('SESSION_REGISTER', { email: data.user.email });
    return data;
  };

  /**
   * LOGOUT - clear token and session
   */
  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(ACTIVE_PROFILE_KEY);
    setSession({
      exists: false,
      verified: false,
      token: null,
      user: null,
      role: null,
      profiles: [],
      activeProfile: null,
      activeProfileId: null,
    });
    auditLog('SESSION_LOGOUT');
  };

  /**
   * Legacy verify function (no-op with JWT)
   */
  const verify = async () => {
    if (!session.token) throw new Error('No session token');
    setSession((prev) => ({ ...prev, verified: true }));
  };

  /**
   * Update user role
   */
  const setRole = async (role) => {
    setSession((prev) => ({ ...prev, role }));
    auditLog('ROLE_SET', { role });
  };

  /**
   * Switch active profile
   */
  const switchProfile = async (profile) => {
    setSession((prev) => ({
      ...prev,
      activeProfile: profile,
      activeProfileId: profile.profile_id,
    }));
    auditLog('PROFILE_SWITCHED', { profileId: profile.profile_id, type: profile.type });
  };

  /**
   * Refresh profiles from server
   */
  const refreshProfiles = async () => {
    if (!session.token) return;
    setSession((prev) => ({ ...prev, _meLoaded: false }));
  };

  return (
    <SessionContext.Provider value={{
      session,
      setSession,
      login,
      register,
      logout,
      verify,
      setRole,
      switchProfile,
      refreshProfiles,
      authFetch,
    }}>
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
