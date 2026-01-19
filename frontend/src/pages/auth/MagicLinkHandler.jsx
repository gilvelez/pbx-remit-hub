/**
 * Magic Link Authentication Handler
 * Verifies magic link token and authenticates user automatically
 * 
 * Phase 0 Cleanup: Deep Link Routing
 * - PBX→PBX received → open Chat thread with sender
 * - Friend request → People tab → Requests section
 * - Business payment → Business chat thread
 * - External payout status → Recipient Transfers page
 */
import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useSession } from "../../contexts/SessionContext";

const API_URL = process.env.REACT_APP_BACKEND_URL || "";

// Deep link routing rules
const DEEP_LINK_ROUTES = {
  'pbx_transfer': (data) => `/sender/chat/${data.sender_id || data.from_user_id}`,
  'friend_request': () => '/sender/people?tab=requests',
  'business_payment': (data) => `/sender/chat/${data.business_id || data.from_profile_id}?type=business`,
  'external_payout': () => '/recipient/transfers',
  'incoming_transfer': () => '/recipient/wallets',
  // New dest-based routes
  'chat': (data) => data.conversationId ? `/sender/chat/${data.conversationId}` : '/sender/people',
  'people-requests': () => '/sender/people?tab=requests',
  'businesses': () => '/sender/businesses',
  'activity': () => '/sender/activity',
  'default': '/recipient/wallets',
};

function getDeepLinkRoute(notificationType, data = {}) {
  const routeFn = DEEP_LINK_ROUTES[notificationType];
  if (routeFn) {
    return routeFn(data);
  }
  return DEEP_LINK_ROUTES.default;
}

