/**
 * ConnectBank - Plaid bank connection step in onboarding
 * Part of the progressive Remitly-style onboarding flow
 * 
 * FIXED: Now uses real Plaid Link flow instead of mock auto-connect
 */
import React, { useState, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useSession } from "../../contexts/SessionContext";
import { tw } from "../../lib/theme";
import { usePlaidLink } from "react-plaid-link";

export default function ConnectBank() {
  const navigate = useNavigate();
  const { session, setSession } = useSession();
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState("");
  const [linkToken, setLinkToken] = useState(null);
  const [connectedBank, setConnectedBank] = useState(null);

  // Plaid Link success handler
  const handlePlaidSuccess = useCallback(async (public_token, metadata) => {
    console.log("[ConnectBank] Plaid success, exchanging token...");
    setLoading(true);
    setError("");
    
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || '';
      
      // Exchange public token for access token
      const res = await fetch(`${backendUrl}/api/banks/link`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Session-Token": session?.token || "",
        },
        body: JSON.stringify({
          public_token,
          institution: metadata.institution,
          accounts: metadata.accounts,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to link bank");
      }

      const bankData = {
        institution: metadata.institution?.name || "Bank",
        accountType: metadata.accounts?.[0]?.subtype || "Checking",
        last4: metadata.accounts?.[0]?.mask || "****",
        linked: true,
      };

      setConnectedBank(bankData);
      setSession(prev => ({
        ...prev,
        bankConnected: true,
        bank: bankData
      }));
      
      setConnected(true);
    } catch (err) {
      console.error("[ConnectBank] Link error:", err);
      setError(err.message || "Failed to connect bank. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [session?.token, setSession]);

  // Plaid Link exit handler
  const handlePlaidExit = useCallback((err) => {
    if (err) {
      console.error("[ConnectBank] Plaid exit with error:", err);
      setError(err.error_message || "Bank connection was cancelled");
    }
    setLoading(false);
    setLinkToken(null);
  }, []);

  // Plaid Link configuration
  const plaidConfig = linkToken ? {
    token: linkToken,
    onSuccess: handlePlaidSuccess,
    onExit: handlePlaidExit,
  } : { token: null };

  const { open: openPlaid, ready: plaidReady } = usePlaidLink(plaidConfig);

  // Handle connect button click - fetch link token then open Plaid
  const handleConnectPlaid = async () => {
    setLoading(true);
    setError("");
    
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || '';
      console.log("[ConnectBank] Fetching link token...");
      
      const res = await fetch(`${backendUrl}/api/plaid/link-token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Session-Token": session?.token || "",
          "X-Session-Verified": session?.verified ? "true" : "false",
        },
        body: JSON.stringify({ 
          client_user_id: session?.user?.email || session?.token || "pbx-user" 
        }),
      });

      const text = await res.text();
      const data = text && text.trim() ? JSON.parse(text) : {};

      if (!res.ok) {
        throw new Error(data.detail || data.error || "Failed to initialize bank connection");
      }

      if (!data.link_token) {
        throw new Error("No link token received from server");
      }

      console.log("[ConnectBank] Got link token, opening Plaid...");
      setLinkToken(data.link_token);
      
      // Small delay to allow usePlaidLink to reinitialize with new token
      setTimeout(() => {
        setLoading(false);
      }, 500);
      
    } catch (err) {
      console.error("[ConnectBank] Error:", err);
      setError(err.message || "Failed to connect. Please try again.");
      setLoading(false);
    }
  };

  // Open Plaid when token is ready
  React.useEffect(() => {
    if (linkToken && plaidReady && !loading) {
      console.log("[ConnectBank] Opening Plaid Link...");
      openPlaid();
    }
  }, [linkToken, plaidReady, loading, openPlaid]);

  const handleContinue = () => {
    navigate('/onboarding/recipient');
  };

  const handleSkip = () => {
    navigate('/onboarding/recipient');
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
            onClick={() => navigate('/onboarding/phone')}
            className={`text-sm ${tw.textOnDarkMuted}`}
          >
            Back
          </button>
        </div>
      </header>

      {/* Progress indicator */}
      <div className="max-w-lg mx-auto px-4 py-4">
        <div className="flex gap-2">
          <div className="flex-1 h-1 rounded-full bg-[#F6C94B]" />
          <div className="flex-1 h-1 rounded-full bg-[#F6C94B]" />
          <div className="flex-1 h-1 rounded-full bg-[#F6C94B]" />
          <div className="flex-1 h-1 rounded-full bg-white/20" />
        </div>
        <p className={`text-xs ${tw.textOnDarkMuted} mt-2`}>Step 3 of 4</p>
      </div>

      {/* Content */}
      <main className="max-w-lg mx-auto px-4 py-6">
        <div className={`${tw.cardBg} rounded-2xl p-6 shadow-lg`}>
          {!connected ? (
            <>
              <div className="text-center mb-6">
                <div className="w-16 h-16 rounded-full bg-[#0A2540]/10 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-[#0A2540]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </div>
                <h1 className={`text-2xl font-bold ${tw.textOnLight} mb-2`}>
                  Connect your bank
                </h1>
                <p className={`${tw.textOnLightMuted}`}>
                  Link your bank for faster, cheaper transfers with no fees
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {/* Benefits */}
              <div className="space-y-3 mb-6">
                <BenefitItem 
                  icon={
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  }
                  text="Bank-level security with encryption"
                />
                <BenefitItem 
                  icon={
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  }
                  text="Fastest transfer speeds available"
                />
                <BenefitItem 
                  icon={
                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  }
                  text="$0 fees for bank transfers"
                />
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleConnectPlaid}
                  disabled={loading}
                  className={`w-full ${tw.btnNavy} rounded-xl h-12 transition disabled:opacity-50 flex items-center justify-center gap-2`}
                  data-testid="connect-bank-btn"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      {linkToken ? "Opening Plaid..." : "Connecting..."}
                    </>
                  ) : (
                    'Connect Bank Account'
                  )}
                </button>
                
                <button
                  onClick={handleSkip}
                  className={`w-full ${tw.textOnLightMuted} font-medium py-3`}
                >
                  Skip for now
                </button>
              </div>

              <p className={`text-xs ${tw.textOnLightMuted} text-center mt-4`}>
                Powered by Plaid. We never store your bank credentials.
              </p>
            </>
          ) : (
            <>
              {/* Success State */}
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className={`text-xl font-bold ${tw.textOnLight} mb-2`}>Bank Connected!</h2>
                <p className={`${tw.textOnLightMuted} mb-6`}>
                  {connectedBank?.institution || session.bank?.institution} •••• {connectedBank?.last4 || session.bank?.last4}
                </p>

                <button
                  onClick={handleContinue}
                  className={`w-full ${tw.btnNavy} rounded-xl h-12 transition`}
                  data-testid="bank-continue-btn"
                >
                  Continue
                </button>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

function BenefitItem({ icon, text }) {
  return (
    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
      <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <span className="text-sm text-[#1A1A1A]">{text}</span>
    </div>
  );
}
