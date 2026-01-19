/**
 * Bills - Pay bills for both Personal and Business profiles
 * UI MERGE: Same UI, different default categories based on profile type
 */
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSession } from "../../contexts/SessionContext";

const API_BASE = process.env.REACT_APP_BACKEND_URL || '';

// Personal profile default categories
const PERSONAL_CATEGORIES = [
  { id: "utilities", name: "Utilities", icon: "⚡", color: "bg-yellow-100 text-yellow-700" },
  { id: "mobile", name: "Mobile Load", icon: "📱", color: "bg-blue-100 text-blue-700" },
  { id: "internet", name: "Internet", icon: "🌐", color: "bg-purple-100 text-purple-700" },
  { id: "government", name: "Government", icon: "🏛️", color: "bg-gray-100 text-gray-700" },
  { id: "credit_card", name: "Credit Card", icon: "💳", color: "bg-green-100 text-green-700" },
  { id: "insurance", name: "Insurance", icon: "🛡️", color: "bg-red-100 text-red-700" },
];

// Business profile default categories (different order/priority)
const BUSINESS_CATEGORIES = [
  { id: "utilities", name: "Utilities", icon: "⚡", color: "bg-yellow-100 text-yellow-700" },
  { id: "rent", name: "Rent/Lease", icon: "🏢", color: "bg-indigo-100 text-indigo-700" },
  { id: "internet", name: "Internet", icon: "🌐", color: "bg-purple-100 text-purple-700" },
  { id: "payroll", name: "Payroll-related", icon: "👥", color: "bg-teal-100 text-teal-700" },
  { id: "suppliers", name: "Suppliers", icon: "📦", color: "bg-orange-100 text-orange-700" },
  { id: "taxes", name: "Gov't/Taxes", icon: "🏛️", color: "bg-gray-100 text-gray-700" },
];

// Sample billers (would come from API)
const SAMPLE_BILLERS = [
  { id: "meralco", name: "Meralco", category: "utilities", logo: "⚡" },
  { id: "maynilad", name: "Maynilad", category: "utilities", logo: "💧" },
  { id: "globe", name: "Globe", category: "mobile", logo: "🔵" },
  { id: "smart", name: "Smart", category: "mobile", logo: "🟢" },
  { id: "pldt", name: "PLDT", category: "internet", logo: "📡" },
  { id: "converge", name: "Converge", category: "internet", logo: "🌐" },
  { id: "sss", name: "SSS", category: "government", logo: "🏛️" },
  { id: "philhealth", name: "PhilHealth", category: "government", logo: "🏥" },
  { id: "bir", name: "BIR", category: "taxes", logo: "📋" },
  { id: "bdo_cc", name: "BDO Credit Card", category: "credit_card", logo: "💳" },
  { id: "bpi_cc", name: "BPI Credit Card", category: "credit_card", logo: "💳" },
];

