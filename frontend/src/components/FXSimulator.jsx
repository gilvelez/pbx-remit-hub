import React, { useState } from "react";

// Theme colors
const theme = {
  navy: '#0A2540',
  navyDark: '#061C33',
  gold: '#F6C94B',
  goldDark: '#D4A520',
  offWhite: '#FAFAF7',
};

// Simulated FX rates by plan (PHP per 1 USD)
const rates = {
  Basic: 54.20,
  Premium: 54.60,
  SME: 54.80,
  Enterprise: 54.85,
};

const fees = {
  Basic: 2.00,
  Premium: 0,
  SME: 0,
  Enterprise: 0,
};

export default function FXSimulator({ compact = false }) {
  const [plan, setPlan] = useState("Basic");
  const [usdAmount, setUsdAmount] = useState("");
  const [phpAmount, setPhpAmount] = useState("");

  const handleUsdChange = (e) => {
    const usd = e.target.value;
    setUsdAmount(usd);
    if (usd === "" || isNaN(parseFloat(usd))) {
      setPhpAmount("");
    } else {
      const php = parseFloat(usd) * rates[plan];
      setPhpAmount(php.toFixed(2));
    }
  };

  const handlePhpChange = (e) => {
    const php = e.target.value;
    setPhpAmount(php);
    if (php === "" || isNaN(parseFloat(php))) {
      setUsdAmount("");
    } else {
      const usd = parseFloat(php) / rates[plan];
      setUsdAmount(usd.toFixed(2));
    }
  };

  const handlePlanChange = (newPlan) => {
    setPlan(newPlan);
    if (usdAmount && !isNaN(parseFloat(usdAmount))) {
      const php = parseFloat(usdAmount) * rates[newPlan];
      setPhpAmount(php.toFixed(2));
    } else if (phpAmount && !isNaN(parseFloat(phpAmount))) {
      const usd = parseFloat(phpAmount) / rates[newPlan];
      setUsdAmount(usd.toFixed(2));
    }
  };

  const fee = fees[plan];
  const total = usdAmount ? (parseFloat(usdAmount) + fee).toFixed(2) : "0.00";

  return (
    <div className={`rounded-2xl border border-slate-200 bg-white shadow-sm ${compact ? "p-4" : "p-6"}`}>
      <h3 className={`font-bold mb-4 ${compact ? "text-base" : "text-lg"}`} style={{ color: theme.navy }}>
        FX Rate Simulator
      </h3>

      {/* Plan Selector */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2" style={{ color: theme.navy }}>Plan Tier</label>
        <select
          value={plan}
          onChange={(e) => handlePlanChange(e.target.value)}
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#F6C94B] focus:border-[#F6C94B]"
          style={{ color: theme.navy }}
        >
          <option value="Basic">Basic (Free)</option>
          <option value="Premium">Premium ($10/mo)</option>
          <option value="SME">SME ($50/mo)</option>
          <option value="Enterprise">Enterprise (Custom)</option>
        </select>
      </div>

      {/* Amount Inputs */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: theme.navy }}>Send (USD)</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: '#64748b' }}>$</span>
            <input
              type="number"
              value={usdAmount}
              onChange={handleUsdChange}
              placeholder="0.00"
              className="w-full rounded-xl border border-slate-300 bg-white pl-7 pr-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#F6C94B] focus:border-[#F6C94B]"
              style={{ color: theme.navy }}
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: theme.navy }}>Receive (PHP)</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: '#64748b' }}>₱</span>
            <input
              type="number"
              value={phpAmount}
              onChange={handlePhpChange}
              placeholder="0.00"
              className="w-full rounded-xl border border-slate-300 bg-white pl-7 pr-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#F6C94B] focus:border-[#F6C94B]"
              style={{ color: theme.navy }}
            />
          </div>
        </div>
      </div>

      {/* Rate Info */}
      <div className="rounded-xl p-4" style={{ backgroundColor: theme.offWhite }}>
        <div className="flex justify-between text-sm mb-2">
          <span style={{ color: '#64748b' }}>Exchange Rate</span>
          <span className="font-semibold" style={{ color: theme.gold }}>
            1 USD = {rates[plan].toFixed(2)} PHP
          </span>
        </div>
        <div className="flex justify-between text-sm mb-2">
          <span style={{ color: '#64748b' }}>Transfer Fee</span>
          <span className="font-semibold" style={{ color: fee > 0 ? theme.navy : '#10b981' }}>
            {fee > 0 ? `$${fee.toFixed(2)}` : "Free"}
          </span>
        </div>
        {usdAmount && (
          <div className="flex justify-between text-sm pt-2 border-t border-slate-200">
            <span className="font-medium" style={{ color: theme.navy }}>Total Cost</span>
            <span className="font-bold" style={{ color: theme.navy }}>${total}</span>
          </div>
        )}
      </div>

      <p className="text-xs mt-3 text-center" style={{ color: '#94a3b8' }}>
        * Simulated rates for demo purposes only. Actual rates may vary.
      </p>
    </div>
  );
}
