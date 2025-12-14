import React, { useEffect, useState } from "react";
import { usePlaidLink } from "react-plaid-link";

export default function PlaidLinkButton({ session }) {
  const [linkToken, setLinkToken] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    setLinkToken(null);
    setErr("");
  }, [session?.verified, session?.token]);

  async function getLinkToken() {
    console.log("📡 getLinkToken called");
    setErr("");
    setLoading(true);
    try {
      console.log("📤 Fetching create-link-token with headers:", {
        sessionToken: session?.token ? 'present' : 'missing',
        sessionVerified: session?.verified
      });
      
      const res = await fetch("/.netlify/functions/create-link-token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Session-Token": session?.token || "",
          "X-Session-Verified": String(!!session?.verified),
        },
        body: JSON.stringify({}),
      });

      console.log("📥 Response received:", { status: res.status, ok: res.ok });

      // read once
      const text = await res.text();
      const data = text ? JSON.parse(text) : {};
      
      console.log("📋 Response data:", data);

      if (!res.ok) {
        console.log("❌ Request failed:", data?.error);
        throw new Error(data?.error || `Request failed (${res.status})`);
      }
      if (!data?.link_token) {
        console.log("❌ Missing link_token in response");
        throw new Error("Missing link_token from server");
      }

      console.log("✅ Link token received:", data.link_token.substring(0, 20) + '...');
      setLinkToken(data.link_token);
    } catch (e) {
      console.error("❌ getLinkToken error:", e);
      setErr(e.message || "Failed to create link token");
    } finally {
      setLoading(false);
    }
  }

  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess: async (public_token) => {
      console.log("✅ Plaid onSuccess called with token:", public_token);
      // Exchange token
      try {
        const res = await fetch("/.netlify/functions/exchange-public-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ public_token }),
        });
        
        const text = await res.text();
        const data = text ? JSON.parse(text) : {};
        
        if (res.ok) {
          console.log("✅ Bank connected successfully:", data);
          // Show success state
          setErr("");
        }
      } catch (e) {
        console.error("❌ Token exchange error:", e);
      }
    },
  });

  const canOpen = !!session?.verified && !!session?.token;

  // Debug logging
  console.log("🔍 PlaidLink state:", { 
    linkToken: linkToken ? `${linkToken.substring(0, 10)}...` : null, 
    ready, 
    canOpen, 
    sessionVerified: session?.verified,
    sessionToken: session?.token ? 'present' : 'missing'
  });

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={async () => {
          console.log("🔵 Button clicked! State:", { canOpen, linkToken: !!linkToken, ready, loading });
          
          if (!canOpen) {
            console.log("❌ Can't open - not verified or no token");
            return;
          }
          
          if (!linkToken) {
            console.log("📡 Fetching link token...");
            await getLinkToken();
            console.log("✅ Link token fetched");
          }
          
          // Open after linkToken is set
          setTimeout(() => {
            console.log("🚀 Attempting to open Plaid. Ready:", ready);
            if (ready) {
              open();
              console.log("✅ Plaid open() called");
            } else {
              console.log("⏳ Plaid not ready yet");
            }
          }, 100);
        }}
        disabled={!canOpen || loading || (linkToken && !ready)}
        className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-950 hover:bg-white disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading ? "Connecting..." : "Connect Bank"}
      </button>
      {err ? <div className="text-xs text-rose-300">{err}</div> : null}
    </div>
  );
}
