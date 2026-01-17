/**
 * AddRecipient - Enhanced with PBX-to-PBX + Friends
 * Features:
 * - PBX Wallet as primary delivery method
 * - PBX user search (name/@username/phone/email)
 * - Invite flow for non-PBX users
 * - Friends/Contacts tab like Venmo/Cash App
 * - Dynamic form fields based on delivery method
 */
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useSession } from "../../contexts/SessionContext";
import { tw } from "../../lib/theme";
import { saveRecipient, PH_BANKS } from "../../lib/mockApi";
import { lookupPbxUser, inviteToPbx } from "../../lib/internalApi";

// Updated delivery methods with PBX Wallet as primary
const DELIVERY_METHODS = [
  { id: 'pbx_wallet', name: 'PBX Wallet', icon: '⚡', eta: 'Instant', recommended: true, type: 'PBX_USER' },
  { id: 'gcash', name: 'GCash', icon: '📱', eta: 'Instant', type: 'EXTERNAL' },
  { id: 'maya', name: 'Maya', icon: '📱', eta: 'Instant', type: 'EXTERNAL' },
  { id: 'bank', name: 'Bank Deposit', icon: '🏦', eta: '1-2 hours', type: 'EXTERNAL' },
  { id: 'cash', name: 'Cash Pickup', icon: '💵', eta: 'Same day', type: 'EXTERNAL' },
];

