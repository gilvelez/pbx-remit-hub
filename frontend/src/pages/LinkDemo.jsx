import React, { useState } from "react";

const API_BASE = process.env.REACT_APP_API_BASE || ""; // same-origin on Netlify

async function postJSON(path, body = {}) {
  const res = await fetch(`${API_BASE}/.netlify/functions/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = { raw: text }; }
  if (!res.ok) throw new Error(JSON.stringify(data));
  return data;
}

export default function LinkDemo() {
  const [linkToken, setLinkToken] = useState("");
  const [publicToken, setPublicToken] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [output, setOutput] = useState(null);
  const [loading, setLoading] = useState(false);

  const createLinkToken = async () => {
    setLoading(true);
    try {
      const data = await postJSON("create-link-token", {});
      setLinkToken(data.link_token);
      setOutput({ step: "create-link-token", data });
    } catch (e) {
      setOutput({ step: "create-link-token", error: String(e) });
    } finally { setLoading(false); }
  };

  const openLink = () => {
    if (!window.Plaid || !linkToken) {
      setOutput({ step: "open-link", error: "Missing Plaid script or link_token" });
      return;
    }
    const handler = window.Plaid.create({
      token: linkToken,
      onSuccess: (pubToken /*, metadata */) => {
        setPublicToken(pubToken);
        setOutput({ step: "link-success", public_token: pubToken });
      },
      onExit: (err, metadata) => {
        if (err) setOutput({ step: "link-exit", error: err });
      },
    });
    handler.open();
  };

  const useSandboxPublicToken = async () => {
    setLoading(true);
    try {
      const data = await postJSON("sandbox-public-token", {});
      setPublicToken(data.public_token);
      setOutput({ step: "sandbox-public-token", data });
    } catch (e) {
      setOutput({ step: "sandbox-public-token", error: String(e) });
    } finally { setLoading(false); }
  };

  const exchangePublicToken = async () => {
    setLoading(true);
    try {
      const data = await postJSON("exchange-public-token", { public_token: publicToken });
      setAccessToken(data.access_token);
      setOutput({ step: "exchange-public-token", data });
    } catch (e) {
      setOutput({ step: "exchange-public-token", error: String(e) });
    } finally { setLoading(false); }
  };

  const getBalances = async () => {
    setLoading(true);
    try {
      const data = await postJSON("accounts-balance", { access_token: accessToken });
      setOutput({ step: "accounts-balance", data });
    } catch (e) {
      setOutput({ step: "accounts-balance", error: String(e) });
    } finally { setLoading(false); }
  };

  const getAuthNumbers = async () => {
    setLoading(true);
    try {
      const data = await postJSON("accounts-auth", { access_token: accessToken });
      setOutput({ step: "accounts-auth", data });
    } catch (e) {
      setOutput({ step: "accounts-auth", error: String(e) });
    } finally { setLoading(false); }
  };

  const getIdentity = async () => {
    setLoading(true);
    try {
      const data = await postJSON("identity", { access_token: accessToken });
      setOutput({ step: "identity", data });
    } catch (e) {
      setOutput({ step: "identity", error: String(e) });
    } finally { setLoading(false); }
  };

  return (
    <main style={{ maxWidth: 900, margin: "32px auto", padding: 16, fontFamily: "system-ui, sans-serif" }}>
      <h1>PBX • Plaid Link Demo</h1>
      <p style={{ color: "#64748b" }}>Create link token → Open Link (or use sandbox public token) → Exchange → Balances / Auth / Identity</p>

      <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", marginTop: 16 }}>
        <button onClick={createLinkToken} disabled={loading} style={btn}>1) Create Link Token</button>
        <button onClick={openLink} disabled={!linkToken || loading} style={btn}>2) Open Link (UI)</button>
        <button onClick={useSandboxPublicToken} disabled={loading} style={btn}>Alt: Sandbox Public Token</button>
        <button onClick={exchangePublicToken} disabled={!publicToken || loading} style={btn}>3) Exchange → Access Token</button>
        <button onClick={getBalances} disabled={!accessToken || loading} style={btn}>4) Get Balances</button>
        <button onClick={getAuthNumbers} disabled={!accessToken || loading} style={btn}>Get Auth (ACH)</button>
        <button onClick={getIdentity} disabled={!accessToken || loading} style={btn}>Get Identity</button>
      </div>

      <section style={{ marginTop: 20 }}>
        <small style={{ display: "block", marginBottom: 8 }}>
          <strong>link_token:</strong> {linkToken || "—"}
          <br />
          <strong>public_token:</strong> {publicToken || "—"}
          <br />
          <strong>access_token:</strong> {accessToken ? "(stored in state)" : "—"}
        </small>

        <pre style={pre}>
          {output ? JSON.stringify(output, null, 2) : "// results will appear here"}
        </pre>
      </section>
    </main>
  );
}

const btn = {
  padding: "12px 14px",
  borderRadius: 12,
  border: "1px solid #e2e8f0",
  background: "#111827",
  color: "white",
  cursor: "pointer",
};

const pre = {
  background: "#0b1220",
  color: "#a7f3d0",
  padding: 16,
  borderRadius: 12,
  overflowX: "auto",
  minHeight: 160,
};
