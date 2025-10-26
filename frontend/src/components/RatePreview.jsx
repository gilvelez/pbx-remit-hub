import React, { useState, useMemo } from 'react';

export const RatePreview = ({ onPreviewClick }) => {
  const [usd, setUsd] = useState("");
  const [route, setRoute] = useState("gcash");

  // MOCK VALUES (demo only)
  const fx = 58.25;
  const fee = 2.99;
  const spread = 0.004;

  const parsed = parseFloat(usd) || 0;
  const php = useMemo(() => {
    const netUsd = Math.max(parsed - fee, 0) * (1 - spread);
    return Math.floor(netUsd * fx);
  }, [parsed]);

  const handlePreview = (e) => {
    e.preventDefault();
    if (parsed > 0 && onPreviewClick) {
      onPreviewClick({
        amount: parsed,
        destination: route === "gcash" ? "GCash Wallet" : "Bank Account (PH)",
        php: php,
        fx: fx,
        fee: fee
      });
    }
  };

  return (
    <form className="mt-3 grid gap-3" onSubmit={handlePreview}>
      <div className="grid gap-2">
        <label htmlFor="amount" className="text-xs text-slate-500">Amount in USD</label>
        <input
          id="amount"
          type="text"
          inputMode="decimal"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
          placeholder="Amount in USD"
          value={usd}
          onChange={(e) => setUsd(e.target.value)}
        />
      </div>

      <div className="grid gap-2">
        <label htmlFor="dest" className="text-xs text-slate-500">Destination</label>
        <select
          id="dest"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
          value={route}
          onChange={(e) => setRoute(e.target.value)}
        >
          <option value="gcash">GCash Wallet</option>
          <option value="bank">Bank Account (PH)</option>
        </select>
      </div>

      {parsed > 0 && (
        <div className="rounded-lg bg-slate-50 p-3 text-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Est. rate</span>
            <span className="font-medium">₱{fx.toFixed(2)} / $1</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Fee</span>
            <span className="font-medium">${fee.toFixed(2)} (demo)</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">FX spread</span>
            <span className="font-medium">{(spread * 100).toFixed(1)}% (demo)</span>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-300 flex items-center justify-between text-base">
            <span className="font-semibold">They'll receive (est.)</span>
            <span className="font-bold text-sky-700">₱{php.toLocaleString()}</span>
          </div>
        </div>
      )}

      <button 
        type="submit" 
        className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={parsed <= 0}
      >
        Preview transfer
      </button>
    </form>
  );
};
