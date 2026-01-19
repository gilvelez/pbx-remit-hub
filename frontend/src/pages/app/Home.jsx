/**
 * Home - Unified dashboard home page
 * UI MERGE: Same for Personal and Business profiles
 * Quick Actions: Find People, Send External, Pay Bills, Receive
 */
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSession } from "../../contexts/SessionContext";
import { getConversations } from "../../lib/socialApi";
import { getLinkedBanks } from "../../lib/bankApi";
import { QRCodeSVG } from "qrcode.react";

export default function Home() {
  const { session } = useSession();
  const navigate = useNavigate();
  const [wallet, setWallet] = useState({ usd_balance: 0, php_balance: 0 });
  const [recentActivity, setRecentActivity] = useState([]);
  const [recentChats, setRecentChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [linkedBanks, setLinkedBanks] = useState([]);
  
  // Send Sheet state
  const [showSendSheet, setShowSendSheet] = useState(false);
  // Receive modal state
  const [showReceive, setShowReceive] = useState(false);

  const activeProfile = session?.activeProfile;
  const isBusinessProfile = activeProfile?.type === "business";
  const displayName = isBusinessProfile 
    ? (activeProfile?.business_name || "Business")
    : (activeProfile?.display_name || session?.user?.email?.split('@')[0] || 'there');
  const handle = activeProfile?.handle;

  // Fetch wallet balance
  useEffect(() => {
    const fetchWallet = async () => {
      if (!session?.token) return;
      
      try {
        const backendUrl = process.env.REACT_APP_BACKEND_URL || '';
        const res = await fetch(`${backendUrl}/api/recipient/wallet`, {
          headers: {
            'Content-Type': 'application/json',
            'X-Session-Token': session.token,
          },
        });
        
        if (res.ok) {
          const data = await res.json();
          setWallet({
            usd_balance: data.usd_balance || 0,
            php_balance: data.php_balance || 0,
          });
        }
      } catch (err) {
        console.error("Failed to fetch wallet:", err);
      }
    };
    
    fetchWallet();
  }, [session?.token]);

  // Fetch linked banks for inline display
  useEffect(() => {
    const fetchBanks = async () => {
      if (!session?.token) return;
      try {
        const banks = await getLinkedBanks(session.token);
        setLinkedBanks(banks || []);
      } catch (err) {
        console.error("Failed to fetch linked banks:", err);
      }
    };
    fetchBanks();
  }, [session?.token]);

  // Fetch recent activity
  useEffect(() => {
    const fetchActivity = async () => {
      if (!session?.token) return;
      
      try {
        const backendUrl = process.env.REACT_APP_BACKEND_URL || '';
        const res = await fetch(`${backendUrl}/api/recipient/statements?limit=5`, {
          headers: {
            'Content-Type': 'application/json',
            'X-Session-Token': session.token,
          },
        });
        
        if (res.ok) {
          const data = await res.json();
          setRecentActivity(data.transactions || []);
        }
      } catch (err) {
        console.error("Failed to fetch activity:", err);
      }
    };
    
    fetchActivity();
  }, [session?.token]);

  // Fetch recent chats
  useEffect(() => {
    const fetchChats = async () => {
      if (!session?.token) return;
      
      try {
        const data = await getConversations();
        setRecentChats((data.conversations || []).slice(0, 3));
      } catch (err) {
        console.error("Failed to fetch chats:", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchChats();
  }, [session?.token]);

  // Format currency
  const formatUSD = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount || 0);
  };

  const formatPHP = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(amount || 0);
  };

  return (
    <div className="pb-20">
      {/* Welcome Header - Profile aware */}
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-[#0A2540]">
            Hey, {displayName}
          </h1>
          {isBusinessProfile && (
            <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-bold rounded">
              BUSINESS
            </span>
          )}
        </div>
        {handle && (
          <p className="text-sm text-gray-500 mt-0.5">@{handle}</p>
        )}
        <p className="text-sm text-gray-500 mt-1">
          Send money, pay bills, and connect with {isBusinessProfile ? "customers" : "friends"}
        </p>
      </div>

      {/* Balance Summary Card with Add Money / Withdraw CTAs */}
      <div className="bg-gradient-to-br from-[#0A2540] to-[#1a4a7c] rounded-2xl p-5 text-white mb-6">
        <div className="text-sm text-white/70 mb-1">Total Balance</div>
        <div className="text-3xl font-bold mb-4">{formatUSD(wallet.usd_balance)}</div>
        
        {/* ADD MONEY / WITHDRAW BUTTONS - Always visible */}
        <div className="flex gap-3 mb-4">
          <button
            onClick={() => navigate('/sender/add-money')}
            className="flex-1 h-11 bg-[#F6C94B] text-[#0A2540] font-semibold rounded-xl hover:bg-[#F6C94B]/90 transition flex items-center justify-center gap-2"
            data-testid="add-money-btn"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Money
          </button>
          <button
            onClick={() => navigate('/sender/withdraw')}
            className="flex-1 h-11 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 transition flex items-center justify-center gap-2 border border-white/20"
            data-testid="withdraw-btn"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
            Withdraw
          </button>
        </div>
        
        <div className="flex gap-4 pt-3 border-t border-white/20">
          <div>
            <div className="text-xs text-white/60">USD Wallet</div>
            <div className="font-semibold">{formatUSD(wallet.usd_balance)}</div>
          </div>
          <div>
            <div className="text-xs text-white/60">PHP Wallet</div>
            <div className="font-semibold">{formatPHP(wallet.php_balance)}</div>
          </div>
        </div>
      </div>

      {/* PRIMARY QUICK ACTIONS - SAME FOR BOTH PROFILES */}
      <div className="grid grid-cols-4 gap-2 mb-6">
        {/* Find People */}
        <button
          onClick={() => navigate('/sender/people/picker')}
          className="flex flex-col items-center gap-1.5 bg-[#0A2540] text-white rounded-xl py-3 px-2 hover:bg-[#0A2540]/90 transition"
          data-testid="find-people-btn"
        >
          <div className="w-10 h-10 rounded-full bg-[#F6C94B]/20 flex items-center justify-center">
            <svg className="w-5 h-5 text-[#F6C94B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <span className="text-xs font-medium">Find People</span>
        </button>

        {/* Send External */}
        <button
          onClick={() => navigate('/sender/send-external')}
          className="flex flex-col items-center gap-1.5 bg-white text-[#0A2540] rounded-xl py-3 px-2 border border-gray-200 hover:border-[#0A2540] transition"
          data-testid="send-external-btn"
        >
          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </div>
          <span className="text-xs font-medium">Send External</span>
        </button>

        {/* Pay Bills */}
        <button
          onClick={() => navigate('/sender/bills')}
          className="flex flex-col items-center gap-1.5 bg-white text-[#0A2540] rounded-xl py-3 px-2 border border-gray-200 hover:border-[#0A2540] transition"
          data-testid="pay-bills-btn"
        >
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
          <span className="text-xs font-medium">Pay Bills</span>
        </button>

        {/* Receive */}
        <button
          onClick={() => setShowReceive(true)}
          className="flex flex-col items-center gap-1.5 bg-white text-[#0A2540] rounded-xl py-3 px-2 border border-gray-200 hover:border-green-500 transition"
          data-testid="receive-btn"
        >
          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
          <span className="text-xs font-medium">Receive</span>
        </button>
      </div>

      {/* Recent Chats */}
      {recentChats.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-500 uppercase">Recent Chats</h2>
            <button
              onClick={() => navigate('/sender/people')}
              className="text-sm text-[#0A2540] font-medium"
            >
              See all
            </button>
          </div>
          
          <div className="flex gap-3 overflow-x-auto pb-2">
            {recentChats.map((chat) => {
              const otherUser = chat.other_user;
              const isBiz = otherUser?.type === 'business';
              return (
                <button
                  key={chat.conversation_id}
                  onClick={() => navigate(`/sender/chat/${otherUser?.user_id}`)}
                  className="flex flex-col items-center min-w-[72px]"
                  data-testid="recent-chat-btn"
                >
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-lg mb-1 ${
                    isBiz 
                      ? 'bg-gradient-to-br from-purple-500 to-purple-700' 
                      : 'bg-gradient-to-br from-[#0A2540] to-[#1a4a7c]'
                  }`}>
                    {(otherUser?.display_name || otherUser?.business_name || "?")?.[0]?.toUpperCase()}
                  </div>
                  <span className="text-xs text-gray-600 truncate max-w-[72px]">
                    {otherUser?.display_name || otherUser?.business_name || "Friend"}
                  </span>
                  {isBiz && (
                    <span className="text-[8px] text-purple-600 font-medium">Business</span>
                  )}
                </button>
              );
            })}
            
            {/* Add Friend Button */}
            <button
              onClick={() => navigate('/sender/people/picker')}
              className="flex flex-col items-center min-w-[72px]"
            >
              <div className="w-14 h-14 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <span className="text-xs text-gray-500 mt-1">Add</span>
            </button>
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <h2 className="font-semibold text-[#0A2540]">Recent Activity</h2>
          <button
            onClick={() => navigate('/sender/activity')}
            className="text-sm text-[#0A2540] font-medium"
          >
            View all
          </button>
        </div>
        
        {loading ? (
          <div className="p-8 flex justify-center">
            <svg className="animate-spin h-6 w-6 text-gray-400" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
        ) : recentActivity.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <p className="text-gray-500">No recent activity</p>
            <p className="text-sm text-gray-400 mt-1">Your transactions will appear here</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {recentActivity.slice(0, 5).map((tx, idx) => (
              <div key={tx.tx_id || idx} className="px-4 py-3 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  tx.amount > 0 ? "bg-green-100" : "bg-red-100"
                }`}>
                  {tx.amount > 0 ? (
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                    </svg>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-[#0A2540] truncate">
                    {tx.type === "internal_transfer_in" ? "Received PBX" :
                     tx.type === "internal_transfer_out" ? "Sent PBX" :
                     tx.type === "conversion" ? "Converted" :
                     tx.type === "bill_payment" ? "Bill Payment" :
                     tx.type || "Transaction"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {tx.created_at ? new Date(tx.created_at).toLocaleDateString() : ""}
                  </p>
                </div>
                <div className={`font-semibold ${tx.amount > 0 ? "text-green-600" : "text-gray-900"}`}>
                  {tx.amount > 0 ? "+" : ""}{formatUSD(Math.abs(tx.amount))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Trust Indicators */}
      <div className="mt-6 bg-white rounded-2xl p-5 border border-gray-200">
        <h3 className="font-medium text-[#0A2540] mb-4">Why PBX?</h3>
        <div className="space-y-3">
          <TrustItem 
            icon={<svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
            bgColor="bg-green-100"
            title="PBX-to-PBX: Instant & Free"
            subtitle="Send to friends with zero fees"
          />
          <TrustItem 
            icon={<svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>}
            bgColor="bg-blue-100"
            title="Pay Bills Instantly"
            subtitle="Utilities, mobile load, and more"
          />
          <TrustItem 
            icon={<svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>}
            bgColor="bg-amber-100"
            title="Secure & Licensed"
            subtitle="Bank-grade security"
          />
        </div>
      </div>

      {/* Receive Modal */}
      {showReceive && (
        <ReceiveModal 
          activeProfile={activeProfile}
          isBusinessProfile={isBusinessProfile}
          handle={handle}
          displayName={displayName}
          onClose={() => setShowReceive(false)}
        />
      )}
    </div>
  );
}

function TrustItem({ icon, bgColor, title, subtitle }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`w-8 h-8 rounded-full ${bgColor} flex items-center justify-center flex-shrink-0`}>
        {icon}
      </div>
      <div>
        <div className="text-sm font-medium text-[#0A2540]">{title}</div>
        <div className="text-xs text-gray-500">{subtitle}</div>
      </div>
    </div>
  );
}

// Receive Modal Component - Enhanced with QR Code
function ReceiveModal({ activeProfile, isBusinessProfile, handle, displayName, onClose }) {
  const [copied, setCopied] = useState(false);
  const [showProfileSwitcher, setShowProfileSwitcher] = useState(false);
  const { session, setSession } = useSession();
  
  // Generate the deep link URL for QR code
  const payUrl = handle 
    ? `${window.location.origin}/pay/@${handle}` 
    : null;
  
  // Copy handle to clipboard
  const copyHandle = () => {
    if (handle) {
      navigator.clipboard.writeText(`@${handle}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };
  
  // Copy full link to clipboard
  const copyLink = () => {
    if (payUrl) {
      navigator.clipboard.writeText(payUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };
  
  // Share via system share sheet (if available)
  const shareHandle = async () => {
    if (navigator.share && handle) {
      try {
        await navigator.share({
          title: `Pay @${handle} on PBX`,
          text: `Send me PBX at @${handle}`,
          url: payUrl,
        });
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Share failed:', err);
        }
      }
    } else {
      copyLink();
    }
  };
  
  // Switch profile
  const handleSwitchProfile = (profile) => {
    setSession(prev => ({
      ...prev,
      activeProfile: profile,
      activeProfileId: profile.profile_id,
    }));
    setShowProfileSwitcher(false);
  };
  
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm max-h-[90vh] overflow-y-auto" data-testid="receive-modal">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-[#0A2540]">Receive PBX</h2>
            <p className="text-sm text-gray-500">Share your handle to receive money instantly</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
            data-testid="receive-close-btn"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-4">
          {/* PRIMARY: Handle Block with Copy */}
          {handle ? (
            <div className="mb-4">
              {/* Large Handle Display */}
              <div className="flex items-center justify-center gap-2 mb-3">
                <span className="text-2xl font-bold text-[#0A2540]">@{handle}</span>
                <span className={`px-2 py-0.5 text-xs font-bold rounded ${
                  isBusinessProfile 
                    ? 'bg-purple-100 text-purple-700' 
                    : 'bg-blue-100 text-blue-700'
                }`}>
                  {isBusinessProfile ? "Business" : "Personal"}
                </span>
              </div>
              
              {/* Primary Copy Button */}
              <button
                onClick={copyHandle}
                className={`w-full h-12 rounded-xl font-semibold flex items-center justify-center gap-2 transition ${
                  copied 
                    ? 'bg-green-500 text-white' 
                    : 'bg-[#0A2540] text-white hover:bg-[#0A2540]/90'
                }`}
                data-testid="copy-handle-btn"
              >
                {copied ? (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Copied!
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                    </svg>
                    Copy @{handle}
                  </>
                )}
              </button>
              <p className="text-xs text-gray-500 text-center mt-2">
                Share this handle so someone can send you PBX.
              </p>
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-4">
              <p className="text-sm text-yellow-800 text-center">
                Set up your @handle in Settings to receive payments easily
              </p>
            </div>
          )}
          
          {/* SECONDARY: QR Code Block */}
          {handle && payUrl && (
            <div className="bg-gray-50 rounded-xl p-4 mb-4">
              <div className="flex justify-center mb-3">
                <div className="bg-white p-3 rounded-xl shadow-sm">
                  <QRCodeSVG 
                    value={payUrl}
                    size={180}
                    level="M"
                    includeMargin={false}
                    data-testid="receive-qr-code"
                  />
                </div>
              </div>
              <p className="text-sm text-gray-600 text-center mb-2">
                Scan to pay @{handle}
              </p>
              <p className="text-xs text-gray-400 text-center">
                Opens PBX if installed, otherwise opens web
              </p>
            </div>
          )}
          
          {/* Share Button (if Web Share API available) */}
          {handle && navigator.share && (
            <button
              onClick={shareHandle}
              className="w-full h-10 bg-gray-100 text-[#0A2540] rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-gray-200 transition mb-4"
              data-testid="share-handle-btn"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              Share
            </button>
          )}
          
          {/* Profile Context + Switch */}
          <div className="border-t border-gray-100 pt-4">
            <button
              onClick={() => setShowProfileSwitcher(!showProfileSwitcher)}
              className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition"
              data-testid="profile-switch-btn"
            >
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                  isBusinessProfile 
                    ? 'bg-gradient-to-br from-purple-500 to-purple-700' 
                    : 'bg-gradient-to-br from-[#0A2540] to-[#1a4a7c]'
                }`}>
                  {displayName?.[0]?.toUpperCase() || "?"}
                </div>
                <div className="text-left">
                  <p className="text-xs text-gray-500">Receiving as</p>
                  <p className="text-sm font-medium text-[#0A2540]">
                    @{handle || "no handle"} ({isBusinessProfile ? "Business" : "Personal"})
                  </p>
                </div>
              </div>
              <svg className={`w-5 h-5 text-gray-400 transition ${showProfileSwitcher ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {/* Profile Switcher Dropdown */}
            {showProfileSwitcher && session?.profiles?.length > 1 && (
              <div className="mt-2 p-2 bg-white border border-gray-200 rounded-xl shadow-sm">
                <p className="text-xs text-gray-500 px-2 py-1 mb-1">Switch profile to receive as:</p>
                {session.profiles.map((profile) => {
                  const isActive = profile.profile_id === activeProfile?.profile_id;
                  const isBiz = profile.type === 'business';
                  const name = isBiz ? profile.business_name : profile.display_name;
                  
                  return (
                    <button
                      key={profile.profile_id}
                      onClick={() => !isActive && handleSwitchProfile(profile)}
                      className={`w-full flex items-center gap-2 p-2 rounded-lg transition ${
                        isActive 
                          ? 'bg-gray-100 cursor-default' 
                          : 'hover:bg-gray-50'
                      }`}
                      disabled={isActive}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                        isBiz 
                          ? 'bg-gradient-to-br from-purple-500 to-purple-700' 
                          : 'bg-gradient-to-br from-[#0A2540] to-[#1a4a7c]'
                      }`}>
                        {name?.[0]?.toUpperCase() || "?"}
                      </div>
                      <div className="flex-1 text-left">
                        <p className="text-sm font-medium text-[#0A2540]">{name}</p>
                        <p className="text-xs text-gray-500">@{profile.handle} • {isBiz ? "Business" : "Personal"}</p>
                      </div>
                      {isActive && (
                        <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
