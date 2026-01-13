/**
 * Pricing - Subscription pricing page
 * Wrapped in PublicShell for consistent nav/footer
 * ALL PRICES IN USD (not PHP) - P1 requirement
 */
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Check, X, Minus } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { tw } from "../lib/theme";
import LiveFXRate from "../components/LiveFXRate";

// USD PRICING - P1 REQUIREMENT
const plans = [
  {
    name: "Basic",
    price: "Free",
    period: "",
    description: "For individual users starting out",
    features: {
      wallet: true,
      recurring: false,
      betterRates: false,
      fxLock: "15 min",
      support: "Standard",
      monthlyLimit: "$5,000",
    },
    cta: "Get Started",
    ctaLink: "/welcome",
    highlight: false,
  },
  {
    name: "Premium",
    price: "$10",
    period: "/mo",
    description: "For individuals & families",
    features: {
      wallet: true,
      recurring: true,
      betterRates: true,
      fxLock: "15 min",
      support: "Priority",
      monthlyLimit: "$25,000",
    },
    cta: "Choose Premium",
    ctaLink: "/welcome",
    highlight: true,
    badge: "Popular",
  },
  {
    name: "SME",
    price: "$50",
    period: "/mo",
    description: "For small business teams",
    features: {
      wallet: true,
      recurring: true,
      betterRates: true,
      fxLock: "15 min",
      support: "Priority",
      monthlyLimit: "$100,000",
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
      betterRates: true,
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
    <div className="min-h-screen">
      {/* Hero */}
      <div className="text-center py-12 px-6 bg-[#0A2540]">
        <h1 className={`text-4xl md:text-5xl font-bold ${tw.textGold} mb-4`} style={{ fontFamily: 'Georgia, serif' }}>
          Choose Your Plan
        </h1>
        <p className={`text-lg max-w-2xl mx-auto ${tw.textOnDarkMuted} mb-6`}>
          Find the perfect plan for your needs — from individuals to enterprises.
        </p>
        
        {/* Live FX Rate - Contextual reinforcement */}
        <div className="flex flex-col items-center gap-3">
          <LiveFXRate showLockInfo={true} showDisclaimer={false} className="max-w-sm" />
          <p className={`text-sm ${tw.textOnDarkMuted}`}>
            Premium members get better locked rates on every transfer
          </p>
        </div>
      </div>

      {/* Plan Cards */}
      <div className="max-w-7xl mx-auto px-6 py-12 bg-neutral-900">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`relative flex flex-col border bg-neutral-800 text-gray-100 ${
                plan.highlight
                  ? "border-[#F6C94B] shadow-lg shadow-[#F6C94B]/20"
                  : "border-neutral-700"
              }`}
            >
              {plan.badge && (
                <div className="absolute top-0 right-0 bg-[#F6C94B] text-[#0A2540] text-xs font-bold px-3 py-1 rounded-bl-lg">
                  {plan.badge}
                </div>
              )}
              <CardHeader>
                <CardTitle className={`text-xl font-semibold ${tw.textGold}`}>{plan.name}</CardTitle>
                <CardDescription className="text-gray-400">{plan.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="mb-4">
                  <span className="text-4xl font-bold text-gray-100">{plan.price}</span>
                  {plan.period && <span className="text-base text-gray-400">{plan.period}</span>}
                  {plan.price !== "Free" && plan.price !== "Custom" && (
                    <span className="text-xs text-gray-500 ml-1">USD</span>
                  )}
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
                    {plan.features.betterRates ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <X className="w-4 h-4 text-gray-600" />
                    )}
                    <span className={!plan.features.betterRates ? "text-gray-500" : ""}>
                      Better FX Rates
                    </span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className={`w-4 h-4 text-xs font-bold ${tw.textGold}`}>15m</span>
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
                  className={`w-full ${plan.highlight ? 'bg-red-600 hover:bg-red-700' : 'bg-[#F6C94B] hover:bg-[#D4A520] text-[#0A2540]'} font-semibold`}
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
      <div className="max-w-6xl mx-auto px-6 py-16 bg-neutral-950">
        <h2 className={`text-2xl font-bold text-center ${tw.textGold} mb-8`}>Feature Comparison</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm bg-neutral-900 border border-neutral-700 rounded-xl overflow-hidden">
            <thead className="bg-neutral-800 text-gray-100">
              <tr>
                <th className="text-left p-4 font-semibold">Feature</th>
                {plans.map((p) => (
                  <th key={p.name} className={`p-4 font-semibold text-center ${tw.textGold}`}>{p.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-neutral-700">
                <td className="p-4 font-medium text-gray-300">Monthly Fee (USD)</td>
                {plans.map((p) => (
                  <td key={p.name} className="p-4 text-center text-gray-100">
                    {p.price}{p.period}
                  </td>
                ))}
              </tr>
              <tr className="border-t border-neutral-700">
                <td className="p-4 font-medium text-gray-300">PBX Wallet</td>
                {plans.map((p) => (
                  <td key={p.name} className="p-4 text-center">
                    <Check className="mx-auto text-green-500" size={18} />
                  </td>
                ))}
              </tr>
              <tr className="border-t border-neutral-700">
                <td className="p-4 font-medium text-gray-300">Better FX Rates</td>
                {plans.map((p) => (
                  <td key={p.name} className="p-4 text-center">
                    {p.features.betterRates ? (
                      <Check className="mx-auto text-green-500" size={18} />
                    ) : (
                      <Minus className="mx-auto text-gray-600" size={18} />
                    )}
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
                <td className="p-4 font-medium text-gray-300">FX Rate Lock</td>
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
          All subscription fees are in USD. FX rates apply to transfers (USD → PHP).
        </p>
      </div>
    </div>
  );
}
