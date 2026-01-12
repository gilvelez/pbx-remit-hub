import React from "react";
import { Link } from "react-router-dom";

export default function Business() {
  return (
    <div className="min-h-screen bg-neutral-950 text-gray-100">
      {/* Header */}
      <nav className="border-b border-neutral-800">
        <div className="mx-auto max-w-7xl px-6 py-4 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-2xl flex items-center justify-center bg-amber-500/20 border border-amber-500/40">
              <span className="font-extrabold text-sm text-amber-400">PBX</span>
            </div>
            <span className="font-bold text-lg text-amber-400">PBX</span>
          </Link>
          <div className="hidden md:flex items-center gap-6 text-sm">
            <Link to="/pricing" className="text-gray-300 hover:text-amber-400 transition">Pricing</Link>
            <Link to="/how-it-works" className="text-gray-300 hover:text-amber-400 transition">How It Works</Link>
            <Link to="/login" className="rounded-xl px-5 py-2 font-semibold bg-red-600 hover:bg-red-700 text-white transition">Login</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="py-20 px-6 bg-neutral-900">
        <div className="max-w-4xl mx-auto text-center">
          <span className="inline-block px-4 py-1.5 rounded-full text-sm font-semibold bg-amber-500/20 text-amber-400 mb-6">
            For Business
          </span>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-100 mb-6" style={{ fontFamily: 'Georgia, serif' }}>
            Cross-Border Payments for Growing Businesses
          </h1>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto mb-8">
            PBX offers SMEs and enterprises a secure platform to manage international payouts with low FX spreads, recurring transfers, and flexible plans.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              to="/welcome"
              className="rounded-xl px-8 py-4 font-semibold bg-red-600 hover:bg-red-700 text-white transition"
              data-testid="business-get-started"
            >
              Get Started
            </Link>
            <Link
              to="/pricing"
              className="rounded-xl px-8 py-4 font-semibold border-2 border-neutral-700 text-gray-100 hover:bg-neutral-800 transition"
            >
              View Plans
            </Link>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-amber-400 mb-12" style={{ fontFamily: 'Georgia, serif' }}>
            Why Choose PBX for Your Business?
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-neutral-900 rounded-2xl p-8 border border-neutral-800">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-amber-500/20 mb-4">
                <svg className="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-100 mb-2">Save on FX</h3>
              <p className="text-gray-400">
                Enjoy better-than-bank exchange rates with low spreads, saving your company money on every international transfer.
              </p>
            </div>

            <div className="bg-neutral-900 rounded-2xl p-8 border border-neutral-800">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-amber-500/20 mb-4">
                <svg className="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-100 mb-2">Recurring Transfers</h3>
              <p className="text-gray-400">
                Automate your payroll and supplier payments with scheduled recurring transfers. Set it once, run it forever.
              </p>
            </div>

            <div className="bg-neutral-900 rounded-2xl p-8 border border-neutral-800">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-amber-500/20 mb-4">
                <svg className="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-100 mb-2">Scalable Solutions</h3>
              <p className="text-gray-400">
                SME plan for up to ₱5M monthly. Enterprise for unlimited volume with custom rates tailored to your needs.
              </p>
            </div>

            <div className="bg-neutral-900 rounded-2xl p-8 border border-neutral-800">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-amber-500/20 mb-4">
                <svg className="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-100 mb-2">Dedicated Support</h3>
              <p className="text-gray-400">
                Priority support for SME and a dedicated account manager for Enterprise clients to help you succeed.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="py-16 px-6 bg-neutral-900">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-amber-400 mb-8">Business Plans</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-neutral-800 rounded-2xl p-6 border border-neutral-700 text-left">
              <h3 className="text-xl font-bold text-amber-400 mb-2">SME</h3>
              <div className="text-3xl font-bold text-gray-100 mb-4">₱2,499<span className="text-base text-gray-400">/mo</span></div>
              <ul className="space-y-2 text-sm text-gray-400 mb-6">
                <li>✓ Up to ₱5,000,000/month</li>
                <li>✓ Recurring Transfers</li>
                <li>✓ 15-min FX Rate Lock</li>
                <li>✓ Priority Support</li>
              </ul>
              <Link
                to="/welcome"
                className="block text-center rounded-xl py-3 font-semibold bg-red-600 hover:bg-red-700 text-white transition"
              >
                Choose SME
              </Link>
            </div>
            <div className="bg-neutral-800 rounded-2xl p-6 border border-amber-500 text-left">
              <h3 className="text-xl font-bold text-amber-400 mb-2">Enterprise</h3>
              <div className="text-3xl font-bold text-gray-100 mb-4">Custom</div>
              <ul className="space-y-2 text-sm text-gray-400 mb-6">
                <li>✓ Unlimited volume</li>
                <li>✓ Custom FX rates</li>
                <li>✓ Recurring Transfers</li>
                <li>✓ Dedicated Account Manager</li>
              </ul>
              <Link
                to="/welcome"
                className="block text-center rounded-xl py-3 font-semibold bg-red-600 hover:bg-red-700 text-white transition"
              >
                Contact Sales
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-gray-100 mb-4">Ready to Get Started?</h2>
          <p className="text-gray-400 mb-8">
            Choose an SME plan to self-onboard, or contact us for Enterprise solutions tailored to your needs.
          </p>
          <Link
            to="/welcome"
            className="inline-block rounded-xl px-8 py-4 font-semibold bg-red-600 hover:bg-red-700 text-white transition"
          >
            Join PBX Business
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-neutral-800">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-xs text-gray-500">
            © {new Date().getFullYear()} Philippine Bayani Exchange (PBX). Built in the United States. All features and pricing shown are for demonstration purposes.
          </p>
        </div>
      </footer>
    </div>
  );
}
