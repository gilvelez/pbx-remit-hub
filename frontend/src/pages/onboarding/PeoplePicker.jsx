/**
 * PeoplePicker - Onboarding Mode
 * Search PBX users (people + businesses) or invite someone new
 * Routes to /onboarding/chat/:conversationId when selecting a user
 */
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useSession } from "../../contexts/SessionContext";
import { tw } from "../../lib/theme";

const API_BASE = process.env.REACT_APP_BACKEND_URL || '';

export default function PeoplePicker() {
  const navigate = useNavigate();
  const { session, setSession } = useSession();
  const inputRef = useRef(null);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  
  // Invite modal state
  const [showInvite, setShowInvite] = useState(false);
  const [inviteMethod, setInviteMethod] = useState(null); // 'sms' | 'email'
  const [inviteContact, setInviteContact] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteResult, setInviteResult] = useState(null);

  // Auto-focus search input
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Search profiles (people + businesses)
  const searchProfiles = useCallback(async (query) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      return;
    }
    
    setSearching(true);
    try {
      // Search both people and businesses in parallel
      const [peopleRes, bizRes] = await Promise.all([
        fetch(`${API_BASE}/api/profiles/search/people?q=${encodeURIComponent(query)}`, {
          headers: {
            'Content-Type': 'application/json',
            'X-Session-Token': session?.token || '',
          },
        }),
        fetch(`${API_BASE}/api/profiles/search/businesses?q=${encodeURIComponent(query)}`, {
          headers: {
            'Content-Type': 'application/json',
            'X-Session-Token': session?.token || '',
          },
        }),
      ]);
      
      const people = peopleRes.ok ? (await peopleRes.json()).profiles || [] : [];
      const businesses = bizRes.ok ? (await bizRes.json()).profiles || [] : [];
      
      // Combine and format results
      const combined = [
        ...people.map(p => ({ ...p, resultType: 'person' })),
        ...businesses.map(b => ({ ...b, resultType: 'business' })),
      ];
      
      setSearchResults(combined.slice(0, 15));
    } catch (error) {
      console.error("Search error:", error);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, [session?.token]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) {
        searchProfiles(searchQuery);
      } else {
        setSearchResults([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, searchProfiles]);

  // Handle selecting a profile (start chat)
  const handleSelectProfile = async (profile) => {
    try {
      let conversationId;
      
      if (profile.resultType === 'business') {
        // Start business chat
        const res = await fetch(`${API_BASE}/api/businesses/chat/${profile.profile_id}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Session-Token': session?.token || '',
          },
        });
        
        if (!res.ok) throw new Error('Failed to start chat');
        const data = await res.json();
        conversationId = data.conversation_id;
      } else {
        // For personal profiles, we need to get or create conversation
        // First send friend request if not friends
        const res = await fetch(`${API_BASE}/api/social/conversations/${profile.user_id}`, {
          headers: {
            'Content-Type': 'application/json',
            'X-Session-Token': session?.token || '',
          },
        });
        
        if (res.ok) {
          const data = await res.json();
          conversationId = data.conversation_id;
        } else {
          // Not friends yet - send friend request and show message
          const reqRes = await fetch(`${API_BASE}/api/social/friends/request`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Session-Token': session?.token || '',
            },
            body: JSON.stringify({ addressee_user_id: profile.user_id }),
          });
          
          if (reqRes.ok) {
            // Mark onboarding complete and go to people page
            setSession(prev => ({
              ...prev,
              exists: true,
              verified: true,
              role: prev.role || 'sender',
              onboardingComplete: true,
            }));
            navigate('/sender/people?tab=requests');
            return;
          }
        }
      }
      
      // Navigate to chat
      if (conversationId) {
        navigate(`/onboarding/chat/${conversationId}`);
      }
    } catch (error) {
      console.error("Failed to start chat:", error);
      alert(error.message || "Failed to start chat");
    }
  };

  // Handle invite submission
  const handleInvite = async () => {
    if (!inviteContact.trim()) return;
    
    setInviteLoading(true);
    setInviteResult(null);
    
    try {
      const res = await fetch(`${API_BASE}/api/social/quick-add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Token': session?.token || '',
        },
        body: JSON.stringify({
          contact: inviteContact.trim(),
          name: inviteName.trim() || null,
        }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.detail || 'Invite failed');
      }
      
      if (data.found && data.user) {
        // User exists - select them
        setInviteResult({ found: true, user: data.user });
      } else if (data.invited) {
        // Invite sent
        setInviteResult({ invited: true, message: "Invite saved — delivery pending" });
      }
    } catch (error) {
      setInviteResult({ error: error.message });
    } finally {
      setInviteLoading(false);
    }
  };

  // Handle selecting found user from invite
  const handleSelectFoundUser = async (user) => {
    // Send friend request and go to chat or people page
    try {
      await fetch(`${API_BASE}/api/social/friends/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Token': session?.token || '',
        },
        body: JSON.stringify({ addressee_user_id: user.user_id }),
      });
      
      // Mark onboarding complete
      setSession(prev => ({
        ...prev,
        exists: true,
        verified: true,
        role: prev.role || 'sender',
        onboardingComplete: true,
      }));
      
      navigate('/sender/people?tab=requests');
    } catch (error) {
      console.error("Failed to add friend:", error);
    }
  };

  // Skip and complete onboarding
  const handleSkip = () => {
    setSession(prev => ({
      ...prev,
      exists: true,
      verified: true,
      role: prev.role || 'sender',
      onboardingComplete: true,
      skippedExternalPayee: true,
    }));
    navigate('/sender/people');
  };

  return (
    <div className={`min-h-screen ${tw.shellBg}`}>
      {/* Header */}
      <header className={`${tw.shellBgSolid} border-b ${tw.borderOnDark}`}>
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-[#F6C94B]/20 border border-[#F6C94B]/40 flex items-center justify-center">
              <span className={`${tw.textGold} font-bold text-xs`}>PBX</span>
            </div>
          </Link>
          <button
            onClick={() => navigate('/onboarding/recipient')}
            className={`text-sm ${tw.textOnDarkMuted}`}
          >
            Back
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-lg mx-auto px-4 py-6">
        <div className={`${tw.cardBg} rounded-2xl p-6 shadow-lg`}>
          <h1 className={`text-2xl font-bold ${tw.textOnLight} mb-2`}>
            Find people
          </h1>
          <p className={`${tw.textOnLightMuted} mb-6`}>
            Search by name, @username, phone, or email
          </p>

          {/* Search Input */}
          <div className="relative mb-4">
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, @username, phone, or email"
              className="w-full h-12 pl-11 pr-4 bg-gray-100 border-0 rounded-xl focus:ring-2 focus:ring-[#0A2540]/20 outline-none"
              autoFocus
              data-testid="people-search-input"
            />
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {searching && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                <svg className="animate-spin h-5 w-5 text-gray-400" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              </div>
            )}
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="space-y-2 mb-6">
              {searchResults.map((profile) => (
                <button
                  key={profile.profile_id}
                  onClick={() => handleSelectProfile(profile)}
                  className="w-full p-3 bg-gray-50 rounded-xl flex items-center gap-3 hover:bg-gray-100 transition text-left"
                  data-testid="search-result-item"
                >
                  {/* Avatar */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                    profile.resultType === 'business' 
                      ? 'bg-gradient-to-br from-purple-500 to-purple-700' 
                      : 'bg-gradient-to-br from-[#0A2540] to-[#1a4a7c]'
                  }`}>
                    {profile.resultType === 'business' 
                      ? (profile.business_name?.[0] || 'B').toUpperCase()
                      : (profile.display_name?.[0] || '?').toUpperCase()
                    }
                  </div>
                  
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-[#0A2540] truncate">
                        {profile.resultType === 'business' ? profile.business_name : profile.display_name}
                      </p>
                      {profile.resultType === 'business' && (
                        <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 text-[10px] font-bold rounded">
                          BUSINESS
                        </span>
                      )}
                      {profile.verified && (
                        <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    {profile.handle && (
                      <p className="text-sm text-gray-500 truncate">@{profile.handle}</p>
                    )}
                  </div>
                  
                  {/* Arrow */}
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ))}
            </div>
          )}

          {/* No Results State */}
          {searchQuery.length >= 2 && !searching && searchResults.length === 0 && (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <p className="text-gray-600 font-medium mb-2">No PBX user found</p>
              <p className="text-sm text-gray-500 mb-4">Invite them to join PBX</p>
              
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => {
                    setInviteMethod('sms');
                    setShowInvite(true);
                  }}
                  className="px-4 py-2 bg-[#0A2540] text-white rounded-lg text-sm font-medium"
                  data-testid="invite-sms-btn"
                >
                  Invite via SMS
                </button>
                <button
                  onClick={() => {
                    setInviteMethod('email');
                    setShowInvite(true);
                  }}
                  className="px-4 py-2 bg-gray-200 text-[#0A2540] rounded-lg text-sm font-medium"
                  data-testid="invite-email-btn"
                >
                  Invite via Email
                </button>
              </div>
            </div>
          )}

          {/* Skip Button */}
          <button
            onClick={handleSkip}
            className={`w-full mt-4 ${tw.textOnLightMuted} font-medium py-3`}
          >
            Skip for now
          </button>
        </div>
      </main>

      {/* Invite Modal */}
      {showInvite && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md max-h-[85vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-bold text-[#0A2540]">
                Invite via {inviteMethod === 'sms' ? 'SMS' : 'Email'}
              </h2>
              <button 
                onClick={() => {
                  setShowInvite(false);
                  setInviteResult(null);
                  setInviteContact("");
                  setInviteName("");
                }}
                className="p-2 text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-4">
              {!inviteResult && (
                <>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">
                        {inviteMethod === 'sms' ? 'Phone Number' : 'Email Address'} *
                      </label>
                      <input
                        type={inviteMethod === 'sms' ? 'tel' : 'email'}
                        value={inviteContact}
                        onChange={(e) => setInviteContact(e.target.value)}
                        placeholder={inviteMethod === 'sms' ? '+1 234 567 8900' : 'friend@example.com'}
                        className="w-full h-12 px-4 border border-gray-200 rounded-xl focus:border-[#0A2540] focus:ring-2 focus:ring-[#0A2540]/10 outline-none"
                        data-testid="invite-contact-input"
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">Name (optional)</label>
                      <input
                        type="text"
                        value={inviteName}
                        onChange={(e) => setInviteName(e.target.value)}
                        placeholder="Their name"
                        className="w-full h-12 px-4 border border-gray-200 rounded-xl focus:border-[#0A2540] focus:ring-2 focus:ring-[#0A2540]/10 outline-none"
                        data-testid="invite-name-input"
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleInvite}
                    disabled={!inviteContact.trim() || inviteLoading}
                    className="w-full mt-6 h-12 bg-[#0A2540] text-white rounded-xl font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                    data-testid="invite-submit-btn"
                  >
                    {inviteLoading ? (
                      <>
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Sending...
                      </>
                    ) : (
                      'Send Invite'
                    )}
                  </button>
                </>
              )}

              {/* User Found */}
              {inviteResult?.found && inviteResult.user && (
                <div className="text-center py-4">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="font-bold text-lg text-[#0A2540] mb-1">Found on PBX!</h3>
                  <p className="text-gray-600 mb-4">{inviteResult.user.display_name || inviteResult.user.email}</p>
                  
                  <button
                    onClick={() => handleSelectFoundUser(inviteResult.user)}
                    className="w-full h-12 bg-[#F6C94B] text-[#0A2540] rounded-xl font-medium"
                    data-testid="add-found-user-btn"
                  >
                    Add Friend
                  </button>
                </div>
              )}

              {/* Invite Sent */}
              {inviteResult?.invited && (
                <div className="text-center py-4">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-100 flex items-center justify-center">
                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="font-bold text-lg text-[#0A2540] mb-1">Invite saved</h3>
                  <p className="text-gray-600 mb-4">{inviteResult.message}</p>
                  
                  <button
                    onClick={() => {
                      setSession(prev => ({
                        ...prev,
                        exists: true,
                        verified: true,
                        role: prev.role || 'sender',
                        onboardingComplete: true,
                      }));
                      navigate('/sender/people?tab=invited');
                    }}
                    className="w-full h-12 bg-[#0A2540] text-white rounded-xl font-medium"
                  >
                    Continue
                  </button>
                </div>
              )}

              {/* Error */}
              {inviteResult?.error && (
                <div className="text-center py-4">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
                    <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="font-bold text-lg text-red-600 mb-1">Error</h3>
                  <p className="text-gray-600 mb-4">{inviteResult.error}</p>
                  
                  <button
                    onClick={() => setInviteResult(null)}
                    className="w-full h-12 bg-gray-100 text-[#0A2540] rounded-xl font-medium"
                  >
                    Try Again
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