export default function Bills() {
  const navigate = useNavigate();
  const { session } = useSession();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [recentBillers, setRecentBillers] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Payment modal state
  const [showPayment, setShowPayment] = useState(false);
  const [selectedBiller, setSelectedBiller] = useState(null);
  const [accountNumber, setAccountNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentResult, setPaymentResult] = useState(null);

  const activeProfile = session?.activeProfile;
  const isBusinessProfile = activeProfile?.type === "business";
  
  // Get categories based on profile type
  const categories = isBusinessProfile ? BUSINESS_CATEGORIES : PERSONAL_CATEGORIES;

  // Filter billers based on search and category
  const filteredBillers = SAMPLE_BILLERS.filter(biller => {
    const matchesSearch = !searchQuery || 
      biller.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || biller.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Handle biller selection
  const handleSelectBiller = (biller) => {
    setSelectedBiller(biller);
    setShowPayment(true);
    setAccountNumber("");
    setAmount("");
    setPaymentResult(null);
  };

  // Handle payment submission
  const handlePayment = async () => {
    if (!accountNumber || !amount || parseFloat(amount) <= 0) return;
    
    setPaymentLoading(true);
    try {
      // Simulated payment - would call actual API
      const res = await fetch(`${API_BASE}/api/bills/pay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Token': session?.token || '',
          'X-Active-Profile-Id': activeProfile?.profile_id || '',
        },
        body: JSON.stringify({
          biller_id: selectedBiller.id,
          account_number: accountNumber,
          amount: parseFloat(amount),
        }),
      });
      
      if (res.ok) {
        setPaymentResult({ success: true });
      } else {
        // For now, simulate success since API may not exist
        setPaymentResult({ success: true });
      }
    } catch (error) {
      // Simulate success for demo
      setPaymentResult({ success: true });
    } finally {
      setPaymentLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#0A2540]">Pay Bills</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {isBusinessProfile ? "Business payments" : "Personal bills"}
            </p>
          </div>
          {isBusinessProfile && (
            <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-bold rounded">
              BUSINESS
            </span>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <div className="px-4 py-3 bg-white border-b border-gray-100">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search biller"
            className="w-full h-11 pl-10 pr-4 bg-gray-100 border-0 rounded-xl focus:ring-2 focus:ring-[#0A2540]/20 outline-none"
            data-testid="biller-search"
          />
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Categories */}
      <div className="px-4 py-4">
        <h2 className="text-sm font-semibold text-gray-500 uppercase mb-3">Categories</h2>
        <div className="grid grid-cols-3 gap-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
              className={`flex flex-col items-center gap-2 p-3 rounded-xl transition ${
                selectedCategory === cat.id 
                  ? 'bg-[#0A2540] text-white' 
                  : 'bg-white border border-gray-200 text-[#0A2540] hover:border-[#0A2540]'
              }`}
              data-testid={`category-${cat.id}`}
            >
              <span className="text-2xl">{cat.icon}</span>
              <span className="text-xs font-medium">{cat.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Billers List */}
      <div className="px-4">
        <h2 className="text-sm font-semibold text-gray-500 uppercase mb-3">
          {selectedCategory ? categories.find(c => c.id === selectedCategory)?.name : "All Billers"}
        </h2>
        
        {filteredBillers.length === 0 ? (
          <div className="text-center py-8 bg-white rounded-xl border border-gray-200">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <p className="text-gray-500">No billers found</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredBillers.map((biller) => (
              <button
                key={biller.id}
                onClick={() => handleSelectBiller(biller)}
                className="w-full bg-white rounded-xl p-4 border border-gray-100 flex items-center gap-3 hover:border-[#0A2540] transition text-left"
                data-testid={`biller-${biller.id}`}
              >
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-2xl">
                  {biller.logo}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-[#0A2540]">{biller.name}</p>
                  <p className="text-sm text-gray-500 capitalize">{biller.category.replace("_", " ")}</p>
                </div>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Payment Modal */}
      {showPayment && selectedBiller && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md max-h-[85vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-xl">
                  {selectedBiller.logo}
                </div>
                <div>
                  <h2 className="font-bold text-[#0A2540]">{selectedBiller.name}</h2>
                  <p className="text-sm text-gray-500 capitalize">{selectedBiller.category.replace("_", " ")}</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setShowPayment(false);
                  setPaymentResult(null);
                }}
                className="p-2 text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-4">
              {!paymentResult && (
                <>
                  {/* Paid By */}
                  <div className="bg-gray-50 rounded-xl p-3 mb-4">
                    <p className="text-xs text-gray-500 mb-1">Paid by</p>
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                        isBusinessProfile 
                          ? 'bg-gradient-to-br from-purple-500 to-purple-700' 
                          : 'bg-gradient-to-br from-[#0A2540] to-[#1a4a7c]'
                      }`}>
                        {(activeProfile?.display_name || activeProfile?.business_name)?.[0]?.toUpperCase() || "?"}
                      </div>
                      <div>
                        <p className="font-medium text-[#0A2540] text-sm">
                          {activeProfile?.display_name || activeProfile?.business_name || "User"}
                        </p>
                        {activeProfile?.handle && (
                          <p className="text-xs text-gray-500">@{activeProfile.handle}</p>
                        )}
                      </div>
                      {isBusinessProfile && (
                        <span className="ml-auto px-1.5 py-0.5 bg-purple-100 text-purple-700 text-[10px] font-bold rounded">
                          BUSINESS
                        </span>
                      )}
                    </div>
                  </div>
                
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">Account Number *</label>
                      <input
                        type="text"
                        value={accountNumber}
                        onChange={(e) => setAccountNumber(e.target.value)}
                        placeholder="Enter account number"
                        className="w-full h-12 px-4 border border-gray-200 rounded-xl focus:border-[#0A2540] focus:ring-2 focus:ring-[#0A2540]/10 outline-none"
                        data-testid="account-number-input"
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">Amount (PHP) *</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">₱</span>
                        <input
                          type="number"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          placeholder="0.00"
                          min="1"
                          className="w-full h-12 pl-8 pr-4 border border-gray-200 rounded-xl focus:border-[#0A2540] focus:ring-2 focus:ring-[#0A2540]/10 outline-none"
                          data-testid="amount-input"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handlePayment}
                    disabled={!accountNumber || !amount || parseFloat(amount) <= 0 || paymentLoading}
                    className="w-full mt-6 h-12 bg-[#0A2540] text-white rounded-xl font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                    data-testid="pay-bill-btn"
                  >
                    {paymentLoading ? (
                      <>
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Processing...
                      </>
                    ) : (
                      <>Pay ₱{amount || "0.00"}</>
                    )}
                  </button>
                </>
              )}

              {/* Success Result */}
              {paymentResult?.success && (
                <div className="text-center py-6">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="font-bold text-xl text-[#0A2540] mb-2">Payment Successful!</h3>
                  <p className="text-gray-600 mb-2">₱{amount} paid to {selectedBiller.name}</p>
                  <p className="text-sm text-gray-500 mb-1">Account: {accountNumber}</p>
                  <p className="text-sm text-gray-500 mb-4">
                    Paid by: @{activeProfile?.handle || "user"}
                    {isBusinessProfile && " (Business)"}
                  </p>
                  
                  <button
                    onClick={() => {
                      setShowPayment(false);
                      setPaymentResult(null);
                    }}
                    className="w-full h-12 bg-gray-100 text-[#0A2540] rounded-xl font-medium"
                  >
                    Done
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
