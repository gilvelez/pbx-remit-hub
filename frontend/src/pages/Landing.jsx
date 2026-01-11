import React from "react";

import heroBg from "../assets/landing/hero-bg.png";
import sectionBg from "../assets/landing/section-bg.png";
import storyBg from "../assets/landing/story-bg.png";

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#0b1220]">
      {/* HERO */}
      <section
        className="relative overflow-hidden"
        style={{
          backgroundImage: `url(${heroBg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {/* dark overlay for readability */}
        <div className="absolute inset-0 bg-black/30" />

        {/* NAV */}
        <nav className="relative z-10 mx-auto max-w-7xl px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-[#f6c94b]/20 border border-[#f6c94b]/40" />
              <div className="text-white font-extrabold text-xl tracking-wide">
                PBX
              </div>
            </div>

            <div className="hidden md:flex items-center gap-8 text-sm text-white/85">
              <a href="/pricing" className="hover:text-white transition">
                Pricing
              </a>
              <a href="/how-it-works" className="hover:text-white transition">
                How It Works
              </a>
              <a href="/business" className="hover:text-white transition">
                Business
              </a>
              <a
                href="/onboarding/personal"
                className="rounded-xl bg-[#f6c94b] px-5 py-2.5 font-extrabold text-[#1b1b1b] shadow hover:brightness-105 transition"
              >
                Get Started
              </a>
            </div>
          </div>
        </nav>

        {/* HERO BODY */}
        <div className="relative z-10 mx-auto max-w-7xl px-6 pb-20 pt-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* LEFT */}
            <div className="text-white">
              <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl leading-[1.08] tracking-tight">
                Move Money Seamlessly
                <br />
                Between the U.S.
                <br />
                <span className="italic text-white/90">and the Philippines</span>
              </h1>

              <p className="mt-6 max-w-xl text-lg text-white/80 leading-relaxed">
                A U.S.-built, secure platform for expats, travelers, families, 
                retirees, and businesses moving money across borders—clearly, 
                quickly, and transparently.
              </p>

              {/* Trust line */}
              <p className="mt-4 text-sm text-white/60">
                Built in the United States • Designed for cross-border living • Secure financial infrastructure
              </p>

              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <a
                  href="/onboarding/personal"
                  className="inline-flex justify-center rounded-2xl bg-[#f6c94b] px-8 py-4 font-extrabold text-[#1b1b1b] shadow-lg hover:brightness-105 transition"
                >
                  Get Started Free
                </a>
                <a
                  href="/how-it-works"
                  className="inline-flex justify-center rounded-2xl bg-white/10 border border-white/25 px-8 py-4 font-bold text-white hover:bg-white/15 transition"
                >
                  How PBX Works →
                </a>
              </div>
            </div>

            {/* RIGHT CARD - FX Preview */}
            <div className="flex justify-center lg:justify-end">
              <div className="w-full max-w-md rounded-[28px] bg-white/90 backdrop-blur border border-white/30 shadow-2xl p-6">
                <div className="text-sm text-slate-600 font-semibold">
                  FX Rate Preview
                </div>

                <div className="mt-3 rounded-2xl bg-white border border-slate-200 shadow-sm p-5">
                  <h3 className="text-xl font-extrabold text-slate-900">
                    Better Rates, Better Value
                  </h3>

                  <div className="mt-4 divide-y divide-slate-200 text-sm">
                    <div className="flex justify-between py-3">
                      <span>Basic Plan Rate</span>
                      <span className="font-extrabold">₱54.20 / $1</span>
                    </div>
                    <div className="flex justify-between py-3">
                      <span>Premium Plan Rate</span>
                      <span className="font-extrabold text-[#0A2540]">₱54.60 / $1</span>
                    </div>
                    <div className="flex justify-between py-3">
                      <span>Enterprise Rate</span>
                      <span className="font-extrabold text-[#f6c94b]">₱54.85 / $1</span>
                    </div>
                  </div>
                </div>

                <p className="mt-4 text-xs text-slate-600 leading-relaxed">
                  Higher tiers unlock better FX rates. Rates shown are illustrative 
                  and may vary in production.
                </p>

                <a
                  href="/pricing"
                  className="mt-4 inline-flex w-full justify-center rounded-2xl bg-[#f6c94b] px-6 py-3.5 font-extrabold text-[#1b1b1b] shadow hover:brightness-105 transition"
                >
                  Compare All Plans
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* soft divider */}
        <div className="h-12 bg-gradient-to-b from-transparent to-[#f7f1e6]" />
      </section>

      {/* FX BAR */}
      <section
        className="py-8"
        style={{
          backgroundImage: `url(${sectionBg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="mx-auto max-w-7xl px-6 text-center">
          <div className="inline-flex flex-col items-center gap-1">
            <div className="font-extrabold text-slate-800">
              USD → PHP Indicative Rate
              <span className="ml-2 text-xs bg-[#f6c94b]/70 px-2 py-0.5 rounded">
                Real-time
              </span>
            </div>
            <div className="text-sm text-slate-600">
              Updated moments ago
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS / WHY PBX IS DIFFERENT */}
      <section
        id="how-it-works"
        className="py-16 bg-[#0A2540]"
      >
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center mb-12">
            <h2 className="font-serif text-4xl md:text-5xl text-white">
              Why PBX is Different
            </h2>
            <p className="mt-4 max-w-2xl mx-auto text-white/70">
              U.S.-built platform designed for cross-border users with transparency at every step.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Card 1 */}
            <div className="rounded-2xl bg-white/5 backdrop-blur border border-white/10 p-8 hover:bg-white/10 transition">
              <div className="w-12 h-12 rounded-xl bg-[#f6c94b]/20 flex items-center justify-center mb-5">
                <svg className="w-6 h-6 text-[#f6c94b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl font-extrabold text-white mb-3">Built for Trust</h3>
              <p className="text-white/70 leading-relaxed">
                U.S.-based financial infrastructure designed to meet high regulatory and security standards.
              </p>
            </div>

            {/* Card 2 */}
            <div className="rounded-2xl bg-white/5 backdrop-blur border border-white/10 p-8 hover:bg-white/10 transition">
              <div className="w-12 h-12 rounded-xl bg-[#f6c94b]/20 flex items-center justify-center mb-5">
                <svg className="w-6 h-6 text-[#f6c94b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-extrabold text-white mb-3">Know the Cost Before You Send</h3>
              <p className="text-white/70 leading-relaxed">
                Upfront FX rates and fees so users always know exactly what will arrive.
              </p>
            </div>

            {/* Card 3 */}
            <div className="rounded-2xl bg-white/5 backdrop-blur border border-white/10 p-8 hover:bg-white/10 transition">
              <div className="w-12 h-12 rounded-xl bg-[#f6c94b]/20 flex items-center justify-center mb-5">
                <svg className="w-6 h-6 text-[#f6c94b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-extrabold text-white mb-3">Built for Life Between Countries</h3>
              <p className="text-white/70 leading-relaxed">
                Designed for expats, travelers, families, retirees, and businesses moving money between the U.S. and the Philippines.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section
        id="pricing"
        className="py-16"
        style={{
          backgroundImage: `url(${sectionBg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="mx-auto max-w-7xl px-6 text-center">
          {/* Section badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#f6c94b]/20 mb-6">
            <span className="text-sm font-semibold text-[#8b6914]">Subscription Plans</span>
          </div>

          <h2 className="font-serif text-4xl md:text-5xl text-slate-900">
            Choose Your Plan
          </h2>
          <p className="mt-4 max-w-3xl mx-auto text-slate-700">
            From individuals to enterprises — lower FX spreads and better rates with every tier.
          </p>

          {/* 4-Tier Subscription Grid */}
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <SubscriptionTier 
              name="Basic"
              price="Free"
              spread="~1.5%"
              fee="$2.00/transfer"
              note="Pay-per-use"
              ctaLink="/onboarding/personal"
            />
            <SubscriptionTier 
              name="Premium"
              price="$10/mo"
              spread="~0.8%"
              fee="Free transfers"
              note="Best for individuals"
              highlight
              ctaLink="/onboarding/personal"
            />
            <SubscriptionTier 
              name="SME"
              price="$50/mo"
              spread="~0.5%"
              fee="Free transfers"
              note="Up to $100k/mo"
              ctaLink="/onboarding/business"
            />
            <SubscriptionTier 
              name="Enterprise"
              price="Custom"
              spread="~0.3%"
              fee="Free transfers"
              note="Unlimited volume"
              ctaLink="/onboarding/business"
            />
          </div>

          {/* Disclaimer */}
          <p className="mt-6 text-sm text-slate-600 max-w-2xl mx-auto">
            All pricing shown is for demonstration purposes. Actual rates may vary.
          </p>

          <a
            href="/pricing"
            className="mt-8 inline-flex justify-center rounded-2xl bg-[#f6c94b] px-10 py-4 font-extrabold text-[#1b1b1b] shadow hover:brightness-105 transition"
          >
            Compare All Plans
          </a>
        </div>
      </section>

      {/* STORY */}
      <section
        className="py-24"
        style={{
          backgroundImage: `url(${storyBg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h3 className="font-serif text-4xl md:text-5xl text-slate-900">
            Built for people with lives between two countries.
          </h3>
          <p className="mt-4 text-lg text-slate-700">
            Moving money across borders isn't just a transaction. It's supporting 
            family, managing businesses, and living life seamlessly between the 
            U.S. and the Philippines.
          </p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#101827] py-10">
        <div className="mx-auto max-w-7xl px-6 text-center text-xs text-white/60">
          <div className="flex justify-center items-center gap-3 mb-4">
            <div className="h-9 w-9 rounded-2xl bg-[#f6c94b]/20 border border-[#f6c94b]/40" />
            <div className="font-extrabold text-white">PBX</div>
            <div className="text-white/50">Built in the United States</div>
          </div>
          <p>
            PBX is a financial technology platform built in the United States 
            and does not provide banking or money transmission services directly. 
            Services may be provided by licensed financial partners where required. 
            Demo estimates shown; actual rates, fees, and availability vary and 
            are subject to partner pricing.
          </p>
        </div>
      </footer>
    </div>
  );
}

function SubscriptionTier({ name, price, spread, fee, note, highlight, ctaLink }) {
  return (
    <div
      className={`rounded-2xl p-6 text-center transition ${
        highlight 
          ? "bg-[#0A2540] text-white ring-2 ring-[#f6c94b] shadow-xl" 
          : "bg-white/90 border border-slate-200 shadow-sm"
      }`}
    >
      {/* Plan name */}
      <div className={`text-lg font-bold mb-2 ${highlight ? "text-white" : "text-slate-900"}`}>
        {name}
      </div>
      
      {/* Price */}
      <div className={`text-3xl font-extrabold mb-3 ${highlight ? "text-[#f6c94b]" : "text-slate-900"}`}>
        {price}
      </div>
      
      {/* Divider */}
      <div className={`h-px w-12 mx-auto mb-3 ${highlight ? "bg-[#f6c94b]" : "bg-slate-200"}`} />
      
      {/* FX Spread */}
      <div className={`text-sm font-medium mb-1 ${highlight ? "text-white/70" : "text-slate-500"}`}>
        FX Spread
      </div>
      <div className={`text-xl font-bold mb-2 ${highlight ? "text-[#f6c94b]" : "text-[#0A2540]"}`}>
        {spread}
      </div>
      
      {/* Transfer Fee */}
      <div className={`text-sm mb-2 ${highlight ? "text-white/80" : "text-slate-600"}`}>
        {fee}
      </div>
      
      {/* Note */}
      <div className={`text-xs mb-4 ${highlight ? "text-white/60" : "text-slate-500"}`}>
        {note}
      </div>
      
      {/* CTA */}
      <a
        href={ctaLink}
        className={`block w-full rounded-xl py-2.5 text-sm font-semibold transition ${
          highlight
            ? "bg-[#f6c94b] text-[#0A2540] hover:brightness-105"
            : "bg-[#0A2540] text-white hover:bg-[#061C33]"
        }`}
      >
        Get Started
      </a>
    </div>
  );
}

export { Landing };
