/**
 * Home - Sender dashboard home page
 * Phase 1 Layout:
 * - Balance summary (USD + PHP)
 * - Primary buttons: Send PBX, Send to External
 * - Recent activity preview (last 5)
 * - Recent chats shortcut row
 */
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSession } from "../../contexts/SessionContext";
import { tw } from "../../lib/theme";
import { getConversations } from "../../lib/socialApi";

export default function Home() {
  const { session } = useSession();
  const navigate = useNavigate();
  const [wallet, setWallet] = useState({ usd_balance: 0, php_balance: 0 });
  const [recentActivity, setRecentActivity] = useState([]);
  const [recentChats, setRecentChats] = useState([]);
  const [loading, setLoading] = useState(true);

  const userName = session?.user?.email?.split('@')[0] || 'there';
  const activeProfile = session?.activeProfile;
  const isBusinessProfile = activeProfile?.type === "business";

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
      {/* Welcome Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#0A2540]">
          {isBusinessProfile ? (
            <>Hey, {activeProfile?.business_name || "Business"} 🏢</>
          ) : (
            <>Hello, {userName} 👋</>
          )}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {isBusinessProfile 
            ? "Manage payments and connect with customers"
            : "Send money to friends and businesses"
          }
        </p>
      </div>

      {/* Balance Summary Card */}
      <div className="bg-gradient-to-br from-[#0A2540] to-[#1a4a7c] rounded-2xl p-5 text-white mb-6">
        <div className="text-sm text-white/70 mb-1">Total Balance</div>
        <div className="text-3xl font-bold mb-4">{formatUSD(wallet.usd_balance)}</div>
        
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

      {/* Primary Action Buttons */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <button
          onClick={() => navigate('/sender/people')}
          className="flex flex-col items-center gap-2 bg-[#0A2540] text-white rounded-xl py-4 px-3 hover:bg-[#0A2540]/90 transition"
          data-testid="send-pbx-btn"
        >
          <div className="w-10 h-10 rounded-full bg-[#F6C94B]/20 flex items-center justify-center">
            <svg className="w-5 h-5 text-[#F6C94B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </div>
          <span className="font-medium">Send PBX</span>
          <span className="text-xs text-white/60">To friends</span>
        </button>

        <button
          onClick={() => navigate('/sender/send')}
          className="flex flex-col items-center gap-2 bg-white text-[#0A2540] rounded-xl py-4 px-3 border border-gray-200 hover:border-[#0A2540] transition"
          data-testid="send-external-btn"
        >
          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <span className="font-medium">Send to External</span>
          <span className="text-xs text-gray-500">GCash, Banks</span>
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
            {recentChats.map((chat) => (
              <button
                key={chat.conversation_id}
                onClick={() => navigate(`/sender/chat/${chat.other_user?.user_id}`)}
                className="flex flex-col items-center min-w-[72px]"
                data-testid="recent-chat-btn"
              >
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#0A2540] to-[#1a4a7c] flex items-center justify-center text-white font-bold text-lg mb-1">
                  {(chat.other_user?.display_name || "?")?.[0]?.toUpperCase()}
                </div>
                <span className="text-xs text-gray-600 truncate max-w-[72px]">
                  {chat.other_user?.display_name || "Friend"}
                </span>
              </button>
            ))}
            
            {/* Add Friend Button */}
            <button
              onClick={() => navigate('/sender/people')}
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
            icon={<svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" /></svg>}
            bgColor="bg-blue-100"
            title="Pay Businesses"
            subtitle="Message and pay businesses in-app"
          />
          <TrustItem 
            icon={<svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>}
            bgColor="bg-amber-100"
            title="Secure & Licensed"
            subtitle="Bank-grade security"
          />
        </div>
      </div>
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
