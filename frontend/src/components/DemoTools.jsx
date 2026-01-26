/**
 * DemoTools.jsx - Demo mint panel for testing
 * Visible when REACT_APP_DEMO_MODE=true OR ?demo=1 in URL
 */
import React, { useState } from 'react';
import { useSession } from '../contexts/SessionContext';

/**
 * Check if demo tools should be shown
 * - REACT_APP_DEMO_MODE=true in env
 * - OR ?demo=1 in URL (owner access)
 */
function shouldShowDemoTools() {
  // Check env var
  if (process.env.REACT_APP_DEMO_MODE === 'true') {
    return true;
  }
  // Check URL param (owner access in production)
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    if (params.get('demo') === '1') {
      return true;
    }
  }
  return false;
}

/**
 * Admin mint helper - uses recipient-wallet endpoint with fund action
 */
async function adminMint(userId, currency, amount) {
  const key = process.env.REACT_APP_ADMIN_MINT_KEY || 'demo-mint-key-12345';
  const res = await fetch('/api/admin/mint', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-mint-key': key,
    },
    body: JSON.stringify({ userId, currency, amount }),
  });
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(text || 'Mint failed');
  }
  if (!res.ok) throw new Error(data?.error || data?.detail || 'Mint failed');
  return data;
}

export default function DemoTools({ onBalanceUpdate }) {
  const { session } = useSession();
  const [loading, setLoading] = useState('');
  const [message, setMessage] = useState('');

  // Don't render if demo tools not enabled or no user
  if (!shouldShowDemoTools() || !session?.user) {
    return null;
  }

  // Get user ID - handle both userId and email fallback
  const userId = session.user.userId || session.user.email;

  const handleMint = async (currency, amount, label) => {
    if (!userId) {
      setMessage('Error: No user ID available');
      return;
    }
    
    setLoading(currency);
    setMessage('');
    
    try {
      const result = await adminMint(userId, currency, amount);
      setMessage(`Added ${label}! New balance: $${result.newBalance?.usd?.toFixed(2) || 0} USD, ₱${result.newBalance?.php?.toFixed(2) || 0} PHP`);
      if (onBalanceUpdate) {
        onBalanceUpdate(result.newBalance);
      }
    } catch (err) {
      setMessage(`Error: ${err.message}`);
    } finally {
      setLoading('');
    }
  };

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <span className="font-semibold text-yellow-800">Demo Tools</span>
        <span className="text-xs text-yellow-600">(Testing Only)</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {/* USD Button */}
        <button
          onClick={() => handleMint('USD', 100, '$100 USD')}
          disabled={loading === 'USD'}
          className="px-3 py-1.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 transition"
          data-testid="demo-mint-usd"
        >
          {loading === 'USD' ? 'Adding...' : '+ $100 USD'}
        </button>

        {/* PHP Button */}
        <button
          onClick={() => handleMint('PHP', 5000, '₱5,000 PHP')}
          disabled={loading === 'PHP'}
          className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
          data-testid="demo-mint-php"
        >
          {loading === 'PHP' ? 'Adding...' : '+ ₱5,000 PHP'}
        </button>

        {/* USDC Button REMOVED - USDC is under the hood only */}
      </div>

      {message && (
        <p className={`mt-2 text-sm ${message.startsWith('Error') ? 'text-red-600' : 'text-green-600'}`}>
          {message}
        </p>
      )}

      <p className="mt-2 text-xs text-yellow-600">
        USDC is used under the hood (Circle rail). UI shows USD/PHP only.
      </p>
    </div>
  );
}
