/**
 * PhoneOTP - Phone verification step in onboarding
 * Part of the progressive Remitly-style onboarding flow
 */
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useSession } from "../../contexts/SessionContext";
import { colors, tw } from "../../lib/theme";

export default function PhoneOTP() {
  const navigate = useNavigate();
  const { session, setSession } = useSession();
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [showOtp, setShowOtp] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSendOtp = (e) => {
    e.preventDefault();
    if (!phone || phone.length < 10) return;
    setShowOtp(true);
  };

  const handleVerifyOtp = (e) => {
    e.preventDefault();
    if (otp.length !== 6) return;
    
    setLoading(true);
    // Simulate OTP verification
    setTimeout(() => {
      setSession(prev => ({
        ...prev,
        phoneVerified: true,
        user: { ...prev.user, phone }
      }));
      setLoading(false);
      // Next step: Connect Bank
      navigate('/onboarding/bank');
    }, 1000);
  };

  return (
    <div className={`min-h-screen ${tw.shellBg}`}>
      {/* Header */}
      <header className={`${tw.shellBgSolid} border-b ${tw.borderOnDark}`}>
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-[#F6C94B]/20 border border-[#F6C94B]/40 flex items-center justify-center">
              <span className={`${tw.textGold} font-bold text-xs`}>PBX</span>
            </div>
          </Link>
          <button
            onClick={() => navigate('/welcome')}
            className={`text-sm ${tw.textOnDarkMuted}`}
          >
            Back
          </button>
        </div>
      </header>

      {/* Progress indicator */}
      <div className="max-w-lg mx-auto px-4 py-4">
        <div className="flex gap-2">
          <div className="flex-1 h-1 rounded-full bg-[#F6C94B]" />
          <div className="flex-1 h-1 rounded-full bg-[#F6C94B]" />
          <div className="flex-1 h-1 rounded-full bg-white/20" />
          <div className="flex-1 h-1 rounded-full bg-white/20" />
        </div>
        <p className={`text-xs ${tw.textOnDarkMuted} mt-2`}>Step 2 of 4</p>
      </div>

      {/* Content */}
      <main className="max-w-lg mx-auto px-4 py-6">
        <div className={`${tw.cardBg} rounded-2xl p-6 shadow-lg`}>
          <h1 className={`text-2xl font-bold ${tw.textOnLight} mb-2`}>
            {showOtp ? 'Enter verification code' : 'Verify your phone'}
          </h1>
          <p className={`${tw.textOnLightMuted} mb-6`}>
            {showOtp 
              ? `We sent a 6-digit code to +1 ${phone}`
              : 'We\'ll send you a verification code to secure your account'
            }
          </p>

          {!showOtp ? (
            <form onSubmit={handleSendOtp}>
              <div className="mb-6">
                <label className={`text-sm font-medium ${tw.textOnLightMuted} mb-2 block`}>
                  Phone number
                </label>
                <div className="flex gap-2">
                  <div className="h-12 px-3 flex items-center bg-gray-50 border border-gray-200 rounded-xl text-gray-600">
                    +1
                  </div>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    className="flex-1 h-12 px-4 border border-gray-200 rounded-xl focus:border-[#0A2540] focus:ring-2 focus:ring-[#0A2540]/10 outline-none"
                    placeholder="(555) 123-4567"
                    required
                    data-testid="phone-input"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={phone.length < 10}
                className={`w-full ${tw.btnNavy} rounded-xl h-12 transition disabled:opacity-50`}
                data-testid="send-otp-btn"
              >
                Send Code
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp}>
              <div className="mb-6">
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full h-14 px-4 text-center text-2xl font-mono tracking-[0.5em] border border-gray-200 rounded-xl focus:border-[#0A2540] focus:ring-2 focus:ring-[#0A2540]/10 outline-none"
                  placeholder="000000"
                  maxLength={6}
                  autoFocus
                  required
                  data-testid="otp-input"
                />
              </div>

              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className={`w-full ${tw.btnNavy} rounded-xl h-12 transition disabled:opacity-50 flex items-center justify-center gap-2`}
                data-testid="verify-otp-btn"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Verifying...
                  </>
                ) : (
                  'Verify'
                )}
              </button>

              <button
                type="button"
                onClick={() => setShowOtp(false)}
                className={`w-full ${tw.textOnLightMuted} font-medium py-3 mt-2`}
              >
                Use different number
              </button>

              <p className={`text-xs ${tw.textOnLightMuted} text-center mt-4`}>
                Demo: Enter any 6-digit code
              </p>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
