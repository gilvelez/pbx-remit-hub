import React, { useState, useEffect } from "react";

// Base rate for simulation
const BASE_RATE = 56.25;

// Generate micro-fluctuations
const getFluctuatedRate = () => {
  const fluctuation = (Math.random() - 0.5) * 0.3; // ±0.15
  return BASE_RATE + fluctuation;
};

/**
 * LiveFXRate - Reusable real-time FX display component
 * 
 * @param {boolean} showLockInfo - Show 15-min lock badge
 * @param {boolean} showDisclaimer - Show "Indicative rate" disclaimer
 * @param {boolean} compact - Smaller version for inline use
 * @param {string} variant - "light" | "dark" for theming
 * @param {function} onRateChange - Callback when rate updates
 */
export default function LiveFXRate({ 
  showLockInfo = false, 
  showDisclaimer = true, 
  compact = false,
  variant = "light",
  onRateChange,
  className = "",
}) {
  const [rate, setRate] = useState(getFluctuatedRate());
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [isUpdating, setIsUpdating] = useState(false);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const fetchRate = () => {
      setIsUpdating(true);
      const newRate = getFluctuatedRate();
      
      setTimeout(() => {
        setRate(newRate);
        setLastUpdated(new Date());
        setIsUpdating(false);
        if (onRateChange) onRateChange(newRate);
      }, 300);
    };

    // Initial rate callback
    if (onRateChange) onRateChange(rate);

    const interval = setInterval(fetchRate, 30000);
    return () => clearInterval(interval);
  }, []);

  const isDark = variant === "dark";

  if (compact) {
    return (
      <div className={`inline-flex items-center gap-2 ${className}`}>
        <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          1 USD =
        </span>
        <span className={`font-bold ${isDark ? 'text-amber-400' : 'text-[#0A2540]'} ${isUpdating ? 'animate-pulse' : ''}`}>
          ₱{rate.toFixed(2)}
        </span>
        {showLockInfo && (
          <span className={`text-xs px-2 py-0.5 rounded-full ${isDark ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-700'}`}>
            15-min lock
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={`rounded-2xl p-4 ${isDark ? 'bg-white/10 border border-white/20' : 'bg-white border border-gray-200 shadow-sm'} ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isUpdating ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'}`} />
          <span className={`text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>
            Live Rate
          </span>
        </div>
        <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-400'}`}>
          Updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>

      {/* Rate Display */}
      <div className="flex items-baseline gap-2">
        <span className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-[#0A2540]'} ${isUpdating ? 'animate-pulse' : ''}`}>
          1 USD = ₱{rate.toFixed(2)}
        </span>
      </div>

      {/* Badges & Info */}
      <div className="flex items-center gap-2 mt-3">
        {showLockInfo && (
          <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${isDark ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-700'}`}>
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            15-min rate lock
          </span>
        )}
        <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          No fees
        </span>
      </div>

      {/* Disclaimer */}
      {showDisclaimer && (
        <p className={`text-xs mt-3 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
          * Indicative rate. Actual rate locked at time of transfer.
        </p>
      )}
    </div>
  );
}

/**
 * LiveFXTicker - Minimal ticker for landing page hero
 */
export function LiveFXTicker({ variant = "dark", className = "" }) {
  const [rate, setRate] = useState(getFluctuatedRate());
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const fetchRate = () => {
      setIsUpdating(true);
      setTimeout(() => {
        setRate(getFluctuatedRate());
        setIsUpdating(false);
      }, 300);
    };

    const interval = setInterval(fetchRate, 30000);
    return () => clearInterval(interval);
  }, []);

  const isDark = variant === "dark";

  return (
    <div className={`inline-flex items-center gap-3 px-4 py-2 rounded-full ${isDark ? 'bg-white/10 border border-white/20' : 'bg-gray-100 border border-gray-200'} ${className}`}>
      <div className={`w-2 h-2 rounded-full ${isUpdating ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'}`} />
      <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Live rate:</span>
      <span className={`font-bold ${isDark ? 'text-amber-400' : 'text-[#0A2540]'} ${isUpdating ? 'animate-pulse' : ''}`}>
        1 USD = ₱{rate.toFixed(2)}
      </span>
      <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
        • Updates every 30s
      </span>
    </div>
  );
}

/**
 * Get current rate for use in other components
 */
export function useCurrentRate() {
  const [rate, setRate] = useState(getFluctuatedRate());

  useEffect(() => {
    const interval = setInterval(() => {
      setRate(getFluctuatedRate());
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  return rate;
}
