/**
 * AddRecipient - Add first recipient step in onboarding
 * Final step before landing on App Home
 * After completing, Send flow should have saved recipient + delivery method ready
 */
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useSession } from "../../contexts/SessionContext";
import { tw } from "../../lib/theme";
import { saveRecipient, DELIVERY_METHODS, PH_BANKS } from "../../lib/mockApi";

export default function AddRecipient() {
  const navigate = useNavigate();
  const { session, setSession } = useSession();
  const [loading, setLoading] = useState(false);
  
  const [recipient, setRecipient] = useState({
    fullName: '',
    phone: '',
    deliveryMethod: 'gcash',
    bank: '',
    accountNumber: '',
  });

  const selectedMethod = DELIVERY_METHODS.find(d => d.id === recipient.deliveryMethod);

  const isValid = () => {
    if (!recipient.fullName) return false;
    if (['gcash', 'maya'].includes(recipient.deliveryMethod) && !recipient.phone) return false;
    if (recipient.deliveryMethod === 'bank' && (!recipient.bank || !recipient.accountNumber)) return false;
    return true;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isValid()) return;
    
    setLoading(true);
    
    // Save recipient to local storage
    const savedRecipient = {
      ...recipient,
      id: `rec_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    
    saveRecipient(savedRecipient);
    
    // Update session with first recipient and mark onboarding complete
    setSession(prev => ({
      ...prev,
      exists: true,
      verified: true,
      onboardingComplete: true,
      defaultRecipient: savedRecipient,
      defaultDeliveryMethod: recipient.deliveryMethod,
    }));
    
    setTimeout(() => {
      setLoading(false);
      // Navigate based on user role
      const targetRoute = session?.role === 'recipient' ? '/recipient/dashboard' : '/sender/dashboard';
      navigate(targetRoute);
    }, 500);
  };

  const handleSkip = () => {
    // Allow skipping, mark onboarding as complete
    setSession(prev => ({
      ...prev,
      exists: true,
      verified: true,
      onboardingComplete: true,
    }));
    // Navigate based on user role
    const targetRoute = session?.role === 'recipient' ? '/recipient/dashboard' : '/sender/dashboard';
    navigate(targetRoute);
  };

  return (
    <div className={`min-h-screen ${tw.shellBg}`}>
      {/* Header */}
      <header className={`${tw.shellBgSolid} border-b ${tw.borderOnDark}`}>
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-[#F6C94B]/20 border border-[#F6C94B]/40 flex items-center justify-center">
              <span className={`${tw.textGold} font-bold text-xs`}>PBX</span>
            </div>
          </Link>
          <button
            onClick={() => navigate('/onboarding/bank')}
            className={`text-sm ${tw.textOnDarkMuted}`}
          >
            Back
          </button>
        </div>
      </header>

      {/* Progress indicator */}
      <div className="max-w-lg mx-auto px-4 py-4">
        <div className="flex gap-2">
          <div className="flex-1 h-1 rounded-full bg-[#F6C94B]" />
          <div className="flex-1 h-1 rounded-full bg-[#F6C94B]" />
          <div className="flex-1 h-1 rounded-full bg-[#F6C94B]" />
          <div className="flex-1 h-1 rounded-full bg-[#F6C94B]" />
        </div>
        <p className={`text-xs ${tw.textOnDarkMuted} mt-2`}>Step 4 of 4 - Final step!</p>
      </div>

      {/* Content */}
      <main className="max-w-lg mx-auto px-4 py-6">
        <div className={`${tw.cardBg} rounded-2xl p-6 shadow-lg`}>
          <h1 className={`text-2xl font-bold ${tw.textOnLight} mb-2`}>
            Add your first recipient
          </h1>
          <p className={`${tw.textOnLightMuted} mb-6`}>
            Who will you be sending money to in the Philippines?
          </p>

          <form onSubmit={handleSubmit}>
            {/* Delivery Method Selection */}
            <div className="mb-5">
              <label className={`text-sm font-medium ${tw.textOnLightMuted} mb-2 block`}>
                How will they receive?
              </label>
              <div className="grid grid-cols-2 gap-2">
                {DELIVERY_METHODS.map((method) => (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => setRecipient({ ...recipient, deliveryMethod: method.id, bank: '', accountNumber: '' })}
                    className={`p-3 rounded-xl border-2 text-left transition ${
                      recipient.deliveryMethod === method.id
                        ? 'border-[#0A2540] bg-[#0A2540]/5'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    data-testid={`delivery-${method.id}`}
                  >
                    <div className="text-lg mb-1">{method.icon}</div>
                    <div className="font-medium text-sm text-[#1A1A1A]">{method.name}</div>
                    <div className="text-xs text-gray-500">{method.eta}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Full Name */}
            <div className="mb-4">
              <label className={`text-sm font-medium ${tw.textOnLightMuted} mb-2 block`}>
                Recipient's full name
              </label>
              <input
                type="text"
                value={recipient.fullName}
                onChange={(e) => setRecipient({ ...recipient, fullName: e.target.value })}
                className="w-full h-12 px-4 border border-gray-200 rounded-xl focus:border-[#0A2540] focus:ring-2 focus:ring-[#0A2540]/10 outline-none"
                placeholder="Juan Dela Cruz"
                required
                data-testid="recipient-name-input"
              />
            </div>

            {/* Phone (for GCash/Maya) */}
            {['gcash', 'maya'].includes(recipient.deliveryMethod) && (
              <div className="mb-4">
                <label className={`text-sm font-medium ${tw.textOnLightMuted} mb-2 block`}>
                  {recipient.deliveryMethod === 'gcash' ? 'GCash' : 'Maya'} mobile number
                </label>
                <div className="flex gap-2">
                  <div className="h-12 px-3 flex items-center bg-gray-50 border border-gray-200 rounded-xl text-gray-600">
                    +63
                  </div>
                  <input
                    type="tel"
                    value={recipient.phone}
                    onChange={(e) => setRecipient({ ...recipient, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                    className="flex-1 h-12 px-4 border border-gray-200 rounded-xl focus:border-[#0A2540] focus:ring-2 focus:ring-[#0A2540]/10 outline-none"
                    placeholder="917 123 4567"
                    required
                    data-testid="recipient-phone-input"
                  />
                </div>
              </div>
            )}

            {/* Bank details (for Bank Deposit) */}
            {recipient.deliveryMethod === 'bank' && (
              <>
                <div className="mb-4">
                  <label className={`text-sm font-medium ${tw.textOnLightMuted} mb-2 block`}>
                    Bank
                  </label>
                  <select
                    value={recipient.bank}
                    onChange={(e) => setRecipient({ ...recipient, bank: e.target.value })}
                    className="w-full h-12 px-4 border border-gray-200 rounded-xl focus:border-[#0A2540] focus:ring-2 focus:ring-[#0A2540]/10 outline-none bg-white"
                    required
                    data-testid="recipient-bank-select"
                  >
                    <option value="">Select bank</option>
                    {PH_BANKS.map((bank) => (
                      <option key={bank.id} value={bank.id}>{bank.name}</option>
                    ))}
                  </select>
                </div>
                <div className="mb-4">
                  <label className={`text-sm font-medium ${tw.textOnLightMuted} mb-2 block`}>
                    Account number
                  </label>
                  <input
                    type="text"
                    value={recipient.accountNumber}
                    onChange={(e) => setRecipient({ ...recipient, accountNumber: e.target.value })}
                    className="w-full h-12 px-4 border border-gray-200 rounded-xl focus:border-[#0A2540] focus:ring-2 focus:ring-[#0A2540]/10 outline-none"
                    placeholder="1234567890"
                    required
                    data-testid="recipient-account-input"
                  />
                </div>
              </>
            )}

            {/* Cash Pickup info */}
            {recipient.deliveryMethod === 'cash' && (
              <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <p className="text-sm text-amber-800">
                  For cash pickup, we only need the recipient&apos;s name. They&apos;ll pick up the money at any partner location with a valid ID.
                </p>
              </div>
            )}

            <div className="space-y-3 mt-6">
              <button
                type="submit"
                disabled={!isValid() || loading}
                className={`w-full ${tw.btnNavy} rounded-xl h-12 transition disabled:opacity-50 flex items-center justify-center gap-2`}
                data-testid="add-recipient-submit"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Saving...
                  </>
                ) : (
                  'Add Recipient & Continue'
                )}
              </button>
              
              <button
                type="button"
                onClick={handleSkip}
                className={`w-full ${tw.textOnLightMuted} font-medium py-3`}
              >
                Skip for now
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
