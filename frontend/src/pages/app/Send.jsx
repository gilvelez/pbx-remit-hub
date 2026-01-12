import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  getQuote, 
  lockRate, 
  createTransfer, 
  saveTransfer,
  saveRecipient,
  getRecipients,
  getPaymentMethods,
  DELIVERY_METHODS, 
  PH_BANKS, 
  PAYMENT_METHODS 
} from "../../lib/mockApi";

// Step components
const STEPS = {
  AMOUNT: 'amount',
  RECIPIENT: 'recipient',
  PAYMENT: 'payment',
  REVIEW: 'review',
  CONFIRMATION: 'confirmation',
};

export default function Send() {
  const navigate = useNavigate();
  const [step, setStep] = useState(STEPS.AMOUNT);
  const [loading, setLoading] = useState(false);
  
  // Transfer data
  const [amountUsd, setAmountUsd] = useState('');
  const [quote, setQuote] = useState(null);
  const [recipient, setRecipient] = useState(null);
  const [deliveryMethod, setDeliveryMethod] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [savedRecipients, setSavedRecipients] = useState([]);
  const [transfer, setTransfer] = useState(null);

  // Load saved recipients
  useEffect(() => {
    getRecipients().then(setSavedRecipients);
  }, []);

  // Get quote when amount changes
  useEffect(() => {
    if (amountUsd && parseFloat(amountUsd) > 0) {
      const timer = setTimeout(async () => {
        const q = await getQuote(parseFloat(amountUsd));
        setQuote(q);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [amountUsd]);

  const handleContinueAmount = () => {
    if (!amountUsd || parseFloat(amountUsd) < 1) return;
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
      // Lock the rate
      await lockRate(quote.quoteId);
      
      // Create transfer
      const result = await createTransfer({
        recipient,
        amountUsd: parseFloat(amountUsd),
        amountPhp: quote.amountPhp,
        rate: quote.rate,
        paymentMethod: paymentMethod.id,
        deliveryMethod: deliveryMethod.id,
      });
      
      // Save transfer and recipient
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
    const stepOrder = [STEPS.AMOUNT, STEPS.RECIPIENT, STEPS.PAYMENT, STEPS.REVIEW];
    const currentIndex = stepOrder.indexOf(step);
    if (currentIndex > 0) {
      setStep(stepOrder[currentIndex - 1]);
    } else {
      navigate('/app/home');
    }
  };

  return (
    <div className="min-h-[calc(100vh-8rem)]">
      {/* Progress Header */}
      {step !== STEPS.CONFIRMATION && (
        <div className="bg-white border-b border-gray-100 px-4 py-3 sticky top-14 z-30">
          <div className="flex items-center gap-3">
            <button onClick={goBack} className="p-1 -ml-1">
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="flex-1">
              <div className="flex gap-1">
                {[STEPS.AMOUNT, STEPS.RECIPIENT, STEPS.PAYMENT, STEPS.REVIEW].map((s, i) => (
                  <div
                    key={s}
                    className={`h-1 flex-1 rounded-full ${
                      [STEPS.AMOUNT, STEPS.RECIPIENT, STEPS.PAYMENT, STEPS.REVIEW].indexOf(step) >= i
                        ? 'bg-[#0A2540]'
                        : 'bg-gray-200'
                    }`}
                  />
                ))}
              </div>
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
          onContinue={handleContinueAmount}
        />
      )}

      {step === STEPS.RECIPIENT && (
        <RecipientStep
          savedRecipients={savedRecipients}
          deliveryMethod={deliveryMethod}
          setDeliveryMethod={setDeliveryMethod}
          onSelect={handleSelectRecipient}
        />
      )}

      {step === STEPS.PAYMENT && (
        <PaymentStep
          onSelect={handleSelectPayment}
        />
      )}

      {step === STEPS.REVIEW && (
        <ReviewStep
          amountUsd={amountUsd}
          quote={quote}
          recipient={recipient}
          deliveryMethod={deliveryMethod}
          paymentMethod={paymentMethod}
          loading={loading}
          onSend={handleSendMoney}
          setStep={setStep}
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
            setTransfer(null);
          }}
          onGoHome={() => navigate('/app/home')}
        />
      )}
    </div>
  );
}

// Amount Entry Step
function AmountStep({ amountUsd, setAmountUsd, quote, onContinue }) {
  return (
    <div className="px-4 py-6">
      <h1 className="text-xl font-bold text-[#1A1A1A] mb-6">How much do you want to send?</h1>
      
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-4">
        {/* You Send */}
        <div className="mb-6">
          <label className="text-sm font-medium text-gray-500 mb-2 block">You send</label>
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl text-gray-400">$</span>
              <input
                type="number"
                value={amountUsd}
                onChange={(e) => setAmountUsd(e.target.value)}
                className="w-full h-14 pl-10 pr-4 text-2xl font-semibold border border-gray-200 rounded-xl focus:border-[#0A2540] focus:ring-2 focus:ring-[#0A2540]/10 outline-none"
                placeholder="0.00"
                data-testid="send-amount-input"
              />
            </div>
            <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
              <span className="text-lg">🇺🇸</span>
              <span className="font-medium text-gray-700">USD</span>
            </div>
          </div>
        </div>

        {/* Divider with rate */}
        <div className="flex items-center gap-3 my-4">
          <div className="flex-1 h-px bg-gray-200" />
          <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-full">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
            </svg>
            <span className="text-sm text-gray-600">
              1 USD = ₱{quote?.rate?.toFixed(2) || '56.25'}
            </span>
          </div>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* They Receive */}
        <div>
          <label className="text-sm font-medium text-gray-500 mb-2 block">They receive</label>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-14 px-4 flex items-center bg-gray-50 border border-gray-200 rounded-xl">
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

      {/* Fee info */}
      <div className="flex items-center justify-center gap-2 text-sm text-gray-500 mb-6">
        <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        <span>No fees • Instant delivery available</span>
      </div>

      <button
        onClick={onContinue}
        disabled={!amountUsd || parseFloat(amountUsd) < 1}
        className="w-full bg-[#0A2540] text-white rounded-xl h-12 font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#061C33] transition"
        data-testid="send-continue-btn"
      >
        Continue
      </button>
    </div>
  );
}

// Recipient Selection Step
function RecipientStep({ savedRecipients, deliveryMethod, setDeliveryMethod, onSelect }) {
  const [showAddNew, setShowAddNew] = useState(false);
  const [newRecipient, setNewRecipient] = useState({
    fullName: '',
    phone: '',
    deliveryMethod: 'gcash',
    bank: '',
    accountNumber: '',
  });

  if (showAddNew) {
    return (
      <div className="px-4 py-6">
        <h1 className="text-xl font-bold text-[#1A1A1A] mb-6">Add new recipient</h1>

        <div className="space-y-4">
          {/* Delivery Method */}
          <div>
            <label className="text-sm font-medium text-gray-500 mb-2 block">How will they receive?</label>
            <div className="grid grid-cols-2 gap-2">
              {DELIVERY_METHODS.map((method) => (
                <button
                  key={method.id}
                  onClick={() => setNewRecipient({ ...newRecipient, deliveryMethod: method.id })}
                  className={`p-3 rounded-xl border-2 text-left transition ${
                    newRecipient.deliveryMethod === method.id
                      ? 'border-[#0A2540] bg-[#0A2540]/5'
                      : 'border-gray-200'
                  }`}
                >
                  <div className="text-lg mb-1">{method.icon}</div>
                  <div className="font-medium text-sm">{method.name}</div>
                  <div className="text-xs text-gray-500">{method.eta}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Full Name */}
          <div>
            <label className="text-sm font-medium text-gray-500 mb-2 block">Full name</label>
            <input
              type="text"
              value={newRecipient.fullName}
              onChange={(e) => setNewRecipient({ ...newRecipient, fullName: e.target.value })}
              className="w-full h-12 px-4 border border-gray-200 rounded-xl focus:border-[#0A2540] focus:ring-2 focus:ring-[#0A2540]/10 outline-none"
              placeholder="Juan Dela Cruz"
              data-testid="recipient-name-input"
            />
          </div>

          {/* Phone (for GCash/Maya) */}
          {['gcash', 'maya'].includes(newRecipient.deliveryMethod) && (
            <div>
              <label className="text-sm font-medium text-gray-500 mb-2 block">Mobile number</label>
              <div className="flex gap-2">
                <div className="h-12 px-3 flex items-center bg-gray-50 border border-gray-200 rounded-xl text-gray-600">
                  +63
                </div>
                <input
                  type="tel"
                  value={newRecipient.phone}
                  onChange={(e) => setNewRecipient({ ...newRecipient, phone: e.target.value })}
                  className="flex-1 h-12 px-4 border border-gray-200 rounded-xl focus:border-[#0A2540] focus:ring-2 focus:ring-[#0A2540]/10 outline-none"
                  placeholder="917 123 4567"
                  data-testid="recipient-phone-input"
                />
              </div>
            </div>
          )}

          {/* Bank details (for Bank Deposit) */}
          {newRecipient.deliveryMethod === 'bank' && (
            <>
              <div>
                <label className="text-sm font-medium text-gray-500 mb-2 block">Bank</label>
                <select
                  value={newRecipient.bank}
                  onChange={(e) => setNewRecipient({ ...newRecipient, bank: e.target.value })}
                  className="w-full h-12 px-4 border border-gray-200 rounded-xl focus:border-[#0A2540] focus:ring-2 focus:ring-[#0A2540]/10 outline-none bg-white"
                  data-testid="recipient-bank-select"
                >
                  <option value="">Select bank</option>
                  {PH_BANKS.map((bank) => (
                    <option key={bank.id} value={bank.id}>{bank.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 mb-2 block">Account number</label>
                <input
                  type="text"
                  value={newRecipient.accountNumber}
                  onChange={(e) => setNewRecipient({ ...newRecipient, accountNumber: e.target.value })}
                  className="w-full h-12 px-4 border border-gray-200 rounded-xl focus:border-[#0A2540] focus:ring-2 focus:ring-[#0A2540]/10 outline-none"
                  placeholder="1234567890"
                  data-testid="recipient-account-input"
                />
              </div>
            </>
          )}
        </div>

        <div className="mt-6 space-y-3">
          <button
            onClick={() => {
              const method = DELIVERY_METHODS.find(d => d.id === newRecipient.deliveryMethod);
              onSelect({ ...newRecipient, deliveryMethod: newRecipient.deliveryMethod });
            }}
            disabled={!newRecipient.fullName || (!newRecipient.phone && !newRecipient.accountNumber)}
            className="w-full bg-[#0A2540] text-white rounded-xl h-12 font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#061C33] transition"
          >
            Continue
          </button>
          <button
            onClick={() => setShowAddNew(false)}
            className="w-full text-gray-600 h-12 font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6">
      <h1 className="text-xl font-bold text-[#1A1A1A] mb-6">Who are you sending to?</h1>

      {/* Add New */}
      <button
        onClick={() => setShowAddNew(true)}
        className="w-full flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-200 hover:border-[#0A2540] transition mb-4"
        data-testid="add-recipient-btn"
      >
        <div className="w-10 h-10 rounded-full bg-[#0A2540]/10 flex items-center justify-center">
          <svg className="w-5 h-5 text-[#0A2540]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </div>
        <div className="text-left">
          <div className="font-medium text-[#0A2540]">Add new recipient</div>
          <div className="text-sm text-gray-500">Send to someone new</div>
        </div>
      </button>

      {/* Saved Recipients */}
      {savedRecipients.length > 0 && (
        <>
          <div className="text-sm font-medium text-gray-500 mb-3">SAVED RECIPIENTS</div>
          <div className="space-y-2">
            {savedRecipients.map((r) => (
              <button
                key={r.id}
                onClick={() => onSelect(r)}
                className="w-full flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-200 hover:border-[#0A2540] transition"
              >
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-lg">
                  {r.fullName?.[0]?.toUpperCase() || '?'}
                </div>
                <div className="text-left flex-1">
                  <div className="font-medium text-[#1A1A1A]">{r.fullName}</div>
                  <div className="text-sm text-gray-500">
                    {DELIVERY_METHODS.find(d => d.id === r.deliveryMethod)?.name} • {r.phone || r.accountNumber}
                  </div>
                </div>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
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
  const [showPlaid, setShowPlaid] = useState(false);

  if (showPlaid) {
    return (
      <div className="px-4 py-6">
        <h1 className="text-xl font-bold text-[#1A1A1A] mb-2">Connect your bank</h1>
        <p className="text-gray-500 mb-6">Link your bank for faster, cheaper transfers</p>

        <div className="bg-white rounded-2xl p-5 border border-gray-200 mb-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <span className="text-sm">Bank-level security</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="text-sm">Fastest transfer speeds</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-sm">One-time setup</span>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => onSelect(PAYMENT_METHODS.find(p => p.id === 'bank'))}
            className="w-full bg-[#0A2540] text-white rounded-xl h-12 font-semibold hover:bg-[#061C33] transition"
            data-testid="plaid-connect-btn"
          >
            Connect Bank
          </button>
          <button
            onClick={() => setShowPlaid(false)}
            className="w-full text-gray-600 h-12 font-medium"
          >
            Maybe later
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6">
      <h1 className="text-xl font-bold text-[#1A1A1A] mb-6">How will you pay?</h1>

      <div className="space-y-3">
        {PAYMENT_METHODS.map((method) => (
          <button
            key={method.id}
            onClick={() => {
              if (method.requiresPlaid) {
                setShowPlaid(true);
              } else {
                onSelect(method);
              }
            }}
            className="w-full flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-200 hover:border-[#0A2540] transition"
            data-testid={`payment-${method.id}`}
          >
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
              {method.id === 'bank' && '🏦'}
              {method.id === 'debit' && '💳'}
              {method.id === 'credit' && '💳'}
              {method.id === 'apple_pay' && ''}
            </div>
            <div className="text-left flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-[#1A1A1A]">{method.name}</span>
                {method.badge && (
                  <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                    {method.badge}
                  </span>
                )}
              </div>
              <div className="text-sm text-gray-500">{method.description}</div>
            </div>
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        ))}
      </div>
    </div>
  );
}

// Review Step
function ReviewStep({ amountUsd, quote, recipient, deliveryMethod, paymentMethod, loading, onSend, setStep }) {
  const [expandedSection, setExpandedSection] = useState(null);

  const method = DELIVERY_METHODS.find(d => d.id === recipient?.deliveryMethod) || deliveryMethod;

  return (
    <div className="px-4 py-6">
      {/* Summary Card */}
      <div className="bg-[#0A2540] text-white rounded-2xl p-5 mb-6">
        <div className="text-sm text-white/70 mb-1">Recipient receives</div>
        <div className="text-3xl font-bold mb-3">
          ₱{quote?.amountPhp?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{method?.eta || 'Instant'}</span>
          </div>
          <div className="flex items-center gap-1">
            <span>Rate: ₱{quote?.rate?.toFixed(2)}</span>
          </div>
          <div className="flex items-center gap-1 text-green-300">
            <span>No fees</span>
          </div>
        </div>
      </div>

      {/* Collapsible Sections */}
      <div className="space-y-3">
        {/* Recipient */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <button
            onClick={() => setExpandedSection(expandedSection === 'recipient' ? null : 'recipient')}
            className="w-full flex items-center justify-between p-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm">
                {recipient?.fullName?.[0]?.toUpperCase() || '?'}
              </div>
              <div className="text-left">
                <div className="font-medium text-sm">{recipient?.fullName}</div>
                <div className="text-xs text-gray-500">{method?.name}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={(e) => { e.stopPropagation(); setStep(STEPS.RECIPIENT); }}
                className="text-[#0A2540] text-sm font-medium"
              >
                Edit
              </button>
              <svg className={`w-5 h-5 text-gray-400 transition ${expandedSection === 'recipient' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </button>
          {expandedSection === 'recipient' && (
            <div className="px-4 pb-4 pt-0 text-sm text-gray-600">
              <div>{recipient?.phone || recipient?.accountNumber}</div>
              {recipient?.bank && <div>{PH_BANKS.find(b => b.id === recipient.bank)?.name}</div>}
            </div>
          )}
        </div>

        {/* Payment Method */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <button
            onClick={() => setExpandedSection(expandedSection === 'payment' ? null : 'payment')}
            className="w-full flex items-center justify-between p-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm">
                {paymentMethod?.id === 'bank' ? '🏦' : '💳'}
              </div>
              <div className="text-left">
                <div className="font-medium text-sm">{paymentMethod?.name}</div>
                <div className="text-xs text-gray-500">You pay ${amountUsd}</div>
              </div>
            </div>
            <button 
              onClick={(e) => { e.stopPropagation(); setStep(STEPS.PAYMENT); }}
              className="text-[#0A2540] text-sm font-medium"
            >
              Edit
            </button>
          </button>
        </div>

        {/* Disclosures */}
        <div className="bg-gray-50 rounded-xl p-4 text-xs text-gray-500 space-y-2">
          <p>• PBX earns revenue from the FX spread between currencies</p>
          <p>• Do you know your recipient? Transfers are final once completed</p>
          <p>• You may cancel within 30 minutes if funds haven't been delivered</p>
        </div>
      </div>

      {/* Send Button */}
      <div className="mt-6">
        <button
          onClick={onSend}
          disabled={loading}
          className="w-full bg-[#0A2540] text-white rounded-xl h-14 font-semibold text-lg disabled:opacity-50 hover:bg-[#061C33] transition"
          data-testid="send-confirm-btn"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Processing...
            </span>
          ) : (
            `Send ₱${quote?.amountPhp?.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
          )}
        </button>
      </div>
    </div>
  );
}

// Confirmation Step
function ConfirmationStep({ transfer, onSendAnother, onGoHome }) {
  return (
    <div className="px-4 py-8 text-center">
      {/* Success Icon */}
      <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
        <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <h1 className="text-2xl font-bold text-[#1A1A1A] mb-2">Transfer sent!</h1>
      <p className="text-gray-500 mb-6">
        Your money is on its way to {transfer?.recipient?.fullName}
      </p>

      {/* Transfer Summary */}
      <div className="bg-white rounded-2xl p-5 border border-gray-200 mb-6 text-left">
        <div className="flex items-center justify-between mb-4">
          <span className="text-gray-500">Amount</span>
          <span className="font-semibold">₱{transfer?.amountPhp?.toLocaleString()}</span>
        </div>
        <div className="flex items-center justify-between mb-4">
          <span className="text-gray-500">Status</span>
          <span className="flex items-center gap-1 text-green-600 font-medium">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            {transfer?.status === 'processing' ? 'Processing' : 'Completed'}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-500">ETA</span>
          <span className="font-medium">{transfer?.eta}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-3">
        <button
          onClick={onSendAnother}
          className="w-full bg-[#0A2540] text-white rounded-xl h-12 font-semibold hover:bg-[#061C33] transition"
          data-testid="send-another-btn"
        >
          Send again
        </button>
        <button
          onClick={onGoHome}
          className="w-full text-gray-600 h-12 font-medium"
        >
          Go to Home
        </button>
      </div>
    </div>
  );
}
