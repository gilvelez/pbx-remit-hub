/**
 * Send - Transfer flow with PBX-to-PBX as primary option
 * Flow: Transfer Type → (PBX User / External Payout paths)
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
  formatLockTime,
  FX_POLL_INTERVAL 
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
import { lookupPbxUser, createInternalTransfer, generateInvite } from "../../lib/internalApi";
import { FXLockTimer } from "../../components/LiveFXRate";

const TRANSFER_TYPES = {
  PBX: 'pbx',
  EXTERNAL: 'external',
};

const STEPS = {
  TYPE: 'type',           // NEW: Choose PBX User or External
  // PBX User path
  PBX_RECIPIENT: 'pbx_recipient',
  PBX_AMOUNT: 'pbx_amount',
  PBX_REVIEW: 'pbx_review',
  PBX_CONFIRMATION: 'pbx_confirmation',
  // External path (original flow)
  AMOUNT: 'amount',
  RECIPIENT: 'recipient',
  PAYMENT: 'payment',
  REVIEW: 'review',
  CONFIRMATION: 'confirmation',
};

export default function Send() {
  const navigate = useNavigate();
  const { session } = useSession();
  const [transferType, setTransferType] = useState(null);
  const [step, setStep] = useState(STEPS.TYPE);
  const [loading, setLoading] = useState(false);
  
  // PBX transfer data
  const [pbxRecipient, setPbxRecipient] = useState(null);
  const [pbxAmount, setPbxAmount] = useState('');
  const [pbxNote, setPbxNote] = useState('');
  const [pbxTransfer, setPbxTransfer] = useState(null);
  
  // External transfer data (original)
  const [amountUsd, setAmountUsd] = useState('');
  const [quote, setQuote] = useState(null);
  const [lockedQuote, setLockedQuote] = useState(null);
  const [recipient, setRecipient] = useState(null);
  const [deliveryMethod, setDeliveryMethod] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [savedRecipients, setSavedRecipients] = useState([]);
  const [transfer, setTransfer] = useState(null);

  // Load saved recipients
  useEffect(() => {
    const loadData = async () => {
      const recipients = await getRecipients();
      setSavedRecipients(recipients);
    };
    loadData();
  }, []);

  // FX quote for external transfers
  useEffect(() => {
    if (transferType === TRANSFER_TYPES.EXTERNAL && amountUsd && parseFloat(amountUsd) > 0 && !lockedQuote) {
      const timer = setTimeout(async () => {
        const q = await getFxQuote(parseFloat(amountUsd));
        setQuote(q);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [amountUsd, lockedQuote, transferType]);

  const handleSelectType = (type) => {
    setTransferType(type);
    if (type === TRANSFER_TYPES.PBX) {
      setStep(STEPS.PBX_RECIPIENT);
    } else {
      setStep(STEPS.AMOUNT);
    }
  };

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

  // PBX-to-PBX transfer
  const handlePbxTransfer = async () => {
    if (!pbxRecipient || !pbxAmount || parseFloat(pbxAmount) <= 0) return;
    
    setLoading(true);
    try {
      const result = await createInternalTransfer({
        recipient_identifier: pbxRecipient.email || pbxRecipient.phone,
        amount_usd: parseFloat(pbxAmount),
        note: pbxNote || undefined,
      });
      setPbxTransfer(result);
      setStep(STEPS.PBX_CONFIRMATION);
    } catch (error) {
      console.error('PBX transfer failed:', error);
      alert(error.message || 'Transfer failed');
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    if (step === STEPS.TYPE) {
      navigate('/sender/dashboard');
    } else if (step === STEPS.PBX_RECIPIENT) {
      setStep(STEPS.TYPE);
    } else if (step === STEPS.PBX_AMOUNT) {
      setStep(STEPS.PBX_RECIPIENT);
    } else if (step === STEPS.PBX_REVIEW) {
      setStep(STEPS.PBX_AMOUNT);
    } else if (step === STEPS.AMOUNT) {
      setStep(STEPS.TYPE);
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
      {![STEPS.CONFIRMATION, STEPS.PBX_CONFIRMATION, STEPS.TYPE].includes(step) && (
        <div className={`${tw.cardBg} border-b ${tw.borderOnLight} px-4 py-3 sticky top-14 z-30`}>
          <div className="flex items-center gap-3">
            <button onClick={goBack} className="p-1 -ml-1">
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="flex-1">
              <p className="text-sm font-medium text-[#0A2540]">
                {transferType === TRANSFER_TYPES.PBX ? 'Send to PBX User' : 'External Payout'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Step Content */}
      {step === STEPS.TYPE && (
        <TransferTypeStep onSelect={handleSelectType} onBack={() => navigate('/sender/dashboard')} />
      )}

      {step === STEPS.PBX_RECIPIENT && (
        <PbxRecipientStep 
          onSelect={(user) => {
            setPbxRecipient(user);
            setStep(STEPS.PBX_AMOUNT);
          }}
          onBack={goBack}
        />
      )}

      {step === STEPS.PBX_AMOUNT && (
        <PbxAmountStep
          recipient={pbxRecipient}
          amount={pbxAmount}
          setAmount={setPbxAmount}
          note={pbxNote}
          setNote={setPbxNote}
          onContinue={() => setStep(STEPS.PBX_REVIEW)}
        />
      )}

      {step === STEPS.PBX_REVIEW && (
        <PbxReviewStep
          recipient={pbxRecipient}
          amount={pbxAmount}
          note={pbxNote}
          loading={loading}
          onSend={handlePbxTransfer}
          onEditRecipient={() => setStep(STEPS.PBX_RECIPIENT)}
          onEditAmount={() => setStep(STEPS.PBX_AMOUNT)}
        />
      )}

      {step === STEPS.PBX_CONFIRMATION && (
        <PbxConfirmationStep
          transfer={pbxTransfer}
          recipient={pbxRecipient}
          onSendAnother={() => {
            setStep(STEPS.TYPE);
            setPbxRecipient(null);
            setPbxAmount('');
            setPbxNote('');
            setPbxTransfer(null);
          }}
          onGoHome={() => navigate('/sender/dashboard')}
        />
      )}

      {/* External flow steps */}
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
            setStep(STEPS.TYPE);
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

