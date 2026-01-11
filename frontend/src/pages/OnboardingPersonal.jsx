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

export default function OnboardingPersonal() {
  const { setSession } = useSession();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [kycData, setKycData] = useState({ fullName: "", idNumber: "" });
  const [selectedPlan, setSelectedPlan] = useState("Basic");
  const [loading, setLoading] = useState(false);

  const handleEmailSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      console.log("Verification email sent to", email);
      setLoading(false);
      setStep(2);
    }, 800);
  };

  const handleKycSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      console.log("KYC data submitted:", kycData);
      setSession(prev => ({ ...prev, exists: true, verified: true, user: { email, ...kycData } }));
      setLoading(false);
      setStep(3);
    }, 1000);
  };

  const handlePlanConfirm = () => {
    setLoading(true);
    setTimeout(() => {
      console.log("Plan selected:", selectedPlan);
      setSession(prev => ({ ...prev, plan: selectedPlan }));
      navigate("/app/dashboard");
    }, 500);
  };

  const totalSteps = 3;

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
          <span className="text-sm" style={{ color: '#64748b' }}>Personal Account</span>
        </div>
      </nav>

      {/* Progress Bar */}
      <div className="bg-white border-b border-slate-200 py-4">
        <div className="max-w-md mx-auto px-6">
          <div className="flex justify-between mb-2">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                    step >= s ? "text-white" : "text-slate-400"
                  }`}
                  style={{ backgroundColor: step >= s ? theme.gold : '#e2e8f0' }}
                >
                  {s}
                </div>
                {s < 3 && <div className={`w-16 sm:w-24 h-1 mx-2 rounded ${step > s ? "bg-[#F6C94B]" : "bg-slate-200"}`} />}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs" style={{ color: '#64748b' }}>
            <span>Sign Up</span>
            <span>Verify</span>
            <span>Plan</span>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {step === 1 && (
            <form onSubmit={handleEmailSubmit} className="bg-white rounded-2xl p-8 shadow-lg border border-slate-200">
              <h2 className="text-2xl font-bold mb-2" style={{ color: theme.navy, fontFamily: 'Georgia, serif' }}>Create Your Account</h2>
              <p className="text-sm mb-6" style={{ color: '#64748b' }}>Enter your email to get started with PBX.</p>
              
              <label className="block text-sm font-medium mb-2" style={{ color: theme.navy }}>Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#F6C94B] focus:border-[#F6C94B] mb-6"
                placeholder="you@example.com"
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
            <form onSubmit={handleKycSubmit} className="bg-white rounded-2xl p-8 shadow-lg border border-slate-200">
              <h2 className="text-2xl font-bold mb-2" style={{ color: theme.navy, fontFamily: 'Georgia, serif' }}>Verify Your Identity</h2>
              <p className="text-sm mb-6" style={{ color: '#64748b' }}>We need some basic information for compliance.</p>
              
              <label className="block text-sm font-medium mb-2" style={{ color: theme.navy }}>Full Legal Name</label>
              <input
                type="text"
                required
                value={kycData.fullName}
                onChange={(e) => setKycData({ ...kycData, fullName: e.target.value })}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#F6C94B] focus:border-[#F6C94B] mb-4"
                placeholder="John Doe"
                style={{ color: theme.navy }}
              />
              
              <label className="block text-sm font-medium mb-2" style={{ color: theme.navy }}>Government ID Number</label>
              <input
                type="text"
                required
                value={kycData.idNumber}
                onChange={(e) => setKycData({ ...kycData, idNumber: e.target.value })}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#F6C94B] focus:border-[#F6C94B] mb-6"
                placeholder="XXX-XX-XXXX"
                style={{ color: theme.navy }}
              />
              
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl py-3 font-semibold transition disabled:opacity-50"
                style={{ backgroundColor: theme.gold, color: theme.navyDark }}
              >
                {loading ? "Verifying..." : "Submit"}
              </button>
            </form>
          )}

          {step === 3 && (
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-slate-200">
              <h2 className="text-2xl font-bold mb-2" style={{ color: theme.navy, fontFamily: 'Georgia, serif' }}>Choose Your Plan</h2>
              <p className="text-sm mb-6" style={{ color: '#64748b' }}>Select the plan that works best for you.</p>
              
              <div className="space-y-3 mb-6">
                <label
                  className={`flex items-start p-4 rounded-xl border-2 cursor-pointer transition ${
                    selectedPlan === "Basic" ? "border-[#F6C94B] bg-[#F6C94B]/10" : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="plan"
                    value="Basic"
                    checked={selectedPlan === "Basic"}
                    onChange={(e) => setSelectedPlan(e.target.value)}
                    className="mt-1 mr-3"
                  />
                  <div>
                    <div className="font-semibold" style={{ color: theme.navy }}>Basic — Free</div>
                    <div className="text-sm" style={{ color: '#64748b' }}>Pay-per-use, ~1.5% FX spread, $2 transfer fee</div>
                  </div>
                </label>
                
                <label
                  className={`flex items-start p-4 rounded-xl border-2 cursor-pointer transition ${
                    selectedPlan === "Premium" ? "border-[#F6C94B] bg-[#F6C94B]/10" : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="plan"
                    value="Premium"
                    checked={selectedPlan === "Premium"}
                    onChange={(e) => setSelectedPlan(e.target.value)}
                    className="mt-1 mr-3"
                  />
                  <div>
                    <div className="font-semibold flex items-center gap-2" style={{ color: theme.navy }}>
                      Premium — $10/mo
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: theme.gold, color: theme.navyDark }}>RECOMMENDED</span>
                    </div>
                    <div className="text-sm" style={{ color: '#64748b' }}>~0.8% FX spread, free transfers, priority support</div>
                  </div>
                </label>
              </div>
              
              <button
                onClick={handlePlanConfirm}
                disabled={loading}
                className="w-full rounded-xl py-3 font-semibold transition disabled:opacity-50"
                style={{ backgroundColor: theme.gold, color: theme.navyDark }}
              >
                {loading ? "Setting up..." : "Complete Setup"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
