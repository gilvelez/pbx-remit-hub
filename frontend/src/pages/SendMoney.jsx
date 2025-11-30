import React, { useMemo, useState, useEffect } from "react";
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
  
  // Quote state
  const [quote, setQuote] = useState(null);
  const [quoteError, setQuoteError] = useState("");
  const [isQuoting, setIsQuoting] = useState(false);
  const [hasAmountInput, setHasAmountInput] = useState(false);
  
  // FX quote state (live rates from backend)
  const [fxQuote, setFxQuote] = useState(null);
  const [fxError, setFxError] = useState("");
  const [isFetchingFx, setIsFetchingFx] = useState(false);

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

    console.log("[SendMoney] Creating transfer with quote:", quote);
    console.log("[SendMoney] Selected recipient:", selectedRecipient);

    const res = await createTransfer({
      recipientId: draft.recipientId,
      amountUsd: amountNumber,
      note: draft.note,
      quote, // Pass the quote for remittance record
      selectedRecipient, // Pass recipient info for remittance record
    });

    setSending(false);
    if (res.ok) {
      setResult({ ok: true, message: "Transfer complete ✅" });
      setDraft((d) => ({ ...d, amountUsd: "", note: "" }));
      setHasAmountInput(false); // Reset flag but keep the quote visible
      // IMPORTANT: do NOT call setQuote(null) here - keep last quote visible
    } else {
      setResult({ ok: false, message: "Transfer failed ❌ (mock)" });
    }
  };

  // Fetch live FX quote when amount changes (debounced)
  useEffect(() => {
    const raw = draft.amountUsd;
    const usd = Number(raw || 0);

    if (!usd || usd <= 0) {
      setFxQuote(null);
      setFxError("");
      return;
    }

    let cancelled = false;
    const timeoutId = setTimeout(async () => {
      try {
        setIsFetchingFx(true);
        setFxError("");

        const res = await fetch(
          `/.netlify/functions/get-fx-quote?amount_usd=${usd}`
        );

        if (!res.ok) {
          throw new Error(`FX API error: ${res.status}`);
        }

        const data = await res.json();

        if (!cancelled) {
          setFxQuote(data);
        }
      } catch (err) {
        if (!cancelled) {
          setFxQuote(null);
          setFxError("Live rate unavailable, please try again");
          console.error("[FX] Error fetching live rate:", err);
        }
      } finally {
        if (!cancelled) {
          setIsFetchingFx(false);
        }
      }
    }, 300); // 300ms debounce

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [draft.amountUsd]);

  // Fetch quote when amount changes
  useEffect(() => {
    const raw = draft.amountUsd;
    const usd = Number(raw || 0);

    if (!hasAmountInput || !usd || usd <= 0) {
      // If there is no active input yet, don't fetch a new quote,
      // but DO NOT clear the existing quote here.
      return;
    }

    let cancelled = false;

    const run = async () => {
      try {
        setIsQuoting(true);
        setQuoteError("");

        const res = await fetch("/.netlify/functions/quote-remittance", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amountUsd: usd,
            payoutMethod: "gcash",
          }),
        });

        const data = await res.json();

        if (cancelled) return;

        if (!res.ok || !data.ok) {
          // Backend failed – use a front-end fallback so the user still sees something
          const FX = 55;
          const feeUsd = 2;
          const totalChargeUsd = usd + feeUsd;
          const amountPhp = usd * FX;

          setQuote({
            id: "fallback",
            payoutMethod: "gcash",
            amountUsd: usd,
            feeUsd,
            totalChargeUsd,
            fxRate: FX,
            amountPhp,
            currencyFrom: "USD",
            currencyTo: "PHP",
            expiresAt: null,
          });

          setQuoteError("Sandbox quote loaded with fallback.");
          return;
        }

        setQuote(data.quote);
      } catch (err) {
        if (!cancelled) {
          // Network or other error – again, use fallback
          const FX = 55;
          const feeUsd = 2;
          const totalChargeUsd = usd + feeUsd;
          const amountPhp = usd * FX;

          setQuote({
            id: "fallback_error",
            payoutMethod: "gcash",
            amountUsd: usd,
            feeUsd,
            totalChargeUsd,
            fxRate: FX,
            amountPhp,
            currencyFrom: "USD",
            currencyTo: "PHP",
            expiresAt: null,
          });

          setQuoteError("Sandbox quote loaded with fallback.");
        }
      } finally {
        if (!cancelled) {
          setIsQuoting(false);
        }
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [draft.amountUsd, hasAmountInput]);

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
              onChange={(amountUsd) => {
                setDraft((d) => ({ ...d, amountUsd }));
                if (!amountUsd) {
                  // User manually cleared the field - clear quote and reset flag
                  setQuote(null);
                  setQuoteError("");
                  setHasAmountInput(false);
                } else {
                  // User is typing a new amount
                  setHasAmountInput(true);
                }
              }}
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

            <div className="flex justify-between text-sm mt-1">
              <span className="text-slate-300">Amount (USD)</span>
              <span className="font-semibold">
                {draft.amountUsd ? `$${Number(draft.amountUsd).toFixed(2)}` : "—"}
              </span>
            </div>

            {/* Live FX Rate Section */}
            {fxQuote && (
              <>
                <div className="flex justify-between text-xs mt-2 pt-2 border-t border-slate-800">
                  <span className="text-slate-400">PBX rate (live)</span>
                  <span className="font-semibold text-emerald-400">
                    1 USD = {fxQuote.pbx_rate.toFixed(2)} PHP
                  </span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-slate-300">Est. receive amount</span>
                  <span className="font-semibold text-slate-100">
                    ₱{(Number(draft.amountUsd) * fxQuote.pbx_rate).toLocaleString("en-PH", {
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <div className="flex justify-between text-[11px] mt-1 text-slate-500">
                  <span>Mid-market: {fxQuote.mid_market.toFixed(2)}</span>
                  <span>Spread: {fxQuote.spread_percent.toFixed(2)}%</span>
                </div>
              </>
            )}

            {isFetchingFx && (
              <div className="text-xs text-slate-400 mt-1">
                Fetching live rate...
              </div>
            )}

            {fxError && (
              <div className="text-xs text-amber-300 mt-1">
                {fxError}
              </div>
            )}

            <div className="flex justify-between text-sm mt-1">
              <span className="text-slate-300">Est. PHP for recipient</span>
              <span className="font-semibold">
                {quote
                  ? quote.amountPhp.toLocaleString("en-PH", {
                      maximumFractionDigits: 2,
                    }) + " ₱"
                  : "—"}
              </span>
            </div>

            <div className="flex justify-between text-xs mt-1 text-slate-400">
              <span>FX</span>
              <span>{quote ? `1 USD = ${quote.fxRate} PHP` : "—"}</span>
            </div>

            <div className="flex justify-between text-xs mt-1 text-slate-400">
              <span>Fee</span>
              <span>{quote ? `$${quote.feeUsd.toFixed(2)}` : "—"}</span>
            </div>

            <div className="flex justify-between text-xs mt-1 text-slate-400">
              <span>Total charge</span>
              <span>
                {quote ? `$${quote.totalChargeUsd.toFixed(2)}` : "—"}
              </span>
            </div>

            {isQuoting && (
              <p className="text-xs text-slate-400 mt-1">Updating quote…</p>
            )}
            {quoteError && (
              <p className="text-[11px] text-amber-300 mt-1">
                Using sandbox quote. (FX and fees are for demo only.)
              </p>
            )}

            <p className="text-[11px] text-slate-500 mt-2">
              Sandbox quote only. In production this will use live FX + real payout partner APIs.
            </p>
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

      // 1) get link_token from Netlify (READ ONCE)
      const ltRes = await fetch("/.netlify/functions/create-link-token", {
        method: "POST",
      });

      const ltText = await ltRes.text();   // ✅ read once
      const ltData = JSON.parse(ltText);   // ✅ parse once
      const link_token = ltData.link_token;

      if (!link_token) throw new Error("Missing link_token");

      // 2) open Plaid Link
      const handler = window.Plaid.create({
        token: link_token,

        onSuccess: async (public_token, metadata) => {
          try {
            // 3) exchange public_token (READ ONCE)
            const exRes = await fetch("/.netlify/functions/exchange-public-token", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ public_token }),
            });

            const exText = await exRes.text();   // ✅ read once
            const exData = JSON.parse(exText);   // ✅ parse once

            if (!exRes.ok || !exData.access_token) {
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
