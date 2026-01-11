import React from "react";
import { Link } from "react-router-dom";

const roadmapItems = [
  {
    quarter: "Q1 2025",
    status: "completed",
    items: [
      "Core transfer functionality (USD → PHP)",
      "Basic and Premium subscription plans",
      "Bank and e-wallet payouts to Philippines",
      "Real-time FX rate display",
    ],
  },
  {
    quarter: "Q2 2025",
    status: "in-progress",
    items: [
      "15-minute FX Rate Lock feature",
      "PBX Wallet with stored funds",
      "1% APY interest for Premium users",
      "SME and Enterprise plans launch",
    ],
  },
  {
    quarter: "Q3 2025",
    status: "planned",
    items: [
      "Recurring Transfers (weekly/monthly)",
      "Mobile app (iOS & Android)",
      "PHP → USD transfers (reverse corridor)",
      "Business batch payouts",
    ],
  },
  {
    quarter: "Q4 2025",
    status: "planned",
    items: [
      "PBX debit card (USD & PHP)",
      "Virtual card numbers",
      "Additional corridors (EU, UK)",
      "Enhanced yield options",
    ],
  },
];

const statusConfig = {
  completed: { bg: "bg-green-500", text: "text-green-400", label: "Done" },
  'in-progress': { bg: "bg-amber-500", text: "text-amber-400", label: "In Progress" },
  planned: { bg: "bg-neutral-600", text: "text-gray-400", label: "Planned" },
};

export default function Roadmap() {
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
      <section className="py-16 px-6 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-amber-400 mb-4" style={{ fontFamily: 'Georgia, serif' }}>
          Product Roadmap
        </h1>
        <p className="text-lg text-gray-300 max-w-2xl mx-auto">
          See what we're building and what's coming next for PBX — including recurring transfers, wallet interest, and more.
        </p>
      </section>

      {/* Roadmap Timeline */}
      <section className="py-12 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="space-y-8">
            {roadmapItems.map((item, index) => {
              const config = statusConfig[item.status];
              return (
                <div key={item.quarter} className="flex gap-6">
                  <div className="flex-shrink-0 w-24">
                    <div className="font-bold text-sm text-amber-400">{item.quarter}</div>
                    <span
                      className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${config.bg} text-neutral-900`}
                    >
                      {config.label}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="bg-neutral-900 rounded-2xl p-6 border border-neutral-800">
                      <ul className="space-y-2">
                        {item.items.map((feature, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                            <span className={config.text}>•</span>
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                    {index < roadmapItems.length - 1 && (
                      <div className="ml-4 mt-4 h-8 w-px bg-neutral-700" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* New Features Highlight */}
      <section className="py-12 px-6 bg-neutral-900">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-amber-400 mb-8">Coming Soon Highlights</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-neutral-800 rounded-2xl p-6 border border-neutral-700">
              <div className="text-3xl mb-3">🔄</div>
              <h3 className="font-semibold text-gray-100 mb-2">Recurring Transfers</h3>
              <p className="text-sm text-gray-400">Schedule automatic weekly or monthly payments.</p>
            </div>
            <div className="bg-neutral-800 rounded-2xl p-6 border border-neutral-700">
              <div className="text-3xl mb-3">💰</div>
              <h3 className="font-semibold text-gray-100 mb-2">1% APY Interest</h3>
              <p className="text-sm text-gray-400">Premium users earn interest on wallet balances.</p>
            </div>
            <div className="bg-neutral-800 rounded-2xl p-6 border border-neutral-700">
              <div className="text-3xl mb-3">💳</div>
              <h3 className="font-semibold text-gray-100 mb-2">PBX Debit Card</h3>
              <p className="text-sm text-gray-400">Spend your PBX balance anywhere with a physical or virtual card.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6">
        <div className="max-w-xl mx-auto text-center bg-neutral-900 rounded-2xl p-8 border border-neutral-800">
          <h2 className="text-2xl font-bold text-gray-100 mb-4">Have Feature Requests?</h2>
          <p className="text-gray-400 mb-6">
            We're always listening to our users. Let us know what features would help you most.
          </p>
          <a
            href="mailto:feedback@pbx.com"
            className="inline-block rounded-xl px-8 py-4 font-semibold bg-red-600 hover:bg-red-700 text-white transition"
          >
            Share Feedback
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-neutral-800">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-xs text-gray-500">
            © {new Date().getFullYear()} Philippine Bayani Exchange (PBX). Built in the United States. Roadmap features are subject to change.
          </p>
        </div>
      </footer>
    </div>
  );
}
