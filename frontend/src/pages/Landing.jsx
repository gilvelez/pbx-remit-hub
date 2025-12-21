// PBX Landing Page — Exact Mockup Match
// Premium Filipino Fintech Design

import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

export const Landing = () => {
  return (
    <main className="min-h-screen bg-[#faf8f3]">
      <Header />
      <HeroSection />
      <FXRateBar />
      <PricingSection />
      <KababayanSection />
      <Footer />
    </main>
  );
};

/* ============================================
   HEADER - White/Light header like mockup
============================================ */
function Header() {
  return (
    <header className="absolute top-0 left-0 right-0 z-50 bg-transparent">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <svg className="w-8 h-8" viewBox="0 0 40 40" fill="none">
            <path d="M20 5L35 15L20 25L5 15L20 5Z" fill="#0A2540"/>
            <path d="M20 18L35 28L20 38L5 28L20 18Z" fill="#D4A520"/>
          </svg>
          <span className="text-2xl font-bold text-[#0A2540]">PBX</span>
        </Link>

        {/* Nav */}
        <nav className="hidden md:flex items-center gap-8 text-sm">
          <a href="#pricing" className="text-slate-600 hover:text-[#0A2540] font-medium">Pricing</a>
          <a href="#security" className="text-slate-600 hover:text-[#0A2540] font-medium">Security</a>
          <a href="#faq" className="text-slate-600 hover:text-[#0A2540] font-medium">FAQ</a>
        </nav>

        {/* CTA */}
        <Link
          to="/login"
          className="rounded-full border-2 border-[#0A2540] px-5 py-2 text-sm font-semibold text-[#0A2540] hover:bg-[#0A2540] hover:text-white transition"
        >
          Try the Demo
        </Link>
      </div>
    </header>
  );
}

