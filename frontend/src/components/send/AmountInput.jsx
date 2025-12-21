import React from "react";

// Theme colors
const theme = {
  navy: '#0A2540',
  gold: '#F6C94B',
  goldDark: '#D4A520',
  offWhite: '#FAFAF7',
};

export default function AmountInput({ value, onChange, max }) {
  const num = Number(value);
  const invalid =
    value !== "" && (Number.isNaN(num) || num <= 0 || num > max);

  return (
    <div>
      <div className="relative">
        <span 
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm"
          style={{ color: '#64748b' }}
        >
          $
        </span>
        <input
          type="number"
          inputMode="decimal"
          step="0.01"
          min="0"
          className={[
            "w-full rounded-xl border bg-white pl-8 pr-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2",
            invalid
              ? "border-rose-400 focus:ring-rose-300 focus:border-rose-400"
              : "border-slate-300 focus:ring-[#F6C94B] focus:border-[#F6C94B]",
          ].join(" ")}
          placeholder="0.00"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{ color: theme.navy }}
        />
      </div>

      <div className="mt-2 flex items-center justify-between text-xs">
        <span style={{ color: '#64748b' }}>Available: ${max.toFixed(2)}</span>
        <span style={{ color: invalid ? '#ef4444' : 'transparent' }}>
          {invalid ? "Enter a valid amount" : " "}
        </span>
      </div>

      <div className="mt-3 flex gap-2">
        {[25, 50, 100].map((amt) => (
          <button
            key={amt}
            type="button"
            onClick={() => onChange(String(amt))}
            className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold transition hover:border-[#F6C94B] hover:bg-[#F6C94B]/10"
            style={{ color: theme.navy }}
          >
            ${amt}
          </button>
        ))}
        <button
          type="button"
          onClick={() => onChange(String(max))}
          className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold transition hover:border-[#F6C94B] hover:bg-[#F6C94B]/10"
          style={{ color: theme.navy }}
        >
          Max
        </button>
      </div>
    </div>
  );
}
