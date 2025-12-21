// PBX Landing Page — Exact Mockup Recreation
// Premium Filipino Fintech Design matching provided mockup

import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

export const Landing = () => {
  return (
    <main className="min-h-screen bg-[#FAFAF7]">
      {/* Header */}
      <Header />

      {/* Hero Section */}
      <HeroSection />

      {/* FX Rate Bar */}
      <FXRateBar />

      {/* Pricing Section */}
      <PricingSection />

      {/* Kababayan Story Section */}
      <KababayanSection />

      {/* Footer */}
      <Footer />
    </main>
  );
};

/* ============================================
   HEADER
============================================ */
function Header() {
  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-100">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <svg className="w-8 h-8" viewBox="0 0 40 40" fill="none">
            <path d="M20 5L35 15L20 25L5 15L20 5Z" fill="#0A2540"/>
            <path d="M20 20L35 30L20 40L5 30L20 20Z" fill="#F6C94B"/>
          </svg>
          <span className="text-2xl font-bold text-[#0A2540]">PBX</span>
        </Link>

        {/* Nav Links */}
        <nav className="hidden md:flex items-center gap-8 text-sm">
          <a href="#pricing" className="text-slate-600 hover:text-[#0A2540] transition font-medium">Pricing</a>
          <a href="#security" className="text-slate-600 hover:text-[#0A2540] transition font-medium">Security</a>
          <a href="#faq" className="text-slate-600 hover:text-[#0A2540] transition font-medium">FAQ</a>
        </nav>

        {/* CTA */}
        <Link
          to="/login"
          className="rounded-full border-2 border-[#0A2540] bg-transparent px-5 py-2 text-sm font-semibold text-[#0A2540] hover:bg-[#0A2540] hover:text-white transition"
        >
          Try the Demo
        </Link>
      </div>
    </header>
  );
}

