import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import { LiveFXTicker } from "../components/LiveFXRate";

import heroBg from "../assets/landing/hero-bg.png";

export default function Landing() {
  const [showAuthMenu, setShowAuthMenu] = useState(false);
  
  return (
    <div className="min-h-screen bg-neutral-950 text-gray-100">
      {/* HERO */}
      <section
        className="relative overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.7), rgba(0,0,0,0.9)), url(${heroBg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {/* NAV */}
        <nav className="relative z-10 mx-auto max-w-7xl px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
                <span className="font-extrabold text-sm text-amber-400">PBX</span>
              </div>
              <div className="text-amber-400 font-extrabold text-xl tracking-wide">
                PBX
              </div>
            </div>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-6 text-sm text-gray-300">
              <Link to="/pricing" className="hover:text-amber-400 transition">
                Pricing
              </Link>
              <Link to="/how-it-works" className="hover:text-amber-400 transition">
                How It Works
              </Link>
              <Link to="/business" className="hover:text-amber-400 transition">
                Business
              </Link>
              
              {/* Auth Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowAuthMenu(!showAuthMenu)}
                  className="hover:text-amber-400 transition flex items-center gap-1"
                  data-testid="nav-login-btn"
                >
                  Log in
                  <svg className={`w-4 h-4 transition ${showAuthMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {showAuthMenu && (
                  <div className="absolute top-full right-0 mt-2 w-48 bg-neutral-900 border border-neutral-700 rounded-xl shadow-xl overflow-hidden z-50">
                    <Link
                      to="/login"
                      className="block px-4 py-3 text-sm text-gray-200 hover:bg-neutral-800 hover:text-amber-400 transition"
                      onClick={() => setShowAuthMenu(false)}
                      data-testid="nav-login-dropdown"
                    >
                      Log in
                    </Link>
                    <Link
                      to="/register"
                      className="block px-4 py-3 text-sm text-gray-200 hover:bg-neutral-800 hover:text-amber-400 transition border-t border-neutral-700"
                      onClick={() => setShowAuthMenu(false)}
                      data-testid="nav-create-account-dropdown"
                    >
                      Create account
                    </Link>
                  </div>
                )}
              </div>
              
              <Link
                to="/register"
                className="rounded-xl bg-red-600 hover:bg-red-700 px-5 py-2.5 font-bold text-white shadow transition"
                data-testid="nav-get-started"
              >
                Get Started
              </Link>
            </div>
            
            {/* Mobile Nav */}
            <div className="flex md:hidden items-center gap-3">
              <Link
                to="/login"
                className="text-sm text-gray-300 hover:text-amber-400 transition"
                data-testid="mobile-login-btn"
              >
                Log in
              </Link>
              <Link
                to="/register"
                className="rounded-xl bg-red-600 hover:bg-red-700 px-4 py-2 font-bold text-white text-sm shadow transition"
                data-testid="mobile-get-started"
              >
                Get Started
              </Link>
            </div>
          </div>
        </nav>

        {/* Click outside to close dropdown */}
        {showAuthMenu && (
          <div 
            className="fixed inset-0 z-0" 
            onClick={() => setShowAuthMenu(false)}
          />
        )}

        {/* HERO BODY */}
        <div className="relative z-10 mx-auto max-w-5xl px-6 pb-20 pt-12 text-center">
          {/* Live FX Ticker - Above the fold */}
          <div className="flex justify-center mb-8">
            <LiveFXTicker variant="dark" />
          </div>

          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl leading-tight tracking-tight text-amber-400 mb-6">
            Philippine Bayani Exchange
          </h1>
          <p className="text-xl md:text-2xl text-gray-200 mb-4 max-w-3xl mx-auto">
            The all-in-one platform to <span className="text-amber-400 font-semibold">send, save, and earn</span> — for Filipinos at home and abroad.
          </p>
          
          {/* PBX-to-PBX Highlight */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/20 border border-green-500/40 mb-4">
            <span className="text-green-400">⚡</span>
            <span className="text-sm font-semibold text-green-300">Send to PBX users instantly — free, no fees</span>
          </div>
          
          <p className="text-sm text-gray-400 mb-8">
            Built in the United States • No fees • Instant delivery to GCash & Maya
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="inline-flex justify-center rounded-2xl bg-red-600 hover:bg-red-700 px-8 py-4 font-bold text-white shadow-lg transition"
              data-testid="hero-get-started"
            >
              Get Started Free
            </Link>
            <Link
              to="/how-it-works"
              className="inline-flex justify-center rounded-2xl bg-neutral-800 border border-neutral-700 px-8 py-4 font-bold text-gray-100 hover:bg-neutral-700 transition"
            >
              How PBX Works →
            </Link>
          </div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section className="py-16 px-6 bg-neutral-950">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-amber-400 text-center mb-4">Why Choose PBX?</h2>
          <p className="text-gray-400 text-center mb-12 max-w-2xl mx-auto">
            Experience the future of cross-border payments with features designed for your needs.
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            {/* PBX-to-PBX Transfers - New Primary Feature */}
            <div className="bg-gradient-to-br from-green-900/40 to-green-900/20 p-6 rounded-2xl border border-green-500/40 hover:border-green-500 transition">
              <div className="text-4xl mb-4">⚡</div>
              <h3 className="text-xl font-semibold text-green-400 mb-2">PBX-to-PBX Transfers</h3>
              <p className="text-gray-400 text-sm">
                Send USD instantly to other PBX users — <span className="text-green-400 font-semibold">100% free</span>. Recipients can hold USD or convert to PHP anytime.
              </p>
              <p className="text-xs text-green-400 mt-3">Instant • Free • All plans</p>
            </div>

            {/* Recurring Transfers */}
            <div className="bg-neutral-900 p-6 rounded-2xl border border-neutral-800 hover:border-amber-500/50 transition">
              <div className="text-4xl mb-4">🔄</div>
              <h3 className="text-xl font-semibold text-gray-100 mb-2">Recurring Transfers</h3>
              <p className="text-gray-400 text-sm">
                Schedule automatic transfers to loved ones or suppliers with ease. Set up weekly or monthly payments and never miss a date.
              </p>
              <p className="text-xs text-amber-400 mt-3">Premium, SME, Enterprise</p>
            </div>

            {/* Locked-in FX Rates */}
            <div className="bg-neutral-900 p-6 rounded-2xl border border-neutral-800 hover:border-amber-500/50 transition">
              <div className="text-4xl mb-4">⏱️</div>
              <h3 className="text-xl font-semibold text-gray-100 mb-2">15-Min FX Rate Lock</h3>
              <p className="text-gray-400 text-sm">
                No more surprises — enjoy guaranteed exchange rates for 15 minutes when you get a quote. Lock in a great rate and send funds with confidence.
              </p>
              <p className="text-xs text-amber-400 mt-3">All plans</p>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING PREVIEW */}
      <section className="py-16 px-6 bg-neutral-900">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/20 mb-6">
            <span className="text-sm font-semibold text-amber-400">Subscription Plans (USD)</span>
          </div>

          <h2 className="text-3xl md:text-4xl font-bold text-gray-100 mb-4">
            Choose Your Plan
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto mb-10">
            From individuals to enterprises — better rates and more features with every tier.
          </p>

          {/* 4-Tier Grid - USD Pricing */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
            <PlanCard 
              name="Basic"
              price="Free"
              features={["PBX Wallet", "15-min FX Lock"]}
              ctaLink="/register"
            />
            <PlanCard 
              name="Premium"
              price="$10/mo"
              features={["Better FX Rates", "Recurring Transfers", "Priority Support"]}
              highlight
              ctaLink="/register"
            />
            <PlanCard 
              name="SME"
              price="$50/mo"
              features={["$100k/mo limit", "Recurring Transfers", "Priority Support"]}
              ctaLink="/register"
            />
            <PlanCard 
              name="Enterprise"
              price="Custom"
              features={["Unlimited volume", "Dedicated Manager", "Custom rates"]}
              ctaLink="/register"
            />
          </div>

          <Link
            to="/pricing"
            className="inline-flex justify-center rounded-2xl bg-red-600 hover:bg-red-700 px-10 py-4 font-bold text-white shadow transition"
            data-testid="compare-plans-btn"
          >
            Compare All Plans
          </Link>
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="py-16 px-6 bg-neutral-950">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-amber-400 mb-4">
            Ready to experience the new era of remittances?
          </h2>
          <p className="text-gray-300 mb-8">
            Join PBX today and take control of your international transfers with speed, savings, and security.
          </p>
          <Link
            to="/register"
            className="inline-flex justify-center rounded-2xl bg-red-600 hover:bg-red-700 px-8 py-4 font-bold text-white shadow-lg transition"
          >
            Sign Up Now
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-neutral-900 py-10 border-t border-neutral-800">
        <div className="mx-auto max-w-7xl px-6 text-center text-xs text-gray-500">
          <div className="flex justify-center items-center gap-3 mb-4">
            <div className="h-9 w-9 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
              <span className="font-extrabold text-xs text-amber-400">PBX</span>
            </div>
            <div className="font-semibold text-gray-300">PBX • Built in the United States</div>
          </div>
          <div className="flex flex-wrap justify-center gap-4 mb-4">
            <Link to="/privacy" className="hover:text-amber-400 transition">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-amber-400 transition">Terms of Service</Link>
            <Link to="/security" className="hover:text-amber-400 transition">Security</Link>
          </div>
          <p className="max-w-2xl mx-auto">
            PBX is a financial technology platform and does not provide banking or money transmission services directly. 
            Services may be provided by licensed financial partners where required. 
            Demo estimates shown; actual rates, fees, and availability vary.
          </p>
          <p className="mt-4">© {new Date().getFullYear()} Philippine Bayani Exchange (PBX). All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

function PlanCard({ name, price, features, highlight, ctaLink }) {
  return (
    <div
      className={`rounded-2xl p-6 text-center transition ${
        highlight 
          ? "bg-amber-500/10 border-2 border-amber-500 shadow-lg shadow-amber-500/20" 
          : "bg-neutral-800 border border-neutral-700"
      }`}
    >
      {highlight && (
        <div className="text-xs font-bold text-amber-400 mb-2">POPULAR</div>
      )}
      <div className={`text-lg font-bold mb-2 ${highlight ? "text-amber-400" : "text-gray-100"}`}>
        {name}
      </div>
      <div className={`text-2xl font-extrabold mb-3 ${highlight ? "text-gray-100" : "text-gray-100"}`}>
        {price}
      </div>
      <ul className="text-sm text-gray-400 space-y-1 mb-4">
        {features.map((f, i) => (
          <li key={i}>{f}</li>
        ))}
      </ul>
      <Link
        to={ctaLink}
        className={`block w-full rounded-xl py-2.5 text-sm font-semibold transition ${
          highlight
            ? "bg-red-600 hover:bg-red-700 text-white"
            : "bg-neutral-700 hover:bg-neutral-600 text-gray-100"
        }`}
      >
        Get Started
      </Link>
    </div>
  );
}

export { Landing };
