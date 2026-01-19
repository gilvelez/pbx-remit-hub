import React, { createContext, useContext, useState, useEffect } from 'react';
import { auditLog } from '../lib/auditLog';

const SessionContext = createContext(null);

// Storage key for session data - using localStorage for persistence across tabs/sessions
const STORAGE_KEY = 'pbx_session';
const ACTIVE_PROFILE_KEY = 'pbx_active_profile_id';

export function SessionProvider({ children }) {
  // CRITICAL: Initialize state with function to avoid reading storage multiple times
  // Using localStorage for durable persistence across browser tabs and sessions
  const [session, setSession] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const savedActiveProfileId = localStorage.getItem(ACTIVE_PROFILE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        // Restore activeProfileId from dedicated storage
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
      role: null,  // 'sender' or 'recipient'
      // Profile system
      profiles: [],           // All user profiles (personal + business)
      activeProfile: null,    // Currently active profile
      activeProfileId: null,  // Currently active profile ID
    };
  });

  // Persist to localStorage whenever session changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
      // Also persist activeProfileId separately for easy access
      if (session.activeProfileId) {
        localStorage.setItem(ACTIVE_PROFILE_KEY, session.activeProfileId);
      }
    } catch (e) {
      console.error('Failed to save session to storage:', e);
    }
  }, [session]);

  // Persist role and email to backend when token becomes available
  // This handles the case where role is set during onboarding before login
  useEffect(() => {
    const persistUserToBackend = async () => {
      if (session.token && session.role && !session._rolePersisted) {
        try {
          const backendUrl = process.env.REACT_APP_BACKEND_URL || '';
          const payload = { role: session.role };
          
          // Include email if available (normalized on backend)
          if (session.user?.email) {
            payload.email = session.user.email;
          }
          
          const response = await fetch(`${backendUrl}/api/users/role`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Session-Token': session.token,
            },
            body: JSON.stringify(payload),
          });
          
          if (response.ok) {
            // Mark as persisted to avoid duplicate calls
            setSession(prev => ({ ...prev, _rolePersisted: true }));
            auditLog('USER_PERSISTED_TO_BACKEND', { role: session.role, hasEmail: !!session.user?.email });
          }
        } catch (err) {
          console.error('Failed to persist user to backend:', err);
        }
      }
    };
    
    persistUserToBackend();
  }, [session.token, session.role]);

  // Load profiles when logged in
  useEffect(() => {
    const loadProfiles = async () => {
      if (session.token && !session._profilesLoaded) {
        try {
          const backendUrl = process.env.REACT_APP_BACKEND_URL || '';
          const response = await fetch(`${backendUrl}/api/profiles/me`, {
            headers: {
              'Content-Type': 'application/json',
              'X-Session-Token': session.token,
            },
          });
          
          if (response.ok) {
            const data = await response.json();
            const profiles = data.profiles || [];
            const personalProfile = data.personal || profiles[0];
            
            setSession(prev => ({
              ...prev,
              profiles,
              activeProfile: prev.activeProfile || personalProfile,
              activeProfileId: prev.activeProfileId || personalProfile?.profile_id,
              _profilesLoaded: true,
            }));
            auditLog('PROFILES_LOADED', { count: profiles.length });
            
            // Process any pending invites for this user (viral loop)
            // This creates friend requests from people who invited this user
            try {
              await fetch(`${backendUrl}/api/social/invites/process-on-signup`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'X-Session-Token': session.token,
                },
              });
            } catch (inviteErr) {
              // Non-critical - don't block login if this fails
              console.log('Invite processing skipped:', inviteErr);
            }
          }
        } catch (err) {
          console.error('Failed to load profiles:', err);
        }
      }
    };
    
    loadProfiles();
  }, [session.token]);

  const login = (email) => {
    const token = generateUUID();
    // CRITICAL: Preserve existing session fields (especially role set during onboarding)
    setSession((prev) => ({
      ...prev,
      exists: true,
      verified: false,
      token,
      user: { email },
      _profilesLoaded: false, // Reset to load profiles
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

  // Update user role (backend persistence handled by useEffect when token is available)
  const setRole = async (role) => {
    setSession((prev) => ({ ...prev, role, _rolePersisted: false }));
    auditLog('ROLE_SET', { role });
  };

  // Switch active profile
  const switchProfile = async (profile) => {
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || '';
      await fetch(`${backendUrl}/api/profiles/switch/${profile.profile_id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Token': session.token,
        },
      });
      
      setSession((prev) => ({
        ...prev,
        activeProfile: profile,
        activeProfileId: profile.profile_id,
      }));
      auditLog('PROFILE_SWITCHED', { profileId: profile.profile_id, type: profile.type });
    } catch (err) {
      console.error('Failed to switch profile:', err);
    }
  };

  // Refresh profiles from server
  const refreshProfiles = async () => {
    if (!session.token) return;
    
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || '';
      const response = await fetch(`${backendUrl}/api/profiles/me`, {
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Token': session.token,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        const profiles = data.profiles || [];
        
        setSession((prev) => ({
          ...prev,
          profiles,
          // Update active profile if it was modified
          activeProfile: profiles.find(p => p.profile_id === prev.activeProfileId) || prev.activeProfile,
        }));
      }
    } catch (err) {
      console.error('Failed to refresh profiles:', err);
    }
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

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