// NEW: Transfer Type Selection (PBX User vs External)
function TransferTypeStep({ onSelect, onBack }) {
  return (
    <div className="px-4 py-6">
      <button onClick={onBack} className="flex items-center gap-2 text-gray-600 mb-4">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </button>
      
      <h1 className={`text-2xl font-bold ${tw.textOnLight} mb-2`}>Send money</h1>
      <p className={`${tw.textOnLightMuted} mb-6`}>Choose how you want to send</p>

      <div className="space-y-3">
        {/* PBX User - Primary Option */}
        <button
          onClick={() => onSelect(TRANSFER_TYPES.PBX)}
          className={`w-full ${tw.cardBg} rounded-2xl border-2 border-[#0A2540] p-5 text-left hover:bg-[#0A2540]/5 transition relative overflow-hidden`}
          data-testid="send-pbx-user-btn"
        >
          <div className="absolute top-3 right-3">
            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
              RECOMMENDED
            </span>
          </div>
          
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#0A2540] flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-[#F6C94B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="flex-1 pt-1">
              <h3 className="font-bold text-lg text-[#0A2540] mb-1">Send to PBX User</h3>
              <p className="text-sm text-gray-600 mb-3">
                Instant transfer to anyone on PBX. They can hold USD or convert to PHP anytime.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-lg">
                  ⚡ Instant
                </span>
                <span className="px-2 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-lg">
                  💵 Free
                </span>
                <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-lg">
                  🔒 USD
                </span>
              </div>
            </div>
          </div>
        </button>

        {/* External Payout - Secondary */}
        <button
          onClick={() => onSelect(TRANSFER_TYPES.EXTERNAL)}
          className={`w-full ${tw.cardBg} rounded-2xl border ${tw.borderOnLight} p-5 text-left hover:border-gray-300 transition`}
          data-testid="send-external-btn"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-[#0A2540] mb-1">External Payout</h3>
              <p className="text-sm text-gray-600 mb-3">
                Send directly to GCash, Maya, or Philippine bank account.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-lg">
                  GCash
                </span>
                <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-lg">
                  Maya
                </span>
                <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-lg">
                  Bank Transfer
                </span>
              </div>
            </div>
          </div>
        </button>
      </div>

      {/* Info box */}
      <div className="mt-6 bg-[#0A2540]/5 rounded-xl p-4">
        <p className="text-sm text-gray-600">
          <span className="font-medium text-[#0A2540]">Tip:</span> Send to PBX users for instant, free transfers. 
          They can convert to PHP or cash out whenever they want.
        </p>
      </div>
    </div>
  );
}

// NEW: PBX Recipient Search
function PbxRecipientStep({ onSelect, onBack }) {
  const [identifier, setIdentifier] = useState('');
  const [searching, setSearching] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleSearch = async () => {
    if (!identifier.trim()) return;
    
    setSearching(true);
    setError('');
    setResult(null);
    
    try {
      const res = await lookupPbxUser(identifier.trim());
      setResult(res);
    } catch (err) {
      setError(err.message || 'Search failed');
    } finally {
      setSearching(false);
    }
  };

  const handleInvite = async () => {
    try {
      const invite = await generateInvite(identifier);
      // Copy to clipboard
      await navigator.clipboard.writeText(invite.message);
      alert('Invite message copied to clipboard!');
    } catch (err) {
      console.error('Failed to generate invite:', err);
    }
  };

  return (
    <div className="px-4 py-6">
      <h1 className={`text-xl font-bold ${tw.textOnLight} mb-2`}>Who are you sending to?</h1>
      <p className={`${tw.textOnLightMuted} mb-6`}>Search by email or phone number</p>

      {/* Search Input */}
      <div className="mb-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            className="flex-1 h-12 px-4 border border-gray-200 rounded-xl focus:border-[#0A2540] focus:ring-2 focus:ring-[#0A2540]/10 outline-none"
            placeholder="Email or phone (+639...)"
            data-testid="pbx-search-input"
          />
          <button
            onClick={handleSearch}
            disabled={searching || !identifier.trim()}
            className={`px-6 h-12 ${tw.btnNavy} rounded-xl disabled:opacity-50`}
          >
            {searching ? '...' : 'Search'}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 rounded-xl p-4 mb-4">
          {error}
        </div>
      )}

      {/* Search Result */}
      {result && (
        <div className="mb-4">
          {result.found ? (
            <button
              onClick={() => onSelect(result.user)}
              className={`w-full ${tw.cardBg} rounded-xl border-2 border-[#0A2540] p-4 text-left hover:bg-[#0A2540]/5 transition`}
              data-testid="pbx-user-result"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[#0A2540] flex items-center justify-center text-white text-lg font-bold">
                  {result.user.display_name?.[0]?.toUpperCase() || '?'}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-[#0A2540]">{result.user.display_name}</div>
                  <div className="text-sm text-gray-500">{result.user.email || result.user.phone}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                    PBX User
                  </span>
                  <svg className="w-5 h-5 text-[#0A2540]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </button>
          ) : (
            <div className={`${tw.cardBg} rounded-xl border ${tw.borderOnLight} p-5`}>
              <div className="text-center mb-4">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <p className="font-medium text-[#0A2540] mb-1">Not on PBX yet</p>
                <p className="text-sm text-gray-500">{result.message}</p>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={handleInvite}
                  className="flex-1 h-11 bg-[#0A2540] text-white rounded-xl font-medium hover:bg-[#0A2540]/90 transition"
                  data-testid="invite-btn"
                >
                  Invite to PBX
                </button>
                <button
                  onClick={onBack}
                  className="flex-1 h-11 border border-gray-200 rounded-xl text-gray-600 font-medium hover:bg-gray-50 transition"
                >
                  Use External Payout
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Demo hint */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mt-4">
        <p className="text-sm text-amber-800">
          <strong>Demo:</strong> Try searching for <code className="bg-amber-100 px-1 rounded">maria.santos@example.com</code> or <code className="bg-amber-100 px-1 rounded">juan.delacruz@example.com</code>
        </p>
      </div>
    </div>
  );
}

// NEW: PBX Amount Entry
function PbxAmountStep({ recipient, amount, setAmount, note, setNote, onContinue }) {
  return (
    <div className="px-4 py-6">
      <h1 className={`text-xl font-bold ${tw.textOnLight} mb-6`}>How much do you want to send?</h1>

      {/* Recipient Summary */}
      <div className={`${tw.cardBg} rounded-xl border ${tw.borderOnLight} p-4 mb-6`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#0A2540] flex items-center justify-center text-white font-bold">
            {recipient?.display_name?.[0]?.toUpperCase() || '?'}
          </div>
          <div>
            <div className="font-medium text-[#0A2540]">{recipient?.display_name}</div>
            <div className="text-sm text-gray-500">{recipient?.email}</div>
          </div>
        </div>
      </div>

      {/* Amount Input */}
      <div className={`${tw.cardBg} rounded-2xl p-5 shadow-sm border ${tw.borderOnLight} mb-4`}>
        <label className={`text-sm font-medium ${tw.textOnLightMuted} mb-2 block`}>Amount (USD)</label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl text-gray-400">$</span>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full h-16 pl-12 pr-4 text-3xl font-bold border border-gray-200 rounded-xl focus:border-[#0A2540] focus:ring-2 focus:ring-[#0A2540]/10 outline-none"
            placeholder="0.00"
            data-testid="pbx-amount-input"
          />
        </div>

        {/* Quick amounts */}
        <div className="flex gap-2 mt-4">
          {[50, 100, 250, 500].map((amt) => (
            <button
              key={amt}
              onClick={() => setAmount(amt.toString())}
              className="flex-1 py-2 text-sm font-medium border border-gray-200 rounded-lg hover:bg-gray-50 transition"
            >
              ${amt}
            </button>
          ))}
        </div>
      </div>

      {/* Note */}
      <div className="mb-6">
        <label className={`text-sm font-medium ${tw.textOnLightMuted} mb-2 block`}>Note (optional)</label>
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="w-full h-12 px-4 border border-gray-200 rounded-xl focus:border-[#0A2540] focus:ring-2 focus:ring-[#0A2540]/10 outline-none"
          placeholder="What's this for?"
          maxLength={200}
        />
      </div>

      {/* Info */}
      <div className="flex items-center gap-3 text-sm text-gray-600 mb-6">
        <div className="flex items-center gap-1">
          <span className="text-green-500">✓</span>
          <span>Free</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-green-500">⚡</span>
          <span>Instant</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-blue-500">💵</span>
          <span>USD</span>
        </div>
      </div>

      <button
        onClick={onContinue}
        disabled={!amount || parseFloat(amount) < 1}
        className={`w-full ${tw.btnNavy} rounded-xl h-12 disabled:opacity-50 transition`}
        data-testid="pbx-continue-btn"
      >
        Continue
      </button>
    </div>
  );
}

// NEW: PBX Review Step
function PbxReviewStep({ recipient, amount, note, loading, onSend, onEditRecipient, onEditAmount }) {
  return (
    <div className="px-4 py-6">
      {/* Summary Card */}
      <div className="bg-[#0A2540] text-white rounded-2xl p-5 mb-6">
        <div className="text-sm text-white/70 mb-1">Sending to {recipient?.display_name}</div>
        <div className="text-4xl font-bold mb-2">${parseFloat(amount).toLocaleString()}</div>
        <div className="flex items-center gap-3 text-sm">
          <span className="flex items-center gap-1 text-green-300">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Instant
          </span>
          <span className="flex items-center gap-1 text-green-300">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Free
          </span>
        </div>
      </div>

      {/* Details */}
      <div className="space-y-3 mb-6">
        <div className={`${tw.cardBg} rounded-xl border ${tw.borderOnLight} p-4`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#0A2540] flex items-center justify-center text-white font-bold text-sm">
                {recipient?.display_name?.[0]?.toUpperCase()}
              </div>
              <div>
                <div className="text-sm text-gray-500">To</div>
                <div className="font-medium">{recipient?.display_name}</div>
                <div className="text-xs text-gray-400">{recipient?.email}</div>
              </div>
            </div>
            <button onClick={onEditRecipient} className="text-[#0A2540] text-sm font-medium">
              Edit
            </button>
          </div>
        </div>

        <div className={`${tw.cardBg} rounded-xl border ${tw.borderOnLight} p-4`}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-500">Amount</div>
              <div className="font-semibold text-lg">${parseFloat(amount).toLocaleString()}</div>
            </div>
            <button onClick={onEditAmount} className="text-[#0A2540] text-sm font-medium">
              Edit
            </button>
          </div>
        </div>

        {note && (
          <div className={`${tw.cardBg} rounded-xl border ${tw.borderOnLight} p-4`}>
            <div className="text-sm text-gray-500">Note</div>
            <div className="font-medium">{note}</div>
          </div>
        )}
      </div>

      {/* Disclosures */}
      <div className="bg-gray-50 rounded-xl p-4 text-xs text-gray-500 mb-6">
        <p>• This is an internal PBX-to-PBX transfer in USD</p>
        <p>• Recipient will receive USD in their PBX wallet instantly</p>
        <p>• They can convert to PHP or cash out anytime</p>
      </div>

      <button
        onClick={onSend}
        disabled={loading}
        className={`w-full ${tw.btnNavy} rounded-xl h-14 text-lg disabled:opacity-50 transition`}
        data-testid="pbx-send-btn"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Sending...
          </span>
        ) : (
          `Send $${parseFloat(amount).toLocaleString()}`
        )}
      </button>
    </div>
  );
}

// NEW: PBX Confirmation
function PbxConfirmationStep({ transfer, recipient, onSendAnother, onGoHome }) {
  return (
    <div className="px-4 py-8 text-center">
      <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
        <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <h1 className={`text-2xl font-bold ${tw.textOnLight} mb-2`}>Sent!</h1>
      <p className={`${tw.textOnLightMuted} mb-6`}>
        ${transfer?.amount?.toLocaleString()} has been sent to {recipient?.display_name}
      </p>

      <div className={`${tw.cardBg} rounded-2xl p-5 border ${tw.borderOnLight} mb-6 text-left`}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-gray-500">Amount</span>
          <span className="font-semibold">${transfer?.amount?.toLocaleString()} USD</span>
        </div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-gray-500">To</span>
          <span className="font-medium">{recipient?.display_name}</span>
        </div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-gray-500">Status</span>
          <span className="flex items-center gap-1 text-green-600 font-medium">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Completed
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-500">Fee</span>
          <span className="font-medium text-green-600">Free</span>
        </div>
      </div>

      <div className="space-y-3">
        <button
          onClick={onSendAnother}
          className={`w-full ${tw.btnNavy} rounded-xl h-12 transition`}
        >
          Send again
        </button>
        <button onClick={onGoHome} className="w-full text-gray-600 h-12 font-medium">
          Go to Dashboard
        </button>
      </div>
    </div>
  );
}

// ============ ORIGINAL EXTERNAL FLOW COMPONENTS ============
// (Keeping these from the original file with minimal changes)

function AmountStep({ amountUsd, setAmountUsd, quote, lockedQuote, onContinue }) {
  const sourceLabel = quote?.source 
    ? (fxSourceLabels[quote.source] || getSourceLabel(quote.source))
    : 'Loading';
  const isLive = quote ? isLiveSource(quote.source) : false;
  const isDev = quote?.source === 'dev' || quote?.source === 'local-dev';

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
      >
        Continue
      </button>
    </div>
  );
}

function RecipientStep({ savedRecipients, preSelectedRecipient, onSelect }) {
  const [showAddNew, setShowAddNew] = useState(false);
  const [newRecipient, setNewRecipient] = useState({
    fullName: '', phone: '', deliveryMethod: 'gcash', bank: '', accountNumber: '',
  });

  if (showAddNew) {
    return (
      <div className="px-4 py-6">
        <h1 className={`text-xl font-bold ${tw.textOnLight} mb-6`}>Add new recipient</h1>
        <div className="space-y-4">
          <div>
            <label className={`text-sm font-medium ${tw.textOnLightMuted} mb-2 block`}>Payout method</label>
            <div className="grid grid-cols-2 gap-2">
              {DELIVERY_METHODS.map((method) => (
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
          <button onClick={() => onSelect({ ...newRecipient })} disabled={!newRecipient.fullName || (!newRecipient.phone && !newRecipient.accountNumber)} className={`w-full ${tw.btnNavy} rounded-xl h-12 disabled:opacity-50`}>Continue</button>
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
          <div className="font-medium text-[#0A2540]">Add new recipient</div>
          <div className="text-sm text-gray-500">GCash, Maya, or Bank</div>
        </div>
      </button>
      {savedRecipients.length > 0 && (
        <>
          <div className={`text-sm font-medium ${tw.textOnLightMuted} mb-3`}>SAVED RECIPIENTS</div>
          <div className="space-y-2">
            {savedRecipients.map((r) => (
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
      <button onClick={onSend} disabled={loading} className={`w-full ${tw.btnNavy} rounded-xl h-14 text-lg disabled:opacity-50`}>
        {loading ? 'Processing...' : `Send ₱${activeQuote?.amountPhp?.toLocaleString()}`}
      </button>
    </div>
  );
}

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
