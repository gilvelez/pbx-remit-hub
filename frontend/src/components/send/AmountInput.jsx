import React from "react";

export default function AmountInput({ value, onChange, max }) {
  const num = Number(value);
  const invalid =
    value !== "" && (Number.isNaN(num) || num <= 0 || num > max);

  return (
    <div>
      <label className="mb-1 block text-xs font-semibold text-slate-300">
        Amount (USD)
      </label>

      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
          $
        </span>
        <input
          type="number"
          inputMode="decimal"
          step="0.01"
          min="0"
          className={[
            "w-full rounded-xl border bg-slate-900 px-7 py-2 text-sm outline-none",
            invalid
              ? "border-rose-500 focus:border-rose-400"
              : "border-slate-800 focus:border-emerald-400",
          ].join(" ")}
          placeholder="0.00"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>

      <div className="mt-1 flex items-center justify-between text-xs text-slate-400">
        <span>Available: ${max.toFixed(2)}</span>
        <span>{invalid ? "Enter a valid amount" : " "}</span>
      </div>

      <div className="mt-2 flex gap-2">
        {[25, 50, 100].map((amt) => (
          <button
            key={amt}
            type="button"
            onClick={() => onChange(String(amt))}
            className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-1 text-xs font-semibold text-slate-200 hover:bg-slate-800"
          >
            ${amt}
          </button>
        ))}
        <button
          type="button"
          onClick={() => onChange(String(max))}
          className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-1 text-xs font-semibold text-slate-200 hover:bg-slate-800"
        >
          Max
        </button>
      </div>
    </div>
  );
}
