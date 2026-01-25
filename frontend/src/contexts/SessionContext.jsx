import React, { createContext, useContext, useState, useEffect } from 'react';
import { auditLog } from '../lib/auditLog';

const SessionContext = createContext(null);

// Storage key for session data - using localStorage for persistence across tabs/sessions
const STORAGE_KEY = 'pbx_session';
const ACTIVE_PROFILE_KEY = 'pbx_active_profile_id';

export function SessionProvider({ children }) {
  // CRITICAL: Initialize state with function to avoid reading storage multiple times
  const [session, setSession] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const savedActiveProfileId = localStorage.getItem(ACTIVE_PROFILE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (savedActiveProfileId && !parsed.activeProfileId) {
          parsed.activeProfileId = savedActiveProfileId;
        }
        return parsed;
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
      role: null,
      profiles: [],
      activeProfile: null,
      activeProfileId: null,
    };
  });

  // Persist to localStorage whenever session changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
      if (session.activeProfileId) {
        localStorage.setItem(ACTIVE_PROFILE_KEY, session.activeProfileId);
      }
    } catch (e) {
      console.error('Failed to save session to storage:', e);
    }
  }, [session]);

  // Load user data from auth-me when token is available
  useEffect(() => {
    const loadMe = async () => {
      if (!session.token || session._meLoaded) return;

      try {
        const res = await fetch('/.netlify/functions/auth-me', {
          headers: { 
            'Content-Type': 'application/json', 
            'X-Session-Token': session.token 
          },
        });
        if (!res.ok) {
          // Session invalid - clear it
          if (res.status === 401) {
            console.log('Session invalid, clearing...');
            localStorage.removeItem(STORAGE_KEY);
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
          return;
        }

        const data = await res.json();
        setSession((prev) => ({
          ...prev,
          user: { 
            ...(prev.user || {}), 
            ...data.user,
            displayName: data.user.displayName,
            userId: data.user.userId,
          },
          linkedBanks: data.linkedBanks || [],
          _meLoaded: true,
        }));
        auditLog('AUTH_ME_LOADED', { email: data.user.email });
      } catch (e) {
        console.error('Failed to load auth-me:', e);
      }
    };

    loadMe();
  }, [session.token, session._meLoaded]);

  // LOGIN: Call auth-login to get server-generated token
  const login = async (email) => {
    const res = await fetch('/.netlify/functions/auth-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    // Read body ONCE
    const text = await res.text();
    let data;
    try {
      data = text ? JSON.parse(text) : {};
    } catch (e) {
      data = { error: text };
    }

    // Then check status
    if (!res.ok) {
      throw new Error(data.error || data.message || 'Login failed');
    }

    setSession((prev) => ({
      ...prev,
      exists: true,
      verified: true,
      token: data.token,
      user: { 
        email: data.user.email, 
        displayName: data.user.displayName, 
        userId: data.user.userId 
      },
      _meLoaded: false, // Will trigger auth-me load
      _profilesLoaded: true,
    }));
    auditLog('SESSION_CREATED', { email: data.user.email, token: data.token });
  };

  // VERIFY: No-op since auth-login sets verified=true
  const verify = async () => {
    if (!session.token) throw new Error('No session token');
    setSession((prev) => ({ ...prev, verified: true }));
    auditLog('SESSION_VERIFIED', { token: session.token });
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
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

  // Update user role
  const setRole = async (role) => {
    setSession((prev) => ({ ...prev, role }));
    auditLog('ROLE_SET', { role });
  };

  // Switch active profile
  const switchProfile = async (profile) => {
    setSession((prev) => ({
      ...prev,
      activeProfile: profile,
      activeProfileId: profile.profile_id,
    }));
    auditLog('PROFILE_SWITCHED', { profileId: profile.profile_id, type: profile.type });
  };

  // Refresh profiles (no-op for now, data comes from auth-me)
  const refreshProfiles = async () => {
    if (!session.token) return;
    // Force re-fetch from auth-me
    setSession((prev) => ({ ...prev, _meLoaded: false }));
  };

  return (
    <SessionContext.Provider value={{ 
      session, 
      setSession, 
      login, 
      verify, 
      logout, 
      setRole,
      switchProfile,
      refreshProfiles,
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
