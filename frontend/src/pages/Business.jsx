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

export default function Business() {
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
      <section className="py-20 px-6" style={{ backgroundColor: theme.navyDark }}>
        <div className="max-w-4xl mx-auto text-center">
          <span className="inline-block px-4 py-1.5 rounded-full text-sm font-semibold mb-6" style={{ backgroundColor: `${theme.gold}20`, color: theme.gold }}>
            For Business
          </span>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6" style={{ fontFamily: 'Georgia, serif' }}>
            Cross-Border Payments for Growing Businesses
          </h1>
          <p className="text-lg text-white/80 max-w-2xl mx-auto mb-8">
            PBX offers SMEs and enterprises a secure platform to manage international payouts with low FX spreads and flexible plans.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              to="/onboarding/business"
              className="rounded-xl px-8 py-4 font-semibold transition"
              style={{ backgroundColor: theme.gold, color: theme.navyDark }}
            >
              Get Started
            </Link>
            <Link
              to="/pricing"
              className="rounded-xl px-8 py-4 font-semibold border-2 text-white hover:bg-white/10 transition"
              style={{ borderColor: 'rgba(255,255,255,0.3)' }}
            >
              View Plans
            </Link>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12" style={{ color: theme.navy, fontFamily: 'Georgia, serif' }}>
            Why Choose PBX for Your Business?
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: `${theme.gold}20` }}>
                <svg className="w-6 h-6" style={{ color: theme.gold }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2" style={{ color: theme.navy }}>Save on FX</h3>
              <p style={{ color: '#64748b' }}>
                Enjoy better-than-bank exchange rates, saving your company money on every international transfer.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: `${theme.gold}20` }}>
                <svg className="w-6 h-6" style={{ color: theme.gold }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2" style={{ color: theme.navy }}>Scalable Solutions</h3>
              <p style={{ color: '#64748b' }}>
                SME plan for up to $100k monthly transfers. Enterprise for higher volumes with custom rates.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: `${theme.gold}20` }}>
                <svg className="w-6 h-6" style={{ color: theme.gold }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2" style={{ color: theme.navy }}>Dedicated Support</h3>
              <p style={{ color: '#64748b' }}>
                Priority support and a dedicated account manager for Enterprise clients to help you succeed.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: `${theme.gold}20` }}>
                <svg className="w-6 h-6" style={{ color: theme.gold }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2" style={{ color: theme.navy }}>API Integration</h3>
              <p style={{ color: '#64748b' }}>
                API access (SME & Enterprise) to integrate PBX directly into your payroll or accounting systems.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6" style={{ backgroundColor: 'white' }}>
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-4" style={{ color: theme.navy }}>Ready to Get Started?</h2>
          <p className="mb-8" style={{ color: '#64748b' }}>
            Choose an SME plan to self-onboard, or contact us for Enterprise solutions tailored to your needs.
          </p>
          <Link
            to="/onboarding/business"
            className="inline-block rounded-xl px-8 py-4 font-semibold transition"
            style={{ backgroundColor: theme.navy, color: 'white' }}
          >
            Join PBX Business
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8" style={{ backgroundColor: theme.navyDark }}>
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
            © {new Date().getFullYear()} PBX. Built in the United States. All features and pricing shown are for demonstration purposes.
          </p>
        </div>
      </footer>
    </div>
  );
}
