/**
 * Send - EXTERNAL Transfers Only (Phase 0 Cleanup)
 * 
 * PBX→PBX transfers are now done via Chat (social flow).
 * This page is for EXTERNAL payouts only: GCash, Maya, Bank, Cash Pickup.
 * 
 * Flow: Amount → Recipient → Payment Method → Review → Confirmation
 */
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useSession } from "../../contexts/SessionContext";
import { tw, fxSourceLabels } from "../../lib/theme";
import { 
  getFxQuote, 
  lockRate as lockFxRate, 
  getSourceLabel, 
  isLiveSource,
} from "../../lib/fxApi";
import { 
  createTransfer, 
  saveTransfer,
  saveRecipient,
  getRecipients,
  DELIVERY_METHODS, 
  PH_BANKS, 
  PAYMENT_METHODS 
} from "../../lib/mockApi";
import { FXLockTimer } from "../../components/LiveFXRate";

const STEPS = {
  AMOUNT: 'amount',
  RECIPIENT: 'recipient',
  PAYMENT: 'payment',
  REVIEW: 'review',
  CONFIRMATION: 'confirmation',
};

export default function Send() {
  const navigate = useNavigate();
  const { session } = useSession();
  const [step, setStep] = useState(STEPS.AMOUNT);
  const [loading, setLoading] = useState(false);
  
  // External transfer data
  const [amountUsd, setAmountUsd] = useState('');
  const [quote, setQuote] = useState(null);
  const [lockedQuote, setLockedQuote] = useState(null);
  const [recipient, setRecipient] = useState(null);
  const [deliveryMethod, setDeliveryMethod] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [savedRecipients, setSavedRecipients] = useState([]);
  const [transfer, setTransfer] = useState(null);

  // Load saved recipients (external only)
  useEffect(() => {
    const loadData = async () => {
      const recipients = await getRecipients();
      // Filter to external only
      const external = recipients.filter(r => r.deliveryMethod !== 'pbx_wallet');
      setSavedRecipients(external);
    };
    loadData();
  }, []);

  // FX quote for external transfers
  useEffect(() => {
    if (amountUsd && parseFloat(amountUsd) > 0 && !lockedQuote) {
      const timer = setTimeout(async () => {
        const q = await getFxQuote(parseFloat(amountUsd));
        setQuote(q);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [amountUsd, lockedQuote]);

  const handleLockRate = useCallback(() => {
    if (quote) {
      const locked = lockFxRate(quote);
      setLockedQuote(locked);
    }
  }, [quote]);

  const handleRateLockExpire = useCallback(() => {
    setLockedQuote(null);
    if (amountUsd && parseFloat(amountUsd) > 0) {
      getFxQuote(parseFloat(amountUsd)).then(setQuote);
    }
  }, [amountUsd]);

  const handleContinueAmount = () => {
    if (!amountUsd || parseFloat(amountUsd) < 1) return;
    handleLockRate();
    setStep(STEPS.RECIPIENT);
  };

  const handleSelectRecipient = (r) => {
    setRecipient(r);
    setDeliveryMethod(DELIVERY_METHODS.find(d => d.id === r.deliveryMethod) || DELIVERY_METHODS[0]);
    setStep(STEPS.PAYMENT);
  };

  const handleSelectPayment = (method) => {
    setPaymentMethod(method);
    setStep(STEPS.REVIEW);
  };

  const handleSendMoney = async () => {
    setLoading(true);
    try {
      const activeQuote = lockedQuote || quote;
      const result = await createTransfer({
        recipient,
        amountUsd: parseFloat(amountUsd),
        amountPhp: activeQuote.amountPhp,
        rate: activeQuote.rate,
        paymentMethod: paymentMethod.id,
        deliveryMethod: deliveryMethod.id,
      });
      saveTransfer(result);
      saveRecipient(recipient);
      setTransfer(result);
      setStep(STEPS.CONFIRMATION);
    } catch (error) {
      console.error('Transfer failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    if (step === STEPS.AMOUNT) {
      navigate('/sender/dashboard');
    } else if (step === STEPS.RECIPIENT) {
      setStep(STEPS.AMOUNT);
    } else if (step === STEPS.PAYMENT) {
      setStep(STEPS.RECIPIENT);
    } else if (step === STEPS.REVIEW) {
      setStep(STEPS.PAYMENT);
    }
  };

  const activeQuote = lockedQuote || quote;

  return (
    <div className="min-h-[calc(100vh-8rem)]">
      {/* Progress Header */}
      {step !== STEPS.CONFIRMATION && (
        <div className={`${tw.cardBg} border-b ${tw.borderOnLight} px-4 py-3 sticky top-14 z-30`}>
          <div className="flex items-center gap-3">
            <button onClick={goBack} className="p-1 -ml-1">
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="flex-1">
              <p className="text-sm font-medium text-[#0A2540]">Send to External</p>
              <p className="text-xs text-gray-500">GCash, Maya, Bank, Cash</p>
            </div>
          </div>
        </div>
      )}

      {/* PBX Friends Tip Banner - Show only on first step */}
      {step === STEPS.AMOUNT && (
        <div 
          onClick={() => navigate('/sender/people')}
          className="mx-4 mt-4 p-4 bg-gradient-to-r from-[#0A2540] to-[#1a4a7c] rounded-xl cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#F6C94B]/20 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-[#F6C94B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="flex-1 text-white">
              <p className="font-semibold text-sm">Sending to a PBX user?</p>
              <p className="text-xs text-white/80">Go to People tab for instant, free transfers →</p>
            </div>
          </div>
        </div>
      )}

      {/* Step Content */}
      {step === STEPS.AMOUNT && (
        <AmountStep
          amountUsd={amountUsd}
          setAmountUsd={setAmountUsd}
          quote={quote}
          lockedQuote={lockedQuote}
          onContinue={handleContinueAmount}
        />
      )}

      {step === STEPS.RECIPIENT && (
        <RecipientStep
          savedRecipients={savedRecipients}
          preSelectedRecipient={recipient}
          onSelect={handleSelectRecipient}
        />
      )}

      {step === STEPS.PAYMENT && (
        <PaymentStep onSelect={handleSelectPayment} />
      )}

      {step === STEPS.REVIEW && (
        <ReviewStep
          amountUsd={amountUsd}
          quote={activeQuote}
          lockedQuote={lockedQuote}
          recipient={recipient}
          deliveryMethod={deliveryMethod}
          paymentMethod={paymentMethod}
          loading={loading}
          onSend={handleSendMoney}
          setStep={setStep}
          onRateLockExpire={handleRateLockExpire}
        />
      )}

      {step === STEPS.CONFIRMATION && (
        <ConfirmationStep
          transfer={transfer}
          onSendAnother={() => {
            setStep(STEPS.AMOUNT);
            setAmountUsd('');
            setRecipient(null);
            setPaymentMethod(null);
            setLockedQuote(null);
            setTransfer(null);
          }}
          onGoHome={() => navigate('/sender/dashboard')}
        />
      )}
    </div>
  );
}

// Amount Step
function AmountStep({ amountUsd, setAmountUsd, quote, lockedQuote, onContinue }) {
  const sourceLabel = quote?.source 
    ? (fxSourceLabels[quote.source] || getSourceLabel(quote.source))
    : 'Loading';
  const isLive = quote ? isLiveSource(quote.source) : false;

  return (
    <div className="px-4 py-6">
      <h1 className={`text-xl font-bold ${tw.textOnLight} mb-6`}>How much do you want to send?</h1>
      
      <div className={`${tw.cardBg} rounded-2xl p-5 shadow-sm border ${tw.borderOnLight} mb-4`}>
        <div className="mb-6">
          <label className={`text-sm font-medium ${tw.textOnLightMuted} mb-2 block`}>You send</label>
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl text-gray-400">$</span>
              <input
                type="number"
                value={amountUsd}
                onChange={(e) => setAmountUsd(e.target.value)}
                className="w-full h-14 pl-10 pr-4 text-2xl font-semibold border border-gray-200 rounded-xl focus:border-[#0A2540] focus:ring-2 focus:ring-[#0A2540]/10 outline-none"
                placeholder="0.00"
                data-testid="amount-input"
              />
            </div>
            <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
              <span className="text-lg">🇺🇸</span>
              <span className="font-medium text-gray-700">USD</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 my-4">
          <div className="flex-1 h-px bg-gray-200" />
          <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-full">
            <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-green-500' : 'bg-yellow-500'}`} />
            <span className="text-sm text-gray-600">1 USD = ₱{quote?.rate?.toFixed(2) || '—'}</span>
            <span className={`text-xs px-1.5 py-0.5 rounded ${isLive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
              {sourceLabel}
            </span>
          </div>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        <div>
          <label className={`text-sm font-medium ${tw.textOnLightMuted} mb-2 block`}>They receive</label>
          <div className="flex items-center gap-3">
            <div className={`flex-1 h-14 px-4 flex items-center ${tw.cardBgDark} border ${tw.borderOnLight} rounded-xl`}>
              <span className="text-2xl font-semibold text-[#0A2540]">
                ₱{quote?.amountPhp?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '0.00'}
              </span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
              <span className="text-lg">🇵🇭</span>
              <span className="font-medium text-gray-700">PHP</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 text-sm text-gray-500 mb-6">
        <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        <span>15-min rate lock • ETA depends on payout method</span>
      </div>

      <button
        onClick={onContinue}
        disabled={!amountUsd || parseFloat(amountUsd) < 1}
        className={`w-full ${tw.btnNavy} rounded-xl h-12 disabled:opacity-50 transition`}
        data-testid="continue-btn"
      >
        Continue
      </button>
    </div>
  );
}

// Recipient Step - External only
function RecipientStep({ savedRecipients, onSelect }) {
  const [showAddNew, setShowAddNew] = useState(false);
  const [newRecipient, setNewRecipient] = useState({
    fullName: '', phone: '', deliveryMethod: 'gcash', bank: '', accountNumber: '',
  });

  // Filter out PBX wallet recipients
  const externalRecipients = savedRecipients.filter(r => r.deliveryMethod !== 'pbx_wallet');

  if (showAddNew) {
    return (
      <div className="px-4 py-6">
        <h1 className={`text-xl font-bold ${tw.textOnLight} mb-6`}>Add external payee</h1>
        <div className="space-y-4">
          <div>
            <label className={`text-sm font-medium ${tw.textOnLightMuted} mb-2 block`}>Payout method</label>
            <div className="grid grid-cols-2 gap-2">
              {DELIVERY_METHODS.filter(m => m.id !== 'pbx_wallet').map((method) => (
                <button
                  key={method.id}
                  onClick={() => setNewRecipient({ ...newRecipient, deliveryMethod: method.id })}
                  className={`p-3 rounded-xl border-2 text-left ${newRecipient.deliveryMethod === method.id ? 'border-[#0A2540] bg-[#0A2540]/5' : 'border-gray-200'}`}
                >
                  <div className="text-lg mb-1">{method.icon}</div>
                  <div className="font-medium text-sm">{method.name}</div>
                  <div className="text-xs text-gray-500">{method.eta}</div>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className={`text-sm font-medium ${tw.textOnLightMuted} mb-2 block`}>Full name</label>
            <input type="text" value={newRecipient.fullName} onChange={(e) => setNewRecipient({ ...newRecipient, fullName: e.target.value })} className="w-full h-12 px-4 border border-gray-200 rounded-xl" placeholder="Juan Dela Cruz" />
          </div>
          {['gcash', 'maya'].includes(newRecipient.deliveryMethod) && (
            <div>
              <label className={`text-sm font-medium ${tw.textOnLightMuted} mb-2 block`}>Mobile number</label>
              <div className="flex gap-2">
                <div className="h-12 px-3 flex items-center bg-gray-50 border border-gray-200 rounded-xl">+63</div>
                <input type="tel" value={newRecipient.phone} onChange={(e) => setNewRecipient({ ...newRecipient, phone: e.target.value })} className="flex-1 h-12 px-4 border border-gray-200 rounded-xl" placeholder="917 123 4567" />
              </div>
            </div>
          )}
          {newRecipient.deliveryMethod === 'bank' && (
            <>
              <div>
                <label className={`text-sm font-medium ${tw.textOnLightMuted} mb-2 block`}>Bank</label>
                <select value={newRecipient.bank} onChange={(e) => setNewRecipient({ ...newRecipient, bank: e.target.value })} className="w-full h-12 px-4 border border-gray-200 rounded-xl bg-white">
                  <option value="">Select bank</option>
                  {PH_BANKS.map((bank) => (<option key={bank.id} value={bank.id}>{bank.name}</option>))}
                </select>
              </div>
              <div>
                <label className={`text-sm font-medium ${tw.textOnLightMuted} mb-2 block`}>Account number</label>
                <input type="text" value={newRecipient.accountNumber} onChange={(e) => setNewRecipient({ ...newRecipient, accountNumber: e.target.value })} className="w-full h-12 px-4 border border-gray-200 rounded-xl" placeholder="1234567890" />
              </div>
            </>
          )}
        </div>
        <div className="mt-6 space-y-3">
          <button onClick={() => onSelect({ ...newRecipient, recipientType: 'EXTERNAL' })} disabled={!newRecipient.fullName || (!newRecipient.phone && !newRecipient.accountNumber)} className={`w-full ${tw.btnNavy} rounded-xl h-12 disabled:opacity-50`}>Continue</button>
          <button onClick={() => setShowAddNew(false)} className="w-full text-gray-600 h-12 font-medium">Cancel</button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6">
      <h1 className={`text-xl font-bold ${tw.textOnLight} mb-6`}>Who are you sending to?</h1>
      <button onClick={() => setShowAddNew(true)} className={`w-full flex items-center gap-3 p-4 ${tw.cardBg} rounded-xl border ${tw.borderOnLight} hover:border-[#0A2540] mb-4`}>
        <div className="w-10 h-10 rounded-full bg-[#0A2540]/10 flex items-center justify-center">
          <svg className="w-5 h-5 text-[#0A2540]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
        </div>
        <div className="text-left">
          <div className="font-medium text-[#0A2540]">Add new external payee</div>
          <div className="text-sm text-gray-500">GCash, Maya, or Bank</div>
        </div>
      </button>
      {externalRecipients.length > 0 && (
        <>
          <div className={`text-sm font-medium ${tw.textOnLightMuted} mb-3`}>SAVED EXTERNAL PAYEES</div>
          <div className="space-y-2">
            {externalRecipients.map((r) => (
              <button key={r.id} onClick={() => onSelect(r)} className={`w-full flex items-center gap-3 p-4 ${tw.cardBg} rounded-xl border ${tw.borderOnLight} hover:border-[#0A2540]`}>
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-lg">{r.fullName?.[0]?.toUpperCase() || '?'}</div>
                <div className="text-left flex-1">
                  <div className={`font-medium ${tw.textOnLight}`}>{r.fullName}</div>
                  <div className="text-sm text-gray-500">{DELIVERY_METHODS.find(d => d.id === r.deliveryMethod)?.name} • {r.phone || r.accountNumber}</div>
                </div>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// Payment Method Step
function PaymentStep({ onSelect }) {
  return (
    <div className="px-4 py-6">
      <h1 className={`text-xl font-bold ${tw.textOnLight} mb-6`}>How will you pay?</h1>
      <div className="space-y-3">
        {PAYMENT_METHODS.map((method) => (
          <button key={method.id} onClick={() => onSelect(method)} className={`w-full flex items-center gap-3 p-4 ${tw.cardBg} rounded-xl border ${tw.borderOnLight} hover:border-[#0A2540]`}>
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">{method.id === 'bank' ? '🏦' : '💳'}</div>
            <div className="text-left flex-1">
              <div className="flex items-center gap-2">
                <span className={`font-medium ${tw.textOnLight}`}>{method.name}</span>
                {method.badge && <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">{method.badge}</span>}
              </div>
              <div className="text-sm text-gray-500">{method.description}</div>
            </div>
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>
        ))}
      </div>
    </div>
  );
}

// Review Step
function ReviewStep({ amountUsd, quote, lockedQuote, recipient, deliveryMethod, paymentMethod, loading, onSend, setStep, onRateLockExpire }) {
  const method = DELIVERY_METHODS.find(d => d.id === recipient?.deliveryMethod) || deliveryMethod;
  const activeQuote = lockedQuote || quote;

  return (
    <div className="px-4 py-6">
      <div className="bg-[#0A2540] text-white rounded-2xl p-5 mb-6">
        <div className="text-sm text-white/70 mb-1">Recipient receives</div>
        <div className="text-3xl font-bold mb-3">₱{activeQuote?.amountPhp?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
        <div className="flex items-center gap-4 text-sm">
          <span>{method?.eta || 'Processing'}</span>
          <span>Rate: ₱{activeQuote?.rate?.toFixed(2)}</span>
        </div>
        {lockedQuote && (
          <div className="mt-4 pt-4 border-t border-white/20">
            <FXLockTimer expiresAt={lockedQuote.expiresAt} onExpire={onRateLockExpire} />
          </div>
        )}
      </div>
      <div className="space-y-3 mb-6">
        <div className={`${tw.cardBg} rounded-xl border ${tw.borderOnLight} p-4`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm">{recipient?.fullName?.[0]?.toUpperCase() || '?'}</div>
              <div><div className="font-medium text-sm">{recipient?.fullName}</div><div className="text-xs text-gray-500">{method?.name}</div></div>
            </div>
            <button onClick={() => setStep(STEPS.RECIPIENT)} className="text-[#0A2540] text-sm font-medium">Edit</button>
          </div>
        </div>
        <div className={`${tw.cardBg} rounded-xl border ${tw.borderOnLight} p-4`}>
          <div className="flex items-center justify-between">
            <div><div className="font-medium text-sm">{paymentMethod?.name}</div><div className="text-xs text-gray-500">You pay ${amountUsd}</div></div>
            <button onClick={() => setStep(STEPS.PAYMENT)} className="text-[#0A2540] text-sm font-medium">Edit</button>
          </div>
        </div>
      </div>
      <button onClick={onSend} disabled={loading} className={`w-full ${tw.btnNavy} rounded-xl h-14 text-lg disabled:opacity-50`} data-testid="send-btn">
        {loading ? 'Processing...' : `Send ₱${activeQuote?.amountPhp?.toLocaleString()}`}
      </button>
    </div>
  );
}

// Confirmation Step
function ConfirmationStep({ transfer, onSendAnother, onGoHome }) {
  return (
    <div className="px-4 py-8 text-center">
      <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
        <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
      </div>
      <h1 className={`text-2xl font-bold ${tw.textOnLight} mb-2`}>Transfer sent!</h1>
      <p className={`${tw.textOnLightMuted} mb-6`}>Your money is on its way to {transfer?.recipient?.fullName}</p>
      <div className={`${tw.cardBg} rounded-2xl p-5 border ${tw.borderOnLight} mb-6 text-left`}>
        <div className="flex items-center justify-between mb-4"><span className="text-gray-500">Amount</span><span className="font-semibold">₱{transfer?.amountPhp?.toLocaleString()}</span></div>
        <div className="flex items-center justify-between mb-4"><span className="text-gray-500">Status</span><span className="text-green-600 font-medium">{transfer?.status === 'processing' ? 'Processing' : 'Completed'}</span></div>
        <div className="flex items-center justify-between"><span className="text-gray-500">ETA</span><span className="font-medium">{transfer?.eta}</span></div>
      </div>
      <div className="space-y-3">
        <button onClick={onSendAnother} className={`w-full ${tw.btnNavy} rounded-xl h-12`}>Send again</button>
        <button onClick={onGoHome} className="w-full text-gray-600 h-12 font-medium">Go to Dashboard</button>
      </div>
    </div>
  );
}

const STEPS_CONST = STEPS;
export { STEPS_CONST as STEPS };