export default function AddRecipient() {
  const navigate = useNavigate();
  const { session, setSession } = useSession();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('friends'); // 'friends' | 'manual'
  
  // PBX user search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedPbxUser, setSelectedPbxUser] = useState(null);
  const [notFoundMessage, setNotFoundMessage] = useState('');
  
  // Invite state
  const [showInvite, setShowInvite] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [inviteSent, setInviteSent] = useState(false);
  
  // Recent recipients (simulated)
  const [recentRecipients, setRecentRecipients] = useState([]);
  
  // Recipient form state
  const [recipient, setRecipient] = useState({
    fullName: '',
    phone: '',
    email: '',
    deliveryMethod: 'pbx_wallet',
    bank: '',
    accountNumber: '',
    city: '',
    recipientType: 'PBX_USER',
    pbxUserId: null,
  });

  // Load recent recipients on mount
  useEffect(() => {
    const stored = localStorage.getItem('pbx_recipients');
    if (stored) {
      try {
        const recipients = JSON.parse(stored);
        setRecentRecipients(recipients.slice(0, 5));
      } catch (e) {
        console.error('Failed to load recipients:', e);
      }
    }
  }, []);

  // Debounced PBX user search
  const searchPbxUsers = useCallback(async (query) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      setNotFoundMessage('');
      setShowInvite(false);
      return;
    }
    
    setSearching(true);
    setNotFoundMessage('');
    setShowInvite(false);
    
    try {
      const result = await lookupPbxUser(query);
      
      if (result.found) {
        setSearchResults([result.user]);
        setShowInvite(false);
      } else {
        setSearchResults([]);
        setNotFoundMessage(`No PBX user found for "${query}"`);
        setShowInvite(true);
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) {
        searchPbxUsers(searchQuery);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, searchPbxUsers]);

  // Select a PBX user from search results
  const handleSelectPbxUser = (user) => {
    setSelectedPbxUser(user);
    setRecipient({
      ...recipient,
      fullName: user.display_name || user.email?.split('@')[0] || 'PBX User',
      email: user.email || '',
      phone: user.phone || '',
      deliveryMethod: 'pbx_wallet',
      recipientType: 'PBX_USER',
      pbxUserId: user.user_id,
    });
    setSearchQuery('');
    setSearchResults([]);
  };

  // Select a recent recipient
  const handleSelectRecent = (recentRec) => {
    if (recentRec.recipientType === 'PBX_USER') {
      setSelectedPbxUser({
        user_id: recentRec.pbxUserId,
        display_name: recentRec.fullName,
        email: recentRec.email,
      });
    }
    setRecipient({
      ...recentRec,
      id: undefined, // Will get new ID on save
    });
    setActiveTab('manual'); // Switch to show form
  };

  // Send invite
  const handleInvite = async (method) => {
    setInviting(true);
    try {
      await inviteToPbx(method, searchQuery);
      setInviteSent(true);
      
      // Create pending invited contact
      const pendingRecipient = {
        fullName: searchQuery.includes('@') ? searchQuery.split('@')[0] : searchQuery,
        email: searchQuery.includes('@') ? searchQuery : '',
        phone: /^\+?\d+$/.test(searchQuery) ? searchQuery : '',
        deliveryMethod: 'pbx_wallet',
        recipientType: 'INVITED',
        invitedVia: method,
        invitedAt: new Date().toISOString(),
      };
      setRecipient(pendingRecipient);
      
      setTimeout(() => {
        setInviteSent(false);
        setShowInvite(false);
      }, 3000);
    } catch (error) {
      console.error('Invite error:', error);
    } finally {
      setInviting(false);
    }
  };

  // Handle delivery method change
  const handleDeliveryMethodChange = (methodId) => {
    const method = DELIVERY_METHODS.find(m => m.id === methodId);
    setRecipient({
      ...recipient,
      deliveryMethod: methodId,
      recipientType: method?.type || 'EXTERNAL',
      bank: '',
      accountNumber: '',
      city: '',
    });
    
    // Clear PBX user selection if switching away from PBX Wallet
    if (methodId !== 'pbx_wallet') {
      setSelectedPbxUser(null);
    }
  };

  const isValid = () => {
    if (!recipient.fullName && !selectedPbxUser) return false;
    
    if (recipient.deliveryMethod === 'pbx_wallet') {
      // For PBX Wallet, need either selected PBX user OR manual phone/email
      if (!selectedPbxUser && !recipient.phone && !recipient.email) return false;
    }
    
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
      fullName: recipient.fullName || selectedPbxUser?.display_name || 'PBX User',
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
            Add your first recipient
          </h1>
          <p className={`${tw.textOnLightMuted} mb-6`}>
            Who will you be sending money to?
          </p>

          {/* Tab Navigation */}
          <div className="flex bg-gray-100 rounded-xl p-1 mb-6" data-testid="recipient-tabs">
            <button
              onClick={() => setActiveTab('friends')}
              className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition ${
                activeTab === 'friends'
                  ? 'bg-white text-[#0A2540] shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              data-testid="tab-friends"
            >
              PBX Friends
            </button>
            <button
              onClick={() => setActiveTab('manual')}
              className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition ${
                activeTab === 'manual'
                  ? 'bg-white text-[#0A2540] shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              data-testid="tab-manual"
            >
              Manual Details
            </button>
          </div>

          {/* PBX Friends Tab */}
          {activeTab === 'friends' && (
            <div className="space-y-4">
              {/* PBX User Search */}
              <div className="relative">
                <label className={`text-sm font-medium ${tw.textOnLightMuted} mb-2 block`}>
                  Send to a PBX user
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-12 pl-10 pr-4 border border-gray-200 rounded-xl focus:border-[#0A2540] focus:ring-2 focus:ring-[#0A2540]/10 outline-none"
                    placeholder="Search by name, @username, phone, or email"
                    data-testid="pbx-user-search"
                  />
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  {searching && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <svg className="animate-spin h-5 w-5 text-gray-400" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                    </div>
                  )}
                </div>
                
                {/* Search Results */}
                {searchResults.length > 0 && (
                  <div className="absolute z-10 w-full mt-2 bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden">
                    {searchResults.map((user) => (
                      <button
                        key={user.user_id}
                        onClick={() => handleSelectPbxUser(user)}
                        className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition text-left"
                        data-testid="search-result-item"
                      >
                        <div className="w-10 h-10 rounded-full bg-[#0A2540] flex items-center justify-center text-white font-bold">
                          {(user.display_name || user.email)?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-[#0A2540]">{user.display_name || user.email?.split('@')[0]}</div>
                          {user.email && <div className="text-sm text-gray-500">{user.email}</div>}
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-green-600 font-medium">PBX Wallet</div>
                          <div className="text-xs text-gray-400">Instant</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                
                {/* Not Found + Invite */}
                {showInvite && notFoundMessage && (
                  <div className="mt-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                    <p className="text-sm text-amber-800 mb-3">{notFoundMessage}</p>
                    <p className="text-sm text-gray-600 mb-3">Not on PBX yet? Invite them!</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleInvite('sms')}
                        disabled={inviting}
                        className="flex-1 py-2 px-3 bg-[#0A2540] text-white text-sm rounded-lg hover:bg-[#0A2540]/90 transition disabled:opacity-50"
                        data-testid="invite-sms-btn"
                      >
                        {inviting ? '...' : '📱 Invite via SMS'}
                      </button>
                      <button
                        onClick={() => handleInvite('email')}
                        disabled={inviting}
                        className="flex-1 py-2 px-3 bg-white text-[#0A2540] text-sm rounded-lg border border-[#0A2540] hover:bg-gray-50 transition disabled:opacity-50"
                        data-testid="invite-email-btn"
                      >
                        {inviting ? '...' : '✉️ Invite via Email'}
                      </button>
                    </div>
                    {inviteSent && (
                      <p className="mt-3 text-sm text-green-600 font-medium">✓ Invite sent successfully!</p>
                    )}
                  </div>
                )}
              </div>

              {/* Selected PBX User */}
              {selectedPbxUser && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-xl" data-testid="selected-pbx-user">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                      <span className="text-green-700 font-bold text-lg">
                        {selectedPbxUser.display_name?.[0]?.toUpperCase() || '✓'}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-green-800">
                        {selectedPbxUser.display_name || selectedPbxUser.email?.split('@')[0]}
                      </p>
                      <p className="text-sm text-green-600">PBX user found ✅</p>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedPbxUser(null);
                        setRecipient({ ...recipient, pbxUserId: null, fullName: '', email: '', phone: '' });
                      }}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}

              {/* Recent Recipients */}
              {recentRecipients.length > 0 && !selectedPbxUser && (
                <div>
                  <p className={`text-sm font-medium ${tw.textOnLightMuted} mb-3`}>Recent recipients</p>
                  <div className="space-y-2">
                    {recentRecipients.map((rec) => (
                      <button
                        key={rec.id}
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
                            {rec.deliveryMethod === 'pbx_wallet' ? 'PBX Wallet' : rec.deliveryMethod?.toUpperCase()}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Continue Button for Friends Tab */}
              {selectedPbxUser && (
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className={`w-full ${tw.btnNavy} rounded-xl h-12 transition disabled:opacity-50 flex items-center justify-center gap-2 mt-4`}
                  data-testid="continue-with-pbx-user"
                >
                  {loading ? 'Saving...' : `Continue with ${selectedPbxUser.display_name || 'PBX User'}`}
                </button>
              )}

              {/* Switch to Manual */}
              {!selectedPbxUser && (
                <button
                  onClick={() => setActiveTab('manual')}
                  className="w-full text-center text-sm text-[#0A2540] hover:underline mt-4"
                >
                  Or add recipient manually →
                </button>
              )}
            </div>
          )}

          {/* Manual Details Tab */}
          {activeTab === 'manual' && (
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
                      onClick={() => handleDeliveryMethodChange(method.id)}
                      className={`p-3 rounded-xl border-2 text-left transition relative ${
                        recipient.deliveryMethod === method.id
                          ? 'border-[#0A2540] bg-[#0A2540]/5'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      data-testid={`delivery-${method.id}`}
                    >
                      {method.recommended && (
                        <span className="absolute -top-2 -right-2 px-2 py-0.5 bg-green-500 text-white text-[10px] font-bold rounded-full">
                          Recommended
                        </span>
                      )}
                      <div className="text-lg mb-1">{method.icon}</div>
                      <div className="font-medium text-sm text-[#1A1A1A]">{method.name}</div>
                      <div className="text-xs text-gray-500">{method.eta}</div>
                    </button>
                  ))}
                </div>
                
                {/* PBX Wallet Info */}
                {recipient.deliveryMethod === 'pbx_wallet' && (
                  <p className="mt-3 text-xs text-green-600 bg-green-50 p-2 rounded-lg">
                    ⚡ Fastest option — funds stay in PBX and can be used anytime.
                  </p>
                )}
              </div>

              {/* PBX Wallet Fields */}
              {recipient.deliveryMethod === 'pbx_wallet' && (
                <>
                  <div className="mb-4">
                    <label className={`text-sm font-medium ${tw.textOnLightMuted} mb-2 block`}>
                      Recipient&apos;s name
                    </label>
                    <input
                      type="text"
                      value={recipient.fullName}
                      onChange={(e) => setRecipient({ ...recipient, fullName: e.target.value })}
                      className="w-full h-12 px-4 border border-gray-200 rounded-xl focus:border-[#0A2540] focus:ring-2 focus:ring-[#0A2540]/10 outline-none"
                      placeholder="Juan Dela Cruz"
                      data-testid="recipient-name-input"
                    />
                  </div>
                  <div className="mb-4">
                    <label className={`text-sm font-medium ${tw.textOnLightMuted} mb-2 block`}>
                      Phone or email (to find them on PBX)
                    </label>
                    <input
                      type="text"
                      value={recipient.email || recipient.phone}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val.includes('@')) {
                          setRecipient({ ...recipient, email: val, phone: '' });
                        } else {
                          setRecipient({ ...recipient, phone: val, email: '' });
                        }
                      }}
                      className="w-full h-12 px-4 border border-gray-200 rounded-xl focus:border-[#0A2540] focus:ring-2 focus:ring-[#0A2540]/10 outline-none"
                      placeholder="email@example.com or +63917..."
                      data-testid="recipient-identifier-input"
                    />
                  </div>
                </>
              )}

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
          )}
        </div>
      </main>
    </div>
  );
}
