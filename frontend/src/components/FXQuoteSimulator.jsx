import React, { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Progress } from "./ui/progress";

// Theme colors
const theme = {
  gold: '#F6C94B',
  goldDark: '#D4A520',
};

// Simulated FX rates by plan (PHP per 1 USD)
const rates = {
  Basic: 55.50,
  Premium: 56.00,
  SME: 56.30,
  Enterprise: 56.50,
};

export default function FXQuoteSimulator({ compact = false }) {
  const [plan, setPlan] = useState("Basic");
  const [amountUSD, setAmountUSD] = useState(100);
  const [quoteRate, setQuoteRate] = useState(null);
  const [quoteExpiry, setQuoteExpiry] = useState(0);
  const [isLocked, setIsLocked] = useState(false);

  // Countdown timer
  useEffect(() => {
    if (quoteExpiry > 0) {
      const timer = setInterval(() => {
        setQuoteExpiry(prev => {
          if (prev <= 1) {
            setIsLocked(false);
            setQuoteRate(null);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [quoteExpiry]);

  // Format seconds to M:SS
  const formatTime = (secs) => {
    const min = Math.floor(secs / 60);
    const sec = secs % 60;
    return `${min}:${sec.toString().padStart(2, '0')}`;
  };

  // Get a new quote with 15-min lock
  const getQuote = () => {
    const fetchedRate = rates[plan];
    setQuoteRate(fetchedRate);
    setQuoteExpiry(15 * 60); // 15 minutes
    setIsLocked(true);
  };

  // Calculate converted amount
  const convertedAmount = quoteRate ? (amountUSD * quoteRate) : (amountUSD * rates[plan]);
  const previewRate = rates[plan];

  return (
    <div className={`rounded-2xl border border-neutral-700 bg-neutral-900 text-gray-100 ${compact ? "p-4" : "p-6"}`}>
      <h3 className={`font-bold text-amber-400 mb-4 ${compact ? "text-base" : "text-xl"}`}>
        FX Rate Simulator
      </h3>

      {/* Plan Selector */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2 text-gray-300">Plan Tier</label>
        <select
          value={plan}
          onChange={(e) => {
            setPlan(e.target.value);
            if (!isLocked) setQuoteRate(null);
          }}
          disabled={isLocked}
          className="w-full rounded-xl border border-neutral-600 bg-neutral-800 px-4 py-2.5 text-sm text-gray-100 outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 disabled:opacity-50"
          data-testid="fx-plan-selector"
        >
          <option value="Basic">Basic (Free)</option>
          <option value="Premium">Premium (₱499/mo)</option>
          <option value="SME">SME (₱2,499/mo)</option>
          <option value="Enterprise">Enterprise (Custom)</option>
        </select>
      </div>

      {/* Amount Input */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2 text-gray-300">Amount in USD</label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">$</span>
          <input
            type="number"
            value={amountUSD}
            onChange={(e) => setAmountUSD(Number(e.target.value))}
            disabled={isLocked}
            className="w-full rounded-xl border border-neutral-600 bg-neutral-800 pl-7 pr-3 py-2.5 text-sm text-gray-100 outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 disabled:opacity-50"
            min="1"
            data-testid="fx-amount-input"
          />
        </div>
      </div>

      {/* Get Quote Button */}
      {!isLocked && (
        <Button
          onClick={getQuote}
          className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold mb-4"
          data-testid="fx-get-quote-btn"
        >
          Get FX Quote (Lock for 15 min)
        </Button>
      )}

      {/* Quote Display */}
      <div className="rounded-xl p-4 bg-neutral-800">
        {isLocked ? (
          <>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-green-400 text-sm font-semibold">🔒 Rate Locked</span>
            </div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-400">Locked Rate</span>
              <span className="font-bold text-amber-400">
                1 USD = ₱{quoteRate?.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-sm mb-3">
              <span className="text-gray-400">You will receive</span>
              <span className="font-bold text-gray-100">
                ₱{convertedAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="mb-2">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-400">Time remaining</span>
                <span className="font-bold text-amber-400">{formatTime(quoteExpiry)}</span>
              </div>
              <Progress 
                value={(quoteExpiry / (15 * 60)) * 100} 
                className="h-2 bg-neutral-700"
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Complete your transfer before the timer expires to lock in this rate.
            </p>
          </>
        ) : (
          <>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-400">Preview Rate ({plan})</span>
              <span className="font-semibold text-amber-400">
                1 USD = ₱{previewRate.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-400">Estimated receive</span>
              <span className="font-semibold text-gray-100">
                ₱{(amountUSD * previewRate).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Click "Get FX Quote" to lock this rate for 15 minutes.
            </p>
          </>
        )}
      </div>

      <p className="text-xs mt-3 text-center text-gray-500">
        * Simulated rates for demo purposes only. Actual rates may vary.
      </p>
    </div>
  );
}
