/**
 * PBX Profiles API Client
 * Handles Personal and Business profiles
 */

const API_BASE = process.env.REACT_APP_BACKEND_URL || '';

function getSession() {
  try {
    const stored = localStorage.getItem('pbx_session');
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

function getHeaders() {
  const session = getSession();
  return {
    'Content-Type': 'application/json',
    'X-Session-Token': session?.token || '',
    'X-Active-Profile': session?.activeProfileId || '',
  };
}

// ============================================================
// PROFILE MANAGEMENT
// ============================================================

/**
 * Get all profiles for current user (personal + business)
 */
export async function getMyProfiles() {
  const res = await fetch(`${API_BASE}/api/profiles/me`, {
    headers: getHeaders(),
  });
  
  if (!res.ok) {
    throw new Error('Failed to get profiles');
  }
  
  return res.json();
}

/**
 * Get currently active profile
 */
export async function getActiveProfile() {
  const res = await fetch(`${API_BASE}/api/profiles/active`, {
    headers: getHeaders(),
  });
  
  if (!res.ok) {
    throw new Error('Failed to get active profile');
  }
  
  return res.json();
}

/**
 * Switch active profile
 */
export async function switchProfile(profileId) {
  const res = await fetch(`${API_BASE}/api/profiles/switch/${profileId}`, {
    method: 'POST',
    headers: getHeaders(),
  });
  
  // Read body ONCE
  const data = await res.json().catch(() => ({}));
  
  if (!res.ok) {
    throw new Error(data.detail || 'Failed to switch profile');
  }
  
  return data;
}

/**
 * Create or update personal profile
 */
export async function updatePersonalProfile({ handle, displayName, avatarUrl }) {
  const res = await fetch(`${API_BASE}/api/profiles/personal`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      handle,
      display_name: displayName,
      avatar_url: avatarUrl,
    }),
  });
  
  // Read body ONCE
  const data = await res.json().catch(() => ({}));
  
  if (!res.ok) {
    throw new Error(data.detail || 'Failed to update profile');
  }
  
  return data;
}

/**
 * Create a new business profile
 */
export async function createBusinessProfile({ businessName, handle, category, logoUrl }) {
  const res = await fetch(`${API_BASE}/api/profiles/business`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      business_name: businessName,
      handle,
      category,
      logo_url: logoUrl,
    }),
  });
  
  // Read body ONCE
  const data = await res.json().catch(() => ({}));
  
  if (!res.ok) {
    throw new Error(data.detail || 'Failed to create business profile');
  }
  
  return data;
}

/**
 * Update a profile
 */
export async function updateProfile(profileId, updates) {
  const res = await fetch(`${API_BASE}/api/profiles/${profileId}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(updates),
  });
  
  // Read body ONCE
  const data = await res.json().catch(() => ({}));
  
  if (!res.ok) {
    throw new Error(data.detail || 'Failed to update profile');
  }
  
  return data;
}

/**
 * Delete a business profile
 */
export async function deleteBusinessProfile(profileId) {
  const res = await fetch(`${API_BASE}/api/profiles/${profileId}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  
  // Read body ONCE
  const data = await res.json().catch(() => ({}));
  
  if (!res.ok) {
    throw new Error(data.detail || 'Failed to delete profile');
  }
  
  return data;
}

// ============================================================
// SEARCH
// ============================================================

/**
 * Search people (personal profiles) by @username, name, phone, email
 */
export async function searchPeople(query) {
  if (!query || query.length < 2) return { profiles: [] };
  
  const res = await fetch(`${API_BASE}/api/profiles/search/people?q=${encodeURIComponent(query)}`, {
    headers: getHeaders(),
  });
  
  if (!res.ok) {
    return { profiles: [] };
  }
  
  return res.json();
}

/**
 * Search businesses by business name or @handle
 */
export async function searchBusinesses(query) {
  if (!query || query.length < 2) return { profiles: [] };
  
  const res = await fetch(`${API_BASE}/api/profiles/search/businesses?q=${encodeURIComponent(query)}`, {
    headers: getHeaders(),
  });
  
  if (!res.ok) {
    return { profiles: [] };
  }
  
  return res.json();
}

/**
 * Get profile by ID
 */
export async function getProfile(profileId) {
  const res = await fetch(`${API_BASE}/api/profiles/${profileId}`, {
    headers: getHeaders(),
  });
  
  if (!res.ok) {
    throw new Error('Profile not found');
  }
  
  return res.json();
}
