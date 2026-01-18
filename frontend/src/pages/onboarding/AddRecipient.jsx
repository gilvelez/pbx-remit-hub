/**
 * AddRecipient - Phase 0 Cleanup: External Payee Only
 * 
 * PBX→PBX has moved to Chat (social flow).
 * This page is now for EXTERNAL payees only (GCash, Maya, Bank, Cash).
 * 
 * Changes from Phase 0:
 * - Removed PBX Wallet option (moved to People/Chat)
 * - Default tab is now 'manual' (shows external delivery methods)
 * - Renamed: "Add Recipient" → "Add External Payee"
 * - Added prominent link to People tab for PBX→PBX
 */
import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useSession } from "../../contexts/SessionContext";
import { tw } from "../../lib/theme";
import { saveRecipient, PH_BANKS } from "../../lib/mockApi";

// External delivery methods only (PBX Wallet removed - now in Chat)
const EXTERNAL_DELIVERY_METHODS = [
  { id: 'gcash', name: 'GCash', icon: '📱', eta: 'Instant', type: 'EXTERNAL' },
  { id: 'maya', name: 'Maya', icon: '📱', eta: 'Instant', type: 'EXTERNAL' },
  { id: 'bank', name: 'Bank Deposit', icon: '🏦', eta: '1-2 hours', type: 'EXTERNAL' },
  { id: 'cash', name: 'Cash Pickup', icon: '💵', eta: 'Same day', type: 'EXTERNAL' },
];

