/**
 * Home - App home page with live FX rate
 * Part of the 4-tab navigation in AppShell
 */
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSession } from "../../contexts/SessionContext";
import { tw } from "../../lib/theme";
import LiveFXRate from "../../components/LiveFXRate";

export default function Home() {
  const { session } = useSession();
  const navigate = useNavigate();
  const [currentRate, setCurrentRate] = useState(56.25);

  const userName = session?.user?.fullName?.split(' ')[0] || 
                   session?.user?.email?.split('@')[0] || 
                   'there';

  // Check if user has a saved recipient from onboarding
  const hasRecipient = session?.defaultRecipient;

  return (
    <div className="px-4 py-6">
      {/* Welcome Header */}
      <div className="mb-6">
        <h1 className={`text-2xl font-bold ${tw.textOnLight}`}>
          Hello, {userName} 👋
        </h1>
        <p className={`text-sm ${tw.textOnLightMuted} mt-1`}>
          Ready to send money to the Philippines?
        </p>
      </div>

      {/* Live FX Rate Card - Primary Card */}
      <LiveFXRate 
        showLockInfo={true} 
        showDisclaimer={true}
        onRateChange={setCurrentRate}
        className="mb-6"
      />

      {/* Send Money CTA */}
      <button
        onClick={() => navigate('/app/send')}
        className={`w-full ${tw.btnNavy} rounded-2xl py-4 text-base transition shadow-lg shadow-[#0A2540]/20`}
        data-testid="home-send-money-btn"
      >
        {hasRecipient 
          ? `Send to ${session.defaultRecipient.fullName.split(' ')[0]}`
          : 'Send Money Now'
        }
      </button>

      {/* Quick Actions */}
      <div className="mt-8">
        <h2 className={`text-sm font-semibold ${tw.textOnLightMuted} mb-3`}>QUICK ACTIONS</h2>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => navigate('/app/send')}
            className={`${tw.cardBg} rounded-xl p-4 text-left border ${tw.borderOnLight} hover:border-[#0A2540] transition`}
          >
            <div className="w-10 h-10 rounded-full bg-[#0A2540]/10 flex items-center justify-center mb-3">
              <svg className="w-5 h-5 text-[#0A2540]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </div>
            <div className={`font-medium ${tw.textOnLight}`}>Send Money</div>
            <div className={`text-xs ${tw.textOnLightMuted} mt-0.5`}>To Philippines</div>
          </button>

          <button
            onClick={() => navigate('/app/activity')}
            className={`${tw.cardBg} rounded-xl p-4 text-left border ${tw.borderOnLight} hover:border-[#0A2540] transition`}
          >
            <div className="w-10 h-10 rounded-full bg-[#0A2540]/10 flex items-center justify-center mb-3">
              <svg className="w-5 h-5 text-[#0A2540]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className={`font-medium ${tw.textOnLight}`}>Track Transfer</div>
            <div className={`text-xs ${tw.textOnLightMuted} mt-0.5`}>View status</div>
          </button>
        </div>
      </div>

      {/* Trust Indicators */}
      <div className={`mt-8 ${tw.cardBg} rounded-2xl p-5 border ${tw.borderOnLight}`}>
        <h3 className={`font-medium ${tw.textOnLight} mb-4`}>Why choose PBX?</h3>
        <div className="space-y-3">
          <TrustItem 
            icon={<svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
            bgColor="bg-green-100"
            title="No hidden fees"
            subtitle="Transparent pricing always"
          />
          <TrustItem 
            icon={<svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
            bgColor="bg-blue-100"
            title="Instant delivery"
            subtitle="GCash & Maya in seconds"
          />
          <TrustItem 
            icon={<svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>}
            bgColor="bg-amber-100"
            title="15-min rate lock"
            subtitle="Lock your rate, no surprises"
          />
          <TrustItem 
            icon={<svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>}
            bgColor="bg-purple-100"
            title="Bank-level security"
            subtitle="Your money is protected"
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
        <div className={`text-sm font-medium ${tw.textOnLight}`}>{title}</div>
        <div className={`text-xs ${tw.textOnLightMuted}`}>{subtitle}</div>
      </div>
    </div>
  );
}
