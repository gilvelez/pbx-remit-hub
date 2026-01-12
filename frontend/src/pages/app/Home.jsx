import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSession } from "../../contexts/SessionContext";
import LiveFXRate from "../../components/LiveFXRate";

export default function Home() {
  const { session } = useSession();
  const navigate = useNavigate();
  const [currentRate, setCurrentRate] = useState(56.25);

  const userName = session?.user?.fullName?.split(' ')[0] || 
                   session?.user?.email?.split('@')[0] || 
                   'there';

  return (
    <div className="px-4 py-6">
      {/* Welcome Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1A1A1A]">
          Hello, {userName} 👋
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Ready to send money to the Philippines?
        </p>
      </div>

      {/* Live FX Rate Card - Primary Card */}
      <LiveFXRate 
        variant="light" 
        showLockInfo={true} 
        showDisclaimer={true}
        onRateChange={setCurrentRate}
        className="mb-6"
      />

      {/* Send Money CTA */}
      <button
        onClick={() => navigate('/app/send')}
        className="w-full bg-[#0A2540] text-white rounded-2xl py-4 font-semibold text-base hover:bg-[#061C33] transition shadow-lg shadow-[#0A2540]/20"
        data-testid="home-send-money-btn"
      >
        Send Money Now
      </button>

      {/* Quick Actions */}
      <div className="mt-8">
        <h2 className="text-sm font-semibold text-gray-500 mb-3">QUICK ACTIONS</h2>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => navigate('/app/send')}
            className="bg-white rounded-xl p-4 text-left border border-gray-100 hover:border-[#0A2540] transition"
          >
            <div className="w-10 h-10 rounded-full bg-[#0A2540]/10 flex items-center justify-center mb-3">
              <svg className="w-5 h-5 text-[#0A2540]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </div>
            <div className="font-medium text-[#1A1A1A]">Send Money</div>
            <div className="text-xs text-gray-500 mt-0.5">To Philippines</div>
          </button>

          <button
            onClick={() => navigate('/app/activity')}
            className="bg-white rounded-xl p-4 text-left border border-gray-100 hover:border-[#0A2540] transition"
          >
            <div className="w-10 h-10 rounded-full bg-[#0A2540]/10 flex items-center justify-center mb-3">
              <svg className="w-5 h-5 text-[#0A2540]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="font-medium text-[#1A1A1A]">Track Transfer</div>
            <div className="text-xs text-gray-500 mt-0.5">View status</div>
          </button>
        </div>
      </div>

      {/* Trust Indicators */}
      <div className="mt-8 bg-white rounded-2xl p-5 border border-gray-100">
        <h3 className="font-medium text-[#1A1A1A] mb-4">Why choose PBX?</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <div className="text-sm font-medium text-[#1A1A1A]">No hidden fees</div>
              <div className="text-xs text-gray-500">Transparent pricing always</div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <div className="text-sm font-medium text-[#1A1A1A]">Instant delivery</div>
              <div className="text-xs text-gray-500">GCash & Maya in seconds</div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div>
              <div className="text-sm font-medium text-[#1A1A1A]">15-min rate lock</div>
              <div className="text-xs text-gray-500">Lock your rate, no surprises</div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <div className="text-sm font-medium text-[#1A1A1A]">Bank-level security</div>
              <div className="text-xs text-gray-500">Your money is protected</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
