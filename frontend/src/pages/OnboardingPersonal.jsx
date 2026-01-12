import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useSession } from "../contexts/SessionContext";
import { Button } from "../components/ui/button";

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
          <span className="text-sm text-gray-400">Personal Account</span>
        </div>
      </nav>

      {/* Progress Bar */}
      <div className="border-b border-neutral-800 py-4 bg-neutral-900">
        <div className="max-w-md mx-auto px-6">
          <div className="flex justify-between mb-2">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                    step >= s ? "bg-amber-500 text-neutral-900" : "bg-neutral-700 text-gray-400"
                  }`}
                >
                  {s}
                </div>
                {s < 3 && (
                  <div className={`w-16 sm:w-24 h-1 mx-2 rounded ${step > s ? "bg-amber-500" : "bg-neutral-700"}`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs text-gray-500">
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
            <form onSubmit={handleEmailSubmit} className="bg-neutral-900 rounded-2xl p-8 border border-neutral-800">
              <h2 className="text-2xl font-bold text-amber-400 mb-2" style={{ fontFamily: 'Georgia, serif' }}>
                Create Your Account
              </h2>
              <p className="text-sm text-gray-400 mb-6">Enter your email to get started with PBX.</p>
              
              <label className="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-neutral-700 bg-neutral-800 px-4 py-3 text-sm text-gray-100 outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 mb-6"
                placeholder="you@example.com"
                data-testid="onboarding-email-input"
              />
              
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold disabled:opacity-50"
                data-testid="onboarding-continue-btn"
              >
                {loading ? "Sending..." : "Continue"}
              </Button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleKycSubmit} className="bg-neutral-900 rounded-2xl p-8 border border-neutral-800">
              <h2 className="text-2xl font-bold text-amber-400 mb-2" style={{ fontFamily: 'Georgia, serif' }}>
                Verify Your Identity
              </h2>
              <p className="text-sm text-gray-400 mb-6">We need some basic information for compliance.</p>
              
              <label className="block text-sm font-medium text-gray-300 mb-2">Full Legal Name</label>
              <input
                type="text"
                required
                value={kycData.fullName}
                onChange={(e) => setKycData({ ...kycData, fullName: e.target.value })}
                className="w-full rounded-xl border border-neutral-700 bg-neutral-800 px-4 py-3 text-sm text-gray-100 outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 mb-4"
                placeholder="Juan Dela Cruz"
                data-testid="onboarding-name-input"
              />
              
              <label className="block text-sm font-medium text-gray-300 mb-2">Government ID Number</label>
              <input
                type="text"
                required
                value={kycData.idNumber}
                onChange={(e) => setKycData({ ...kycData, idNumber: e.target.value })}
                className="w-full rounded-xl border border-neutral-700 bg-neutral-800 px-4 py-3 text-sm text-gray-100 outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 mb-6"
                placeholder="XXX-XX-XXXX"
                data-testid="onboarding-id-input"
              />
              
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold disabled:opacity-50"
              >
                {loading ? "Verifying..." : "Submit"}
              </Button>
            </form>
          )}

          {step === 3 && (
            <div className="bg-neutral-900 rounded-2xl p-8 border border-neutral-800">
              <h2 className="text-2xl font-bold text-amber-400 mb-2" style={{ fontFamily: 'Georgia, serif' }}>
                Choose Your Plan
              </h2>
              <p className="text-sm text-gray-400 mb-6">Select the plan that works best for you.</p>
              
              <div className="space-y-3 mb-6">
                <label
                  className={`flex items-start p-4 rounded-xl border-2 cursor-pointer transition ${
                    selectedPlan === "Basic" ? "border-amber-500 bg-amber-500/10" : "border-neutral-700 hover:border-neutral-600"
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
                    <div className="font-semibold text-gray-100">Basic — Free</div>
                    <div className="text-sm text-gray-400">PBX Wallet, 15-min FX Lock</div>
                  </div>
                </label>
                
                <label
                  className={`flex items-start p-4 rounded-xl border-2 cursor-pointer transition ${
                    selectedPlan === "Premium" ? "border-amber-500 bg-amber-500/10" : "border-neutral-700 hover:border-neutral-600"
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
                    <div className="font-semibold text-gray-100 flex items-center gap-2">
                      Premium — ₱499/mo
                      <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500 text-neutral-900 font-bold">
                        RECOMMENDED
                      </span>
                    </div>
                    <div className="text-sm text-gray-400">
                      Recurring Transfers, <span className="text-amber-400 font-semibold">1% APY Interest</span>, Priority Support
                    </div>
                  </div>
                </label>
              </div>
              
              <Button
                onClick={handlePlanConfirm}
                disabled={loading}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold disabled:opacity-50"
                data-testid="onboarding-complete-btn"
              >
                {loading ? "Setting up..." : "Complete Setup"}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
