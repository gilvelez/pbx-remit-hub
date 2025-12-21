// PBX Landing Page — Premium Filipino Fintech Redesign
// - Deep Navy + Filipino Gold theme
// - Static pricing preview, tiered pricing, emotional storytelling
// - Compliance-safe, no fake balances or interactive transfers
// - TailwindCSS

import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

// Custom Filipino-themed colors
const colors = {
  navy: "#0A2540",
  navyDark: "#061C33",
  gold: "#F6C94B",
  goldDark: "#D4A534",
  red: "#C1121F",
  offWhite: "#FAFAF7",
  warmGray: "#F5F3EF",
};

export const Landing = () => {
  return (
    <main className="min-h-screen bg-[#FAFAF7] text-slate-800 selection:bg-yellow-200">
      {/* Header / Nav */}
      <Header />

      {/* Hero Section */}
      <HeroSection />

      {/* Real-time FX Rate Bar */}
      <FXRateBar />

      {/* Tiered Pricing Section */}
      <PricingSection />

      {/* Why PBX Section */}
      <WhyPBXSection />

      {/* Filipino Story / Emotional Section */}
      <StorySection />

      {/* Footer */}
      <Footer />
    </main>
  );
};

/* ============================================
   HEADER COMPONENT
============================================ */
function Header() {
  return (
    <header className="sticky top-0 z-50 bg-[#0A2540]/95 backdrop-blur-sm border-b border-[#0A2540]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3">
          <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-gradient-to-br from-[#F6C94B] to-[#D4A534] shadow-md">
            <svg className="w-5 h-5 text-[#0A2540]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" strokeWidth="2" stroke="currentColor" fill="none"/>
            </svg>
          </div>
          <span className="text-xl font-bold text-white tracking-tight">PBX</span>
        </Link>

        {/* Nav Links */}
        <nav className="hidden md:flex items-center gap-8 text-sm">
          <a href="#pricing" className="text-slate-300 hover:text-[#F6C94B] transition font-medium">Pricing</a>
          <a href="#security" className="text-slate-300 hover:text-[#F6C94B] transition font-medium">Security</a>
          <a href="#faq" className="text-slate-300 hover:text-[#F6C94B] transition font-medium">FAQ</a>
        </nav>

        {/* CTA */}
        <Link
          to="/login"
          className="rounded-xl bg-[#F6C94B] px-5 py-2.5 text-sm font-bold text-[#0A2540] shadow-lg hover:bg-[#D4A534] transition transform hover:scale-105"
        >
          Try the Demo
        </Link>
      </div>
    </header>
  );
}

/* ============================================
   HERO SECTION
============================================ */
function HeroSection() {
  return (
    <section className="relative overflow-hidden">
      {/* Background with warm golden gradient */}
      <div 
        className="absolute inset-0 -z-10"
        style={{
          background: `linear-gradient(135deg, #0A2540 0%, #1a3a5c 30%, #8B6914 70%, #F6C94B 100%)`,
        }}
      />
      {/* Subtle texture overlay */}
      <div 
        className="absolute inset-0 -z-10 opacity-20"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-16 md:pt-24 pb-20 md:pb-28">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left: Headlines */}
          <div className="text-white">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
              <span className="block text-white drop-shadow-lg">Know exactly what</span>
              <span className="block text-white drop-shadow-lg">arrives in PHP —</span>
              <span className="block text-[#F6C94B] drop-shadow-lg italic">before you send.</span>
            </h1>

            <p className="mt-6 text-lg text-white/90 max-w-lg leading-relaxed">
              Built for overseas Filipinos. Clear estimates, secure infrastructure, and peace of mind for families back home.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                to="/login"
                className="rounded-xl bg-[#F6C94B] px-6 py-3.5 text-base font-bold text-[#0A2540] shadow-xl hover:bg-[#D4A534] transition transform hover:scale-105"
              >
                Try the Demo
              </Link>
              <a
                href="#how"
                className="flex items-center gap-2 rounded-xl border-2 border-white/40 px-6 py-3.5 text-base font-semibold text-white hover:bg-white/10 transition"
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
            <DemoPricingPreview />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================================
   DEMO PRICING PREVIEW CARD
============================================ */
function DemoPricingPreview() {
  return (
    <div className="relative">
      {/* Glow effect */}
      <div className="absolute -inset-4 bg-[#F6C94B]/20 rounded-3xl blur-2xl" />
      
      <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header badge */}
        <div className="bg-[#0A2540] px-6 py-3 flex items-center justify-between">
          <span className="text-white font-semibold text-sm">Demo Preview</span>
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-[#C1121F]" />
            <div className="h-2 w-2 rounded-full bg-[#F6C94B]" />
            <div className="h-2 w-2 rounded-full bg-green-400" />
          </div>
        </div>

        <div className="p-6">
          <h3 className="text-xl font-bold text-[#0A2540] mb-5">Clear Pricing Preview</h3>

          {/* Pricing rows */}
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-slate-100">
              <span className="text-slate-600 font-medium">Estimated FX Rate</span>
              <span className="text-[#0A2540] font-bold">₱58.25 / $1</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-slate-100">
              <span className="text-slate-600 font-medium">Fees</span>
              <span className="text-[#0A2540] font-bold">Shown in demo</span>
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="text-slate-600 font-medium">Availability</span>
              <span className="text-[#0A2540] font-bold">Varies by partner</span>
            </div>
          </div>

          {/* Disclaimer */}
          <p className="mt-5 text-xs text-slate-500 text-center leading-relaxed">
            Demo estimates are illustrative only. Actual rates, fees, and availability will vary and are subject to partner pricing.
          </p>

          {/* CTA */}
          <Link
            to="/login"
            className="mt-5 block w-full rounded-xl bg-[#0A2540] px-4 py-3.5 text-center text-sm font-bold text-white hover:bg-[#061C33] transition shadow-lg"
          >
            Try the Demo
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ============================================
   REAL-TIME FX RATE BAR
============================================ */
function FXRateBar() {
  const [lastUpdated, setLastUpdated] = useState(25);
  const [rate, setRate] = useState(58.25);

  // Simulate rate refresh
  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdated(prev => {
        if (prev >= 60) {
          // Simulate slight rate fluctuation
          setRate(58.20 + Math.random() * 0.15);
          return 0;
        }
        return prev + 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="bg-white border-y border-slate-200 py-4">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8">
          {/* Flag + Rate */}
          <div className="flex items-center gap-3">
            {/* PH Flag */}
            <div className="flex items-center gap-1">
              <div className="w-6 h-4 rounded-sm overflow-hidden shadow-sm flex flex-col">
                <div className="h-1/2 bg-blue-600" />
                <div className="h-1/2 bg-red-600" />
              </div>
            </div>
            <span className="text-lg font-bold text-[#0A2540]">USD → PHP Indicative Rate</span>
          </div>

          {/* Rate Value */}
          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold text-[#0A2540]">₱{rate.toFixed(2)}</span>
            <span className="px-2 py-1 rounded-full bg-[#F6C94B]/20 text-[#8B6914] text-xs font-semibold">
              Refresh
            </span>
          </div>

          {/* Updated timestamp */}
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span>Updated {lastUpdated} seconds ago</span>
            <svg className="w-4 h-4 animate-spin text-slate-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
            </svg>
          </div>
        </div>

        <p className="mt-2 text-center text-xs text-slate-500">
          Rates shown are indicative only and subject to partner pricing.
        </p>
      </div>
    </section>
  );
}

/* ============================================
   TIERED PRICING SECTION
============================================ */
function PricingSection() {
  const tiers = [
    {
      name: "Starter",
      range: "$1 – $250",
      fee: "$1.99",
      description: "Ideal for small sends",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      highlight: false,
    },
    {
      name: "Family",
      range: "$251 – $1,000",
      fee: "$2.99",
      description: "Most popular",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      highlight: false,
    },
    {
      name: "OFW Plus",
      range: "$1,001 – $3,000",
      fee: "$4.99",
      description: "Best value",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      highlight: false,
    },
    {
      name: "Bayani Max",
      range: "$3,001+",
      fee: "$7.99",
      description: "Capped pricing",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
        </svg>
      ),
      highlight: true,
    },
  ];

  return (
    <section id="pricing" className="py-20 bg-[#FAFAF7]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <span className="inline-block px-4 py-1.5 rounded-full bg-[#F6C94B]/20 text-[#8B6914] text-sm font-semibold mb-4">
            Demo Pricing
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-[#0A2540] tracking-tight">
            Fair pricing that rewards sending more
          </h2>
          <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
            PBX uses tiered pricing with capped fees — designed for overseas Filipinos who support family regularly.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`relative rounded-2xl p-6 transition-all duration-300 hover:shadow-xl ${
                tier.highlight
                  ? "bg-[#0A2540] text-white ring-4 ring-[#F6C94B] shadow-2xl scale-105"
                  : "bg-white border border-slate-200 shadow-lg hover:border-[#F6C94B]"
              }`}
            >
              {tier.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-[#F6C94B] text-[#0A2540] text-xs font-bold shadow-lg">
                  BEST VALUE
                </div>
              )}

              {/* Icon */}
              <div className={`mb-4 ${tier.highlight ? "text-[#F6C94B]" : "text-[#F6C94B]"}`}>
                {tier.icon}
              </div>

              {/* Name */}
              <h3 className={`text-xl font-bold mb-1 ${tier.highlight ? "text-white" : "text-[#0A2540]"}`}>
                {tier.name}
              </h3>

              {/* Range */}
              <p className={`text-sm mb-4 ${tier.highlight ? "text-slate-300" : "text-slate-500"}`}>
                {tier.range}
              </p>

              {/* Fee */}
              <div className={`text-3xl font-bold mb-1 ${tier.highlight ? "text-[#F6C94B]" : "text-[#0A2540]"}`}>
                {tier.fee}
                <span className="text-sm font-normal ml-1">fee</span>
              </div>

              {/* Description */}
              <p className={`text-sm ${tier.highlight ? "text-slate-300" : "text-slate-500"}`}>
                {tier.description}
              </p>
            </div>
          ))}
        </div>

        {/* Disclaimer */}
        <p className="mt-8 text-center text-sm text-slate-500">
          Demo pricing shown for illustration only. Actual fees, rates, and availability will vary and are subject to partner pricing.
        </p>

        {/* CTA */}
        <div className="mt-8 text-center">
          <Link
            to="/login"
            className="inline-block rounded-xl bg-[#F6C94B] px-8 py-4 text-base font-bold text-[#0A2540] shadow-xl hover:bg-[#D4A534] transition transform hover:scale-105"
          >
            Try the Demo
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ============================================
   WHY PBX SECTION
============================================ */
function WhyPBXSection() {
  const values = [
    {
      title: "Built for Trust",
      description: "Platform-first design using regulated financial infrastructure",
      icon: (
        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
    },
    {
      title: "Know the Cost Before You Send",
      description: "Clear estimates before committing — no surprises",
      icon: (
        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      title: "Filipino-First",
      description: "Designed for OFWs and families back home",
      icon: (
        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      ),
    },
  ];

  return (
    <section id="security" className="py-20 bg-[#0A2540]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
            Why PBX is Different
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {values.map((value) => (
            <div
              key={value.title}
              className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 hover:border-[#F6C94B]/50 transition-all duration-300 hover:bg-white/10"
            >
              <div className="text-[#F6C94B] mb-5">
                {value.icon}
              </div>
              <h3 className="text-xl font-bold text-white mb-3">{value.title}</h3>
              <p className="text-slate-300 leading-relaxed">{value.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================
   FILIPINO STORY / EMOTIONAL SECTION
============================================ */
function StorySection() {
  return (
    <section className="relative py-24 overflow-hidden">
      {/* Background with warm gradient */}
      <div 
        className="absolute inset-0 -z-10"
        style={{
          background: `linear-gradient(180deg, #FAFAF7 0%, #F6C94B 50%, #D4A534 100%)`,
        }}
      />

      {/* Background image overlay */}
      <div 
        className="absolute inset-0 -z-10 opacity-20"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1526731955462-f6085f39e742?w=1920&q=80')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left: Imagery placeholder / decorative */}
          <div className="relative">
            <div className="rounded-2xl overflow-hidden shadow-2xl">
              <img
                src="https://images.unsplash.com/photo-1507675841101-8c757cb4cc6d?w=600&q=80"
                alt="Filipino mother and child"
                className="w-full h-80 object-cover"
              />
            </div>
            {/* Decorative badge */}
            <div className="absolute -bottom-4 -right-4 bg-white rounded-xl p-4 shadow-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#F6C94B] flex items-center justify-center">
                  <svg className="w-5 h-5 text-[#0A2540]" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-bold text-[#0A2540]">Peace of mind</p>
                  <p className="text-xs text-slate-500">For families back home</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Story content */}
          <div>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#0A2540] tracking-tight leading-tight">
              For our <span className="text-[#C1121F]">kababayan</span>,<br />
              built for home.
            </h2>
            <p className="mt-6 text-lg text-[#0A2540]/80 leading-relaxed">
              Sending money isn't just a transaction.<br />
              <span className="font-semibold">It's groceries, tuition, medicine, and peace of mind.</span>
            </p>
            <p className="mt-4 text-lg text-[#0A2540]/70 leading-relaxed">
              PBX was built with one purpose: to help overseas Filipinos support their families with clarity, security, and dignity.
            </p>

            <div className="mt-8">
              <Link
                to="/login"
                className="inline-block rounded-xl bg-[#0A2540] px-8 py-4 text-base font-bold text-white shadow-xl hover:bg-[#061C33] transition transform hover:scale-105"
              >
                Try the Demo
              </Link>
            </div>
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
    <footer className="bg-[#0A2540] border-t border-slate-800 py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Main footer content */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-gradient-to-br from-[#F6C94B] to-[#D4A534] shadow-md">
              <svg className="w-5 h-5 text-[#0A2540]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" strokeWidth="2" stroke="currentColor" fill="none"/>
              </svg>
            </div>
            <div>
              <span className="text-xl font-bold text-white">PBX</span>
              <span className="ml-2 text-sm text-slate-400">Philippine Bayani Exchange</span>
            </div>
          </div>

          {/* CTA */}
          <Link
            to="/login"
            className="rounded-xl border-2 border-[#F6C94B] px-6 py-2.5 text-sm font-bold text-[#F6C94B] hover:bg-[#F6C94B] hover:text-[#0A2540] transition"
          >
            Try the Demo
          </Link>
        </div>

        {/* Legal links */}
        <div className="flex flex-wrap items-center justify-center gap-4 text-sm mb-6">
          <Link to="/privacy" className="text-slate-400 hover:text-[#F6C94B] transition">Privacy Policy</Link>
          <span className="text-slate-700">•</span>
          <Link to="/terms" className="text-slate-400 hover:text-[#F6C94B] transition">Terms of Service</Link>
          <span className="text-slate-700">•</span>
          <Link to="/data-retention" className="text-slate-400 hover:text-[#F6C94B] transition">Data Retention</Link>
          <span className="text-slate-700">•</span>
          <Link to="/security" className="text-slate-400 hover:text-[#F6C94B] transition">Security</Link>
        </div>

        {/* Compliance text */}
        <div className="text-center">
          <p className="text-xs text-slate-500 max-w-3xl mx-auto leading-relaxed">
            © {new Date().getFullYear()} PBX. Demo experience using sandbox data; no real funds move. 
            PBX is a financial technology platform and does not provide banking or money transmission services directly. 
            Services may be provided by licensed financial partners where required. 
            Availability, limits, and timing vary by destination and payout partner. 
            Demo estimates shown. Actual rates, fees, and availability will vary and are subject to partner pricing.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Landing;