export default function AddRecipient() {
  const navigate = useNavigate();
  const { session, setSession } = useSession();
  const [loading, setLoading] = useState(false);
  
  // Recent recipients (simulated)
  const [recentRecipients, setRecentRecipients] = useState([]);
  
  // Recipient form state - default to GCash (most popular external)
  const [recipient, setRecipient] = useState({
    fullName: '',
    phone: '',
    email: '',
    deliveryMethod: 'gcash',
    bank: '',
    accountNumber: '',
    city: '',
    recipientType: 'EXTERNAL',
  });

  // Load recent recipients on mount
  useEffect(() => {
    const stored = localStorage.getItem('pbx_recipients');
    if (stored) {
      try {
        const recipients = JSON.parse(stored);
        // Filter to external only
        const external = recipients.filter(r => r.recipientType === 'EXTERNAL' || r.deliveryMethod !== 'pbx_wallet');
        // Using functional update to avoid lint warning
        setRecentRecipients(() => external.slice(0, 5));
      } catch (e) {
        console.error('Failed to load recipients:', e);
      }
    }
  }, []);

  // Handle delivery method change
  const handleDeliveryMethodChange = (methodId) => {
    setRecipient({
      ...recipient,
      deliveryMethod: methodId,
      recipientType: 'EXTERNAL',
      bank: '',
      accountNumber: '',
      city: '',
    });
  };

  // Select a recent recipient
  const handleSelectRecent = (recentRec) => {
    setRecipient({
      ...recentRec,
      id: undefined, // Will get new ID on save
    });
  };

  const isValid = () => {
    if (!recipient.fullName) return false;
    if (['gcash', 'maya'].includes(recipient.deliveryMethod) && !recipient.phone) return false;
    if (recipient.deliveryMethod === 'bank' && (!recipient.bank || !recipient.accountNumber)) return false;
    if (recipient.deliveryMethod === 'cash' && !recipient.fullName) return false;
    return true;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isValid()) return;
    
    setLoading(true);
    
    const savedRecipient = {
      ...recipient,
      id: `rec_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    
    saveRecipient(savedRecipient);
    
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
      const targetRoute = session?.role === 'recipient' ? '/recipient/dashboard' : '/sender/dashboard';
      navigate(targetRoute);
    }, 500);
  };

  const handleSkip = () => {
    setSession(prev => ({
      ...prev,
      exists: true,
      verified: true,
      onboardingComplete: true,
    }));
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
            Add your first friend or payee
          </h1>
          <p className={`${tw.textOnLightMuted} mb-6`}>
            Find a PBX user or add an external payee.
          </p>

          {/* PBX Friends CTA - Primary Option */}
          <div 
            onClick={() => {
              // Mark onboarding as complete and set sender role before navigating
              setSession(prev => ({
                ...prev,
                exists: true,
                verified: true,
                role: prev.role || 'sender', // Preserve existing role or default to sender
                onboardingComplete: true,
                skippedExternalPayee: true, // Track that user skipped external payee setup
              }));
              // Navigate to People page
              navigate('/sender/people');
            }}
            className="mb-6 p-4 bg-gradient-to-r from-[#0A2540] to-[#1a4a7c] rounded-xl cursor-pointer hover:opacity-95 transition relative overflow-hidden"
            data-testid="pbx-friends-cta"
          >
            <div className="absolute top-2 right-2">
              <span className="px-2 py-1 bg-[#F6C94B] text-[#0A2540] text-[10px] font-bold rounded-full">
                RECOMMENDED
              </span>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-[#F6C94B]/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-[#F6C94B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="flex-1 text-white">
                <h3 className="font-bold text-lg mb-1">Send to PBX Friends</h3>
                <p className="text-sm text-white/80">
                  Instant & free. Send money through chat.
                </p>
                <div className="flex gap-2 mt-2">
                  <span className="px-2 py-0.5 bg-white/20 text-white text-xs rounded">⚡ Instant</span>
                  <span className="px-2 py-0.5 bg-white/20 text-white text-xs rounded">💵 Free</span>
                </div>
              </div>
              <svg className="w-5 h-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-gray-200"></div>
            <span className="text-sm text-gray-500">or add external payee</span>
            <div className="flex-1 h-px bg-gray-200"></div>
          </div>

          {/* External Delivery Method Form */}
          <form onSubmit={handleSubmit}>
            {/* Delivery Method Selection */}
            <div className="mb-5">
              <label className={`text-sm font-medium ${tw.textOnLightMuted} mb-2 block`}>
                External payout method
              </label>
              <div className="grid grid-cols-2 gap-2">
                {EXTERNAL_DELIVERY_METHODS.map((method) => (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => handleDeliveryMethodChange(method.id)}
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

            {/* GCash / Maya Fields */}
            {['gcash', 'maya'].includes(recipient.deliveryMethod) && (
              <>
                <div className="mb-4">
                  <label className={`text-sm font-medium ${tw.textOnLightMuted} mb-2 block`}>
                    Recipient&apos;s full name
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
              </>
            )}

            {/* Bank Deposit Fields */}
            {recipient.deliveryMethod === 'bank' && (
              <>
                <div className="mb-4">
                  <label className={`text-sm font-medium ${tw.textOnLightMuted} mb-2 block`}>
                    Account holder name
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

            {/* Cash Pickup Fields */}
            {recipient.deliveryMethod === 'cash' && (
              <>
                <div className="mb-4">
                  <label className={`text-sm font-medium ${tw.textOnLightMuted} mb-2 block`}>
                    Recipient&apos;s full name (must match ID)
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
                <div className="mb-4">
                  <label className={`text-sm font-medium ${tw.textOnLightMuted} mb-2 block`}>
                    Mobile number
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
                      data-testid="recipient-phone-input"
                    />
                  </div>
                </div>
                <div className="mb-4">
                  <label className={`text-sm font-medium ${tw.textOnLightMuted} mb-2 block`}>
                    City / Province
                  </label>
                  <input
                    type="text"
                    value={recipient.city}
                    onChange={(e) => setRecipient({ ...recipient, city: e.target.value })}
                    className="w-full h-12 px-4 border border-gray-200 rounded-xl focus:border-[#0A2540] focus:ring-2 focus:ring-[#0A2540]/10 outline-none"
                    placeholder="Manila, Metro Manila"
                    data-testid="recipient-city-input"
                  />
                </div>
                <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                  <p className="text-sm text-amber-800">
                    Recipient will pick up cash at any partner location with a valid ID matching the name above.
                  </p>
                </div>
              </>
            )}

            {/* Recent External Recipients */}
            {recentRecipients.length > 0 && (
              <div className="mb-4">
                <p className={`text-sm font-medium ${tw.textOnLightMuted} mb-3`}>Recent external payees</p>
                <div className="space-y-2">
                  {recentRecipients.slice(0, 3).map((rec) => (
                    <button
                      key={rec.id}
                      type="button"
                      onClick={() => handleSelectRecent(rec)}
                      className="w-full p-3 bg-gray-50 rounded-xl flex items-center gap-3 hover:bg-gray-100 transition text-left"
                      data-testid="recent-recipient"
                    >
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-medium">
                        {rec.fullName?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-[#0A2540]">{rec.fullName}</p>
                        <p className="text-xs text-gray-500">
                          {EXTERNAL_DELIVERY_METHODS.find(m => m.id === rec.deliveryMethod)?.name || rec.deliveryMethod}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
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
                  'Add External Payee & Continue'
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
