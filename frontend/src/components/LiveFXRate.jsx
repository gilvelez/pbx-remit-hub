import React, { useState, useEffect } from "react";
import { getFxQuote, getSourceLabel, isLiveSource, formatLockTime } from "../lib/fxApi";

/**
 * LiveFXRate - Real-time FX display component
 * Polls Netlify function every 10 seconds
 */
export default function LiveFXRate({ 
  showLockInfo = false, 
  showDisclaimer = true, 
  compact = false,
  onRateChange,
  className = "",
}) {
  const [quote, setQuote] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Poll for live rates every 10 seconds
  useEffect(() => {
    const fetchQuote = async () => {
      setIsUpdating(true);
      try {
        const q = await getFxQuote(100);
        setQuote(q);
        if (onRateChange) onRateChange(q);
      } catch (err) {
        console.error('FX fetch error:', err);
      }
      setTimeout(() => setIsUpdating(false), 300);
    };

    fetchQuote();
    const interval = setInterval(fetchQuote, 10000);
    return () => clearInterval(interval);
  }, [onRateChange]);

  const sourceLabel = quote ? getSourceLabel(quote.source) : 'Loading';
  const isLive = quote ? isLiveSource(quote.source) : false;

  if (compact) {
    return (
      <div className={`inline-flex items-center gap-2 ${className}`}>
        <div className={`w-2 h-2 rounded-full ${isUpdating ? 'bg-yellow-500 animate-pulse' : isLive ? 'bg-green-500' : 'bg-yellow-500'}`} />
        <span className="text-sm text-white/70">
          1 USD =
        </span>
        <span className={`font-bold text-[#F6C94B] ${isUpdating ? 'animate-pulse' : ''}`}>
          ₱{quote?.rate?.toFixed(2) || '—'}
        </span>
        <span className={`text-xs px-2 py-0.5 rounded-full ${isLive ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
          {sourceLabel}
        </span>
        {showLockInfo && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/70">
            15-min lock
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={`rounded-2xl p-5 bg-white/10 border border-white/15 backdrop-blur ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isUpdating ? 'bg-yellow-500 animate-pulse' : isLive ? 'bg-green-500' : 'bg-yellow-500'}`} />
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${isLive ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
            {sourceLabel}
          </span>
        </div>
        <span className="text-xs text-white/50">
          Updates every 10s
        </span>
      </div>

      {/* Rate Display */}
      <div className="flex items-baseline gap-2 mb-3">
        <span className={`text-3xl font-bold text-[#F6C94B] ${isUpdating ? 'animate-pulse' : ''}`}>
          1 USD = ₱{quote?.rate?.toFixed(2) || '—'}
        </span>
      </div>

      {/* Badges & Info */}
      <div className="flex items-center gap-2">
        {showLockInfo && (
          <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-white/10 text-white/80">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            15-min rate lock
          </span>
        )}
        <span className="text-xs text-white/60">
          No fees
        </span>
      </div>

      {/* Disclaimer */}
      {showDisclaimer && (
        <p className="text-xs mt-3 text-white/40">
          * {isLive ? 'Live rate' : 'Indicative rate'}. Actual rate locked at time of transfer.
        </p>
      )}
    </div>
  );
}

/**
 * LiveFXTicker - Minimal ticker for marketing pages
 */
export function LiveFXTicker({ className = "" }) {
  const [quote, setQuote] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const fetchQuote = async () => {
      setIsUpdating(true);
      try {
        const q = await getFxQuote(100);
        setQuote(q);
      } catch (err) {
        console.error('FX fetch error:', err);
      }
      setTimeout(() => setIsUpdating(false), 300);
    };

    fetchQuote();
    const interval = setInterval(fetchQuote, 10000);
    return () => clearInterval(interval);
  }, []);

  const sourceLabel = quote ? getSourceLabel(quote.source) : 'Loading';
  const isLive = quote ? isLiveSource(quote.source) : false;

  return (
    <div className={`inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white/10 border border-white/20 ${className}`}>
      <div className={`w-2 h-2 rounded-full ${isUpdating ? 'bg-yellow-500 animate-pulse' : isLive ? 'bg-green-500' : 'bg-yellow-500'}`} />
      <span className="text-sm text-white/70">{sourceLabel} rate:</span>
      <span className={`font-bold text-[#F6C94B] ${isUpdating ? 'animate-pulse' : ''}`}>
        1 USD = ₱{quote?.rate?.toFixed(2) || '—'}
      </span>
      <span className="text-xs text-white/50">
        • Updates every 10s
      </span>
    </div>
  );
}

/**
 * FXLockTimer - Countdown timer for locked rate
 */
export function FXLockTimer({ expiresAt, onExpire }) {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    if (!expiresAt) return;

    const tick = () => {
      const secs = Math.max(0, Math.floor((new Date(expiresAt) - new Date()) / 1000));
      setRemaining(secs);
      if (secs <= 0 && onExpire) {
        onExpire();
      }
    };

    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [expiresAt, onExpire]);

  const progress = (remaining / (15 * 60)) * 100;
  const isExpiring = remaining < 60;

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-white/70">Rate locked for</span>
        <span className={`font-bold ${isExpiring ? 'text-red-400' : 'text-[#F6C94B]'}`}>
          {formatLockTime(remaining)}
        </span>
      </div>
      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
        <div 
          className={`h-full transition-all duration-1000 ${isExpiring ? 'bg-red-500' : 'bg-[#F6C94B]'}`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
