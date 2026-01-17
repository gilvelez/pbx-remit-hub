/**
 * PBX Social API Client
 * Friendships, Conversations, Messages, In-Chat Payments
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
  };
}

// ============================================================
// FRIENDSHIPS
// ============================================================

/**
 * Send a friend request to another user
 */
export async function sendFriendRequest(addresseeUserId) {
  const res = await fetch(`${API_BASE}/api/social/friends/request`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ addressee_user_id: addresseeUserId }),
  });
  
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.detail || 'Failed to send friend request');
  }
  
  return res.json();
}

/**
 * Handle friend request action (accept/decline/block/unblock/unfriend)
 */
export async function handleFriendAction(friendshipId, action) {
  const res = await fetch(`${API_BASE}/api/social/friends/action`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ friendship_id: friendshipId, action }),
  });
  
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.detail || `Failed to ${action} friend request`);
  }
  
  return res.json();
}

/**
 * Get friends list, incoming requests, and outgoing requests
 */
export async function getFriendsList() {
  const res = await fetch(`${API_BASE}/api/social/friends/list`, {
    headers: getHeaders(),
  });
  
  if (!res.ok) {
    throw new Error('Failed to get friends list');
  }
  
  return res.json();
}

/**
 * Get friendship status with another user
 * Returns: none | outgoing_pending | incoming_pending | friends | blocked
 */
export async function getFriendshipStatus(otherUserId) {
  const res = await fetch(`${API_BASE}/api/social/friends/status/${otherUserId}`, {
    headers: getHeaders(),
  });
  
  if (!res.ok) {
    return { status: 'none', friendship_id: null };
  }
  
  return res.json();
}

// ============================================================
// CONVERSATIONS
// ============================================================

/**
 * Get all conversations for current user
 */
export async function getConversations() {
  const res = await fetch(`${API_BASE}/api/social/conversations`, {
    headers: getHeaders(),
  });
  
  if (!res.ok) {
    throw new Error('Failed to get conversations');
  }
  
  return res.json();
}

/**
 * Get or create conversation with a specific user
 */
export async function getConversation(otherUserId) {
  const res = await fetch(`${API_BASE}/api/social/conversations/${otherUserId}`, {
    headers: getHeaders(),
  });
  
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.detail || 'Failed to get conversation');
  }
  
  return res.json();
}

// ============================================================
// MESSAGES
// ============================================================

/**
 * Get messages for a conversation
 */
export async function getMessages(conversationId, limit = 50, before = null) {
  let url = `${API_BASE}/api/social/messages/${conversationId}?limit=${limit}`;
  if (before) {
    url += `&before=${encodeURIComponent(before)}`;
  }
  
  const res = await fetch(url, {
    headers: getHeaders(),
  });
  
  if (!res.ok) {
    throw new Error('Failed to get messages');
  }
  
  return res.json();
}

/**
 * Send a text message
 */
export async function sendMessage(conversationId, text) {
  const res = await fetch(`${API_BASE}/api/social/messages/send`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      conversation_id: conversationId,
      text,
      message_type: 'text',
    }),
  });
  
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.detail || 'Failed to send message');
  }
  
  return res.json();
}

/**
 * Send PBX payment inside chat
 */
export async function sendPaymentInChat(recipientUserId, amountUsd, note = null) {
  const res = await fetch(`${API_BASE}/api/social/payments/send-in-chat`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      recipient_user_id: recipientUserId,
      amount_usd: amountUsd,
      note,
    }),
  });
  
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.detail || 'Failed to send payment');
  }
  
  return res.json();
}
