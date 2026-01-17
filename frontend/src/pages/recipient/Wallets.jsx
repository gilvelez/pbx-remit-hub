/**
 * Wallets Page - USD and PHP wallet management
 * Shows balances and sub-wallets (Bills, Savings, Family)
 */
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getWalletBalances, getFxQuote, allocateSubWallet, fundWalletSimulation } from "../../lib/recipientApi";

export default function Wallets() {
  const navigate = useNavigate();
  const [wallet, setWallet] = useState(null);
  const [fxQuote, setFxQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [allocateModal, setAllocateModal] = useState(null);
  const [allocateAmount, setAllocateAmount] = useState('');
  
  // Test funding state
  const [showFundModal, setShowFundModal] = useState(false);
  const [fundAmount, setFundAmount] = useState('');
  const [fundLoading, setFundLoading] = useState(false);
  const [fundError, setFundError] = useState('');
  const [fundSuccess, setFundSuccess] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [walletData, fxData] = await Promise.all([
          getWalletBalances(),
          getFxQuote(100),
        ]);
        setWallet(walletData);
        setFxQuote(fxData);
      } catch (error) {
        console.error('Failed to fetch wallet data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleAllocate = async () => {
    if (!allocateAmount || parseFloat(allocateAmount) <= 0) return;
    
    try {
      await allocateSubWallet(allocateModal, parseFloat(allocateAmount));
      // Refresh wallet data
      const walletData = await getWalletBalances();
      setWallet(walletData);
      setAllocateModal(null);
      setAllocateAmount('');
    } catch (error) {
      console.error('Failed to allocate:', error);
    }
  };

  // Handle test funding
  const handleFundWallet = async () => {
    const amount = parseFloat(fundAmount);
    if (!fundAmount || amount <= 0) {
      setFundError('Please enter a valid amount');
      return;
    }
    if (amount > 5000) {
      setFundError('Maximum funding amount is $5,000');
      return;
    }
    
    setFundLoading(true);
    setFundError('');
    setFundSuccess(null);
    
    try {
      const result = await fundWalletSimulation(amount);
      setFundSuccess(result);
      // Refresh wallet data
      const walletData = await getWalletBalances();
      setWallet(walletData);
      setFundAmount('');
      // Auto-close after 3 seconds
      setTimeout(() => {
        setShowFundModal(false);
        setFundSuccess(null);
      }, 3000);
    } catch (error) {
      setFundError(error.message || 'Failed to fund wallet');
    } finally {
      setFundLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0B1F3B]" />
      </div>
    );
  }

  const subWallets = [
    { id: 'bills', name: 'Bills', icon: '📄', color: 'amber', balance: wallet?.sub_wallets?.bills || 0 },
    { id: 'savings', name: 'Savings', icon: '🐷', color: 'green', balance: wallet?.sub_wallets?.savings || 0 },
    { id: 'family', name: 'Family', icon: '👨‍👩‍👧', color: 'purple', balance: wallet?.sub_wallets?.family || 0 },
  ];

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#0B1F3B]">Wallets</h1>
        <p className="text-gray-500 text-sm">Manage your USD and PHP balances</p>
      </div>

      {/* Main Wallets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* USD Wallet */}
        <div className="bg-[#0B1F3B] rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                <span className="text-2xl">🇺🇸</span>
              </div>
              <div>
                <p className="text-white/70 text-sm">USD Wallet</p>
                <p className="text-xs text-white/50">USDC Stablecoin</p>
              </div>
            </div>
          </div>
          
          <p className="text-4xl font-bold mb-2" data-testid="wallet-usd-balance">
            ${wallet?.usd_balance?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '0.00'}
          </p>
          
          <p className="text-sm text-white/60 mb-6">
            ≈ ₱{((wallet?.usd_balance || 0) * (fxQuote?.pbx_rate || 56)).toLocaleString(undefined, { minimumFractionDigits: 2 })} at current rate
          </p>

          <div className="bg-white/10 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-[#C9A24D] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-white">Hold & Earn</p>
                <p className="text-xs text-white/60 mt-1">
                  Your USD is held in USDC. Convert to PHP only when you need to spend. 
                  No automatic conversion.
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={() => navigate('/recipient/convert')}
            className="w-full mt-4 bg-[#C9A24D] text-[#0B1F3B] py-3 rounded-xl font-semibold hover:bg-[#C9A24D]/90 transition"
            data-testid="convert-usd-btn"
          >
            Convert to PHP
          </button>

          {/* Test Funding Button */}
          <button
            onClick={() => setShowFundModal(true)}
            className="w-full mt-2 bg-white/10 text-white py-2.5 rounded-xl font-medium hover:bg-white/20 transition border border-white/20 text-sm"
            data-testid="test-fund-btn"
          >
            <span className="mr-2">🧪</span> Test Funding (Simulation)
          </button>
        </div>

        {/* PHP Wallet */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-[#0B1F3B]/10 flex items-center justify-center">
                <span className="text-2xl">🇵🇭</span>
              </div>
              <div>
                <p className="text-gray-500 text-sm">PHP Wallet</p>
                <p className="text-xs text-gray-400">Philippine Peso</p>
              </div>
            </div>
          </div>
          
          <p className="text-4xl font-bold text-[#0B1F3B] mb-2" data-testid="wallet-php-balance">
            ₱{wallet?.php_balance?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '0.00'}
          </p>
          
          <p className="text-sm text-gray-500 mb-6">
            Available for spending, bills, and transfers
          </p>

          <div className="flex gap-3">
            <button
              onClick={() => navigate('/recipient/bills')}
              className="flex-1 bg-[#0B1F3B] text-white py-3 rounded-xl font-semibold hover:bg-[#0B1F3B]/90 transition"
            >
              Pay Bills
            </button>
            <button
              onClick={() => navigate('/recipient/transfers')}
              className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-200 transition"
            >
              Transfer
            </button>
          </div>
        </div>
      </div>

      {/* Sub-Wallets */}
      <div>
        <h2 className="text-lg font-semibold text-[#0B1F3B] mb-4">Sub-Wallets (PHP)</h2>
        <p className="text-sm text-gray-500 mb-4">
          Organize your PHP into buckets for different purposes
        </p>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {subWallets.map((sw) => (
            <div key={sw.id} className="bg-white rounded-xl p-4 border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{sw.icon}</span>
                  <span className="font-medium text-[#0B1F3B]">{sw.name}</span>
                </div>
                <button
                  onClick={() => setAllocateModal(sw.id)}
                  className="text-xs text-[#C9A24D] hover:underline"
                >
                  Allocate
                </button>
              </div>
              <p className="text-xl font-bold text-[#0B1F3B]">
                ₱{sw.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Allocate Modal */}
      {allocateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold text-[#0B1F3B] mb-4">
              Allocate to {subWallets.find(s => s.id === allocateModal)?.name}
            </h3>
            <div className="mb-4">
              <label className="text-sm text-gray-600 mb-2 block">Amount (PHP)</label>
              <input
                type="number"
                value={allocateAmount}
                onChange={(e) => setAllocateAmount(e.target.value)}
                className="w-full h-12 px-4 border border-gray-200 rounded-xl focus:border-[#0B1F3B] focus:ring-2 focus:ring-[#0B1F3B]/10 outline-none"
                placeholder="0.00"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { setAllocateModal(null); setAllocateAmount(''); }}
                className="flex-1 py-3 border border-gray-200 rounded-xl text-gray-600 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleAllocate}
                className="flex-1 py-3 bg-[#0B1F3B] text-white rounded-xl font-semibold"
              >
                Allocate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
