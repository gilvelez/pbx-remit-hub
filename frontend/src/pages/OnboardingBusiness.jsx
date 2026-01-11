import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useSession } from "../contexts/SessionContext";

// Theme colors
const theme = {
  navy: '#0A2540',
  navyDark: '#061C33',
  gold: '#F6C94B',
  goldDark: '#D4A520',
  offWhite: '#FAFAF7',
};

export default function OnboardingBusiness() {
  const { setSession } = useSession();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [selectedPlan, setSelectedPlan] = useState("SME");
  const [company, setCompany] = useState({ name: "", address: "", website: "" });
  const [fxPref, setFxPref] = useState({ defaultCurrency: "USD", alerts: false });
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

  const totalSteps = 4;

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: theme.offWhite }}>
      {/* Header */}
      <nav className="bg-white border-b border-slate-200">
        <div className="mx-auto max-w-7xl px-6 py-4 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-2xl flex items-center justify-center" style={{ backgroundColor: `${theme.gold}20`, border: `1px solid ${theme.gold}40` }}>
              <span className="font-extrabold text-sm" style={{ color: theme.navy }}>PBX</span>
            </div>
          </Link>
          <span className="text-sm" style={{ color: '#64748b' }}>Business Account</span>
        </div>
      </nav>

      {/* Progress Bar */}
      <div className="bg-white border-b border-slate-200 py-4">
        <div className="max-w-lg mx-auto px-6">
          <div className="flex justify-between mb-2">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                    step >= s ? "text-white" : "text-slate-400"
                  }`}
                  style={{ backgroundColor: step >= s ? theme.gold : '#e2e8f0' }}
                >
                  {s}
                </div>
                {s < 4 && <div className={`w-12 sm:w-16 h-1 mx-1 rounded ${step > s ? "bg-[#F6C94B]" : "bg-slate-200"}`} />}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs" style={{ color: '#64748b' }}>
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
            <form onSubmit={handleEmailSubmit} className="bg-white rounded-2xl p-8 shadow-lg border border-slate-200">
              <h2 className="text-2xl font-bold mb-2" style={{ color: theme.navy, fontFamily: 'Georgia, serif' }}>Get Started for Business</h2>
              <p className="text-sm mb-6" style={{ color: '#64748b' }}>Enter your work email to begin.</p>
              
              <label className="block text-sm font-medium mb-2" style={{ color: theme.navy }}>Work Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#F6C94B] focus:border-[#F6C94B] mb-6"
                placeholder="you@company.com"
                style={{ color: theme.navy }}
              />
              
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl py-3 font-semibold transition disabled:opacity-50"
                style={{ backgroundColor: theme.gold, color: theme.navyDark }}
              >
                {loading ? "Sending..." : "Continue"}
              </button>
            </form>
          )}

          {step === 2 && (
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-slate-200">
              <h2 className="text-2xl font-bold mb-2" style={{ color: theme.navy, fontFamily: 'Georgia, serif' }}>Select Your Plan</h2>
              <p className="text-sm mb-6" style={{ color: '#64748b' }}>Choose the plan that fits your business needs.</p>
              
              <div className="space-y-3 mb-6">
                <label
                  className={`flex items-start p-4 rounded-xl border-2 cursor-pointer transition ${
                    selectedPlan === "SME" ? "border-[#F6C94B] bg-[#F6C94B]/10" : "border-slate-200 hover:border-slate-300"
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
                    <div className="font-semibold" style={{ color: theme.navy }}>SME — $50/mo</div>
                    <div className="text-sm" style={{ color: '#64748b' }}>~0.5% FX spread, up to $100k/mo, API access</div>
                  </div>
                </label>
                
                <label
                  className={`flex items-start p-4 rounded-xl border-2 cursor-pointer transition ${
                    selectedPlan === "Enterprise" ? "border-[#F6C94B] bg-[#F6C94B]/10" : "border-slate-200 hover:border-slate-300"
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
                    <div className="font-semibold" style={{ color: theme.navy }}>Enterprise — Custom Pricing</div>
                    <div className="text-sm" style={{ color: '#64748b' }}>~0.3% FX spread, unlimited volume, dedicated manager</div>
                  </div>
                </label>
              </div>
              
              <button
                onClick={handlePlanSubmit}
                className="w-full rounded-xl py-3 font-semibold transition"
                style={{ backgroundColor: theme.gold, color: theme.navyDark }}
              >
                Next
              </button>
            </div>
          )}

          {step === 3 && (
            <form onSubmit={handleCompanySubmit} className="bg-white rounded-2xl p-8 shadow-lg border border-slate-200">
              <h2 className="text-2xl font-bold mb-2" style={{ color: theme.navy, fontFamily: 'Georgia, serif' }}>Company Information</h2>
              <p className="text-sm mb-6" style={{ color: '#64748b' }}>Tell us about your business.</p>
              
              <label className="block text-sm font-medium mb-2" style={{ color: theme.navy }}>Company Name</label>
              <input
                type="text"
                required
                value={company.name}
                onChange={(e) => setCompany({ ...company, name: e.target.value })}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#F6C94B] focus:border-[#F6C94B] mb-4"
                placeholder="Acme Corp"
                style={{ color: theme.navy }}
              />
              
              <label className="block text-sm font-medium mb-2" style={{ color: theme.navy }}>Company Address</label>
              <input
                type="text"
                required
                value={company.address}
                onChange={(e) => setCompany({ ...company, address: e.target.value })}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#F6C94B] focus:border-[#F6C94B] mb-4"
                placeholder="123 Business St, City, Country"
                style={{ color: theme.navy }}
              />
              
              <label className="block text-sm font-medium mb-2" style={{ color: theme.navy }}>Website (optional)</label>
              <input
                type="url"
                value={company.website}
                onChange={(e) => setCompany({ ...company, website: e.target.value })}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#F6C94B] focus:border-[#F6C94B] mb-6"
                placeholder="https://company.com"
                style={{ color: theme.navy }}
              />
              
              <button
                type="submit"
                className="w-full rounded-xl py-3 font-semibold transition"
                style={{ backgroundColor: theme.gold, color: theme.navyDark }}
              >
                Next
              </button>
            </form>
          )}

          {step === 4 && (
            <form onSubmit={handleFinish} className="bg-white rounded-2xl p-8 shadow-lg border border-slate-200">
              <h2 className="text-2xl font-bold mb-2" style={{ color: theme.navy, fontFamily: 'Georgia, serif' }}>FX Preferences</h2>
              <p className="text-sm mb-6" style={{ color: '#64748b' }}>Set your default preferences.</p>
              
              <label className="block text-sm font-medium mb-2" style={{ color: theme.navy }}>Default Send Currency</label>
              <select
                value={fxPref.defaultCurrency}
                onChange={(e) => setFxPref({ ...fxPref, defaultCurrency: e.target.value })}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#F6C94B] focus:border-[#F6C94B] mb-4"
                style={{ color: theme.navy }}
              >
                <option value="USD">USD (US Dollar)</option>
                <option value="EUR">EUR (Euro)</option>
                <option value="GBP">GBP (British Pound)</option>
              </select>
              
              <label className="flex items-center text-sm mb-6 cursor-pointer">
                <input
                  type="checkbox"
                  checked={fxPref.alerts}
                  onChange={() => setFxPref({ ...fxPref, alerts: !fxPref.alerts })}
                  className="mr-3 w-4 h-4"
                />
                <span style={{ color: '#64748b' }}>Send me daily FX rate updates</span>
              </label>
              
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl py-3 font-semibold transition disabled:opacity-50"
                style={{ backgroundColor: theme.gold, color: theme.navyDark }}
              >
                {loading ? "Setting up..." : "Finish Onboarding"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
