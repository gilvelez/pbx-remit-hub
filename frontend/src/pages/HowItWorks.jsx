import React from "react";
import { Link } from "react-router-dom";

export default function HowItWorks() {
  const steps = [
    {
      number: "01",
      title: "Create Your Account",
      description: "Sign up with your email and verify your identity. Choose a plan that fits your needs — from free Basic to Premium with interest earnings.",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
    {
      number: "02",
      title: "Fund Your Wallet",
      description: "Add funds to your PBX Wallet. Premium users earn 1% APY on their balance while funds are held securely.",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      ),
    },
    {
      number: "03",
      title: "Lock Your FX Rate",
      description: "Get a quote and lock in the exchange rate for 15 minutes. No surprises — you know exactly what you'll pay and what your recipient will receive.",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      number: "04",
      title: "Send & Track",
      description: "Complete your transfer and track it in real-time. Set up recurring transfers to automate future payments.",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  ];

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
            <Link to="/business" className="text-gray-300 hover:text-amber-400 transition">Business</Link>
            <Link to="/login" className="rounded-xl px-5 py-2 font-semibold bg-red-600 hover:bg-red-700 text-white transition">Login</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="py-16 px-6 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-amber-400 mb-4" style={{ fontFamily: 'Georgia, serif' }}>
          How PBX Works
        </h1>
        <p className="text-lg text-gray-300 max-w-2xl mx-auto">
          Send money between the U.S. and the Philippines in four simple steps — with locked rates and optional interest earnings.
        </p>
      </section>

      {/* Steps */}
      <section className="py-12 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="space-y-8">
            {steps.map((step, index) => (
              <div key={step.number} className="flex gap-6 items-start">
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-red-600 text-white">
                    {step.icon}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-sm font-bold text-amber-400">{step.number}</span>
                    <h3 className="text-xl font-bold text-gray-100">{step.title}</h3>
                  </div>
                  <p className="text-gray-400">{step.description}</p>
                  {index < steps.length - 1 && (
                    <div className="mt-4 ml-8 h-12 w-px bg-neutral-700" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Highlight */}
      <section className="py-12 px-6 bg-neutral-900">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-amber-400 text-center mb-8">Key Features</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center p-6 rounded-2xl bg-neutral-800 border border-neutral-700">
              <div className="text-3xl mb-3">⏱️</div>
              <h3 className="font-semibold text-gray-100 mb-2">15-Min Rate Lock</h3>
              <p className="text-sm text-gray-400">Guaranteed FX rate for 15 minutes after you get a quote.</p>
            </div>
            <div className="text-center p-6 rounded-2xl bg-neutral-800 border border-neutral-700">
              <div className="text-3xl mb-3">💰</div>
              <h3 className="font-semibold text-gray-100 mb-2">Earn 1% APY</h3>
              <p className="text-sm text-gray-400">Premium users earn interest on wallet balances.</p>
            </div>
            <div className="text-center p-6 rounded-2xl bg-neutral-800 border border-neutral-700">
              <div className="text-3xl mb-3">🔄</div>
              <h3 className="font-semibold text-gray-100 mb-2">Recurring Transfers</h3>
              <p className="text-sm text-gray-400">Set up automatic weekly or monthly payments.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6">
        <div className="max-w-xl mx-auto text-center bg-neutral-900 rounded-2xl p-8 border border-neutral-800">
          <h2 className="text-2xl font-bold text-gray-100 mb-4">Ready to Start?</h2>
          <p className="text-gray-400 mb-6">
            Join thousands of users who trust PBX for their cross-border transfers.
          </p>
          <Link
            to="/welcome"
            className="inline-block rounded-xl px-8 py-4 font-semibold bg-red-600 hover:bg-red-700 text-white transition"
          >
            Get Started Now
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-neutral-800">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-xs text-gray-500">
            © {new Date().getFullYear()} Philippine Bayani Exchange (PBX). Built in the United States.
          </p>
        </div>
      </footer>
    </div>
  );
}
