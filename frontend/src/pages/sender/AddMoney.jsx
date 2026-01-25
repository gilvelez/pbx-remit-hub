/**
 * AddMoney.jsx - Fund PBX wallet from linked bank
 * Phase 2: Add Money Flow
 * 
 * Flow:
 * 1. Check if user has linked banks
 * 2. If no banks → prompt to link bank first
 * 3. If banks exist → show amount input + bank selector
 * 4. On confirm → Call Circle API to mint USDC (user sees USD)
 */
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSession } from "../../contexts/SessionContext";
import { getLinkedBanks } from "../../lib/bankApi";
import { addMoneyFlow } from "../../lib/circleApi";

export default function AddMoney() {
  const navigate = useNavigate();
  const { session } = useSession();
  const [linkedBanks, setLinkedBanks] = useState([]);
  const [selectedBank, setSelectedBank] = useState(null);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);

  // Fetch linked banks on mount
  useEffect(() => {
    const fetchBanks = async () => {
      try {
        const banks = await getLinkedBanks(session?.token);
        setLinkedBanks(banks);
        if (banks.length > 0) {
          setSelectedBank(banks[0]);
        }
      } catch (err) {
        console.error("Failed to fetch linked banks:", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchBanks();
  }, [session?.token]);

  const handleAmountChange = (e) => {
    const value = e.target.value.replace(/[^0-9.]/g, '');
    // Only allow one decimal point and max 2 decimal places
    if (value.split('.').length <= 2) {
      const parts = value.split('.');
      if (parts[1]?.length > 2) return;
      setAmount(value);
    }
    setError("");
  };

  const handleQuickAmount = (quickAmount) => {
    setAmount(quickAmount.toString());
    setError("");
  };

  const handleContinue = () => {
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      setError("Please enter a valid amount");
      return;
    }
    if (numAmount < 10) {
      setError("Minimum amount is $10");
      return;
    }
    if (numAmount > 10000) {
      setError("Maximum amount is $10,000 per transfer");
      return;
    }
    if (!selectedBank) {
      setError("Please select a bank account");
      return;
    }
    setShowConfirm(true);
  };

  const handleConfirm = async () => {
    setSubmitting(true);
    setError("");
    
    try {
      // Call Circle API to add money (mints USDC 1:1 with USD)
      const result = await addMoneyFlow(parseFloat(amount));
      
      // Success - navigate back to home with success state
      navigate("/sender/dashboard", { 
        state: { 
          fundingSuccess: true, 
          amount: result.amountAdded,
          newBalance: result.newBalance,
          message: result.message || "Funds added to your wallet"
        } 
      });
    } catch (err) {
      setError(err.message || "Failed to add money. Please try again.");
      setShowConfirm(false);
    } finally {
      setSubmitting(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0A2540]"></div>
      </div>
    );
  }

  // No linked banks - prompt to link
  if (linkedBanks.length === 0) {
    return (
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-full transition"
            data-testid="add-money-back-btn"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-xl font-bold text-[#0A2540]">Add Money</h1>
        </div>

        {/* No Bank Linked State */}
        <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
            </svg>
          </div>
          
          <h2 className="text-lg font-semibold text-[#0A2540] mb-2">
            Link a bank to fund your PBX wallet
          </h2>
          <p className="text-gray-500 mb-6">
            Connect your bank account securely to add money to your PBX balance
          </p>
          
          <button
            onClick={() => navigate("/sender/banks")}
            className="w-full h-12 bg-[#0A2540] text-white font-semibold rounded-xl hover:bg-[#0A2540]/90 transition flex items-center justify-center gap-2"
            data-testid="link-bank-btn"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            Link a Bank
          </button>
        </div>
      </div>
    );
  }

  // Confirmation screen
  if (showConfirm) {
    return (
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => setShowConfirm(false)}
            className="p-2 hover:bg-gray-100 rounded-full transition"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-xl font-bold text-[#0A2540]">Confirm Transfer</h1>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="text-center mb-6">
            <div className="text-4xl font-bold text-[#0A2540] mb-2">
              ${parseFloat(amount).toFixed(2)}
            </div>
            <p className="text-gray-500">Adding to PBX Wallet</p>
          </div>

          <div className="border-t border-gray-100 pt-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">From</span>
              <span className="font-medium text-[#0A2540]">
                {selectedBank?.institution_name} ••••{selectedBank?.last4}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">To</span>
              <span className="font-medium text-[#0A2540]">PBX USD Wallet</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Fee</span>
              <span className="font-medium text-green-600">Free</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Arrival</span>
              <span className="font-medium text-[#0A2540]">1-3 business days</span>
            </div>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            onClick={handleConfirm}
            disabled={submitting}
            className="w-full h-12 bg-[#0A2540] text-white font-semibold rounded-xl hover:bg-[#0A2540]/90 transition mt-6 disabled:opacity-50"
            data-testid="confirm-add-money-btn"
          >
            {submitting ? "Processing..." : "Confirm Transfer"}
          </button>

          <p className="text-xs text-gray-400 text-center mt-4">
            By confirming, you authorize PBX to initiate this transfer from your bank account.
          </p>
        </div>
      </div>
    );
  }

  // Main add money form
  return (
    <div className="max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 rounded-full transition"
          data-testid="add-money-back-btn"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-xl font-bold text-[#0A2540]">Add Money</h1>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        {/* Amount Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Amount
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl text-gray-400">$</span>
            <input
              type="text"
              inputMode="decimal"
              value={amount}
              onChange={handleAmountChange}
              placeholder="0.00"
              className="w-full h-16 pl-10 pr-4 text-3xl font-bold text-[#0A2540] border border-gray-200 rounded-xl focus:border-[#0A2540] focus:ring-1 focus:ring-[#0A2540] outline-none"
              data-testid="add-money-amount-input"
            />
          </div>
          
          {/* Quick Amount Buttons */}
          <div className="flex gap-2 mt-3">
            {[50, 100, 250, 500].map((quickAmount) => (
              <button
                key={quickAmount}
                onClick={() => handleQuickAmount(quickAmount)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
                  amount === quickAmount.toString()
                    ? 'bg-[#0A2540] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                ${quickAmount}
              </button>
            ))}
          </div>
        </div>

        {/* Bank Selector */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            From Bank Account
          </label>
          <div className="space-y-2">
            {linkedBanks.map((bank) => (
              <button
                key={bank.id}
                onClick={() => setSelectedBank(bank)}
                className={`w-full flex items-center gap-3 p-4 rounded-xl border transition ${
                  selectedBank?.id === bank.id
                    ? 'border-[#0A2540] bg-[#0A2540]/5'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                data-testid={`bank-option-${bank.id}`}
              >
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                  </svg>
                </div>
                <div className="flex-1 text-left">
                  <div className="font-medium text-[#0A2540]">{bank.institution_name}</div>
                  <div className="text-sm text-gray-500">
                    {bank.account_type} ••••{bank.last4}
                  </div>
                </div>
                {selectedBank?.id === bank.id && (
                  <svg className="w-5 h-5 text-[#0A2540]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            ))}
          </div>
          
          {/* Link Another Bank */}
          <button
            onClick={() => navigate("/sender/banks")}
            className="w-full mt-2 py-3 text-sm text-[#0A2540] font-medium hover:bg-gray-50 rounded-lg transition"
          >
            + Link another bank
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Continue Button */}
        <button
          onClick={handleContinue}
          disabled={!amount || !selectedBank}
          className="w-full h-12 bg-[#0A2540] text-white font-semibold rounded-xl hover:bg-[#0A2540]/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
          data-testid="add-money-continue-btn"
        >
          Continue
        </button>

        {/* Info */}
        <div className="mt-4 flex items-start gap-2 text-xs text-gray-500">
          <svg className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>
            ACH transfers typically arrive in 1-3 business days. There are no fees to add money.
          </span>
        </div>
      </div>
    </div>
  );
}
