/**
 * PayByHandle - Public route for paying via QR code / deep link
 * Route: /pay/@handle or /pay/:handle
 * 
 * If logged in: Look up target profile, create/open conversation, navigate to chat
 * If logged out: Show landing page with login/signup CTAs
 */
import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useSession } from "../../contexts/SessionContext";

const API_BASE = process.env.REACT_APP_BACKEND_URL || '';

export default function PayByHandle() {
  const { handle: rawHandle } = useParams();
  const navigate = useNavigate();
  const { session } = useSession();
  
  // Clean handle (remove @ if present)
  const handle = rawHandle?.startsWith('@') ? rawHandle.slice(1) : rawHandle;
  
  const [loading, setLoading] = useState(true);
  const [targetProfile, setTargetProfile] = useState(null);
  const [error, setError] = useState(null);
  const [redirecting, setRedirecting] = useState(false);
  
  // Check if user is logged in
  const isLoggedIn = session?.verified && session?.token;
  
  // Look up the target profile by handle
  useEffect(() => {
    const lookupProfile = async () => {
      if (!handle) {
        setError("No handle provided");
        setLoading(false);
        return;
      }
      
      try {
        const res = await fetch(`${API_BASE}/api/profiles/by-handle/${handle}`, {
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (res.ok) {
          const data = await res.json();
          setTargetProfile(data);
        } else if (res.status === 404) {
          setError("User not found");
        } else {
          setError("Failed to look up user");
        }
      } catch (err) {
        console.error("Profile lookup error:", err);
        setError("Failed to look up user");
      } finally {
        setLoading(false);
      }
    };
    
    lookupProfile();
  }, [handle]);
  
  // If logged in and profile found, redirect to chat
  useEffect(() => {
    const startPayment = async () => {
      if (!isLoggedIn || !targetProfile || redirecting) return;
      
      setRedirecting(true);
      try {
        // Get or create conversation with this profile
        const res = await fetch(`${API_BASE}/api/social/conversations/${targetProfile.user_id}`, {
          headers: {
            'Content-Type': 'application/json',
            'X-Session-Token': session.token,
            'X-Active-Profile-Id': session.activeProfileId || '',
          },
        });
        
        if (res.ok) {
          const data = await res.json();
          // Navigate to chat with the conversation
          navigate(`/sender/chat/${targetProfile.user_id}?action=pay`, { replace: true });
        } else {
          // May not be friends - try to send friend request first
          const reqRes = await fetch(`${API_BASE}/api/social/friends/request`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Session-Token': session.token,
              'X-Active-Profile-Id': session.activeProfileId || '',
            },
            body: JSON.stringify({ addressee_user_id: targetProfile.user_id }),
          });
          
          if (reqRes.ok) {
            // Friend request sent, go to people page
            navigate('/sender/people?tab=requests', { replace: true });
          } else {
            // Still try to navigate to chat
            navigate(`/sender/chat/${targetProfile.user_id}?action=pay`, { replace: true });
          }
        }
      } catch (err) {
        console.error("Failed to start payment:", err);
        setError("Failed to start payment flow");
        setRedirecting(false);
      }
    };
    
    startPayment();
  }, [isLoggedIn, targetProfile, session, navigate, redirecting]);
  
  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0A2540] to-[#1a4a7c] flex items-center justify-center p-4">
        <div className="text-center">
          <svg className="animate-spin h-12 w-12 text-white mx-auto mb-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-white/80">Looking up @{handle}...</p>
        </div>
      </div>
    );
  }
  
  // Redirecting state (logged in user)
  if (isLoggedIn && targetProfile && redirecting) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0A2540] to-[#1a4a7c] flex items-center justify-center p-4">
        <div className="text-center">
          <svg className="animate-spin h-12 w-12 text-white mx-auto mb-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-white/80">Opening chat with @{handle}...</p>
        </div>
      </div>
    );
  }
  
  // Error state - User not found
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0A2540] to-[#1a4a7c] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-xl">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-[#0A2540] mb-2">User not found</h1>
          <p className="text-gray-600 mb-6">
            We couldn't find anyone with the handle @{handle}
          </p>
          
          {isLoggedIn ? (
            <Link
              to="/sender/people/picker"
              className="block w-full h-12 bg-[#0A2540] text-white rounded-xl font-semibold flex items-center justify-center"
            >
              Search people
            </Link>
          ) : (
            <div className="space-y-3">
              <Link
                to="/welcome"
                className="block w-full h-12 bg-[#0A2540] text-white rounded-xl font-semibold flex items-center justify-center"
              >
                Create account
              </Link>
              <Link
                to="/login"
                className="block w-full h-12 bg-gray-100 text-[#0A2540] rounded-xl font-semibold flex items-center justify-center"
              >
                Log in
              </Link>
            </div>
          )}
        </div>
      </div>
    );
  }
  
  // Not logged in - Show landing page
  if (!isLoggedIn && targetProfile) {
    const isBusiness = targetProfile.type === 'business';
    const name = isBusiness ? targetProfile.business_name : targetProfile.display_name;
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0A2540] to-[#1a4a7c] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-xl">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="h-10 w-10 mx-auto mb-4 rounded-lg bg-[#F6C94B]/20 border border-[#F6C94B]/40 flex items-center justify-center">
              <span className="text-[#F6C94B] font-bold text-sm">PBX</span>
            </div>
            <h1 className="text-2xl font-bold text-[#0A2540]">Pay @{handle}</h1>
          </div>
          
          {/* Target Profile */}
          <div className="bg-gray-50 rounded-xl p-4 mb-6 flex items-center gap-3">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-xl ${
              isBusiness 
                ? 'bg-gradient-to-br from-purple-500 to-purple-700' 
                : 'bg-gradient-to-br from-[#0A2540] to-[#1a4a7c]'
            }`}>
              {name?.[0]?.toUpperCase() || "?"}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-semibold text-[#0A2540]">{name}</p>
                {isBusiness && (
                  <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 text-[10px] font-bold rounded">
                    BUSINESS
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500">@{handle}</p>
            </div>
          </div>
          
          {/* Info */}
          <div className="text-center mb-6">
            <p className="text-gray-600">
              Log in or create an account to send money to @{handle}
            </p>
          </div>
          
          {/* Actions */}
          <div className="space-y-3">
            <Link
              to={`/login?redirect=${encodeURIComponent(`/pay/@${handle}`)}`}
              className="block w-full h-12 bg-[#0A2540] text-white rounded-xl font-semibold flex items-center justify-center hover:bg-[#0A2540]/90 transition"
              data-testid="pay-login-btn"
            >
              Log in to send
            </Link>
            <Link
              to={`/welcome?redirect=${encodeURIComponent(`/pay/@${handle}`)}`}
              className="block w-full h-12 bg-[#F6C94B] text-[#0A2540] rounded-xl font-semibold flex items-center justify-center hover:bg-[#F6C94B]/90 transition"
              data-testid="pay-signup-btn"
            >
              Create account to send
            </Link>
          </div>
          
          {/* Trust indicators */}
          <div className="mt-6 pt-6 border-t border-gray-100">
            <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Instant
              </span>
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Free
              </span>
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Secure
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Fallback
  return null;
}
