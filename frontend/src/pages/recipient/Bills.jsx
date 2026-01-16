/**
 * Bills Page - Pay Philippine billers from PHP wallet
 * Supports Meralco, PLDT, Globe, Smart, Maynilad, Manila Water
 */
import React, { useState, useEffect } from "react";
import { getBillers, getSavedBillers, getBillPaymentHistory, payBill, getWalletBalances } from "../../lib/recipientApi";

export default function Bills() {
  const [billers, setBillers] = useState([]);
  const [savedBillers, setSavedBillers] = useState([]);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedBiller, setSelectedBiller] = useState(null);
  const [paymentForm, setPaymentForm] = useState({
    account_no: '',
    amount: '',
    nickname: '',
    save_biller: false,
  });
  const [paying, setPaying] = useState(false);
  const [success, setSuccess] = useState(null);
  const [activeTab, setActiveTab] = useState('pay');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [billersData, savedData, historyData, walletData] = await Promise.all([
          getBillers(),
          getSavedBillers(),
          getBillPaymentHistory(),
          getWalletBalances(),
        ]);
        setBillers(billersData.billers || []);
        setSavedBillers(savedData.saved_billers || []);
        setPaymentHistory(historyData.payments || []);
        setWallet(walletData);
      } catch (error) {
        console.error('Failed to fetch bills data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSelectBiller = (biller) => {
    setSelectedBiller(biller);
    setPaymentForm({ account_no: '', amount: '', nickname: '', save_biller: false });
    setSuccess(null);
  };

  const handleSelectSavedBiller = (saved) => {
    const biller = billers.find(b => b.code === saved.biller_code);
    if (biller) {
      setSelectedBiller(biller);
      setPaymentForm({
        account_no: saved.account_no,
        amount: '',
        nickname: saved.nickname,
        save_biller: false,
      });
      setSuccess(null);
    }
  };

  const handlePayBill = async () => {
    if (!selectedBiller || !paymentForm.account_no || !paymentForm.amount) return;
    if (parseFloat(paymentForm.amount) > (wallet?.php_balance || 0)) return;

    setPaying(true);
    try {
      const result = await payBill(
        selectedBiller.code,
        paymentForm.account_no,
        parseFloat(paymentForm.amount),
        paymentForm.save_biller,
        paymentForm.nickname
      );
      setSuccess(result);
      
      // Refresh data
      const [walletData, historyData, savedData] = await Promise.all([
        getWalletBalances(),
        getBillPaymentHistory(),
        getSavedBillers(),
      ]);
      setWallet(walletData);
      setPaymentHistory(historyData.payments || []);
      setSavedBillers(savedData.saved_billers || []);
    } catch (error) {
      console.error('Payment failed:', error);
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0B1F3B]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#0B1F3B]">Pay Bills</h1>
        <p className="text-gray-500 text-sm">Pay your Philippine bills from your PHP wallet</p>
      </div>

      {/* Available Balance */}
      <div className="bg-[#0B1F3B]/5 rounded-xl px-4 py-3 flex items-center justify-between">
        <span className="text-sm text-gray-600">Available PHP</span>
        <span className="font-semibold text-[#0B1F3B]">
          ₱{wallet?.php_balance?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </span>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('pay')}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition ${
            activeTab === 'pay' 
              ? 'border-[#0B1F3B] text-[#0B1F3B]' 
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Pay Bills
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition ${
            activeTab === 'history' 
              ? 'border-[#0B1F3B] text-[#0B1F3B]' 
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          History
        </button>
      </div>

      {activeTab === 'pay' && (
        <>
          {/* Success State */}
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-green-800">Payment Successful!</p>
                  <p className="text-sm text-green-600">
                    ₱{success.amount?.toLocaleString()} paid to {success.biller_name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => { setSuccess(null); setSelectedBiller(null); }}
                className="mt-3 text-sm text-green-700 hover:underline"
              >
                Pay another bill
              </button>
            </div>
          )}

          {!success && !selectedBiller && (
            <>
              {/* Saved Billers */}
              {savedBillers.length > 0 && (
                <div>
                  <h2 className="font-semibold text-[#0B1F3B] mb-3">Saved Billers</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {savedBillers.map((saved) => {
                      const biller = billers.find(b => b.code === saved.biller_code);
                      return (
                        <button
                          key={saved.id}
                          onClick={() => handleSelectSavedBiller(saved)}
                          className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-200 hover:border-[#0B1F3B] transition text-left"
                        >
                          <span className="text-2xl">{biller?.logo}</span>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-[#0B1F3B] truncate">
                              {saved.nickname || biller?.name}
                            </p>
                            <p className="text-xs text-gray-500 truncate">{saved.account_no}</p>
                          </div>
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* All Billers */}
              <div>
                <h2 className="font-semibold text-[#0B1F3B] mb-3">Select Biller</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {billers.map((biller) => (
                    <button
                      key={biller.code}
                      onClick={() => handleSelectBiller(biller)}
                      className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl border border-gray-200 hover:border-[#0B1F3B] transition"
                      data-testid={`biller-${biller.code}`}
                    >
                      <span className="text-3xl">{biller.logo}</span>
                      <span className="font-medium text-sm text-[#0B1F3B]">{biller.name}</span>
                      <span className="text-xs text-gray-500 capitalize">{biller.category}</span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Payment Form */}
          {!success && selectedBiller && (
            <div className="bg-white rounded-2xl p-6 border border-gray-200">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
                <span className="text-3xl">{selectedBiller.logo}</span>
                <div>
                  <p className="font-semibold text-[#0B1F3B]">{selectedBiller.name}</p>
                  <p className="text-sm text-gray-500 capitalize">{selectedBiller.category}</p>
                </div>
                <button
                  onClick={() => setSelectedBiller(null)}
                  className="ml-auto text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-600 mb-2 block">Account Number</label>
                  <input
                    type="text"
                    value={paymentForm.account_no}
                    onChange={(e) => setPaymentForm({ ...paymentForm, account_no: e.target.value })}
                    className="w-full h-12 px-4 border border-gray-200 rounded-xl focus:border-[#0B1F3B] focus:ring-2 focus:ring-[#0B1F3B]/10 outline-none"
                    placeholder="Enter account number"
                    data-testid="bill-account-input"
                  />
                </div>

                <div>
                  <label className="text-sm text-gray-600 mb-2 block">Amount (PHP)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">₱</span>
                    <input
                      type="number"
                      value={paymentForm.amount}
                      onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                      className="w-full h-12 pl-8 pr-4 border border-gray-200 rounded-xl focus:border-[#0B1F3B] focus:ring-2 focus:ring-[#0B1F3B]/10 outline-none"
                      placeholder="0.00"
                      data-testid="bill-amount-input"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm text-gray-600 mb-2 block">Nickname (optional)</label>
                  <input
                    type="text"
                    value={paymentForm.nickname}
                    onChange={(e) => setPaymentForm({ ...paymentForm, nickname: e.target.value })}
                    className="w-full h-12 px-4 border border-gray-200 rounded-xl focus:border-[#0B1F3B] focus:ring-2 focus:ring-[#0B1F3B]/10 outline-none"
                    placeholder="e.g., Home Electric"
                  />
                </div>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={paymentForm.save_biller}
                    onChange={(e) => setPaymentForm({ ...paymentForm, save_biller: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300 text-[#0B1F3B] focus:ring-[#0B1F3B]"
                  />
                  <span className="text-sm text-gray-600">Save this biller for future payments</span>
                </label>
              </div>

              <button
                onClick={handlePayBill}
                disabled={!paymentForm.account_no || !paymentForm.amount || paying || parseFloat(paymentForm.amount) > (wallet?.php_balance || 0)}
                className="w-full mt-6 py-3 bg-[#0B1F3B] text-white rounded-xl font-semibold hover:bg-[#0B1F3B]/90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                data-testid="pay-bill-btn"
              >
                {paying ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                    Processing...
                  </>
                ) : (
                  `Pay ₱${parseFloat(paymentForm.amount || 0).toLocaleString()}`
                )}
              </button>
            </div>
          )}
        </>
      )}

      {activeTab === 'history' && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          {paymentHistory.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {paymentHistory.map((payment) => (
                <div key={payment.id} className="px-5 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">
                      {billers.find(b => b.code === payment.biller_code)?.logo || '📄'}
                    </span>
                    <div>
                      <p className="font-medium text-[#0B1F3B]">{payment.biller_name}</p>
                      <p className="text-xs text-gray-500">{payment.account_no}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-[#0B1F3B]">
                      ₱{payment.amount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </p>
                    <p className={`text-xs ${payment.status === 'paid' ? 'text-green-600' : 'text-amber-600'}`}>
                      {payment.status === 'paid' ? 'Paid' : 'Processing'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-5 py-8 text-center text-gray-500">
              <p>No payment history yet</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
