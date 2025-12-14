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
    setErr("");
    setLoading(true);
    try {
      const res = await fetch("/.netlify/functions/create-link-token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Session-Token": session?.token || "",
          "X-Session-Verified": String(!!session?.verified),
        },
        body: JSON.stringify({}),
      });

      // read once
      const text = await res.text();
      const data = text ? JSON.parse(text) : {};

      if (!res.ok) throw new Error(data?.error || `Request failed (${res.status})`);
      if (!data?.link_token) throw new Error("Missing link_token from server");

      setLinkToken(data.link_token);
    } catch (e) {
      setErr(e.message || "Failed to create link token");
    } finally {
      setLoading(false);
    }
  }

  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess: async (public_token) => {
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
          console.log("Bank connected successfully:", data);
          // Show success state
          setErr("");
        }
      } catch (e) {
        console.error("Token exchange error:", e);
      }
    },
  });

  const canOpen = !!session?.verified && !!session?.token;

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={async () => {
          if (!canOpen) return;
          if (!linkToken) {
            await getLinkToken();
          }
          // Open after linkToken is set
          setTimeout(() => {
            if (ready) open();
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
