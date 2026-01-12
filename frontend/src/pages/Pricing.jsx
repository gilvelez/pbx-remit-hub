import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Check, X, Minus } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "../components/ui/card";
import { Button } from "../components/ui/button";

const plans = [
  {
    name: "Basic",
    price: "Free",
    period: "",
    description: "For individual users starting out",
    features: {
      wallet: true,
      recurring: false,
      interest: false,
      interestRate: null,
      fxLock: "15 min",
      support: "Standard",
      monthlyLimit: "₱250,000",
    },
    cta: "Get Started",
    ctaLink: "/welcome",
    highlight: false,
  },
  {
    name: "Premium",
    price: "₱499",
    period: "/mo",
    description: "For individuals & families",
    features: {
      wallet: true,
      recurring: true,
      interest: true,
      interestRate: "1% APY",
      fxLock: "15 min",
      support: "Priority",
      monthlyLimit: "₱1,250,000",
    },
    cta: "Choose Premium",
    ctaLink: "/welcome",
    highlight: true,
    badge: "Popular",
  },
  {
    name: "SME",
    price: "₱2,499",
    period: "/mo",
    description: "For small business teams",
    features: {
      wallet: true,
      recurring: true,
      interest: false,
      interestRate: null,
      fxLock: "15 min",
      support: "Priority",
      monthlyLimit: "₱5,000,000",
    },
    cta: "Choose SME",
    ctaLink: "/welcome",
    highlight: false,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "For large organizations",
    features: {
      wallet: true,
      recurring: true,
      interest: false,
      interestRate: null,
      fxLock: "15 min",
      support: "Dedicated Manager",
      monthlyLimit: "Unlimited",
    },
    cta: "Contact Sales",
    ctaLink: "/welcome",
    highlight: false,
  },
];

export default function Pricing() {
  const navigate = useNavigate();

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
            <Link to="/how-it-works" className="text-gray-300 hover:text-amber-400 transition">How It Works</Link>
            <Link to="/business" className="text-gray-300 hover:text-amber-400 transition">Business</Link>
            <Link to="/login" className="rounded-xl px-5 py-2 font-semibold bg-red-600 hover:bg-red-700 text-white transition">Login</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="text-center py-16 px-6">
        <h1 className="text-4xl md:text-5xl font-bold text-amber-400 mb-4" style={{ fontFamily: 'Georgia, serif' }}>
          Choose Your Plan
        </h1>
        <p className="text-lg max-w-2xl mx-auto text-gray-300">
          Find the perfect plan for your needs — from individuals to enterprises.
        </p>
      </div>

      {/* Plan Cards */}
      <div className="max-w-7xl mx-auto px-6 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`relative flex flex-col border bg-neutral-900 text-gray-100 ${
                plan.highlight
                  ? "border-amber-500 shadow-lg shadow-amber-500/20"
                  : "border-neutral-800"
              }`}
            >
              {plan.badge && (
                <div className="absolute top-0 right-0 bg-amber-500 text-neutral-900 text-xs font-bold px-3 py-1 rounded-bl-lg">
                  {plan.badge}
                </div>
              )}
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-amber-400">{plan.name}</CardTitle>
                <CardDescription className="text-gray-400">{plan.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="mb-4">
                  <span className="text-4xl font-bold text-gray-100">{plan.price}</span>
                  {plan.period && <span className="text-base text-gray-400">{plan.period}</span>}
                </div>
                <ul className="text-sm space-y-3">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span>PBX Wallet access</span>
                  </li>
                  <li className="flex items-center gap-2">
                    {plan.features.recurring ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <X className="w-4 h-4 text-gray-600" />
                    )}
                    <span className={!plan.features.recurring ? "text-gray-500" : ""}>
                      Recurring Transfers
                    </span>
                  </li>
                  <li className="flex items-center gap-2">
                    {plan.features.interest ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <X className="w-4 h-4 text-gray-600" />
                    )}
                    <span className={!plan.features.interest ? "text-gray-500" : ""}>
                      {plan.features.interestRate ? (
                        <><strong className="text-amber-400">{plan.features.interestRate}</strong> Interest</>
                      ) : (
                        "Interest on Balance"
                      )}
                    </span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-4 h-4 text-xs font-bold text-amber-400">15m</span>
                    <span>FX Rate Lock</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Minus className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-400">{plan.features.support} Support</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter className="pt-4">
                <Button
                  onClick={() => navigate(plan.ctaLink)}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold"
                  data-testid={`pricing-cta-${plan.name.toLowerCase()}`}
                >
                  {plan.cta}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>

      {/* Feature Comparison Table */}
      <div className="max-w-6xl mx-auto px-6 pb-16">
        <h2 className="text-2xl font-bold text-center text-amber-400 mb-8">Feature Comparison</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm bg-neutral-900 border border-neutral-700 rounded-xl overflow-hidden">
            <thead className="bg-neutral-800 text-gray-100">
              <tr>
                <th className="text-left p-4 font-semibold">Feature</th>
                {plans.map((p) => (
                  <th key={p.name} className="p-4 font-semibold text-center text-amber-400">{p.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-neutral-700">
                <td className="p-4 font-medium text-gray-300">Monthly Fee</td>
                {plans.map((p) => (
                  <td key={p.name} className="p-4 text-center text-gray-100">
                    {p.price}{p.period}
                  </td>
                ))}
              </tr>
              <tr className="border-t border-neutral-700">
                <td className="p-4 font-medium text-gray-300">PBX Wallet (Hold Funds)</td>
                {plans.map((p) => (
                  <td key={p.name} className="p-4 text-center">
                    <Check className="mx-auto text-green-500" size={18} />
                  </td>
                ))}
              </tr>
              <tr className="border-t border-neutral-700">
                <td className="p-4 font-medium text-gray-300">Recurring Transfers</td>
                {plans.map((p) => (
                  <td key={p.name} className="p-4 text-center">
                    {p.features.recurring ? (
                      <Check className="mx-auto text-green-500" size={18} />
                    ) : (
                      <Minus className="mx-auto text-gray-600" size={18} />
                    )}
                  </td>
                ))}
              </tr>
              <tr className="border-t border-neutral-700">
                <td className="p-4 font-medium text-gray-300">Interest on Balance</td>
                {plans.map((p) => (
                  <td key={p.name} className="p-4 text-center">
                    {p.features.interest ? (
                      <span className="text-amber-400 font-semibold">{p.features.interestRate}</span>
                    ) : (
                      <Minus className="mx-auto text-gray-600" size={18} />
                    )}
                  </td>
                ))}
              </tr>
              <tr className="border-t border-neutral-700">
                <td className="p-4 font-medium text-gray-300">FX Rate Lock Window</td>
                {plans.map((p) => (
                  <td key={p.name} className="p-4 text-center text-gray-100">15 min</td>
                ))}
              </tr>
              <tr className="border-t border-neutral-700">
                <td className="p-4 font-medium text-gray-300">Monthly Limit</td>
                {plans.map((p) => (
                  <td key={p.name} className="p-4 text-center text-gray-100">{p.features.monthlyLimit}</td>
                ))}
              </tr>
              <tr className="border-t border-neutral-700">
                <td className="p-4 font-medium text-gray-300">Support Level</td>
                {plans.map((p) => (
                  <td key={p.name} className="p-4 text-center text-gray-100">{p.features.support}</td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-center text-xs mt-4 text-gray-500">
          All pricing shown is for demonstration purposes. Actual rates may vary.
        </p>
      </div>

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