/* ============================================
   HERO SECTION - Dramatic golden sunset background
============================================ */
function HeroSection() {
  return (
    <section 
      className="relative min-h-[600px] overflow-hidden"
      style={{
        background: `
          linear-gradient(135deg, 
            #0d1b2a 0%, 
            #1b2838 10%, 
            #2a3f4f 18%,
            #3d5060 25%,
            #5a6a5a 32%,
            #7a7a48 40%,
            #9a8a35 48%,
            #ba9a22 56%,
            #d4aa15 64%,
            #e8ba0a 72%,
            #f5c808 80%,
            #ffd500 88%,
            #ffe44d 94%,
            #fff59d 100%
          )
        `,
      }}
    >
      {/* Decorative flowing curves overlay */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse 150% 100% at 100% 0%, rgba(13,27,42,0.9) 0%, transparent 45%),
            radial-gradient(ellipse 120% 80% at 0% 0%, rgba(26,40,56,0.7) 0%, transparent 35%),
            radial-gradient(ellipse 100% 60% at 50% 100%, rgba(255,213,0,0.3) 0%, transparent 50%)
          `,
        }}
      />
      
      {/* Wavy flowing lines effect */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-30" preserveAspectRatio="none" viewBox="0 0 1440 600">
        <path d="M0,200 Q360,100 720,200 T1440,200 L1440,0 L0,0 Z" fill="url(#waveGradient1)" />
        <path d="M0,250 Q360,150 720,250 T1440,250 L1440,0 L0,0 Z" fill="url(#waveGradient2)" />
        <path d="M0,300 Q360,200 720,300 T1440,300 L1440,0 L0,0 Z" fill="url(#waveGradient3)" />
        <defs>
          <linearGradient id="waveGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0d1b2a" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#3d5060" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#d4aa15" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="waveGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1b2838" stopOpacity="0.6" />
            <stop offset="50%" stopColor="#7a7a48" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#f5c808" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="waveGradient3" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2a3f4f" stopOpacity="0.4" />
            <stop offset="50%" stopColor="#9a8a35" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#ffd500" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-24 pb-16">
        <div className="grid md:grid-cols-2 gap-10 items-center">
          {/* Left: Headlines */}
          <div>
            <h1 className="text-4xl sm:text-5xl font-bold leading-tight" style={{ fontFamily: 'Georgia, serif' }}>
              <span className="block text-[#1a1a2e]">Know exactly what</span>
              <span className="block text-[#1a1a2e]">arrives in PHP—</span>
              <span className="block italic text-[#0d1b2a]">before you send.</span>
            </h1>

            <p className="mt-6 text-base text-[#2d3748] max-w-md leading-relaxed">
              Built for overseas Filipinos. Clear estimates, secure infrastructure, and peace of mind for families back home.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                to="/login"
                className="rounded-lg bg-[#d4a520] px-6 py-3 text-base font-semibold text-[#1a1a2e] shadow-lg hover:bg-[#c49510] transition"
              >
                Try the Demo
              </Link>
              <a
                href="#how"
                className="flex items-center gap-2 text-base font-medium text-[#1a1a2e] hover:underline"
              >
                How PBX Works
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </a>
            </div>
          </div>

          {/* Right: Demo Preview Card */}
          <div className="relative">
            <DemoPricingCard />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================================
   DEMO PRICING CARD
============================================ */
function DemoPricingCard() {
  return (
    <div className="bg-white rounded-xl shadow-2xl overflow-hidden max-w-sm ml-auto">
      {/* Header */}
      <div className="bg-[#f5f5f5] px-5 py-3 border-b border-slate-200">
        <span className="text-sm font-semibold text-slate-700">Demo Preview</span>
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="text-lg font-bold text-[#0A2540] mb-4">Clear Pricing Preview</h3>

        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-slate-100">
            <span className="text-sm text-slate-600">Estimated FX Rate</span>
            <span className="text-sm font-bold text-[#0A2540]">₱58.25 / $1</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-slate-100">
            <span className="text-sm text-slate-600">Fees</span>
            <span className="text-sm font-bold text-[#0A2540]">Shown in demo</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-slate-600">Availability</span>
            <span className="text-sm font-bold text-[#0A2540]">Varies by partner</span>
          </div>
        </div>

        <p className="mt-4 text-xs text-slate-500 leading-relaxed">
          Demo estimates are illustrative only. Actual rates, fees, and availability will vary and are subject to partner pricing.
        </p>

        <Link
          to="/login"
          className="mt-4 block w-full rounded-lg bg-slate-100 px-4 py-3 text-center text-sm font-semibold text-[#0A2540] hover:bg-slate-200 transition border border-slate-200"
        >
          Try the Demo
        </Link>
      </div>
    </div>
  );
}

/* ============================================
   FX RATE BAR
============================================ */
function FXRateBar() {
  const [lastUpdated, setLastUpdated] = useState(25);
  const [rate, setRate] = useState(58.25);

  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdated(prev => {
        if (prev >= 60) {
          setRate(58.20 + Math.random() * 0.15);
          return 0;
        }
        return prev + 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="bg-white border-y border-slate-200 py-3">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6">
          <div className="flex items-center gap-2">
            {/* PH Flag */}
            <div className="w-6 h-4 rounded-sm overflow-hidden shadow-sm flex flex-col border border-slate-200">
              <div className="h-1/2 bg-[#0038a8]" />
              <div className="h-1/2 bg-[#ce1126]" />
            </div>
            <span className="text-sm font-medium text-slate-700">USD → PHP Indicative Rate</span>
          </div>

          <span className="text-xl font-bold text-[#0A2540]">₱{rate.toFixed(2)}</span>

          <span className="px-3 py-1 rounded-full bg-[#f5c808]/30 text-[#8b6914] text-xs font-semibold">
            Refresh
          </span>

          <span className="text-xs text-slate-500 flex items-center gap-1">
            Updated {lastUpdated} seconds ago
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </span>
        </div>
      </div>
    </section>
  );
}

/* ============================================
   PRICING SECTION
============================================ */
function PricingSection() {
  const tiers = [
    { name: "Starter", range: "$1 - $250", fee: "$2.09", desc: "Ideal for small sends", icon: "check" },
    { name: "Family", range: "$251 - $1,000", fee: "$2.09", desc: "Most popular", icon: "building" },
    { name: "OFW Plus", range: "$1,001 - $3,000", fee: "$4.99", feeNote: "demo", desc: "Best value", icon: "bolt" },
    { name: "Bayani Max", range: "$3,001+", fee: "$7.99", feeNote: "max fee", desc: "Capped pricing", icon: "star", highlight: true },
  ];

  const icons = {
    check: <svg className="w-8 h-8" fill="none" stroke="#d4a520" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    building: <svg className="w-8 h-8" fill="none" stroke="#d4a520" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>,
    bolt: <svg className="w-8 h-8" fill="none" stroke="#d4a520" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>,
    star: <svg className="w-8 h-8" fill="none" stroke="#d4a520" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>,
  };

  return (
    <section id="pricing" className="py-16 bg-gradient-to-b from-[#f5efe0] to-[#faf8f3]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-3xl sm:text-4xl font-bold text-[#1a1a2e]" style={{ fontFamily: 'Georgia, serif' }}>
            Fair pricing that rewards sending more
          </h2>
          <p className="mt-3 text-base text-slate-600 max-w-2xl mx-auto">
            PBX uses tiered pricing with capped fees — designed for overseas Filipinos who support family regularly.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`rounded-xl p-5 ${
                tier.highlight
                  ? "bg-[#f5e6c8] border-2 border-[#d4a520] shadow-lg"
                  : "bg-white border border-slate-200 shadow-sm"
              }`}
            >
              <div className="mb-3">{icons[tier.icon]}</div>
              <h3 className="text-lg font-bold text-[#1a1a2e]">{tier.name}</h3>
              <p className="text-sm text-slate-500 mb-3">{tier.range}</p>
              <div className="text-2xl font-bold text-[#1a1a2e]">
                {tier.fee}
                <span className="text-sm font-normal text-slate-500 ml-1">{tier.feeNote || "fee"}</span>
              </div>
              <p className="mt-2 text-sm text-slate-500">{tier.desc}</p>
            </div>
          ))}
        </div>

        <p className="mt-6 text-center text-sm text-slate-500">
          Demo pricing shown for illustration only. Actual fees, rates, and availability will vary and are subject to partner pricing.
        </p>

        <div className="mt-6 text-center">
          <Link
            to="/login"
            className="inline-block rounded-lg bg-[#d4a520] px-8 py-3 text-base font-semibold text-[#1a1a2e] shadow-lg hover:bg-[#c49510] transition"
          >
            Try the Demo
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ============================================
   KABABAYAN STORY SECTION
============================================ */
function KababayanSection() {
  return (
    <section 
      className="relative py-20 overflow-hidden"
      style={{
        background: `linear-gradient(180deg, 
          #faf8f3 0%,
          #f5e6c8 15%,
          #e8c878 35%,
          #d4a520 55%,
          #c49510 70%,
          #a67c00 85%,
          #8b6914 100%)`,
      }}
    >
      {/* Background image overlay with Manila skyline feel */}
      <div 
        className="absolute inset-0 opacity-30 pointer-events-none"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1526731955462-f6085f39e742?w=1920&q=80')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          mixBlendMode: 'overlay',
        }}
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-[#1a1a2e]" style={{ fontFamily: 'Georgia, serif' }}>
            For our <span className="text-[#1a1a2e]">kababayan</span>, built for home.
          </h2>
          <p className="mt-6 text-lg text-[#2d2d2d] leading-relaxed">
            Sending money isn't just a transaction.<br />
            <span className="font-semibold">It's groceries, tuition, medicine, and peace of mind.</span>
          </p>
        </div>

        {/* Images showing OFW to family connection */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-8">
          <div className="relative">
            <img
              src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&q=80&fit=crop"
              alt="OFW sending support"
              className="w-48 h-64 object-cover rounded-2xl shadow-2xl"
              style={{ filter: 'sepia(0.2) saturate(1.1)' }}
            />
          </div>
          <div className="relative">
            <img
              src="https://images.unsplash.com/photo-1507675841101-8c757cb4cc6d?w=400&q=80&fit=crop"
              alt="Filipino family receiving support"
              className="w-64 h-72 object-cover rounded-2xl shadow-2xl"
              style={{ filter: 'sepia(0.15) saturate(1.1)' }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================================
   FOOTER
============================================ */
function Footer() {
  return (
    <footer className="bg-[#0A2540] py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
          <div className="flex items-center gap-2">
            <svg className="w-8 h-8" viewBox="0 0 40 40" fill="none">
              <path d="M20 5L35 15L20 25L5 15L20 5Z" fill="#f5c808"/>
              <path d="M20 18L35 28L20 38L5 28L20 18Z" fill="#f5c808" opacity="0.6"/>
            </svg>
            <span className="text-xl font-bold text-white">PBX</span>
            <span className="text-sm text-slate-400 ml-2">Philippine Bayani Exchange</span>
          </div>

          <Link
            to="/login"
            className="rounded-full border-2 border-slate-500 px-6 py-2 text-sm font-semibold text-white hover:bg-white hover:text-[#0A2540] transition"
          >
            Try the Demo
          </Link>
        </div>

        <div className="text-center border-t border-slate-700 pt-6">
          <p className="text-xs text-slate-400 max-w-4xl mx-auto leading-relaxed">
            PBX is a financial technology platform and does not provide banking or money transmission services directly. Services may be provided by licensed financial partners where required. Demo estimates shown. Actual rates, fees, and availability will vary and are subject to partner pricing.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4 text-xs mt-4">
          <Link to="/privacy" className="text-slate-500 hover:text-slate-300">Privacy Policy</Link>
          <span className="text-slate-700">•</span>
          <Link to="/terms" className="text-slate-500 hover:text-slate-300">Terms of Service</Link>
          <span className="text-slate-700">•</span>
          <Link to="/data-retention" className="text-slate-500 hover:text-slate-300">Data Retention</Link>
          <span className="text-slate-700">•</span>
          <Link to="/security" className="text-slate-500 hover:text-slate-300">Security</Link>
        </div>
      </div>
    </footer>
  );
}

export default Landing;
