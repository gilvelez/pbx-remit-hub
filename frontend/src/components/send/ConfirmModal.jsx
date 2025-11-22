import React from "react";

export default function ConfirmModal({
  open,
  onClose,
  onConfirm,
  recipient,
  amountUsd,
  note,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-black/70 p-4">
      <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-950 p-5 shadow-2xl">
        <div className="mb-3 text-lg font-bold">Confirm Transfer</div>

        <div className="grid gap-2 text-sm">
          <InfoRow label="Recipient">
            {recipient ? (
              <div>
                <div className="font-semibold">{recipient.name}</div>
                <div className="text-xs text-slate-400">
                  {recipient.handle} • {recipient.country} •{" "}
                  {recipient.payoutMethod?.replace("_", " ")}
                </div>
              </div>
            ) : (
              "—"
            )}
          </InfoRow>

          <InfoRow label="Amount (USD)">
            <div className="font-semibold">${amountUsd.toFixed(2)}</div>
          </InfoRow>

          <InfoRow label="USDC credited">
            <div className="font-semibold">{amountUsd.toFixed(2)} USDC</div>
          </InfoRow>

          <InfoRow label="Fees">
            <div className="font-semibold">$0.00</div>
          </InfoRow>

          {note && (
            <div className="rounded-xl bg-slate-900 px-3 py-2">
              <div className="text-xs font-semibold text-slate-400">Note</div>
              <div>{note}</div>
            </div>
          )}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            onClick={onClose}
            className="rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm font-semibold hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-bold text-slate-950 hover:bg-emerald-400"
          >
            Confirm Send
          </button>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, children }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-slate-900 px-3 py-2">
      <div className="text-xs font-semibold text-slate-400">{label}</div>
      <div className="text-right">{children}</div>
    </div>
  );
}
