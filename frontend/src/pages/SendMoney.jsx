import React, { useMemo, useState, useEffect } from "react";
import RecipientSelect from "../components/send/RecipientSelect.jsx";
import AmountInput from "../components/send/AmountInput.jsx";
import ConfirmModal from "../components/send/ConfirmModal.jsx";

export default function SendMoney({
  recipients,
  balances,
  createTransfer,
  setPage,
  onPayoutComplete,
}) {
  const [draft, setDraft] = useState({
    recipientId: recipients[0]?.id || "",
    amountUsd: "",
    note: "",
  });
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null); // {ok, message}
  
  // FX quote state (live rates from backend)
  const [fxQuote, setFxQuote] = useState(null);
  const [fxError, setFxError] = useState("");
  const [isFetchingFx, setIsFetchingFx] = useState(false);
  const [hasAmountInput, setHasAmountInput] = useState(false);

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
    !sending &&
    !fxError; // Disable if FX rate unavailable

  const openConfirm = () => {
    setResult(null);
    setIsConfirmOpen(true);
  };

  const onConfirmSend = async () => {
    setSending(true);
    setResult(null);
    setIsConfirmOpen(false);

    console.log("[SendMoney] Creating transfer with FX quote:", fxQuote);
    console.log("[SendMoney] Selected recipient:", selectedRecipient);

    // If recipient has GCash info, use real PayMongo API
    if (selectedRecipient?.gcashNumber) {
      try {
        // Calculate PHP amount using the live FX rate
        const amountPhp = fxQuote ? amountNumber * fxQuote.pbx_rate : 0;

        // Call the real PayMongo transfer endpoint
        const payoutRes = await fetch("/.netlify/functions/pbx-create-transfer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amountPhp: amountPhp,
            institution_code: "GCSH", // GCash institution code
            account_name: selectedRecipient.name,
            account_number: selectedRecipient.gcashNumber,
            provider: "instapay",
            description: `PBX transfer to ${selectedRecipient.name}`,
            metadata: {
              usd_amount: amountNumber,
              fx_rate: fxQuote?.pbx_rate,
              user_id: "demo-user",
            },
          }),
        });

        const payoutData = await payoutRes.json();

        setSending(false);

        if (payoutRes.ok) {
          // Format response for UI display
          const formattedPayoutData = {
            txId: payoutData.data?.id || `PBX-${Date.now()}`,
            recipient_name: selectedRecipient.name,
            gcash_number: selectedRecipient.gcashNumber,
            amount_usd: amountNumber,
            fee_usd: 0,
            created_at: new Date().toISOString(),
            fx: fxQuote ? {
              mid_market: fxQuote.mid_market,
              pbx_rate: fxQuote.pbx_rate,
              spread_percent: fxQuote.spread_percent,
              estimated_php: amountPhp,
            } : null,
          };

          setResult({
            ok: true,
            message: "Payout complete ✅",
            payoutData: formattedPayoutData,
          });
          setDraft((d) => ({ ...d, amountUsd: "", note: "" }));
          setHasAmountInput(false);
          
          // Add to Recent Activity and PH Payouts
          if (onPayoutComplete) {
            onPayoutComplete(formattedPayoutData);
          }
          
          console.log("[SendMoney] PayMongo transfer successful:", payoutData);
        } else {
          setResult({
            ok: false,
            message: payoutData.error || "Payout failed. Please try again in a few minutes.",
          });
          console.error("[SendMoney] PayMongo transfer error:", payoutData);
        }
      } catch (error) {
        setSending(false);
        setResult({
          ok: false,
          message: "We couldn't complete your payout right now. Please try again in a few minutes.",
        });
        console.error("[SendMoney] PayMongo transfer exception:", error);
      }
      return;
    }

    // Fallback to mock transfer for internal transfers
    // Create a quote object from FX data for remittance record
    const quoteForRemittance = fxQuote ? {
      amountUsd: amountNumber,
      amountPhp: Number((amountNumber * fxQuote.pbx_rate).toFixed(2)),
      fxRate: fxQuote.pbx_rate,
      feeUsd: 0, // No fee for internal transfers
      totalChargeUsd: amountNumber,
    } : null;

    const res = await createTransfer({
      recipientId: draft.recipientId,
      amountUsd: amountNumber,
      note: draft.note,
      quote: quoteForRemittance, // Pass the quote for remittance record
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

  return (
    <div className="grid gap-5 md:grid-cols-5">
      {/* Left: Form */}
      <div className="md:col-span-3">
        <Card>
          <CardHeader
            title="Send Money"
            subtitle="Send USD → PHP via PayMongo (Real Payouts)"
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
                  // User manually cleared the field - clear FX quote and reset flag
                  setFxQuote(null);
                  setFxError("");
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

            {result && result.ok && result.payoutData ? (
              <div className="rounded-2xl border border-emerald-800 bg-emerald-950/50 p-4">
                <div className="mb-3 text-base font-bold text-emerald-200">
                  {result.message}
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">To:</span>
                    <span className="font-semibold text-slate-100">
                      {result.payoutData.recipient_name} ({result.payoutData.gcash_number})
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Amount sent:</span>
                    <span className="font-semibold text-slate-100">
                      ${result.payoutData.amount_usd.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Fee:</span>
                    <span className="font-semibold text-slate-100">
                      ${result.payoutData.fee_usd.toFixed(2)}
                    </span>
                  </div>
                  {result.payoutData.fx && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-slate-400">PBX rate:</span>
                        <span className="font-semibold text-emerald-300">
                          1 USD = {result.payoutData.fx.pbx_rate.toFixed(2)} PHP
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Est. PHP received:</span>
                        <span className="font-bold text-emerald-200">
                          ₱{result.payoutData.fx.estimated_php.toLocaleString("en-PH", {
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs text-slate-500">
                        <span>Mid-market: {result.payoutData.fx.mid_market.toFixed(2)}</span>
                        <span>Spread: {result.payoutData.fx.spread_percent.toFixed(2)}%</span>
                      </div>
                    </>
                  )}
                  <div className="mt-3 border-t border-emerald-900 pt-2">
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>Ref:</span>
                      <span className="font-mono">{result.payoutData.txId}</span>
                    </div>
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>Time:</span>
                      <span>
                        {new Date(result.payoutData.created_at).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : result && !result.ok ? (
              <div className="rounded-xl bg-rose-500/15 px-3 py-2 text-sm text-rose-200">
                {result.message}
              </div>
            ) : null}

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
            {fxQuote && draft.amountUsd && (
              <>
                <div className="flex justify-between text-xs mt-2 pt-2 border-t border-slate-800">
                  <span className="text-slate-400">PBX rate (live)</span>
                  <span className="font-semibold text-emerald-400">
                    1 USD = {fxQuote.pbx_rate.toFixed(2)} PHP
                  </span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-slate-300">Estimated PHP</span>
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

            {isFetchingFx && draft.amountUsd && (
              <div className="text-xs text-slate-400 mt-2">
                Fetching live rate...
              </div>
            )}

            {fxError && draft.amountUsd && (
              <div className="text-xs text-amber-300 mt-2">
                Live rate unavailable
              </div>
            )}

            <p className="text-[11px] text-slate-500 mt-2">
              Live FX rates + PayMongo real-time transfers to PH banks & e-wallets.
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
