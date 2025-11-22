import React, { useMemo, useState } from "react";
import RecipientSelect from "../components/send/RecipientSelect.jsx";
import AmountInput from "../components/send/AmountInput.jsx";
import ConfirmModal from "../components/send/ConfirmModal.jsx";

export default function SendMoney({
  recipients,
  balances,
  createTransfer,
  setPage,
}) {
  const [draft, setDraft] = useState({
    recipientId: recipients[0]?.id || "",
    amountUsd: "",
    note: "",
  });
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null); // {ok, message}

  const selectedRecipient = useMemo(
    () => recipients.find((r) => r.id === draft.recipientId),
    [recipients, draft.recipientId]
  );

  const amountNumber = Number(draft.amountUsd);
  const canSend =
    draft.recipientId &&
    draft.amountUsd !== "" &&
    !Number.isNaN(amountNumber) &&
    amountNumber > 0 &&
    amountNumber <= balances.usd &&
    !sending;

  const openConfirm = () => {
    setResult(null);
    setIsConfirmOpen(true);
  };

  const onConfirmSend = async () => {
    setSending(true);
    setResult(null);
    setIsConfirmOpen(false);

    const res = await createTransfer({
      recipientId: draft.recipientId,
      amountUsd: amountNumber,
      note: draft.note,
    });

    setSending(false);
    if (res.ok) {
      setResult({ ok: true, message: "Transfer complete ✅" });
      setDraft((d) => ({ ...d, amountUsd: "", note: "" }));
    } else {
      setResult({ ok: false, message: "Transfer failed ❌ (mock)" });
    }
  };

  return (
    <div className="grid gap-5 md:grid-cols-5">
      {/* Left: Form */}
      <div className="md:col-span-3">
        <Card>
          <CardHeader
            title="Send Money"
            subtitle="Send USD → PBX USDC internally (Sandbox UI)"
          />

          <div className="grid gap-4">
            <PlaidConnectBanner />

            <RecipientSelect
              recipients={recipients}
              value={draft.recipientId}
              onChange={(recipientId) =>
                setDraft((d) => ({ ...d, recipientId }))
              }
            />

            <AmountInput
              value={draft.amountUsd}
              onChange={(amountUsd) =>
                setDraft((d) => ({ ...d, amountUsd }))
              }
              max={balances.usd}
            />

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-300">
                Note (optional)
              </label>
              <input
                className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-emerald-400"
                placeholder="e.g. For school, food, meds"
                value={draft.note}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, note: e.target.value }))
                }
              />
            </div>

            {result && (
              <div
                className={[
                  "rounded-xl px-3 py-2 text-sm",
                  result.ok
                    ? "bg-emerald-500/15 text-emerald-200"
                    : "bg-rose-500/15 text-rose-200",
                ].join(" ")}
              >
                {result.message}
              </div>
            )}

            <button
              disabled={!canSend}
              onClick={openConfirm}
              className={[
                "mt-1 w-full rounded-2xl px-4 py-3 text-sm font-bold transition",
                canSend
                  ? "bg-emerald-500 text-slate-950 hover:bg-emerald-400"
                  : "bg-slate-800 text-slate-400",
              ].join(" ")}
            >
              {sending ? "Sending..." : "Send"}
            </button>

            <button
              onClick={() => setPage("wallet")}
              className="w-full rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm font-semibold text-slate-200 hover:bg-slate-800"
            >
              View Wallet
            </button>
          </div>
        </Card>
      </div>

      {/* Right: Preview */}
      <div className="md:col-span-2">
        <Card>
          <CardHeader title="Preview" subtitle="What will happen" />

          <div className="grid gap-3 text-sm">
            <Row label="Recipient">
              {selectedRecipient ? (
                <div className="font-semibold">
                  {selectedRecipient.name}{" "}
                  <span className="text-slate-400">
                    ({selectedRecipient.handle})
                  </span>
                </div>
              ) : (
                <div className="text-slate-400">Select a recipient</div>
              )}
            </Row>

            <Row label="Amount (USD)">
              <div className="font-semibold">
                {draft.amountUsd ? `$${draft.amountUsd}` : "—"}
              </div>
            </Row>

            <Row label="Estimated USDC received">
              <div className="font-semibold">
                {draft.amountUsd ? `${draft.amountUsd} USDC` : "—"}
              </div>
            </Row>

            <Row label="Fees (Sandbox)">
              <div className="font-semibold">$0.00</div>
            </Row>

            <div className="mt-2 rounded-xl bg-slate-900 p-3 text-xs text-slate-300">
              In sandbox we assume 1 USD = 1 USDC for internal transfers.
              Later, this preview will include FX, off-ramp fees, and GCash payout
              estimates.
            </div>
          </div>
        </Card>
      </div>

      <ConfirmModal
        open={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={onConfirmSend}
        recipient={selectedRecipient}
        amountUsd={amountNumber}
        note={draft.note}
      />
    </div>
  );
}

