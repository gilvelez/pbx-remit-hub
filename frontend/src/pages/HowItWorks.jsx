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

const steps = [
  {
    number: "01",
    title: "Create Your Account",
    description: "Sign up with your email and verify your identity. Choose a plan that fits your needs.",
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
  {
    number: "02",
    title: "Add Funds",
    description: "Connect your bank account or fund your wallet. Your money is held securely.",
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    ),
  },
  {
    number: "03",
    title: "Send Money",
    description: "Enter the amount and recipient details. See the exact FX rate and fees upfront.",
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
      </svg>
    ),
  },
  {
    number: "04",
    title: "Recipient Gets Paid",
    description: "Funds are delivered to the recipient’s bank account or e-wallet in PHP.",
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
];

export default function HowItWorks() {
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
            <Link to="/business" className="hover:text-[#F6C94B] transition" style={{ color: theme.navy }}>Business</Link>
            <Link to="/login" className="rounded-xl px-5 py-2 font-semibold transition" style={{ backgroundColor: theme.gold, color: theme.navyDark }}>Login</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="py-16 px-6 text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-4" style={{ color: theme.navy, fontFamily: 'Georgia, serif' }}>
          How PBX Works
        </h1>
        <p className="text-lg max-w-2xl mx-auto" style={{ color: '#64748b' }}>
          Send money between the U.S. and the Philippines in four simple steps.
        </p>
      </section>

      {/* Steps */}
      <section className="py-12 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="space-y-8">
            {steps.map((step, index) => (
              <div key={step.number} className="flex gap-6 items-start">
                <div className="flex-shrink-0">
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center"
                    style={{ backgroundColor: theme.gold, color: theme.navyDark }}
                  >
                    {step.icon}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-sm font-bold" style={{ color: theme.gold }}>{step.number}</span>
                    <h3 className="text-xl font-bold" style={{ color: theme.navy }}>{step.title}</h3>
                  </div>
                  <p style={{ color: '#64748b' }}>{step.description}</p>
                  {index < steps.length - 1 && (
                    <div className="mt-4 ml-8 h-12 w-px" style={{ backgroundColor: '#e2e8f0' }} />
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
          <h2 className="text-2xl font-bold mb-4" style={{ color: theme.navy }}>Ready to Start?</h2>
          <p className="mb-6" style={{ color: '#64748b' }}>
            Join thousands of users who trust PBX for their cross-border transfers.
          </p>
          <Link
            to="/onboarding/personal"
            className="inline-block rounded-xl px-8 py-4 font-semibold transition"
            style={{ backgroundColor: theme.gold, color: theme.navyDark }}
          >
            Get Started Now
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8" style={{ backgroundColor: theme.navyDark }}>
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
            © {new Date().getFullYear()} PBX. Built in the United States.
          </p>
        </div>
      </footer>
    </div>
  );
}
