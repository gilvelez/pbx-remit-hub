import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Check, X } from "lucide-react";

// Theme colors
const theme = {
  navy: '#0A2540',
  navyDark: '#061C33',
  gold: '#F6C94B',
  goldDark: '#D4A520',
  offWhite: '#FAFAF7',
};

const plans = [
  {
    name: "Basic",
    price: "$0",
    period: "/mo",
    description: "Essential features, pay per transfer",
    fxSpread: "~1.5%",
    transferFee: "$2.00",
    features: {
      support24: false,
      dedicatedManager: false,
      apiAccess: false,
      priorityProcessing: false,
      monthlyLimit: "$5,000",
    },
    cta: "Get Started",
    ctaLink: "/onboarding/personal",
    highlight: false,
  },
  {
    name: "Premium",
    price: "$10",
    period: "/mo",
    description: "Lower fees and premium support",
    fxSpread: "~0.8%",
    transferFee: "$0 (free)",
    features: {
      support24: true,
      dedicatedManager: false,
      apiAccess: false,
      priorityProcessing: true,
      monthlyLimit: "$25,000",
    },
    cta: "Get Started",
    ctaLink: "/onboarding/personal",
    highlight: true,
  },
  {
    name: "SME",
    price: "$50",
    period: "/mo",
    description: "For small & medium enterprises",
    fxSpread: "~0.5%",
    transferFee: "$0 (free)",
    features: {
      support24: true,
      dedicatedManager: false,
      apiAccess: true,
      priorityProcessing: true,
      monthlyLimit: "$100,000",
    },
    cta: "Get Started",
    ctaLink: "/onboarding/business",
    highlight: false,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "Bespoke rates for large volumes",
    fxSpread: "~0.3%",
    transferFee: "$0 (free)",
    features: {
      support24: true,
      dedicatedManager: true,
      apiAccess: true,
      priorityProcessing: true,
      monthlyLimit: "Unlimited",
    },
    cta: "Contact Sales",
    ctaLink: "/onboarding/business",
    highlight: false,
  },
];