export default function MagicLinkHandler() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { session, setSession } = useSession();
  const [status, setStatus] = useState("verifying"); // verifying, success, error
  const [errorMessage, setErrorMessage] = useState("");
  const [resendEmail, setResendEmail] = useState("");
  const [resendStatus, setResendStatus] = useState(""); // "", "sending", "sent", "error"
  const [redirectPath, setRedirectPath] = useState("/recipient/wallets");

  useEffect(() => {
    const verifyToken = async () => {
      const token = searchParams.get("token");
      const notificationType = searchParams.get("type");
      const contextData = searchParams.get("data");
      const explicitRedirect = searchParams.get("redirect");
      
      // Parse context data if provided
      let parsedData = {};
      if (contextData) {
        try {
          parsedData = JSON.parse(atob(contextData));
        } catch {
          console.warn("Failed to parse context data");
        }
      }
      
      // Determine redirect path based on notification type
      let targetPath;
      if (explicitRedirect) {
        targetPath = explicitRedirect;
      } else if (notificationType) {
        targetPath = getDeepLinkRoute(notificationType, parsedData);
      } else {
        targetPath = DEEP_LINK_ROUTES.default;
      }
      setRedirectPath(targetPath);
      
      if (!token) {
        setStatus("error");
        setErrorMessage("No token provided");
        return;
      }

      // If already logged in, bypass auth and redirect
      if (session?.verified && session?.token) {
        navigate(targetPath);
        return;
      }

      try {
        const response = await fetch(`${API_URL}/api/auth/magic/verify`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token }),
        });

        const text = await response.text();
        let data;
        try {
          data = JSON.parse(text);
        } catch {
          throw new Error("Invalid response from server");
        }

        if (!response.ok) {
          throw new Error(data.detail || "Invalid or expired link");
        }

        // Set session in localStorage
        const sessionData = {
          exists: true,
          verified: true,
          token: data.user_id,
          user: { email: data.email },
          role: data.role || "recipient", // Use role from backend if provided
          _profilesLoaded: false, // Will trigger profile load
        };
        
        localStorage.setItem("pbx_session", JSON.stringify(sessionData));
        setSession(sessionData);

        setStatus("success");

        // Use redirect from backend response if provided, else use calculated path
        const finalPath = data.redirect_path || targetPath;
        setRedirectPath(finalPath);

        // Redirect after brief success message
        setTimeout(() => {
          navigate(finalPath);
        }, 1500);

      } catch (error) {
        console.error("Magic link verification error:", error);
        setStatus("error");
        // Show user-friendly message
        if (error.message.includes("clone") || error.message.includes("Response")) {
          setErrorMessage("This link has expired or is invalid. Please request a new one.");
        } else {
          setErrorMessage(error.message || "This link has expired or is invalid");
        }
      }
    };

    verifyToken();
  }, [searchParams, navigate, session, setSession]);

  const handleResendLink = async () => {
    if (!resendEmail) return;
    
    setResendStatus("sending");
    
    try {
      const response = await fetch(`${API_URL}/api/auth/magic/resend`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: resendEmail }),
      });

      if (response.ok) {
        setResendStatus("sent");
      } else {
        setResendStatus("error");
      }
    } catch {
      setResendStatus("error");
    }
  };

  // Get friendly description based on redirect path
  const getRedirectDescription = () => {
    if (redirectPath.includes('/chat/')) {
      return "your conversation";
    } else if (redirectPath.includes('/people')) {
      return "your friends";
    } else if (redirectPath.includes('/transfers')) {
      return "your transfers";
    } else if (redirectPath.includes('/wallets')) {
      return "your wallet";
    }
    return "your dashboard";
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0A2540] to-[#0f3460] flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        {status === "verifying" && (
          <>
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-blue-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-blue-600 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-[#0A2540] mb-2">Verifying your link...</h1>
            <p className="text-gray-600">Please wait while we log you in securely.</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-[#0A2540] mb-2">Welcome back!</h1>
            <p className="text-gray-600">Redirecting you to {getRedirectDescription()}...</p>
            
            {/* Context-aware Banner */}
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-xl">
              {redirectPath.includes('/chat/') ? (
                <>
                  <p className="text-green-700 font-semibold">💬 New message waiting</p>
                  <p className="text-sm text-green-600 mt-1">Opening your conversation...</p>
                </>
              ) : redirectPath.includes('/people') ? (
                <>
                  <p className="text-green-700 font-semibold">👋 Friend request</p>
                  <p className="text-sm text-green-600 mt-1">Someone wants to connect!</p>
                </>
              ) : (
                <>
                  <p className="text-green-700 font-semibold">💰 Funds available</p>
                  <p className="text-sm text-green-600 mt-1">View your balance and recent transfers</p>
                </>
              )}
            </div>
          </>
        )}

        {status === "error" && (
          <>
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-[#0A2540] mb-2">Link Expired</h1>
            <p className="text-gray-600 mb-6">{errorMessage}</p>
            <p className="text-sm text-gray-500 mb-6">
              Magic links expire after 15 minutes for security.
            </p>
            
            {/* Resend Link Form */}
            {resendStatus !== "sent" && (
              <div className="mb-6">
                <p className="text-sm text-gray-600 mb-3">Enter your email to get a new link:</p>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={resendEmail}
                    onChange={(e) => setResendEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0A2540] focus:border-transparent"
                    data-testid="resend-email-input"
                  />
                  <button
                    onClick={handleResendLink}
                    disabled={!resendEmail || resendStatus === "sending"}
                    className="px-4 py-2 bg-[#F6C94B] text-[#0A2540] rounded-lg font-semibold hover:bg-[#F6C94B]/90 transition disabled:opacity-50"
                    data-testid="resend-link-btn"
                  >
                    {resendStatus === "sending" ? "..." : "Send"}
                  </button>
                </div>
                {resendStatus === "error" && (
                  <p className="text-sm text-red-500 mt-2">Failed to send. Please try again.</p>
                )}
              </div>
            )}
            
            {resendStatus === "sent" && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl">
                <p className="text-green-700 font-semibold">✓ New link sent!</p>
                <p className="text-sm text-green-600 mt-1">Check your email inbox</p>
              </div>
            )}
            
            <div className="border-t pt-6">
              <button
                onClick={() => navigate("/onboarding/welcome")}
                className="w-full py-3 bg-[#0A2540] text-white rounded-xl font-semibold hover:bg-[#0A2540]/90 transition"
                data-testid="login-btn"
              >
                Go to Login
              </button>
            </div>
          </>
        )}
        
        {/* Trust Footer */}
        <div className="mt-6 pt-4 border-t border-gray-100">
          <p className="text-xs text-gray-400">
            🔒 PBX will never ask for your password
          </p>
        </div>
      </div>
    </div>
  );
}
