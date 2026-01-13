/**
 * PBX FX API Client
 * Connects to Netlify function for real FX quotes
 * Falls back to dev rates if not configured
 */

const FX_ENDPOINT = '/.netlify/functions/get-fx-quote';
const POLL_INTERVAL = 10000; // 10 seconds
const RATE_LOCK_DURATION = 15 * 60; // 15 minutes in seconds

// Fallback rate for dev/demo (when Netlify function unavailable)
const DEV_BASE_RATE = 56.25;
const getDevRate = () => DEV_BASE_RATE + (Math.random() - 0.5) * 0.3;

/**
 * Fetch live FX quote from Netlify function
 */
export async function getFxQuote(amountUsd = 100) {
  try {
    const response = await fetch(`${FX_ENDPOINT}?amount_usd=${amountUsd}`);
    
    if (!response.ok) {
      throw new Error(`FX API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Handle Netlify function response format
    return {
      rate: data.rate || data.pbx_rate,
      midMarket: data.mid_market,
      amountUsd: data.amount_usd || amountUsd,
      amountPhp: data.amount_php || amountUsd * (data.rate || data.pbx_rate),
      spreadPercent: data.spread_percent,
      source: data.source || 'live',
      isLive: data.source !== 'dev',
      timestamp: new Date(data.timestamp * 1000),
      quoteId: `quote_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
  } catch (error) {
    console.warn('FX API fallback to local dev rates:', error.message);
    
    // Return local dev fallback
    const devRate = getDevRate();
    return {
      rate: Math.round(devRate * 100) / 100,
      midMarket: null,
      amountUsd: amountUsd,
      amountPhp: Math.round(amountUsd * devRate * 100) / 100,
      spreadPercent: null,
      source: 'local-dev',
      isLive: false,
      timestamp: new Date(),
      quoteId: `local_${Date.now()}`,
    };
  }
}

/**
 * Lock the current rate for 15 minutes
 */
export function lockRate(quote) {
  const lockedAt = new Date();
  const expiresAt = new Date(lockedAt.getTime() + RATE_LOCK_DURATION * 1000);
  
  return {
    ...quote,
    locked: true,
    lockedAt,
    expiresAt,
    lockDuration: RATE_LOCK_DURATION,
    lockId: `lock_${Date.now()}`,
  };
}

/**
 * Calculate remaining lock time in seconds
 */
export function getRemainingLockTime(lockedQuote) {
  if (!lockedQuote?.expiresAt) return 0;
  const remaining = Math.max(0, (new Date(lockedQuote.expiresAt) - new Date()) / 1000);
  return Math.floor(remaining);
}

/**
 * Format seconds as MM:SS
 */
export function formatLockTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Get source label for display
 */
export function getSourceLabel(source) {
  switch (source) {
    case 'openexchangerates':
      return 'Live';
    case 'exchangerate.host':
      return 'Live';
    case 'dev':
      return 'Dev feed';
    case 'local-dev':
      return 'Dev feed';
    default:
      return source || 'Live';
  }
}

/**
 * Check if source is live
 */
export function isLiveSource(source) {
  return source === 'openexchangerates' || source === 'exchangerate.host';
}

// Export constants
export const FX_POLL_INTERVAL = POLL_INTERVAL;
export const FX_LOCK_DURATION = RATE_LOCK_DURATION;
