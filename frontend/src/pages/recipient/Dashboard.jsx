/**
 * Recipient Dashboard - One-glance financial control
 * Shows USD/PHP balances, live FX rate, recent activity, incoming PBX transfers
 */
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getWalletBalances, getFxQuote, getStatements } from "../../lib/recipientApi";
import { getIncomingTransfers } from "../../lib/internalApi";

export default function RecipientDashboard() {
  const navigate = useNavigate();
  const [wallet, setWallet] = useState(null);
  const [fxQuote, setFxQuote] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [incomingTransfers, setIncomingTransfers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [walletData, fxData, statementsData, incomingData] = await Promise.all([
          getWalletBalances(),
          getFxQuote(100),
          getStatements({ limit: 5 }),
          getIncomingTransfers(5).catch(() => ({ transfers: [] })),
        ]);
        setWallet(walletData);
        setFxQuote(fxData);
        setRecentActivity(statementsData.transactions || []);
        setIncomingTransfers(incomingData.transfers || []);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Poll FX rate every 15 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const fxData = await getFxQuote(100);
        setFxQuote(fxData);
      } catch (error) {
        console.error('Failed to refresh FX rate:', error);
      }
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0B1F3B]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      {/* Welcome Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#0B1F3B]">Dashboard</h1>
        <p className="text-gray-500 text-sm">Your financial overview at a glance</p>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* USD Wallet Card */}
        <div className="bg-[#0B1F3B] rounded-2xl p-5 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                <span className="text-lg">🇺🇸</span>
              </div>
              <div>
                <p className="text-white/70 text-sm">USD Balance</p>
                <p className="text-xs text-white/50">USDC</p>
              </div>
            </div>
            <span className="text-xs bg-[#C9A24D]/20 text-[#C9A24D] px-2 py-1 rounded-full">Hold</span>
          </div>
          <p className="text-3xl font-bold" data-testid="usd-balance">
            ${wallet?.usd_balance?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '0.00'}
          </p>
          <p className="text-sm text-white/50 mt-2">
            ≈ ₱{((wallet?.usd_balance || 0) * (fxQuote?.pbx_rate || 56)).toLocaleString(undefined, { minimumFractionDigits: 2 })} PHP
          </p>
        </div>

        {/* PHP Wallet Card */}
        <div className="bg-white rounded-2xl p-5 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-[#0B1F3B]/10 flex items-center justify-center">
                <span className="text-lg">🇵🇭</span>
              </div>
              <div>
                <p className="text-gray-500 text-sm">PHP Balance</p>
                <p className="text-xs text-gray-400">Spending</p>
              </div>
            </div>
            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Active</span>
          </div>
          <p className="text-3xl font-bold text-[#0B1F3B]" data-testid="php-balance">
            ₱{wallet?.php_balance?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '0.00'}
          </p>
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => navigate('/recipient/bills')}
              className="text-xs bg-[#0B1F3B] text-white px-3 py-1.5 rounded-lg hover:bg-[#0B1F3B]/90 transition"
            >
              Pay Bills
            </button>
            <button
              onClick={() => navigate('/recipient/transfers')}
              className="text-xs bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-200 transition"
            >
              Transfer
            </button>
          </div>
        </div>
      </div>

      {/* Live FX Rate Card */}
      <div className="bg-gradient-to-r from-[#C9A24D]/10 to-[#C9A24D]/5 rounded-2xl p-5 border border-[#C9A24D]/20">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <p className="text-sm text-gray-600">Live Exchange Rate</p>
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold text-[#0B1F3B]" data-testid="fx-rate">
                1 USD = ₱{fxQuote?.pbx_rate?.toFixed(2) || '—'}
              </p>
              <span className="text-xs text-gray-500">
                Mid: ₱{fxQuote?.mid_market_rate?.toFixed(2)}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              PBX Spread: {fxQuote?.pbx_spread_percent}% • Bank Spread: {fxQuote?.bank_spread_percent}%
            </p>
          </div>
          <button
            onClick={() => navigate('/recipient/convert')}
            className="bg-[#0B1F3B] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#0B1F3B]/90 transition whitespace-nowrap"
            data-testid="convert-btn"
          >
            Convert USD → PHP
          </button>
        </div>
      </div>

      {/* Incoming PBX Transfers */}
      {incomingTransfers.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden" data-testid="incoming-transfers-section">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-green-50">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h2 className="font-semibold text-[#0B1F3B]">Incoming PBX Transfers</h2>
                <p className="text-xs text-gray-500">Instant • Free • From PBX users</p>
              </div>
            </div>
          </div>
          
          <div className="divide-y divide-gray-100">
            {incomingTransfers.map((tx) => (
              <div key={tx.id || tx.transfer_id} className="px-5 py-4 flex items-center justify-between" data-testid="incoming-transfer-item">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                    <span className="text-green-600 font-bold">
                      {tx.from?.[0]?.toUpperCase() || '?'}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-[#0B1F3B] text-sm">From {tx.from || 'PBX User'}</p>
                    {tx.note && <p className="text-xs text-gray-500">"{tx.note}"</p>}
                    <p className="text-xs text-gray-400">
                      {new Date(tx.created_at).toLocaleDateString()} • {new Date(tx.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-600 text-lg">
                    +${tx.amount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                    Received
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-[#0B1F3B]">Recent Activity</h2>
          <button
            onClick={() => navigate('/recipient/statements')}
            className="text-sm text-[#C9A24D] hover:underline"
          >
            View all
          </button>
        </div>
        
        {recentActivity.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {recentActivity.map((tx) => (
              <div key={tx.id} className="px-5 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    tx.type === 'credit' ? 'bg-green-100' :
                    tx.type === 'fx_conversion' ? 'bg-blue-100' :
                    tx.type === 'bill_payment' ? 'bg-amber-100' :
                    'bg-purple-100'
                  }`}>
                    {tx.type === 'credit' && <span className="text-green-600">↓</span>}
                    {tx.type === 'fx_conversion' && <span className="text-blue-600">↔</span>}
                    {tx.type === 'bill_payment' && <span className="text-amber-600">📄</span>}
                    {tx.type === 'transfer_out' && <span className="text-purple-600">↑</span>}
                  </div>
                  <div>
                    <p className="font-medium text-[#0B1F3B] text-sm">{tx.category}</p>
                    <p className="text-xs text-gray-500">{tx.description}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-semibold ${
                    tx.amount > 0 ? 'text-green-600' : 'text-gray-900'
                  }`}>
                    {tx.amount > 0 ? '+' : ''}{tx.currency === 'USD' ? '$' : '₱'}
                    {Math.abs(tx.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(tx.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-5 py-8 text-center text-gray-500">
            <p>No recent activity</p>
          </div>
        )}
      </div>
    </div>
  );
}
