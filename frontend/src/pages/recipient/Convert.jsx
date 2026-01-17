/**
 * Convert Page - USD → PHP Conversion (MOST IMPORTANT)
 * Shows live FX rate, PBX spread, 15-min countdown timer
 */
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getWalletBalances, getFxQuote, lockFxRate, convertCurrency } from "../../lib/recipientApi";

export default function Convert() {
  const navigate = useNavigate();
  const [wallet, setWallet] = useState(null);
  const [amountUsd, setAmountUsd] = useState('100');
  const [fxQuote, setFxQuote] = useState(null);
  const [lockedRate, setLockedRate] = useState(null);
  const [lockExpiry, setLockExpiry] = useState(null);
  const [countdown, setCountdown] = useState(null);
  const [loading, setLoading] = useState(true);
  const [converting, setConverting] = useState(false);
  const [success, setSuccess] = useState(null);

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [walletData, fxData] = await Promise.all([
          getWalletBalances(),
          getFxQuote(parseFloat(amountUsd) || 100),
        ]);
        setWallet(walletData);
        setFxQuote(fxData);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Update FX quote when amount changes (if not locked)
  useEffect(() => {
    if (!lockedRate && amountUsd && parseFloat(amountUsd) > 0) {
      const timer = setTimeout(async () => {
        try {
          const fxData = await getFxQuote(parseFloat(amountUsd));
          setFxQuote(fxData);
        } catch (error) {
          console.error('Failed to update FX quote:', error);
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [amountUsd, lockedRate]);

  // Poll FX rate every 15 seconds (if not locked)
  useEffect(() => {
    if (lockedRate) return;

    const interval = setInterval(async () => {
      if (amountUsd && parseFloat(amountUsd) > 0) {
        try {
          const fxData = await getFxQuote(parseFloat(amountUsd));
          setFxQuote(fxData);
        } catch (error) {
          console.error('Failed to refresh FX rate:', error);
        }
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [amountUsd, lockedRate]);

  // Countdown timer for locked rate
  useEffect(() => {
    if (!lockExpiry) return;

    const tick = () => {
      const remaining = Math.max(0, Math.floor((new Date(lockExpiry) - new Date()) / 1000));
      setCountdown(remaining);
      
      if (remaining <= 0) {
        // Rate expired, unlock
        setLockedRate(null);
        setLockExpiry(null);
      }
    };

    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [lockExpiry]);

  const handleLockRate = useCallback(async () => {
    try {
      const result = await lockFxRate(parseFloat(amountUsd), fxQuote.pbx_rate);
      setLockedRate({
        rate: result.rate,
        lock_id: result.lock_id,
      });
      setLockExpiry(result.expires_at);
    } catch (error) {
      console.error('Failed to lock rate:', error);
    }
  }, [amountUsd, fxQuote]);

  const handleConvert = async () => {
    if (!amountUsd || parseFloat(amountUsd) <= 0) return;
    if (parseFloat(amountUsd) > (wallet?.usd_balance || 0)) return;

    setConverting(true);
    try {
      const result = await convertCurrency(
        parseFloat(amountUsd),
        lockedRate?.rate || fxQuote?.pbx_rate,
        lockedRate?.lock_id
      );
      
      setSuccess(result);
      
      // Refresh wallet
      const walletData = await getWalletBalances();
      setWallet(walletData);
      
      // Reset state
      setLockedRate(null);
      setLockExpiry(null);
      setCountdown(null);
    } catch (error) {
      console.error('Conversion failed:', error);
    } finally {
      setConverting(false);
    }
  };

  const formatCountdown = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0B1F3B]" />
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-2xl p-8 border border-gray-200 text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-[#0B1F3B] mb-2">Conversion Complete!</h2>
          <p className="text-gray-500 mb-6">
            Successfully converted ${success.from_amount} to ₱{success.to_amount?.toLocaleString()}
          </p>
          
          <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
            <div className="flex justify-between py-2 border-b border-gray-200">
              <span className="text-gray-500">From</span>
              <span className="font-semibold">${success.from_amount} USD</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-200">
              <span className="text-gray-500">To</span>
              <span className="font-semibold">₱{success.to_amount?.toLocaleString()} PHP</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-500">Rate</span>
              <span className="font-semibold">₱{success.rate}</span>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => navigate('/recipient/dashboard')}
              className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold"
            >
              Dashboard
            </button>
            <button
              onClick={() => setSuccess(null)}
              className="flex-1 py-3 bg-[#0B1F3B] text-white rounded-xl font-semibold"
            >
              Convert More
            </button>
          </div>
        </div>
      </div>
    );
  }

  const activeRate = lockedRate?.rate || fxQuote?.pbx_rate || 0;
  const amountPhp = (parseFloat(amountUsd) || 0) * activeRate;
  const bankAmount = (parseFloat(amountUsd) || 0) * (fxQuote?.bank_rate || 0);
  const savings = amountPhp - bankAmount;
  const isValidAmount = parseFloat(amountUsd) > 0 && parseFloat(amountUsd) <= (wallet?.usd_balance || 0);

  return (
    <div className="max-w-lg mx-auto space-y-6 pb-20 lg:pb-0">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#0B1F3B]">Convert USD → PHP</h1>
        <p className="text-gray-500 text-sm">Lock a rate for 15 minutes before converting</p>
      </div>

      {/* Available Balance */}
      <div className="bg-[#0B1F3B]/5 rounded-xl px-4 py-3 flex items-center justify-between">
        <span className="text-sm text-gray-600">Available USD</span>
        <span className="font-semibold text-[#0B1F3B]">
          ${wallet?.usd_balance?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </span>
      </div>

      {/* Amount Input */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200">
        <label className="text-sm text-gray-600 mb-2 block">You convert</label>
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl">$</span>
            <input
              type="number"
              value={amountUsd}
              onChange={(e) => setAmountUsd(e.target.value)}
              disabled={!!lockedRate}
              className="w-full h-14 pl-10 pr-4 text-2xl font-semibold border border-gray-200 rounded-xl focus:border-[#0B1F3B] focus:ring-2 focus:ring-[#0B1F3B]/10 outline-none disabled:bg-gray-50"
              placeholder="0.00"
              data-testid="convert-amount-input"
            />
          </div>
          <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-lg">
            <span className="text-lg">🇺🇸</span>
            <span className="font-medium">USD</span>
          </div>
        </div>

        {/* Quick amounts */}
        {!lockedRate && (
          <div className="flex gap-2 flex-wrap">
            {[100, 250, 500, 1000].map((amt) => (
              <button
                key={amt}
                onClick={() => setAmountUsd(amt.toString())}
                className={`px-3 py-1.5 text-sm rounded-lg border transition ${
                  amountUsd === amt.toString()
                    ? 'border-[#0B1F3B] bg-[#0B1F3B]/5 text-[#0B1F3B]'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                ${amt}
              </button>
            ))}
            <button
              onClick={() => setAmountUsd(wallet?.usd_balance?.toString() || '0')}
              className="px-3 py-1.5 text-sm rounded-lg border border-[#C9A24D] text-[#C9A24D] hover:bg-[#C9A24D]/5 transition"
            >
              Max
            </button>
          </div>
        )}
      </div>

      {/* FX Rate Card */}
      <div className={`rounded-2xl p-6 border ${lockedRate ? 'bg-[#C9A24D]/10 border-[#C9A24D]' : 'bg-white border-gray-200'}`}>
        {/* Rate Lock Timer */}
        {lockedRate && countdown !== null && (
          <div className="mb-4 pb-4 border-b border-[#C9A24D]/30">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-[#C9A24D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span className="text-sm font-medium text-[#0B1F3B]">Rate Locked</span>
              </div>
              <span className={`font-bold text-lg ${countdown < 60 ? 'text-red-600' : 'text-[#0B1F3B]'}`}>
                {formatCountdown(countdown)}
              </span>
            </div>
            <div className="h-2 bg-white/50 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-1000 ${countdown < 60 ? 'bg-red-500' : 'bg-[#C9A24D]'}`}
                style={{ width: `${(countdown / 900) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Rate Display */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              {!lockedRate && <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />}
              <span className="text-sm text-gray-600">
                {lockedRate ? 'Locked Rate' : 'Live Rate'}
              </span>
            </div>
            <p className="text-2xl font-bold text-[#0B1F3B]" data-testid="convert-rate">
              1 USD = ₱{activeRate.toFixed(2)}
            </p>
          </div>
          {!lockedRate && (
            <button
              onClick={handleLockRate}
              disabled={!isValidAmount}
              className="px-4 py-2 bg-[#C9A24D] text-[#0B1F3B] rounded-lg font-semibold text-sm hover:bg-[#C9A24D]/90 transition disabled:opacity-50"
              data-testid="lock-rate-btn"
            >
              Lock Rate
            </button>
          )}
        </div>

        {/* Spread Info */}
        <div className="grid grid-cols-2 gap-4 py-3 border-t border-gray-200">
          <div>
            <p className="text-xs text-gray-500">PBX Spread</p>
            <p className="font-semibold text-green-600">{fxQuote?.pbx_spread_percent}%</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Bank Spread (avg)</p>
            <p className="font-semibold text-gray-600">{fxQuote?.bank_spread_percent}%</p>
          </div>
        </div>
      </div>

      {/* You Receive Card */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200">
        <label className="text-sm text-gray-600 mb-2 block">You receive</label>
        <div className="flex items-center justify-between">
          <p className="text-3xl font-bold text-[#0B1F3B]" data-testid="convert-receive-amount">
            ₱{amountPhp.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
          <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-lg">
            <span className="text-lg">🇵🇭</span>
            <span className="font-medium">PHP</span>
          </div>
        </div>

        {/* Savings comparison */}
        {savings > 0 && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-xl">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-semibold text-green-800">
                You save ₱{savings.toLocaleString(undefined, { minimumFractionDigits: 2 })} vs banks!
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Convert Button */}
      <button
        onClick={handleConvert}
        disabled={!isValidAmount || converting}
        className="w-full py-4 bg-[#0B1F3B] text-white rounded-xl font-semibold text-lg hover:bg-[#0B1F3B]/90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        data-testid="convert-confirm-btn"
      >
        {converting ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
            Converting...
          </>
        ) : (
          `Convert $${amountUsd || 0} → ₱${amountPhp.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
        )}
      </button>

      {/* Disclaimer */}
      <p className="text-xs text-center text-gray-500">
        Conversion is final once confirmed. Rate is locked for 15 minutes or until expiry.
      </p>
    </div>
  );
}