/* ============================================
   HERO SECTION - Matching Mockup
============================================ */
function HeroSection() {
  return (
    <section className="relative overflow-hidden min-h-[550px]">
      {/* Background matching mockup - dark navy top to golden bottom */}
      <div 
        className="absolute inset-0 -z-20"
        style={{
          background: `linear-gradient(175deg, 
            #0d1421 0%, 
            #1a2633 12%,
            #2a3b4d 22%,
            #3d4a4f 32%,
            #5a5a42 42%,
            #7a6a35 52%,
            #9a7a28 60%,
            #ba8a1a 68%,
            #d49a10 76%,
            #e8b020 84%,
            #f5c530 90%,
            #ffd54f 96%,
            #ffe082 100%)`,
        }}
      />
      
      {/* Decorative wave curves like in mockup */}
      <div 
        className="absolute inset-0 -z-10"
        style={{
          background: `
            radial-gradient(ellipse 120% 80% at 80% 20%, rgba(212,170,32,0.3) 0%, transparent 50%),
            radial-gradient(ellipse 100% 60% at 20% 80%, rgba(255,213,79,0.4) 0%, transparent 40%),
            radial-gradient(ellipse 80% 50% at 60% 60%, rgba(186,138,26,0.25) 0%, transparent 50%)
          `,
        }}
      />
      
      {/* Subtle diagonal stripes for texture */}
      <div 
        className="absolute inset-0 -z-10 opacity-10"
        style={{
          backgroundImage: `repeating-linear-gradient(
            135deg,
            transparent,
            transparent 40px,
            rgba(255,255,255,0.05) 40px,
            rgba(255,255,255,0.05) 80px
          )`,
        }}
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-16 md:pt-20 pb-16 md:pb-24">
        <div className="grid md:grid-cols-2 gap-10 items-start">
          {/* Left: Headlines */}
          <div className="pt-4">
            <h1 className="text-4xl sm:text-5xl font-bold leading-tight text-[#1a1a2e]" style={{ fontFamily: 'Georgia, serif' }}>
              <span className="block">Know exactly what</span>
              <span className="block">arrives in PHP—</span>
              <span className="block italic text-[#0A2540]">before you send.</span>
            </h1>

            <p className="mt-6 text-base text-[#2d2d2d]/80 max-w-md leading-relaxed">
              Built for overseas Filipinos. Clear estimates, secure infrastructure, and peace of mind for families back home.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                to="/login"
                className="rounded-lg bg-[#D4A520] px-6 py-3 text-base font-semibold text-[#1a1a2e] shadow-lg hover:bg-[#b8960b] transition"
              >
                Try the Demo
              </Link>
              <a
                href="#how"
                className="flex items-center gap-2 text-base font-medium text-[#1a1a2e] hover:text-[#0A2540] transition"
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
      <div className="bg-slate-100 px-5 py-3 border-b border-slate-200">
        <span className="text-sm font-semibold text-slate-700">Demo Preview</span>
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="text-lg font-bold text-[#0A2540] mb-4">Clear Pricing Preview</h3>

        {/* Pricing rows */}
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

        {/* Disclaimer */}
        <p className="mt-4 text-xs text-slate-500 leading-relaxed">
          Demo estimates are illustrative only. Actual rates, fees, and availability will vary and are subject to partner pricing.
        </p>

        {/* CTA */}
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
          {/* Flag + Label */}
          <div className="flex items-center gap-2">
            {/* PH Flag */}
            <div className="w-6 h-4 rounded-sm overflow-hidden shadow-sm flex flex-col border border-slate-200">
              <div className="h-1/2 bg-[#0038a8]" />
              <div className="h-1/2 bg-[#ce1126]" />
              <div className="absolute w-0 h-0 border-l-[8px] border-l-white border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent" style={{ left: 0 }} />
            </div>
            <span className="text-sm font-medium text-slate-700">USD → PHP Indicative Rate</span>
          </div>

          {/* Rate */}
          <span className="text-xl font-bold text-[#0A2540]">₱{rate.toFixed(2)}</span>

          {/* Refresh badge */}
          <span className="px-3 py-1 rounded-full bg-[#F6C94B]/30 text-[#8B6914] text-xs font-semibold">
            Refresh
          </span>

          {/* Updated */}
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
   PRICING SECTION - Matching Mockup Exactly
============================================ */
function PricingSection() {
  const tiers = [
    {
      name: "Starter",
      range: "$1 - $250",
      fee: "$2.09",
      description: "Ideal for small sends",
      icon: (
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="#D4A520" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      name: "Family",
      range: "$251 - $1,000",
      fee: "$2.09",
      description: "Most popular",
      icon: (
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="#D4A520" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
    },
    {
      name: "OFW Plus",
      range: "$1,001 - $3,000",
      fee: "$4.99",
      feeNote: "demo",
      description: "Best value",
      icon: (
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="#D4A520" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
    },
    {
      name: "Bayani Max",
      range: "$3,001+",
      fee: "$7.99",
      feeNote: "max fee",
      description: "Capped pricing",
      highlight: true,
      icon: (
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="#D4A520" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
        </svg>
      ),
    },
  ];

  return (
    <section id="pricing" className="py-16 bg-gradient-to-b from-[#f5f0e6] to-[#faf8f3]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-10">
          <h2 className="text-3xl sm:text-4xl font-bold text-[#1a1a2e]" style={{ fontFamily: 'Georgia, serif' }}>
            Fair pricing that rewards sending more
          </h2>
          <p className="mt-3 text-base text-slate-600 max-w-2xl mx-auto">
            PBX uses tiered pricing with capped fees — designed for overseas Filipinos who support family regularly.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`relative rounded-xl p-5 transition-all ${
                tier.highlight
                  ? "bg-[#f5e6c8] border-2 border-[#D4A520] shadow-lg"
                  : "bg-white border border-slate-200 shadow-sm hover:shadow-md"
              }`}
            >
              {/* Icon */}
              <div className="mb-3">
                {tier.icon}
              </div>

              {/* Name */}
              <h3 className="text-lg font-bold text-[#1a1a2e] mb-1">{tier.name}</h3>

              {/* Range */}
              <p className="text-sm text-slate-500 mb-3">{tier.range}</p>

              {/* Fee */}
              <div className="text-2xl font-bold text-[#1a1a2e]">
                {tier.fee}
                <span className="text-sm font-normal text-slate-500 ml-1">
                  {tier.feeNote || "fee"}
                </span>
              </div>

              {/* Description */}
              <p className="mt-2 text-sm text-slate-500">{tier.description}</p>
            </div>
          ))}
        </div>

        {/* Disclaimer */}
        <p className="mt-6 text-center text-sm text-slate-500">
          Demo pricing shown for illustration only. Actual fees, rates, and availability will vary and are subject to partner pricing.
        </p>

        {/* CTA */}
        <div className="mt-6 text-center">
          <Link
            to="/login"
            className="inline-block rounded-lg bg-[#D4A520] px-8 py-3 text-base font-semibold text-[#1a1a2e] shadow-lg hover:bg-[#b8960b] transition"
          >
            Try the Demo
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ============================================
   KABABAYAN STORY SECTION - Matching Mockup
============================================ */
function KababayanSection() {
  return (
    <section className="relative py-20 overflow-hidden">
      {/* Background - Warm sunset gradient matching mockup */}
      <div 
        className="absolute inset-0 -z-10"
        style={{
          background: `linear-gradient(180deg, 
            #faf8f3 0%,
            #f5e6c8 10%,
            #e6c88a 25%,
            #d4a520 45%,
            #c49520 60%,
            #a67c00 80%,
            #8b6914 100%)`,
        }}
      />

      {/* Illustrated scene overlay - using background image */}
      <div 
        className="absolute inset-0 -z-10 opacity-40"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1526731955462-f6085f39e742?w=1920&q=80')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center bottom',
          mixBlendMode: 'overlay',
        }}
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-[#1a1a2e] leading-tight" style={{ fontFamily: 'Georgia, serif' }}>
            For our <span className="text-[#1a1a2e]">kababayan</span>, built for home.
          </h2>
          
          <p className="mt-6 text-lg text-[#2d2d2d]/90 leading-relaxed">
            Sending money isn't just a transaction.<br />
            <span className="font-semibold">It's groceries, tuition, medicine, and peace of mind.</span>
          </p>
        </div>

        {/* Illustrated scene - OFW to family */}
        <div className="mt-12 relative">
          <div className="flex items-end justify-center gap-8">
            {/* Left: OFW with phone (silhouette style) */}
            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&q=80&fit=crop"
                alt="OFW sending money"
                className="w-48 h-64 object-cover rounded-2xl shadow-2xl opacity-90"
                style={{ filter: 'sepia(0.3) saturate(1.2)' }}
              />
            </div>

            {/* Right: Family at home */}
            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1507675841101-8c757cb4cc6d?w=400&q=80&fit=crop"
                alt="Filipino family at home"
                className="w-64 h-72 object-cover rounded-2xl shadow-2xl"
                style={{ filter: 'sepia(0.2) saturate(1.1)' }}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================================
   FOOTER - Matching Mockup
============================================ */
function Footer() {
  return (
    <footer className="bg-[#0A2540] py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Top row */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <svg className="w-8 h-8" viewBox="0 0 40 40" fill="none">
              <path d="M20 5L35 15L20 25L5 15L20 5Z" fill="#F6C94B"/>
              <path d="M20 20L35 30L20 40L5 30L20 20Z" fill="#F6C94B" opacity="0.6"/>
            </svg>
            <span className="text-xl font-bold text-white">PBX</span>
            <span className="text-sm text-slate-400 ml-2">Philippine Bayani Exchange</span>
          </div>

          {/* CTA */}
          <Link
            to="/login"
            className="rounded-full border-2 border-slate-500 px-6 py-2 text-sm font-semibold text-white hover:bg-white hover:text-[#0A2540] transition"
          >
            Try the Demo
          </Link>
        </div>

        {/* Compliance text */}
        <div className="text-center border-t border-slate-700 pt-6">
          <p className="text-xs text-slate-400 max-w-4xl mx-auto leading-relaxed">
            PBX is a financial technology platform and does not provide banking or money transmission services directly. Services may be provided by licensed financial partners where required. Demo estimates shown. Actual rates, fees, and availability will vary and are subject to partner pricing.
          </p>
        </div>

        {/* Legal links */}
        <div className="flex flex-wrap items-center justify-center gap-4 text-xs mt-4">
          <Link to="/privacy" className="text-slate-500 hover:text-slate-300 transition">Privacy Policy</Link>
          <span className="text-slate-700">•</span>
          <Link to="/terms" className="text-slate-500 hover:text-slate-300 transition">Terms of Service</Link>
          <span className="text-slate-700">•</span>
          <Link to="/data-retention" className="text-slate-500 hover:text-slate-300 transition">Data Retention</Link>
          <span className="text-slate-700">•</span>
          <Link to="/security" className="text-slate-500 hover:text-slate-300 transition">Security</Link>
        </div>
      </div>
    </footer>
  );
}

export default Landing;
