import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useSession } from "../contexts/SessionContext";
import { Button } from "../components/ui/button";

export default function OnboardingBusiness() {
  const { setSession } = useSession();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [selectedPlan, setSelectedPlan] = useState("SME");
  const [company, setCompany] = useState({ name: "", address: "", website: "" });
  const [fxPref, setFxPref] = useState({ defaultCurrency: "USD", alerts: false, recurring: false });
  const [loading, setLoading] = useState(false);

  const handleEmailSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep(2);
    }, 800);
  };

  const handlePlanSubmit = () => {
    setStep(3);
  };

  const handleCompanySubmit = (e) => {
    e.preventDefault();
    setStep(4);
  };

  const handleFinish = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setSession(prev => ({
        ...prev,
        exists: true,
        verified: true,
        plan: selectedPlan,
        user: { email, company, fxPref },
        isBusiness: true,
      }));
      navigate("/app/dashboard");
    }, 500);
  };

  return (
    <div className="min-h-screen flex flex-col bg-neutral-950 text-gray-100">
      {/* Header */}
      <nav className="border-b border-neutral-800">
        <div className="mx-auto max-w-7xl px-6 py-4 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-2xl flex items-center justify-center bg-amber-500/20 border border-amber-500/40">
              <span className="font-extrabold text-sm text-amber-400">PBX</span>
            </div>
          </Link>
          <span className="text-sm text-gray-400">Business Account</span>
        </div>
      </nav>

      {/* Progress Bar */}
      <div className="border-b border-neutral-800 py-4 bg-neutral-900">
        <div className="max-w-lg mx-auto px-6">
          <div className="flex justify-between mb-2">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                    step >= s ? "bg-amber-500 text-neutral-900" : "bg-neutral-700 text-gray-400"
                  }`}
                >
                  {s}
                </div>
                {s < 4 && (
                  <div className={`w-12 sm:w-16 h-1 mx-1 rounded ${step > s ? "bg-amber-500" : "bg-neutral-700"}`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>Email</span>
            <span>Plan</span>
            <span>Company</span>
            <span>Preferences</span>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {step === 1 && (
            <form onSubmit={handleEmailSubmit} className="bg-neutral-900 rounded-2xl p-8 border border-neutral-800">
              <h2 className="text-2xl font-bold text-amber-400 mb-2" style={{ fontFamily: 'Georgia, serif' }}>
                Get Started for Business
              </h2>
              <p className="text-sm text-gray-400 mb-6">Enter your work email to begin.</p>
              
              <label className="block text-sm font-medium text-gray-300 mb-2">Work Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-neutral-700 bg-neutral-800 px-4 py-3 text-sm text-gray-100 outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 mb-6"
                placeholder="you@company.com"
                data-testid="business-email-input"
              />
              
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold disabled:opacity-50"
              >
                {loading ? "Sending..." : "Continue"}
              </Button>
            </form>
          )}

          {step === 2 && (
            <div className="bg-neutral-900 rounded-2xl p-8 border border-neutral-800">
              <h2 className="text-2xl font-bold text-amber-400 mb-2" style={{ fontFamily: 'Georgia, serif' }}>
                Select Your Plan
              </h2>
              <p className="text-sm text-gray-400 mb-6">Choose the plan that fits your business needs.</p>
              
              <div className="space-y-3 mb-6">
                <label
                  className={`flex items-start p-4 rounded-xl border-2 cursor-pointer transition ${
                    selectedPlan === "SME" ? "border-amber-500 bg-amber-500/10" : "border-neutral-700 hover:border-neutral-600"
                  }`}
                >
                  <input
                    type="radio"
                    name="plan"
                    value="SME"
                    checked={selectedPlan === "SME"}
                    onChange={(e) => setSelectedPlan(e.target.value)}
                    className="mt-1 mr-3"
                  />
                  <div>
                    <div className="font-semibold text-gray-100">SME — ₱2,499/mo</div>
                    <div className="text-sm text-gray-400">Up to ₱5M/mo, Recurring Transfers, Priority Support</div>
                  </div>
                </label>
                
                <label
                  className={`flex items-start p-4 rounded-xl border-2 cursor-pointer transition ${
                    selectedPlan === "Enterprise" ? "border-amber-500 bg-amber-500/10" : "border-neutral-700 hover:border-neutral-600"
                  }`}
                >
                  <input
                    type="radio"
                    name="plan"
                    value="Enterprise"
                    checked={selectedPlan === "Enterprise"}
                    onChange={(e) => setSelectedPlan(e.target.value)}
                    className="mt-1 mr-3"
                  />
                  <div>
                    <div className="font-semibold text-gray-100">Enterprise — Custom Pricing</div>
                    <div className="text-sm text-gray-400">Unlimited volume, Custom FX rates, Dedicated Manager</div>
                  </div>
                </label>
              </div>
              
              <Button
                onClick={handlePlanSubmit}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold"
                data-testid="business-plan-next"
              >
                Next
              </Button>
            </div>
          )}

          {step === 3 && (
            <form onSubmit={handleCompanySubmit} className="bg-neutral-900 rounded-2xl p-8 border border-neutral-800">
              <h2 className="text-2xl font-bold text-amber-400 mb-2" style={{ fontFamily: 'Georgia, serif' }}>
                Company Information
              </h2>
              <p className="text-sm text-gray-400 mb-6">Tell us about your business.</p>
              
              <label className="block text-sm font-medium text-gray-300 mb-2">Company Name</label>
              <input
                type="text"
                required
                value={company.name}
                onChange={(e) => setCompany({ ...company, name: e.target.value })}
                className="w-full rounded-xl border border-neutral-700 bg-neutral-800 px-4 py-3 text-sm text-gray-100 outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 mb-4"
                placeholder="Acme Corp"
                data-testid="business-company-name"
              />
              
              <label className="block text-sm font-medium text-gray-300 mb-2">Company Address</label>
              <input
                type="text"
                required
                value={company.address}
                onChange={(e) => setCompany({ ...company, address: e.target.value })}
                className="w-full rounded-xl border border-neutral-700 bg-neutral-800 px-4 py-3 text-sm text-gray-100 outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 mb-4"
                placeholder="123 Business St, Makati City"
              />
              
              <label className="block text-sm font-medium text-gray-300 mb-2">Website (optional)</label>
              <input
                type="url"
                value={company.website}
                onChange={(e) => setCompany({ ...company, website: e.target.value })}
                className="w-full rounded-xl border border-neutral-700 bg-neutral-800 px-4 py-3 text-sm text-gray-100 outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 mb-6"
                placeholder="https://company.com"
              />
              
              <Button
                type="submit"
                className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold"
              >
                Next
              </Button>
            </form>
          )}

          {step === 4 && (
            <form onSubmit={handleFinish} className="bg-neutral-900 rounded-2xl p-8 border border-neutral-800">
              <h2 className="text-2xl font-bold text-amber-400 mb-2" style={{ fontFamily: 'Georgia, serif' }}>
                Transfer Preferences
              </h2>
              <p className="text-sm text-gray-400 mb-6">Set your default preferences.</p>
              
              <label className="block text-sm font-medium text-gray-300 mb-2">Default Send Currency</label>
              <select
                value={fxPref.defaultCurrency}
                onChange={(e) => setFxPref({ ...fxPref, defaultCurrency: e.target.value })}
                className="w-full rounded-xl border border-neutral-700 bg-neutral-800 px-4 py-3 text-sm text-gray-100 outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 mb-4"
              >
                <option value="USD">USD (US Dollar)</option>
                <option value="PHP">PHP (Philippine Peso)</option>
                <option value="EUR">EUR (Euro)</option>
              </select>

              <div className="space-y-3 mb-6">
                <label className="flex items-center text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={fxPref.alerts}
                    onChange={() => setFxPref({ ...fxPref, alerts: !fxPref.alerts })}
                    className="mr-3 w-4 h-4 rounded border-neutral-600"
                  />
                  <span className="text-gray-300">Send me daily FX rate updates</span>
                </label>
                
                <label className="flex items-center text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={fxPref.recurring}
                    onChange={() => setFxPref({ ...fxPref, recurring: !fxPref.recurring })}
                    className="mr-3 w-4 h-4 rounded border-neutral-600"
                  />
                  <span className="text-gray-300">Enable recurring transfer scheduling</span>
                </label>
              </div>
              
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold disabled:opacity-50"
                data-testid="business-complete-btn"
              >
                {loading ? "Setting up..." : "Finish Onboarding"}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
