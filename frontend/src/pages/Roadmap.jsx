import React from "react";
import { Link } from "react-router-dom";

// Theme colors
const theme = {
  navy: '#0A2540',
  navyDark: '#061C33',
  gold: '#F6C94B',
  goldDark: '#D4A520',
  offWhite: '#FAFAF7',
};

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
      "SME and Enterprise plans launch",
      "API access for business integrations",
      "Multi-currency wallet support",
      "Enhanced KYC/AML compliance",
    ],
  },
  {
    quarter: "Q3 2025",
    status: "planned",
    items: [
      "Mobile app (iOS & Android)",
      "Recurring transfers",
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
      "Yield on idle balances",
    ],
  },
];

const statusColors = {
  completed: { bg: '#10b981', text: 'white' },
  'in-progress': { bg: theme.gold, text: theme.navyDark },
  planned: { bg: '#e2e8f0', text: '#64748b' },
};

export default function Roadmap() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: theme.offWhite }}>
      {/* Header */}
      <nav className="bg-white border-b border-slate-200">
        <div className="mx-auto max-w-7xl px-6 py-4 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-2xl flex items-center justify-center" style={{ backgroundColor: `${theme.gold}20`, border: `1px solid ${theme.gold}40` }}>
              <span className="font-extrabold text-sm" style={{ color: theme.navy }}>PBX</span>
            </div>
            <span className="font-bold text-lg" style={{ color: theme.navy }}>PBX</span>
          </Link>
          <div className="hidden md:flex items-center gap-6 text-sm">
            <Link to="/pricing" className="hover:text-[#F6C94B] transition" style={{ color: theme.navy }}>Pricing</Link>
            <Link to="/how-it-works" className="hover:text-[#F6C94B] transition" style={{ color: theme.navy }}>How It Works</Link>
            <Link to="/login" className="rounded-xl px-5 py-2 font-semibold transition" style={{ backgroundColor: theme.gold, color: theme.navyDark }}>Login</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="py-16 px-6 text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-4" style={{ color: theme.navy, fontFamily: 'Georgia, serif' }}>
          Product Roadmap
        </h1>
        <p className="text-lg max-w-2xl mx-auto" style={{ color: '#64748b' }}>
          See what we’re building and what’s coming next for PBX.
        </p>
      </section>

      {/* Roadmap Timeline */}
      <section className="py-12 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="space-y-8">
            {roadmapItems.map((item, index) => (
              <div key={item.quarter} className="flex gap-6">
                <div className="flex-shrink-0 w-24">
                  <div className="font-bold text-sm" style={{ color: theme.navy }}>{item.quarter}</div>
                  <span
                    className="inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium"
                    style={{ backgroundColor: statusColors[item.status].bg, color: statusColors[item.status].text }}
                  >
                    {item.status === 'completed' ? 'Done' : item.status === 'in-progress' ? 'In Progress' : 'Planned'}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                    <ul className="space-y-2">
                      {item.items.map((feature, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm" style={{ color: '#64748b' }}>
                          <span style={{ color: statusColors[item.status].bg === '#10b981' ? '#10b981' : theme.gold }}>•</span>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                  {index < roadmapItems.length - 1 && (
                    <div className="ml-4 mt-4 h-8 w-px" style={{ backgroundColor: '#e2e8f0' }} />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6">
        <div className="max-w-xl mx-auto text-center bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
          <h2 className="text-2xl font-bold mb-4" style={{ color: theme.navy }}>Have Feature Requests?</h2>
          <p className="mb-6" style={{ color: '#64748b' }}>
            We’re always listening to our users. Let us know what features would help you most.
          </p>
          <a
            href="mailto:feedback@pbx.com"
            className="inline-block rounded-xl px-8 py-4 font-semibold transition"
            style={{ backgroundColor: theme.gold, color: theme.navyDark }}
          >
            Share Feedback
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8" style={{ backgroundColor: theme.navyDark }}>
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
            © {new Date().getFullYear()} PBX. Built in the United States. Roadmap features are subject to change.
          </p>
        </div>
      </footer>
    </div>
  );
}
