/**
 * People Page - Friends, Requests, Invites, Search
 * Social hub for PBX connections
 * 
 * Phase 0: Added Quick Add modal and Invited section
 */
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useSession } from "../../contexts/SessionContext";
import { getFriendsList, handleFriendAction, sendFriendRequest, getFriendshipStatus } from "../../lib/socialApi";
import { lookupPbxUser } from "../../lib/internalApi";

const API_BASE = process.env.REACT_APP_BACKEND_URL || '';

export default function People() {
  const navigate = useNavigate();
  const { session, setSession } = useSession();
  const [activeTab, setActiveTab] = useState("friends"); // friends | requests | invited
  const [loading, setLoading] = useState(true);
  
  // Data state
  const [friends, setFriends] = useState([]);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [outgoingRequests, setOutgoingRequests] = useState([]);
  const [invites, setInvites] = useState([]);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchStatus, setSearchStatus] = useState({});
  
  // Quick Add Modal state
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickAddContact, setQuickAddContact] = useState("");
  const [quickAddName, setQuickAddName] = useState("");
  const [quickAddLoading, setQuickAddLoading] = useState(false);
  const [quickAddResult, setQuickAddResult] = useState(null);
  
  // Action state
  const [actionLoading, setActionLoading] = useState({});

  // Fetch friends list
  const fetchFriends = useCallback(async () => {
    try {
      const data = await getFriendsList();
      setFriends(data.friends || []);
      setIncomingRequests(data.incoming_requests || []);
      setOutgoingRequests(data.outgoing_requests || []);
    } catch (error) {
      console.error("Failed to fetch friends:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch all invites (pending + converted)
  const fetchInvites = useCallback(async () => {
    try {
      const token = session?.token;
      if (!token) return;
      
      const res = await fetch(`${API_BASE}/api/social/invites/all`, {
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Token': token,
        },
      });
      
      if (res.ok) {
        const data = await res.json();
        setInvites(data.invites || []);
      }
    } catch (error) {
      console.error("Failed to fetch invites:", error);
    }
  }, [session?.token]);

  useEffect(() => {
    fetchFriends();
    fetchInvites();
  }, [fetchFriends, fetchInvites]);

  // Search users
  const searchUsers = useCallback(async (query) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      return;
    }
    
    setSearching(true);
    try {
      const results = await lookupPbxUser(query);
      const users = Array.isArray(results) ? results : (results.users || []);
      setSearchResults(users);
      
      // Fetch friendship status for each result
      const statusPromises = users.map(async (user) => {
        try {
          const status = await getFriendshipStatus(user.user_id);
          return { userId: user.user_id, ...status };
        } catch {
          return { userId: user.user_id, status: "none" };
        }
      });
      
      const statuses = await Promise.all(statusPromises);
      const statusMap = {};
      statuses.forEach(s => { statusMap[s.userId] = s; });
      setSearchStatus(statusMap);
    } catch (error) {
      console.error("Search error:", error);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) {
        searchUsers(searchQuery);
      } else {
        setSearchResults([]);
        setSearchStatus({});
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, searchUsers]);

  // Handle Quick Add submission
  const handleQuickAdd = async () => {
    if (!quickAddContact.trim()) return;
    
    setQuickAddLoading(true);
    setQuickAddResult(null);
    
    try {
      const res = await fetch(`${API_BASE}/api/social/quick-add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Token': session?.token || '',
        },
        body: JSON.stringify({
          contact: quickAddContact.trim(),
          name: quickAddName.trim() || null,
        }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.detail || 'Quick add failed');
      }
      
      setQuickAddResult(data);
      
      // Refresh invites if we sent one
      if (data.invited) {
        fetchInvites();
      }
    } catch (error) {
      setQuickAddResult({ error: error.message });
    } finally {
      setQuickAddLoading(false);
    }
  };

  // Add friend from Quick Add result
  const handleAddFriendFromQuickAdd = async (userId) => {
    setQuickAddLoading(true);
    try {
      await sendFriendRequest(userId);
      setQuickAddResult({ success: true, message: "Friend request sent!" });
      fetchFriends();
      setTimeout(() => {
        setShowQuickAdd(false);
        setQuickAddContact("");
        setQuickAddName("");
        setQuickAddResult(null);
      }, 1500);
    } catch (error) {
      setQuickAddResult({ error: error.message });
    } finally {
      setQuickAddLoading(false);
    }
  };

  // Cancel an invite
  const cancelInvite = async (inviteId) => {
    try {
      const res = await fetch(`${API_BASE}/api/social/invites/${inviteId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Token': session?.token || '',
        },
      });
      
      if (res.ok) {
        setInvites(prev => prev.filter(i => i.invite_id !== inviteId));
      }
    } catch (error) {
      console.error("Failed to cancel invite:", error);
    }
  };

  // Handle friend request action
  const handleAction = async (friendshipId, action) => {
    setActionLoading(prev => ({ ...prev, [friendshipId]: true }));
    try {
      await handleFriendAction(friendshipId, action);
      await fetchFriends();
    } catch (error) {
      console.error("Action failed:", error);
    } finally {
      setActionLoading(prev => ({ ...prev, [friendshipId]: false }));
    }
  };

  // Send friend request
  const handleAddFriend = async (userId) => {
    setActionLoading(prev => ({ ...prev, [userId]: true }));
    try {
      await sendFriendRequest(userId);
      setSearchStatus(prev => ({
        ...prev,
        [userId]: { status: "outgoing_pending" }
      }));
      await fetchFriends();
    } catch (error) {
      console.error("Failed to send request:", error);
    } finally {
      setActionLoading(prev => ({ ...prev, [userId]: false }));
    }
  };

  // Navigate to chat
  const openChat = (userId) => {
    navigate(`/sender/chat/${userId}`);
  };

  // Dismiss the setup banner
  const dismissSetupBanner = () => {
    setSession(prev => ({
      ...prev,
      skippedExternalPayee: false,
    }));
  };

  const pendingCount = incomingRequests.length;
  const pendingInvitesCount = invites.filter(i => i.status === "pending").length;
  const convertedInvitesCount = invites.filter(i => i.status === "converted").length;
  const showSetupBanner = session?.skippedExternalPayee;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Optional Setup Banner */}
      {showSetupBanner && (
        <div className="bg-blue-50 border-b border-blue-200 px-4 py-3">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm text-blue-800 font-medium">External payee setup is optional</p>
              <p className="text-xs text-blue-600 mt-0.5">You can add GCash, Bank, or Cash Pickup recipients anytime from Send → External</p>
              <button
                onClick={() => navigate('/sender/send')}
                className="mt-2 text-xs font-medium text-blue-700 underline"
              >
                Add External Payee →
              </button>
            </div>
            <button 
              onClick={dismissSetupBanner}
              className="text-blue-400 hover:text-blue-600 p-1"
              data-testid="dismiss-setup-banner"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-[#0A2540]">People</h1>
          <button
            onClick={() => setShowQuickAdd(true)}
            className="px-4 py-2 bg-[#0A2540] text-white text-sm rounded-lg font-medium flex items-center gap-2"
            data-testid="quick-add-btn"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Quick Add
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="px-4 py-3 bg-white border-b border-gray-100">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search @username, name, phone, email"
            className="w-full h-11 pl-10 pr-4 bg-gray-100 border-0 rounded-xl focus:ring-2 focus:ring-[#0A2540]/20 outline-none"
            data-testid="people-search"
          />
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          {searching && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <svg className="animate-spin h-5 w-5 text-gray-400" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
          )}
        </div>
        
        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="mt-3 space-y-2">
            {searchResults.map((user) => (
              <SearchResultCard
                key={user.user_id}
                user={user}
                status={searchStatus[user.user_id]}
                loading={actionLoading[user.user_id]}
                onAddFriend={() => handleAddFriend(user.user_id)}
                onMessage={() => openChat(user.user_id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex bg-white border-b border-gray-200">
        <button
          onClick={() => setActiveTab("friends")}
          className={`flex-1 py-3 text-sm font-medium border-b-2 transition ${
            activeTab === "friends"
              ? "text-[#0A2540] border-[#0A2540]"
              : "text-gray-500 border-transparent"
          }`}
          data-testid="tab-friends"
        >
          Friends ({friends.length})
        </button>
        <button
          onClick={() => setActiveTab("requests")}
          className={`flex-1 py-3 text-sm font-medium border-b-2 transition relative ${
            activeTab === "requests"
              ? "text-[#0A2540] border-[#0A2540]"
              : "text-gray-500 border-transparent"
          }`}
          data-testid="tab-requests"
        >
          Requests
          {pendingCount > 0 && (
            <span className="absolute top-2 right-1/4 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
              {pendingCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("invited")}
          className={`flex-1 py-3 text-sm font-medium border-b-2 transition ${
            activeTab === "invited"
              ? "text-[#0A2540] border-[#0A2540]"
              : "text-gray-500 border-transparent"
          }`}
          data-testid="tab-invited"
        >
          Invited ({invites.length})
        </button>
      </div>

      {/* Content */}
      <div className="px-4 py-4">
        {loading ? (
          <div className="flex justify-center py-8">
            <svg className="animate-spin h-8 w-8 text-gray-400" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
        ) : (
          <>
            {/* Friends Tab */}
            {activeTab === "friends" && (
              <div className="space-y-3">
                {friends.length === 0 ? (
                  <EmptyState
                    icon="👋"
                    title="No friends yet"
                    subtitle="Search for friends above or use Quick Add to invite someone"
                  />
                ) : (
                  friends.map((friend) => (
                    <FriendCard
                      key={friend.user_id}
                      friend={friend}
                      onMessage={() => openChat(friend.user_id)}
                    />
                  ))
                )}
              </div>
            )}

            {/* Requests Tab */}
            {activeTab === "requests" && (
              <div className="space-y-6">
                {/* Incoming Requests */}
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-3">Incoming Requests ({incomingRequests.length})</h3>
                  {incomingRequests.length === 0 ? (
                    <p className="text-sm text-gray-400 py-4">No pending requests</p>
                  ) : (
                    <div className="space-y-2">
                      {incomingRequests.map((req) => (
                        <RequestCard
                          key={req.friendship_id}
                          request={req}
                          type="incoming"
                          loading={actionLoading[req.friendship_id]}
                          onAccept={() => handleAction(req.friendship_id, "accept")}
                          onDecline={() => handleAction(req.friendship_id, "decline")}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Outgoing Requests */}
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-3">Sent Requests ({outgoingRequests.length})</h3>
                  {outgoingRequests.length === 0 ? (
                    <p className="text-sm text-gray-400 py-4">No sent requests</p>
                  ) : (
                    <div className="space-y-2">
                      {outgoingRequests.map((req) => (
                        <RequestCard
                          key={req.friendship_id}
                          request={req}
                          type="outgoing"
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Invited Tab */}
            {activeTab === "invited" && (
              <div className="space-y-3">
                {invites.length === 0 ? (
                  <EmptyState
                    icon="✉️"
                    title="No pending invites"
                    subtitle="Use Quick Add to invite friends who aren't on PBX yet"
                  />
                ) : (
                  invites.map((invite) => (
                    <InviteCard
                      key={invite.invite_id}
                      invite={invite}
                      onCancel={() => cancelInvite(invite.invite_id)}
                    />
                  ))
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Quick Add Modal */}
      {showQuickAdd && (
        <QuickAddModal
          contact={quickAddContact}
          setContact={setQuickAddContact}
          name={quickAddName}
          setName={setQuickAddName}
          loading={quickAddLoading}
          result={quickAddResult}
          onSubmit={handleQuickAdd}
          onAddFriend={handleAddFriendFromQuickAdd}
          onClose={() => {
            setShowQuickAdd(false);
            setQuickAddContact("");
            setQuickAddName("");
            setQuickAddResult(null);
          }}
        />
      )}
    </div>
  );
}

// Quick Add Modal Component
function QuickAddModal({ contact, setContact, name, setName, loading, result, onSubmit, onAddFriend, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-bold text-[#0A2540]">Quick Add</h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {!result && (
            <>
              <p className="text-sm text-gray-600 mb-4">
                Enter a phone number or email to find a PBX user or send an invite.
              </p>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Phone or Email *</label>
                  <input
                    type="text"
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    placeholder="email@example.com or +1234567890"
                    className="w-full h-12 px-4 border border-gray-200 rounded-xl focus:border-[#0A2540] focus:ring-2 focus:ring-[#0A2540]/10 outline-none"
                    data-testid="quick-add-contact-input"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Name (optional)</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Their name"
                    className="w-full h-12 px-4 border border-gray-200 rounded-xl focus:border-[#0A2540] focus:ring-2 focus:ring-[#0A2540]/10 outline-none"
                    data-testid="quick-add-name-input"
                  />
                </div>
              </div>

              <button
                onClick={onSubmit}
                disabled={!contact.trim() || loading}
                className="w-full mt-6 h-12 bg-[#0A2540] text-white rounded-xl font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                data-testid="quick-add-submit-btn"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Looking up...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    Find or Invite
                  </>
                )}
              </button>
            </>
          )}

          {/* Result: User Found */}
          {result?.found && result.user && (
            <div className="text-center py-4">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="font-bold text-lg text-[#0A2540] mb-1">Found on PBX!</h3>
              <p className="text-gray-600 mb-4">{result.user.display_name || result.user.email}</p>
              
              <button
                onClick={() => onAddFriend(result.user.user_id)}
                disabled={loading}
                className="w-full h-12 bg-[#F6C94B] text-[#0A2540] rounded-xl font-medium disabled:opacity-50"
                data-testid="quick-add-friend-btn"
              >
                {loading ? "Adding..." : "Add Friend"}
              </button>
            </div>
          )}

          {/* Result: Invite Sent */}
          {result?.invited && !result?.found && (
            <div className="text-center py-4">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-100 flex items-center justify-center">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="font-bold text-lg text-[#0A2540] mb-1">Invite Sent!</h3>
              <p className="text-gray-600 mb-2">{result.contact}</p>
              <p className="text-sm text-gray-500 mb-4">
                {result.name && `(${result.name}) `}
                They&apos;ll receive an invite to join PBX.
              </p>
              
              <button
                onClick={onClose}
                className="w-full h-12 bg-gray-100 text-[#0A2540] rounded-xl font-medium"
              >
                Done
              </button>
            </div>
          )}

          {/* Result: Friend Request Sent */}
          {result?.success && result?.message && (
            <div className="text-center py-4">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="font-bold text-lg text-[#0A2540] mb-1">{result.message}</h3>
            </div>
          )}

          {/* Result: Error */}
          {result?.error && (
            <div className="text-center py-4">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-bold text-lg text-red-600 mb-1">Error</h3>
              <p className="text-gray-600 mb-4">{result.error}</p>
              
              <button
                onClick={() => onClose()}
                className="w-full h-12 bg-gray-100 text-[#0A2540] rounded-xl font-medium"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Search Result Card
function SearchResultCard({ user, status, loading, onAddFriend, onMessage }) {
  const friendshipStatus = status?.status || "none";
  
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-3">
      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#0A2540] to-[#1a4a7c] flex items-center justify-center text-white font-bold text-lg">
        {user.display_name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || "?"}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-[#0A2540] truncate">{user.display_name || user.email?.split("@")[0]}</p>
        <p className="text-sm text-gray-500 truncate">{user.email || user.phone}</p>
      </div>
      {friendshipStatus === "none" && (
        <button
          onClick={onAddFriend}
          disabled={loading}
          className="px-4 py-2 bg-[#F6C94B] text-[#0A2540] text-sm rounded-lg font-medium disabled:opacity-50"
          data-testid="add-friend-btn"
        >
          {loading ? "..." : "Add"}
        </button>
      )}
      {friendshipStatus === "friends" && (
        <button
          onClick={onMessage}
          className="px-4 py-2 bg-[#0A2540] text-white text-sm rounded-lg font-medium"
        >
          Message
        </button>
      )}
      {friendshipStatus === "outgoing_pending" && (
        <span className="px-3 py-1.5 bg-gray-100 text-gray-500 text-sm rounded-lg">Pending</span>
      )}
      {friendshipStatus === "incoming_pending" && (
        <span className="px-3 py-1.5 bg-blue-100 text-blue-600 text-sm rounded-lg">Accept?</span>
      )}
    </div>
  );
}

// Friend Card
function FriendCard({ friend, onMessage }) {
  return (
    <div
      onClick={onMessage}
      className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-3 cursor-pointer hover:bg-gray-50 transition"
      data-testid="friend-card"
    >
      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#0A2540] to-[#1a4a7c] flex items-center justify-center text-white font-bold text-lg">
        {friend.display_name?.[0]?.toUpperCase() || friend.email?.[0]?.toUpperCase() || "?"}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-[#0A2540] truncate">{friend.display_name || friend.email?.split("@")[0] || "PBX Friend"}</p>
        <p className="text-sm text-gray-500 truncate">{friend.email || "Tap to chat"}</p>
      </div>
      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    </div>
  );
}

// Request Card - Updated to show "Invited you to PBX" badge
function RequestCard({ request, type, loading, onAccept, onDecline }) {
  const user = type === "incoming" ? request.requester : request.addressee;
  const isFromInvite = request.source === "invite_auto";
  
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#0A2540] to-[#1a4a7c] flex items-center justify-center text-white font-bold text-lg">
          {user?.display_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "?"}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-[#0A2540] truncate">{user?.display_name || user?.email?.split("@")[0] || "PBX User"}</p>
            {isFromInvite && type === "incoming" && (
              <span className="px-2 py-0.5 bg-[#F6C94B]/20 text-[#0A2540] text-[10px] font-bold rounded-full whitespace-nowrap">
                Invited you
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500">
            {type === "incoming" 
              ? (isFromInvite ? "invited you to PBX — friend request received" : "wants to be friends")
              : "Pending..."}
          </p>
        </div>
      </div>
      {type === "incoming" && (
        <div className="flex gap-2 mt-3">
          <button
            onClick={onAccept}
            disabled={loading}
            className="flex-1 h-10 bg-[#0A2540] text-white rounded-lg font-medium disabled:opacity-50"
            data-testid="accept-request-btn"
          >
            Accept
          </button>
          <button
            onClick={onDecline}
            disabled={loading}
            className="flex-1 h-10 bg-gray-100 text-gray-600 rounded-lg font-medium disabled:opacity-50"
          >
            Decline
          </button>
        </div>
      )}
    </div>
  );
}

// Invite Card - Updated to show status (pending, converted/joined, canceled)
function InviteCard({ invite, onCancel }) {
  const isConverted = invite.status === "converted";
  const isCanceled = invite.status === "canceled";
  const isPending = invite.status === "pending";
  
  return (
    <div className={`bg-white rounded-xl p-4 shadow-sm border ${isConverted ? 'border-green-200 bg-green-50/50' : 'border-gray-100'}`}>
      <div className="flex items-center gap-3">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
          isConverted ? 'bg-green-100' : 'bg-gray-200'
        }`}>
          {isConverted ? (
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-[#0A2540] truncate">{invite.contact_name || invite.contact}</p>
            {isConverted && (
              <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded-full">
                Joined!
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500">
            {invite.contact_type === "email" ? "📧" : "📱"} 
            {isConverted 
              ? " They joined PBX — friend request sent" 
              : isCanceled 
                ? " Invite canceled"
                : " Invite sent • waiting to join"
            }
          </p>
        </div>
        {isPending && (
          <button
            onClick={onCancel}
            className="p-2 text-gray-400 hover:text-red-500"
            data-testid="cancel-invite-btn"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
        {isConverted && (
          <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        )}
      </div>
    </div>
  );
}

// Empty State
function EmptyState({ icon, title, subtitle }) {
  return (
    <div className="text-center py-12">
      <div className="text-4xl mb-4">{icon}</div>
      <p className="text-gray-600 font-medium">{title}</p>
      <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
    </div>
  );
}