export default function Pricing() {
  const navigate = useNavigate();

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
            <Link to="/how-it-works" className="hover:text-[#F6C94B] transition" style={{ color: theme.navy }}>How It Works</Link>
            <Link to="/business" className="hover:text-[#F6C94B] transition" style={{ color: theme.navy }}>Business</Link>
            <Link to="/login" className="rounded-xl px-5 py-2 font-semibold transition" style={{ backgroundColor: theme.gold, color: theme.navyDark }}>Login</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="text-center py-16 px-6">
        <h1 className="text-4xl md:text-5xl font-bold mb-4" style={{ color: theme.navy, fontFamily: 'Georgia, serif' }}>
          Simple, Transparent Pricing
        </h1>
        <p className="text-lg max-w-2xl mx-auto" style={{ color: '#64748b' }}>
          Choose a plan that fits your needs. Save more on every transfer with lower FX spreads.
        </p>
      </div>

      {/* Plan Cards */}
      <div className="max-w-7xl mx-auto px-6 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-2xl p-6 flex flex-col transition-all ${
                plan.highlight
                  ? "bg-[#0A2540] text-white ring-2 ring-[#F6C94B] shadow-xl scale-105"
                  : "bg-white border border-slate-200 shadow-sm"
              }`}
            >
              {plan.highlight && (
                <div className="text-xs font-bold text-center py-1 px-3 rounded-full mb-3 self-center" style={{ backgroundColor: theme.gold, color: theme.navyDark }}>
                  MOST POPULAR
                </div>
              )}
              <h3 className={`text-xl font-bold ${plan.highlight ? "text-white" : ""}`} style={{ color: plan.highlight ? 'white' : theme.navy }}>
                {plan.name}
              </h3>
              <div className="mt-3">
                <span className={`text-4xl font-extrabold ${plan.highlight ? "text-[#F6C94B]" : ""}`} style={{ color: plan.highlight ? theme.gold : theme.navy }}>
                  {plan.price}
                </span>
                <span className={`text-sm ${plan.highlight ? "text-white/70" : "text-slate-500"}`}>{plan.period}</span>
              </div>
              <p className={`mt-2 text-sm ${plan.highlight ? "text-white/80" : "text-slate-600"}`}>
                {plan.description}
              </p>
              <div className="mt-4 pt-4 border-t" style={{ borderColor: plan.highlight ? 'rgba(255,255,255,0.2)' : '#e2e8f0' }}>
                <div className="flex justify-between text-sm mb-2">
                  <span className={plan.highlight ? "text-white/70" : "text-slate-500"}>FX Spread</span>
                  <span className={`font-semibold ${plan.highlight ? "text-[#F6C94B]" : ""}`} style={{ color: plan.highlight ? theme.gold : theme.navy }}>{plan.fxSpread}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className={plan.highlight ? "text-white/70" : "text-slate-500"}>Transfer Fee</span>
                  <span className={`font-semibold ${plan.highlight ? "text-white" : ""}`} style={{ color: plan.highlight ? 'white' : theme.navy }}>{plan.transferFee}</span>
                </div>
              </div>
              <button
                onClick={() => navigate(plan.ctaLink)}
                className={`mt-6 w-full rounded-xl py-3 font-semibold transition ${
                  plan.highlight
                    ? "bg-[#F6C94B] text-[#0A2540] hover:brightness-105"
                    : "bg-[#0A2540] text-white hover:bg-[#061C33]"
                }`}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Comparison Table */}
      <div className="max-w-6xl mx-auto px-6 pb-16">
        <h2 className="text-2xl font-bold text-center mb-8" style={{ color: theme.navy }}>Feature Comparison</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm bg-white rounded-xl shadow-sm border border-slate-200">
            <thead>
              <tr style={{ backgroundColor: theme.offWhite }}>
                <th className="text-left p-4 font-semibold" style={{ color: theme.navy }}>Features</th>
                {plans.map((p) => (
                  <th key={p.name} className="p-4 font-semibold text-center" style={{ color: theme.navy }}>{p.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-slate-100">
                <td className="p-4 font-medium" style={{ color: theme.navy }}>Monthly Price</td>
                {plans.map((p) => <td key={p.name} className="p-4 text-center" style={{ color: '#64748b' }}>{p.price}{p.period}</td>)}
              </tr>
              <tr className="border-t border-slate-100">
                <td className="p-4 font-medium" style={{ color: theme.navy }}>FX Spread Markup</td>
                {plans.map((p) => <td key={p.name} className="p-4 text-center font-semibold" style={{ color: theme.gold }}>{p.fxSpread}</td>)}
              </tr>
              <tr className="border-t border-slate-100">
                <td className="p-4 font-medium" style={{ color: theme.navy }}>Transfer Fee per Send</td>
                {plans.map((p) => <td key={p.name} className="p-4 text-center" style={{ color: '#64748b' }}>{p.transferFee}</td>)}
              </tr>
              <tr className="border-t border-slate-100">
                <td className="p-4 font-medium" style={{ color: theme.navy }}>Monthly Limit</td>
                {plans.map((p) => <td key={p.name} className="p-4 text-center" style={{ color: '#64748b' }}>{p.features.monthlyLimit}</td>)}
              </tr>
              <tr className="border-t border-slate-100">
                <td className="p-4 font-medium" style={{ color: theme.navy }}>24/7 Support</td>
                {plans.map((p) => <td key={p.name} className="p-4 text-center">{p.features.support24 ? <Check className="mx-auto text-green-600" size={18} /> : <X className="mx-auto text-slate-300" size={18} />}</td>)}
              </tr>
              <tr className="border-t border-slate-100">
                <td className="p-4 font-medium" style={{ color: theme.navy }}>Priority Processing</td>
                {plans.map((p) => <td key={p.name} className="p-4 text-center">{p.features.priorityProcessing ? <Check className="mx-auto text-green-600" size={18} /> : <X className="mx-auto text-slate-300" size={18} />}</td>)}
              </tr>
              <tr className="border-t border-slate-100">
                <td className="p-4 font-medium" style={{ color: theme.navy }}>API Access</td>
                {plans.map((p) => <td key={p.name} className="p-4 text-center">{p.features.apiAccess ? <Check className="mx-auto text-green-600" size={18} /> : <X className="mx-auto text-slate-300" size={18} />}</td>)}
              </tr>
              <tr className="border-t border-slate-100">
                <td className="p-4 font-medium" style={{ color: theme.navy }}>Dedicated Account Manager</td>
                {plans.map((p) => <td key={p.name} className="p-4 text-center">{p.features.dedicatedManager ? <Check className="mx-auto text-green-600" size={18} /> : <X className="mx-auto text-slate-300" size={18} />}</td>)}
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-center text-xs mt-4" style={{ color: '#94a3b8' }}>
          All pricing is illustrative for demo purposes. Actual rates may vary.
        </p>
      </div>

      {/* Footer */}
      <footer className="py-8" style={{ backgroundColor: theme.navyDark }}>
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
            © {new Date().getFullYear()} PBX. Built in the United States. Demo purposes only.
          </p>
        </div>
      </footer>
    </div>
  );
}
