/**
 * Transfers Page - Send PHP to bank accounts, GCash, Maya
 * PHP only transfers with confirmation modal
 */
import React, { useState, useEffect } from "react";
import { getTransferMethods, getTransferHistory, createTransfer, getWalletBalances } from "../../lib/recipientApi";

export default function Transfers() {
  const [methods, setMethods] = useState([]);
  const [banks, setBanks] = useState([]);
  const [history, setHistory] = useState([]);
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [transferForm, setTransferForm] = useState({
    recipient_account: '',
    recipient_name: '',
    bank_code: '',
    amount: '',
  });
  const [showConfirm, setShowConfirm] = useState(false);
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(null);
  const [activeTab, setActiveTab] = useState('send');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [methodsData, historyData, walletData] = await Promise.all([
          getTransferMethods(),
          getTransferHistory(),
          getWalletBalances(),
        ]);
        setMethods(methodsData.methods || []);
        setBanks(methodsData.banks || []);
        setHistory(historyData.transfers || []);
        setWallet(walletData);
      } catch (error) {
        console.error('Failed to fetch transfers data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSelectMethod = (method) => {
    setSelectedMethod(method);
    setTransferForm({ recipient_account: '', recipient_name: '', bank_code: '', amount: '' });
    setSuccess(null);
  };

  const handleConfirmTransfer = async () => {
    if (!selectedMethod || !transferForm.recipient_account || !transferForm.amount) return;

    setSending(true);
    try {
      const result = await createTransfer(
        selectedMethod.id,
        parseFloat(transferForm.amount),
        transferForm.recipient_account,
        transferForm.recipient_name,
        transferForm.bank_code || null
      );
      setSuccess(result);
      setShowConfirm(false);
      
      // Refresh data
      const [walletData, historyData] = await Promise.all([
        getWalletBalances(),
        getTransferHistory(),
      ]);
      setWallet(walletData);
      setHistory(historyData.transfers || []);
    } catch (error) {
      console.error('Transfer failed:', error);
    } finally {
      setSending(false);
    }
  };

  const isValidTransfer = () => {
    if (!selectedMethod || !transferForm.recipient_account || !transferForm.amount) return false;
    if (parseFloat(transferForm.amount) <= 0) return false;
    if (parseFloat(transferForm.amount) > (wallet?.php_balance || 0)) return false;
    if (selectedMethod.max_amount && parseFloat(transferForm.amount) > selectedMethod.max_amount) return false;
    if (selectedMethod.type === 'bank' && !transferForm.bank_code) return false;
    return true;
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
        <h1 className="text-2xl font-bold text-[#0B1F3B]">Transfers</h1>
        <p className="text-gray-500 text-sm">Send PHP to bank accounts, GCash, or Maya</p>
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
          onClick={() => setActiveTab('send')}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition ${
            activeTab === 'send' 
              ? 'border-[#0B1F3B] text-[#0B1F3B]' 
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Send
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

      {activeTab === 'send' && (
        <>
          {/* Success State */}
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-6">
              <div className="text-center">
                <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="font-semibold text-green-800 text-lg mb-1">Transfer Sent!</p>
                <p className="text-sm text-green-600 mb-4">
                  ₱{success.amount?.toLocaleString()} to {success.recipient}
                </p>
                <div className="bg-white rounded-lg p-3 text-left text-sm">
                  <div className="flex justify-between py-1">
                    <span className="text-gray-500">Method</span>
                    <span className="font-medium">{success.method}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-gray-500">Status</span>
                    <span className="font-medium text-green-600">{success.status}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-gray-500">ETA</span>
                    <span className="font-medium">{success.eta}</span>
                  </div>
                </div>
                <button
                  onClick={() => { setSuccess(null); setSelectedMethod(null); }}
                  className="mt-4 text-sm text-green-700 hover:underline"
                >
                  Make another transfer
                </button>
              </div>
            </div>
          )}

          {!success && !selectedMethod && (
            <div>
              <h2 className="font-semibold text-[#0B1F3B] mb-3">Select Transfer Method</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {methods.map((method) => (
                  <button
                    key={method.id}
                    onClick={() => handleSelectMethod(method)}
                    className="flex items-start gap-3 p-4 bg-white rounded-xl border border-gray-200 hover:border-[#0B1F3B] transition text-left"
                    data-testid={`method-${method.id}`}
                  >
                    <div className="w-10 h-10 rounded-full bg-[#0B1F3B]/10 flex items-center justify-center flex-shrink-0">
                      {method.type === 'ewallet' ? '📱' : '🏦'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-[#0B1F3B]">{method.name}</p>
                      <p className="text-xs text-gray-500">{method.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                          {method.eta}
                        </span>
                        <span className="text-xs text-gray-400">
                          Fee: {method.fee === 0 ? 'Free' : `₱${method.fee}`}
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Transfer Form */}
          {!success && selectedMethod && (
            <div className="bg-white rounded-2xl p-6 border border-gray-200">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
                <div className="w-10 h-10 rounded-full bg-[#0B1F3B]/10 flex items-center justify-center">
                  {selectedMethod.type === 'ewallet' ? '📱' : '🏦'}
                </div>
                <div>
                  <p className="font-semibold text-[#0B1F3B]">{selectedMethod.name}</p>
                  <p className="text-xs text-gray-500">{selectedMethod.eta}</p>
                </div>
                <button
                  onClick={() => setSelectedMethod(null)}
                  className="ml-auto text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                {/* Bank Selection (for bank transfers) */}
                {selectedMethod.type === 'bank' && (
                  <div>
                    <label className="text-sm text-gray-600 mb-2 block">Select Bank</label>
                    <select
                      value={transferForm.bank_code}
                      onChange={(e) => setTransferForm({ ...transferForm, bank_code: e.target.value })}
                      className="w-full h-12 px-4 border border-gray-200 rounded-xl focus:border-[#0B1F3B] focus:ring-2 focus:ring-[#0B1F3B]/10 outline-none bg-white"
                      data-testid="transfer-bank-select"
                    >
                      <option value="">Select a bank</option>
                      {banks.map((bank) => (
                        <option key={bank.code} value={bank.code}>{bank.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="text-sm text-gray-600 mb-2 block">
                    {selectedMethod.type === 'ewallet' ? 'Mobile Number' : 'Account Number'}
                  </label>
                  <input
                    type="text"
                    value={transferForm.recipient_account}
                    onChange={(e) => setTransferForm({ ...transferForm, recipient_account: e.target.value })}
                    className="w-full h-12 px-4 border border-gray-200 rounded-xl focus:border-[#0B1F3B] focus:ring-2 focus:ring-[#0B1F3B]/10 outline-none"
                    placeholder={selectedMethod.type === 'ewallet' ? '09171234567' : '1234567890'}
                    data-testid="transfer-account-input"
                  />
                </div>

                <div>
                  <label className="text-sm text-gray-600 mb-2 block">Recipient Name (optional)</label>
                  <input
                    type="text"
                    value={transferForm.recipient_name}
                    onChange={(e) => setTransferForm({ ...transferForm, recipient_name: e.target.value })}
                    className="w-full h-12 px-4 border border-gray-200 rounded-xl focus:border-[#0B1F3B] focus:ring-2 focus:ring-[#0B1F3B]/10 outline-none"
                    placeholder="Juan Dela Cruz"
                  />
                </div>

                <div>
                  <label className="text-sm text-gray-600 mb-2 block">Amount (PHP)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">₱</span>
                    <input
                      type="number"
                      value={transferForm.amount}
                      onChange={(e) => setTransferForm({ ...transferForm, amount: e.target.value })}
                      className="w-full h-12 pl-8 pr-4 border border-gray-200 rounded-xl focus:border-[#0B1F3B] focus:ring-2 focus:ring-[#0B1F3B]/10 outline-none"
                      placeholder="0.00"
                      data-testid="transfer-amount-input"
                    />
                  </div>
                  {selectedMethod.max_amount && (
                    <p className="text-xs text-gray-500 mt-1">
                      Max: ₱{selectedMethod.max_amount.toLocaleString()}
                    </p>
                  )}
                </div>
              </div>

              <button
                onClick={() => setShowConfirm(true)}
                disabled={!isValidTransfer()}
                className="w-full mt-6 py-3 bg-[#0B1F3B] text-white rounded-xl font-semibold hover:bg-[#0B1F3B]/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
                data-testid="transfer-continue-btn"
              >
                Continue
              </button>
            </div>
          )}
        </>
      )}

      {activeTab === 'history' && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          {history.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {history.map((tx) => (
                <div key={tx.id} className="px-5 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                      <span className="text-purple-600">↑</span>
                    </div>
                    <div>
                      <p className="font-medium text-[#0B1F3B]">{tx.method_name}</p>
                      <p className="text-xs text-gray-500">{tx.recipient}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-[#0B1F3B]">
                      ₱{tx.amount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </p>
                    <p className={`text-xs ${tx.status === 'completed' ? 'text-green-600' : 'text-amber-600'}`}>
                      {tx.eta}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-5 py-8 text-center text-gray-500">
              <p>No transfer history yet</p>
            </div>
          )}
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold text-[#0B1F3B] mb-4">Confirm Transfer</h3>
            
            <div className="bg-gray-50 rounded-xl p-4 space-y-3 mb-6">
              <div className="flex justify-between">
                <span className="text-gray-500">To</span>
                <span className="font-medium text-[#0B1F3B]">{transferForm.recipient_account}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Via</span>
                <span className="font-medium">{selectedMethod?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Amount</span>
                <span className="font-bold text-lg text-[#0B1F3B]">
                  ₱{parseFloat(transferForm.amount).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">ETA</span>
                <span className="font-medium text-green-600">{selectedMethod?.eta}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-3 border border-gray-200 rounded-xl text-gray-600 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmTransfer}
                disabled={sending}
                className="flex-1 py-3 bg-[#0B1F3B] text-white rounded-xl font-semibold flex items-center justify-center gap-2"
                data-testid="confirm-transfer-btn"
              >
                {sending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    Sending...
                  </>
                ) : (
                  'Confirm'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
