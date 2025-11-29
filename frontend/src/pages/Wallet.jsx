import React, { useMemo } from "react";

export default function Wallet({ balances, transfers, recipients, remittances, refreshBalances, setPage }) {
  const transfersWithNames = useMemo(() => {
    return transfers.map((t) => {
      const r = recipients.find((x) => x.id === t.recipientId);
      return { ...t, recipient: r || { name: "Unknown", handle: "" } };
    });
  }, [transfers, recipients]);

  return (
    <div className="grid gap-5 md:grid-cols-3">
      {/* Left: balances */}
      <div className="md:col-span-1">
        <Card>
          <CardHeader title="Wallet" subtitle="Balances (sandbox)" />

          <BalanceRow label="USD available" value={`$${balances.usd.toFixed(2)}`} />
          <BalanceRow label="USDC available" value={`${balances.usdc.toFixed(2)} USDC`} />
          <BalanceRow label="Pending" value={`$${balances.pendingUsd.toFixed(2)}`} subtle />

          <div className="mt-4 grid gap-2">
            <button
              onClick={refreshBalances}
              className="w-full rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm font-semibold hover:bg-slate-800"
            >
              Refresh
            </button>
            <button
              onClick={() => setPage("send")}
              className="w-full rounded-2xl bg-slate-100 px-4 py-3 text-sm font-bold text-slate-950 hover:bg-white"
            >
              Send Money
            </button>
          </div>

          <div className="mt-3 rounded-xl bg-slate-900 p-3 text-xs text-slate-300">
            Later these balances will come from Circle wallets + PBX ledger.
          </div>
        </Card>
      </div>

      {/* Right: activity */}
      <div className="md:col-span-2">
        <Card>
          <CardHeader title="Recent Activity" subtitle="Transfers" />

          <div className="grid gap-2">
            {transfersWithNames.length === 0 && (
              <div className="rounded-xl bg-slate-900 p-3 text-sm text-slate-400">
                No transfers yet.
              </div>
            )}

            {transfersWithNames.map((t) => (
              <TransferItem key={t.id} t={t} />
            ))}
          </div>
        </Card>

        {/* PH Payouts Section */}
        <div className="mt-6">
          <Card>
            <CardHeader title="PH Payouts" subtitle="GCash remittances (sandbox)" />

            <div className="grid gap-2">
              {!remittances || remittances.length === 0 ? (
                <div className="rounded-xl bg-slate-900 p-3 text-xs text-slate-400">
                  No PH payouts yet. Send money to a PH recipient to see them here.
                </div>
              ) : (
                remittances.map((r) => (
                  <div
                    key={r.id}
                    className="flex justify-between items-center rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3"
                  >
                    <div>
                      <div className="text-sm font-semibold text-slate-100">
                        {r.recipientName}{" "}
                        {r.recipientHandle && (
                          <span className="text-xs text-slate-400">{r.recipientHandle}</span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400">
                        ₱{r.amountPhp.toLocaleString("en-PH", { maximumFractionDigits: 2 })}{" "}
                        • {r.payoutMethod.toUpperCase()}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {formatDate(r.createdAt)} • FX {r.fxRate} • Fee $
                        {r.feeUsd.toFixed(2)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-slate-200">
                        -${r.totalChargeUsd.toFixed(2)}
                      </div>
                      <div className="text-[11px] text-emerald-400">
                        {r.status === "completed" ? "completed" : r.status}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

/* ---------------- UI helpers ---------------- */

function TransferItem({ t }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3">
      <div className="min-w-0">
        <div className="truncate text-sm font-semibold">
          {t.recipient.name}{" "}
          <span className="text-xs text-slate-400">{t.recipient.handle}</span>
        </div>
        <div className="text-xs text-slate-400">
          {formatDate(t.createdAt)}
          {t.note ? ` • ${t.note}` : ""}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="text-right">
          <div className="text-sm font-bold">${t.amountUsd.toFixed(2)}</div>
          <div className="text-xs text-slate-400">{t.amountUsd.toFixed(2)} USDC</div>
        </div>
        <StatusChip status={t.status} />
      </div>
    </div>
  );
}

function StatusChip({ status }) {
  const map = {
    processing: "bg-amber-500/15 text-amber-200 border-amber-500/40",
    completed: "bg-emerald-500/15 text-emerald-200 border-emerald-500/40",
    failed: "bg-rose-500/15 text-rose-200 border-rose-500/40",
  };
  const cls = map[status] || map.processing;
  return (
    <div className={`rounded-full border px-3 py-1 text-xs font-bold ${cls}`}>
      {status}
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

function BalanceRow({ label, value, subtle }) {
  return (
    <div className="mb-2 flex items-center justify-between rounded-xl bg-slate-900 px-3 py-2">
      <div className="text-xs font-semibold text-slate-400">{label}</div>
      <div className={`text-sm font-bold ${subtle ? "text-slate-300" : ""}`}>{value}</div>
    </div>
  );
}

function formatDate(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleString();
  } catch {
    return iso;
  }
}
