/**
 * LiveFXRate - Real-time FX display component
 * Polls Netlify function every 10 seconds
 * 
 * P1 REQUIREMENT: Always shows source label - never displays rate without one
 * If API key missing, shows "Dev feed" and continues polling
 */
import React, { useState, useEffect } from "react";
import { getFxQuote, getSourceLabel, isLiveSource, formatLockTime } from "../lib/fxApi";
import { colors, tw, fxSourceLabels } from "../lib/theme";

export default function LiveFXRate({ 
  showLockInfo = false, 
  showDisclaimer = true, 
  compact = false,
  onRateChange,
  className = "",
}) {
  const [quote, setQuote] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState(false);

  // Poll for live rates every 10 seconds
  useEffect(() => {
    const fetchQuote = async () => {
      setIsUpdating(true);
      try {
        const q = await getFxQuote(100);
        setQuote(q);
        setError(false);
        if (onRateChange) onRateChange(q);
      } catch (err) {
        console.error('FX fetch error:', err);
        setError(true);
      }
      setTimeout(() => setIsUpdating(false), 300);
    };

    fetchQuote();
    const interval = setInterval(fetchQuote, 10000);
    return () => clearInterval(interval);
  }, [onRateChange]);

  // CRITICAL: Always derive source label - never show rate without label
  const sourceLabel = quote?.source 
    ? (fxSourceLabels[quote.source] || getSourceLabel(quote.source))
    : 'Loading';
    
  const isLive = quote ? isLiveSource(quote.source) : false;
  const isDev = quote?.source === 'dev' || quote?.source === 'local-dev';

  if (compact) {
    return (
      <div className={`inline-flex items-center gap-2 ${className}`}>
        {/* Live/Dev indicator dot */}
        <div className={`w-2 h-2 rounded-full ${isUpdating ? 'bg-yellow-500 animate-pulse' : isLive ? 'bg-green-500' : 'bg-yellow-500'}`} />
        
        <span className={`text-sm ${tw.textOnDarkMuted}`}>
          1 USD =
        </span>
        
        <span className={`font-bold ${tw.textGold} ${isUpdating ? 'animate-pulse' : ''}`}>
          ₱{quote?.rate?.toFixed(2) || '—'}
        </span>
        
        {/* REQUIRED: Source label badge - always visible */}
        <span className={`text-xs px-2 py-0.5 rounded-full ${
          isLive 
            ? 'bg-green-500/20 text-green-400' 
            : isDev 
              ? 'bg-yellow-500/20 text-yellow-400'
              : 'bg-gray-500/20 text-gray-400'
        }`}>
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
      {/* Header with source status - REQUIRED */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {/* Status indicator */}
          <div className={`w-2 h-2 rounded-full ${
            isUpdating 
              ? 'bg-yellow-500 animate-pulse' 
              : isLive 
                ? 'bg-green-500' 
                : 'bg-yellow-500'
          }`} />
          
          {/* REQUIRED: Source label - always visible, never hidden */}
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
            isLive 
              ? 'bg-green-500/20 text-green-400' 
              : isDev
                ? 'bg-yellow-500/20 text-yellow-400'
                : 'bg-gray-500/20 text-gray-400'
          }`}>
            {sourceLabel}
          </span>
        </div>
        <span className="text-xs text-white/50">
          Updates every 10s
        </span>
      </div>

      {/* Rate Display */}
      <div className="flex items-baseline gap-2 mb-3">
        <span className={`text-3xl font-bold ${tw.textGold} ${isUpdating ? 'animate-pulse' : ''}`}>
          1 USD = ₱{quote?.rate?.toFixed(2) || '—'}
        </span>
      </div>

      {/* Badges & Info */}
      <div className="flex items-center gap-2 flex-wrap">
        {showLockInfo && (
          <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-white/10 ${tw.textOnDarkMuted}`}>
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

      {/* Disclaimer - also includes source type */}
      {showDisclaimer && (
        <p className="text-xs mt-3 text-white/40">
          * {isDev ? 'Dev feed rate for testing.' : isLive ? 'Live market rate.' : 'Indicative rate.'} Actual rate locked at time of transfer.
        </p>
      )}
    </div>
  );
}

/**
 * LiveFXTicker - Minimal ticker for marketing pages
 * REQUIREMENT: Always shows source label
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

  // CRITICAL: Always derive source label
  const sourceLabel = quote?.source 
    ? (fxSourceLabels[quote.source] || getSourceLabel(quote.source))
    : 'Loading';
  const isLive = quote ? isLiveSource(quote.source) : false;
  const isDev = quote?.source === 'dev' || quote?.source === 'local-dev';

  return (
    <div className={`inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white/10 border border-white/20 ${className}`}>
      {/* Status dot */}
      <div className={`w-2 h-2 rounded-full ${
        isUpdating 
          ? 'bg-yellow-500 animate-pulse' 
          : isLive 
            ? 'bg-green-500' 
            : 'bg-yellow-500'
      }`} />
      
      {/* REQUIRED: Source label - always shown */}
      <span className={`text-sm ${
        isDev ? 'text-yellow-400' : isLive ? 'text-green-400' : 'text-white/70'
      }`}>
        {sourceLabel}:
      </span>
      
      <span className={`font-bold ${tw.textGold} ${isUpdating ? 'animate-pulse' : ''}`}>
        1 USD = ₱{quote?.rate?.toFixed(2) || '—'}
      </span>
      
      <span className="text-xs text-white/50">
        • Auto-refresh
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
        <span className={tw.textOnDarkMuted}>Rate locked for</span>
        <span className={`font-bold ${isExpiring ? 'text-red-400' : tw.textGold}`}>
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
