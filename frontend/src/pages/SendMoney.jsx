import React, { useMemo, useState, useEffect } from "react";
import RecipientSelect from "../components/send/RecipientSelect.jsx";
import AmountInput from "../components/send/AmountInput.jsx";
import ConfirmModal from "../components/send/ConfirmModal.jsx";

// Theme colors
const theme = {
  navy: '#0A2540',
  navyDark: '#061C33',
  gold: '#F6C94B',
  goldDark: '#D4A520',
  red: '#C1121F',
  offWhite: '#FAFAF7',
  success: '#10b981',
};

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
  const [result, setResult] = useState(null);
  
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
    !fxError;

  const openConfirm = () => {
    setResult(null);
    setIsConfirmOpen(true);
  };

  const onConfirmSend = async () => {
    setSending(true);
    setResult(null);
    setIsConfirmOpen(false);

    if (selectedRecipient?.gcashNumber) {
      try {
        const amountPhp = fxQuote ? amountNumber * fxQuote.pbx_rate : 0;

        const payoutRes = await fetch("/.netlify/functions/pbx-create-transfer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amountPhp: amountPhp,
            institution_code: "GCSH",
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
          
          if (onPayoutComplete) {
            onPayoutComplete(formattedPayoutData);
          }
        } else {
          setResult({
            ok: false,
            message: payoutData.error || "Payout failed. Please try again.",
          });
        }
      } catch (error) {
        setSending(false);
        setResult({
          ok: false,
          message: "We couldn't complete your payout right now. Please try again.",
        });
      }
      return;
    }

    const quoteForRemittance = fxQuote ? {
      amountUsd: amountNumber,
      amountPhp: Number((amountNumber * fxQuote.pbx_rate).toFixed(2)),
      fxRate: fxQuote.pbx_rate,
      feeUsd: 0,
      totalChargeUsd: amountNumber,
    } : null;

    const res = await createTransfer({
      recipientId: draft.recipientId,
      amountUsd: amountNumber,
      note: draft.note,
      quote: quoteForRemittance,
      selectedRecipient,
    });

    setSending(false);
    if (res.ok) {
      setResult({ ok: true, message: "Transfer complete ✅" });
      setDraft((d) => ({ ...d, amountUsd: "", note: "" }));
      setHasAmountInput(false);
    } else {
      setResult({ ok: false, message: "Transfer failed ❌" });
    }
  };

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
          setFxError("Live rate unavailable");
        }
      } finally {
        if (!cancelled) {
          setIsFetchingFx(false);
        }
      }
    }, 300);

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
            subtitle="Send USD → PHP via PayMongo"
          />

          <div className="grid gap-4">
            <PlaidConnectBanner />

            <div>
              <label className="mb-2 block text-xs font-semibold" style={{ color: theme.navy }}>
                Recipient
              </label>
              <RecipientSelect
                recipients={recipients}
                value={draft.recipientId}
                onChange={(recipientId) =>
                  setDraft((d) => ({ ...d, recipientId }))
                }
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold" style={{ color: theme.navy }}>
                Amount (USD)
              </label>
              <AmountInput
                value={draft.amountUsd}
                onChange={(amountUsd) => {
                  setDraft((d) => ({ ...d, amountUsd }));
                  if (!amountUsd) {
                    setFxQuote(null);
                    setFxError("");
                    setHasAmountInput(false);
                  } else {
                    setHasAmountInput(true);
                  }
                }}
                max={balances.usd}
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold" style={{ color: theme.navy }}>
                Note (optional)
              </label>
              <input
                className="w-full rounded-xl px-4 py-3 text-sm outline-none transition"
                style={{ 
                  backgroundColor: theme.offWhite,
                  border: '1px solid #e2e8f0',
                  color: theme.navy,
                }}
                onFocus={(e) => e.target.style.borderColor = theme.gold}
                onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                placeholder="e.g. For school, food, meds"
                value={draft.note}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, note: e.target.value }))
                }
              />
            </div>

            {result && result.ok && result.payoutData ? (
              <div 
                className="rounded-2xl p-4"
                style={{ 
                  backgroundColor: `${theme.success}10`,
                  border: `1px solid ${theme.success}30`,
                }}
              >
                <div className="mb-3 text-base font-bold" style={{ color: theme.success }}>
                  {result.message}
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span style={{ color: '#64748b' }}>To:</span>
                    <span className="font-semibold" style={{ color: theme.navy }}>
                      {result.payoutData.recipient_name} ({result.payoutData.gcash_number})
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: '#64748b' }}>Amount sent:</span>
                    <span className="font-semibold" style={{ color: theme.navy }}>
                      ${result.payoutData.amount_usd.toFixed(2)}
                    </span>
                  </div>
                  {result.payoutData.fx && (
                    <>
                      <div className="flex justify-between">
                        <span style={{ color: '#64748b' }}>PBX rate:</span>
                        <span className="font-semibold" style={{ color: theme.gold }}>
                          1 USD = {result.payoutData.fx.pbx_rate.toFixed(2)} PHP
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span style={{ color: '#64748b' }}>Est. PHP received:</span>
                        <span className="font-bold" style={{ color: theme.success }}>
                          ₱{result.payoutData.fx.estimated_php.toLocaleString("en-PH", {
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ) : result && !result.ok ? (
              <div 
                className="rounded-xl px-4 py-3 text-sm"
                style={{ 
                  backgroundColor: `${theme.red}10`,
                  color: theme.red,
                }}
              >
                {result.message}
              </div>
            ) : null}

            <button
              disabled={!canSend}
              onClick={openConfirm}
              className="mt-1 w-full rounded-2xl px-4 py-3.5 text-sm font-bold transition shadow-lg hover:brightness-105 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ 
                backgroundColor: canSend ? theme.gold : '#e2e8f0',
                color: canSend ? theme.navyDark : '#94a3b8',
              }}
            >
              {sending ? "Sending..." : "Send"}
            </button>

            <button
              onClick={() => setPage("wallet")}
              className="w-full rounded-2xl px-4 py-3 text-sm font-semibold transition"
              style={{ 
                backgroundColor: 'transparent',
                color: theme.navy,
                border: `1px solid rgba(10, 37, 64, 0.15)`,
              }}
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
                <div className="font-semibold" style={{ color: theme.navy }}>
                  {selectedRecipient.name}{" "}
                  <span style={{ color: '#94a3b8' }}>
                    ({selectedRecipient.handle})
                  </span>
                </div>
              ) : (
                <div style={{ color: '#94a3b8' }}>Select a recipient</div>
              )}
            </Row>

            <div className="flex justify-between text-sm mt-1">
              <span style={{ color: '#64748b' }}>Amount (USD)</span>
              <span className="font-semibold" style={{ color: theme.navy }}>
                {draft.amountUsd ? `$${Number(draft.amountUsd).toFixed(2)}` : "—"}
              </span>
            </div>

            {fxQuote && draft.amountUsd && (
              <>
                <div 
                  className="flex justify-between text-xs mt-2 pt-2"
                  style={{ borderTop: '1px solid #e2e8f0' }}
                >
                  <span style={{ color: '#94a3b8' }}>PBX rate (live)</span>
                  <span className="font-semibold" style={{ color: theme.gold }}>
                    1 USD = {fxQuote.pbx_rate.toFixed(2)} PHP
                  </span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span style={{ color: '#64748b' }}>Estimated PHP</span>
                  <span className="font-semibold" style={{ color: theme.navy }}>
                    ₱{(Number(draft.amountUsd) * fxQuote.pbx_rate).toLocaleString("en-PH", {
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <div className="flex justify-between text-[11px] mt-1" style={{ color: '#94a3b8' }}>
                  <span>Mid-market: {fxQuote.mid_market.toFixed(2)}</span>
                  <span>Spread: {fxQuote.spread_percent.toFixed(2)}%</span>
                </div>
              </>
            )}

            {isFetchingFx && draft.amountUsd && (
              <div className="text-xs mt-2" style={{ color: '#94a3b8' }}>
                Fetching live rate...
              </div>
            )}

            {fxError && draft.amountUsd && (
              <div className="text-xs mt-2" style={{ color: theme.goldDark }}>
                Live rate unavailable
              </div>
            )}

            <p className="text-[11px] mt-2" style={{ color: '#94a3b8' }}>
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

import PlaidLinkButton from "../components/PlaidLinkButton";

function PlaidConnectBanner() {
  let session = { exists: false, verified: false };
  try {
    const sessionStr = sessionStorage.getItem('pbx_session');
    if (sessionStr) {
      session = JSON.parse(sessionStr);
    }
  } catch (e) {}

  if (!session.exists || !session.verified) {
    return (
      <div 
        className="rounded-2xl p-4"
        style={{ 
          backgroundColor: `${theme.goldDark}15`,
          border: `1px solid ${theme.goldDark}30`,
        }}
      >
        <div className="flex items-center gap-3">
          <div className="text-2xl">⚠️</div>
          <div>
            <div className="text-sm font-semibold" style={{ color: theme.goldDark }}>
              Verification Required
            </div>
            <div className="text-xs" style={{ color: theme.goldDark }}>
              Verification required before connecting a bank
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="rounded-2xl p-4"
      style={{ 
        backgroundColor: theme.offWhite,
        border: '1px solid #e2e8f0',
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold" style={{ color: theme.navy }}>
            Connect your bank
          </div>
          <div className="text-xs" style={{ color: '#94a3b8' }}>
            Plaid Sandbox • Connect to continue
          </div>
        </div>

        <PlaidLinkButton session={session} />
      </div>
    </div>
  );
}

function Card({ children }) {
  return (
    <div 
      className="rounded-2xl p-5 shadow-lg"
      style={{ 
        backgroundColor: 'white',
        border: '1px solid rgba(10, 37, 64, 0.08)',
      }}
    >
      {children}
    </div>
  );
}

function CardHeader({ title, subtitle }) {
  return (
    <div className="mb-4">
      <div className="text-lg font-bold" style={{ color: theme.navy, fontFamily: 'Georgia, serif' }}>
        {title}
      </div>
      {subtitle && <div className="text-xs" style={{ color: '#94a3b8' }}>{subtitle}</div>}
    </div>
  );
}

function Row({ label, children }) {
  return (
    <div 
      className="flex items-center justify-between gap-3 rounded-xl px-3 py-2"
      style={{ backgroundColor: theme.offWhite }}
    >
      <div className="text-xs font-semibold" style={{ color: '#64748b' }}>{label}</div>
      <div className="text-right">{children}</div>
    </div>
  );
}
