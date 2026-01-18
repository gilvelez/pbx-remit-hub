/**
 * People Page - Friends, Requests, Search
 * Social hub for PBX connections
 */
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useSession } from "../../contexts/SessionContext";
import { getFriendsList, handleFriendAction, sendFriendRequest, getFriendshipStatus } from "../../lib/socialApi";
import { lookupPbxUser } from "../../lib/internalApi";

export default function People() {
  const navigate = useNavigate();
  const { session } = useSession();
  const [activeTab, setActiveTab] = useState("friends"); // friends | requests
  const [loading, setLoading] = useState(true);
  
  // Data state
  const [friends, setFriends] = useState([]);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [outgoingRequests, setOutgoingRequests] = useState([]);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchStatus, setSearchStatus] = useState({}); // friendship status per user
  
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

  useEffect(() => {
    fetchFriends();
  }, [fetchFriends]);

  // Search users
  const searchUsers = useCallback(async (query) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      return;
    }
    
    setSearching(true);
    try {
      const result = await lookupPbxUser(query);
      if (result.found && result.user) {
        setSearchResults([result.user]);
        
        // Get friendship status for this user
        const status = await getFriendshipStatus(result.user.user_id);
        setSearchStatus(prev => ({
          ...prev,
          [result.user.user_id]: status
        }));
      } else {
        setSearchResults([]);
      }
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
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, searchUsers]);

  // Handle friend actions
  const handleAction = async (friendshipId, action, userId = null) => {
    const key = friendshipId || userId;
    setActionLoading(prev => ({ ...prev, [key]: true }));
    
    try {
      if (action === "add") {
        await sendFriendRequest(userId);
        // Update search status
        setSearchStatus(prev => ({
          ...prev,
          [userId]: { status: "outgoing_pending" }
        }));
      } else {
        await handleFriendAction(friendshipId, action);
      }
      
      // Refresh friends list
      await fetchFriends();
    } catch (error) {
      console.error(`Failed to ${action}:`, error);
    } finally {
      setActionLoading(prev => ({ ...prev, [key]: false }));
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
      skippedExternalPayee: false, // Hide banner after dismissal
    }));
  };

  const pendingCount = incomingRequests.length;
  const showSetupBanner = session?.skippedExternalPayee;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Optional Setup Banner - Shows when user skipped external payee setup */}
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
        <h1 className="text-2xl font-bold text-[#0A2540]">People</h1>
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
          <div className="mt-3 bg-white rounded-xl border border-gray-200 overflow-hidden">
            {searchResults.map((user) => {
              const status = searchStatus[user.user_id];
              const isSelf = user.user_id === session?.token;
              
              return (
                <div key={user.user_id} className="p-3 flex items-center gap-3 border-b last:border-b-0">
                  <div className="w-12 h-12 rounded-full bg-[#0A2540] flex items-center justify-center text-white font-bold text-lg">
                    {(user.display_name || user.email)?.[0]?.toUpperCase() || "?"}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-[#0A2540]">{user.display_name || "PBX User"}</p>
                    {user.username && <p className="text-sm text-gray-500">@{user.username}</p>}
                    {user.email && <p className="text-xs text-gray-400">{user.email}</p>}
                  </div>
                  
                  {!isSelf && (
                    <div>
                      {status?.status === "none" && (
                        <button
                          onClick={() => handleAction(null, "add", user.user_id)}
                          disabled={actionLoading[user.user_id]}
                          className="px-4 py-2 bg-[#0A2540] text-white text-sm rounded-lg font-medium disabled:opacity-50"
                          data-testid="add-friend-btn"
                        >
                          {actionLoading[user.user_id] ? "..." : "Add Friend"}
                        </button>
                      )}
                      {status?.status === "outgoing_pending" && (
                        <span className="px-3 py-1.5 bg-gray-100 text-gray-600 text-sm rounded-lg">Requested</span>
                      )}
                      {status?.status === "incoming_pending" && (
                        <button
                          onClick={() => handleAction(status.friendship_id, "accept")}
                          disabled={actionLoading[status.friendship_id]}
                          className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg font-medium disabled:opacity-50"
                        >
                          Accept
                        </button>
                      )}
                      {status?.status === "friends" && (
                        <button
                          onClick={() => openChat(user.user_id)}
                          className="px-4 py-2 bg-[#F6C94B] text-[#0A2540] text-sm rounded-lg font-medium"
                        >
                          Message
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
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
            <span className="ml-1 px-1.5 py-0.5 bg-red-500 text-white text-xs rounded-full">
              {pendingCount}
            </span>
          )}
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
              <div className="space-y-2">
                {friends.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <p className="text-gray-600 font-medium">No friends yet</p>
                    <p className="text-sm text-gray-500 mt-1">Search for friends above to get started</p>
                  </div>
                ) : (
                  friends.map((friend) => (
                    <div
                      key={friend.user_id}
                      className="bg-white rounded-xl p-4 flex items-center gap-3 shadow-sm"
                      data-testid="friend-item"
                    >
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#0A2540] to-[#1a4a7c] flex items-center justify-center text-white font-bold text-lg">
                        {(friend.display_name || "?")?.[0]?.toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-[#0A2540]">{friend.display_name || "PBX User"}</p>
                        {friend.username && <p className="text-sm text-gray-500">@{friend.username}</p>}
                      </div>
                      <button
                        onClick={() => openChat(friend.user_id)}
                        className="px-4 py-2 bg-[#0A2540] text-white text-sm rounded-lg font-medium"
                        data-testid="message-btn"
                      >
                        Message
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Requests Tab */}
            {activeTab === "requests" && (
              <div className="space-y-4">
                {/* Incoming Requests */}
                {incomingRequests.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Incoming Requests</h3>
                    <div className="space-y-2">
                      {incomingRequests.map((req) => (
                        <div
                          key={req.friendship_id}
                          className="bg-white rounded-xl p-4 flex items-center gap-3 shadow-sm"
                          data-testid="incoming-request"
                        >
                          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg">
                            {(req.display_name || "?")?.[0]?.toUpperCase()}
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-[#0A2540]">{req.display_name || "PBX User"}</p>
                            <p className="text-xs text-gray-500">Wants to be friends</p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleAction(req.friendship_id, "accept")}
                              disabled={actionLoading[req.friendship_id]}
                              className="px-3 py-2 bg-green-600 text-white text-sm rounded-lg font-medium disabled:opacity-50"
                              data-testid="accept-btn"
                            >
                              Accept
                            </button>
                            <button
                              onClick={() => handleAction(req.friendship_id, "decline")}
                              disabled={actionLoading[req.friendship_id]}
                              className="px-3 py-2 bg-gray-200 text-gray-700 text-sm rounded-lg font-medium disabled:opacity-50"
                              data-testid="decline-btn"
                            >
                              Decline
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Outgoing Requests */}
                {outgoingRequests.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Sent Requests</h3>
                    <div className="space-y-2">
                      {outgoingRequests.map((req) => (
                        <div
                          key={req.friendship_id}
                          className="bg-white rounded-xl p-4 flex items-center gap-3 shadow-sm"
                          data-testid="outgoing-request"
                        >
                          <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold text-lg">
                            {(req.display_name || "?")?.[0]?.toUpperCase()}
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-[#0A2540]">{req.display_name || "PBX User"}</p>
                            <p className="text-xs text-gray-500">Pending</p>
                          </div>
                          <button
                            onClick={() => handleAction(req.friendship_id, "unfriend")}
                            disabled={actionLoading[req.friendship_id]}
                            className="px-3 py-2 bg-gray-200 text-gray-700 text-sm rounded-lg font-medium disabled:opacity-50"
                          >
                            Cancel
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {incomingRequests.length === 0 && outgoingRequests.length === 0 && (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                      </svg>
                    </div>
                    <p className="text-gray-600 font-medium">No pending requests</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