/* ---------------- UI helpers ---------------- */

function PlaidConnectBanner() {
  const [status, setStatus] = React.useState("idle"); 
  const [lastError, setLastError] = React.useState("");

  const onConnect = async () => {
    try {
      setStatus("loading");
      setLastError("");

      // 1) get link_token from backend API
      const backendUrl = process.env.REACT_APP_BACKEND_URL || "";
      const ltRes = await fetch(`${backendUrl}/api/plaid/link-token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ client_user_id: "pbx-demo-user" }),
      });
      const ltData = await ltRes.json();
      const link_token = ltData.link_token;
      if (!link_token) throw new Error("Missing link_token");

      // 2) open Plaid Link
      const handler = window.Plaid.create({
        token: link_token,
        onSuccess: async (public_token, metadata) => {
          try {
            // 3) exchange public_token for access_token
            const exRes = await fetch(`${backendUrl}/api/plaid/exchange-public-token`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ public_token }),
            });
            const exData = await exRes.json();

            if (!exData.access_token) {
              throw new Error(exData.error || "Missing access_token");
            }

            setStatus("connected");
          } catch (err) {
            setStatus("error");
            setLastError(err.message || "Exchange failed");
          }
        },
        onExit: (err, metadata) => {
          if (err) {
            setStatus("error");
            setLastError(err.display_message || err.error_message || "Plaid exited");
          } else {
            setStatus("idle");
          }
        },
      });

      handler.open();
    } catch (err) {
      setStatus("error");
      setLastError(err.message || "Link token failed");
    }
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold">
            {status === "connected" ? "Bank Connected ✅" : "Connect your bank"}
          </div>
          <div className="text-xs text-slate-400">
            Plaid Sandbox
            {status === "connected" ? " • Ready for ACH debit" : " • Connect to continue"}
          </div>
          {status === "error" && (
            <div className="mt-1 text-xs text-rose-300">
              {lastError}
            </div>
          )}
        </div>

        <button
          onClick={onConnect}
          disabled={status === "loading"}
          className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-950 hover:bg-white disabled:opacity-60"
        >
          {status === "loading" ? "Opening..." : status === "connected" ? "Reconnect" : "Connect Bank"}
        </button>
      </div>
    </div>
  );
}

function Card({ children }) {
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-950 p-5 shadow-xl shadow-black/30">
      {children}
    </div>
  );
}

function CardHeader({ title, subtitle }) {
  return (
    <div className="mb-4">
      <div className="text-lg font-bold">{title}</div>
      {subtitle && <div className="text-xs text-slate-400">{subtitle}</div>}
    </div>
  );
}

function Row({ label, children }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-slate-900 px-3 py-2">
      <div className="text-xs font-semibold text-slate-400">{label}</div>
      <div className="text-right">{children}</div>
    </div>
  );
}
