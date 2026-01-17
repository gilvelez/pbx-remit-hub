/**
 * PhoneOTP - Phone verification step in onboarding
 * Part of the progressive onboarding flow with country code selector
 * Includes PBX Identity confirmation for internal transfers
 */
import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useSession } from "../../contexts/SessionContext";
import { colors, tw } from "../../lib/theme";

// Country codes with prioritized PH and US at top
const COUNTRY_CODES = [
  // Pinned at top
  { code: "+63", country: "Philippines", flag: "🇵🇭", priority: true },
  { code: "+1", country: "United States", flag: "🇺🇸", priority: true },
  // Other countries (alphabetical)
  { code: "+61", country: "Australia", flag: "🇦🇺" },
  { code: "+43", country: "Austria", flag: "🇦🇹" },
  { code: "+32", country: "Belgium", flag: "🇧🇪" },
  { code: "+55", country: "Brazil", flag: "🇧🇷" },
  { code: "+1", country: "Canada", flag: "🇨🇦" },
  { code: "+86", country: "China", flag: "🇨🇳" },
  { code: "+57", country: "Colombia", flag: "🇨🇴" },
  { code: "+45", country: "Denmark", flag: "🇩🇰" },
  { code: "+20", country: "Egypt", flag: "🇪🇬" },
  { code: "+358", country: "Finland", flag: "🇫🇮" },
  { code: "+33", country: "France", flag: "🇫🇷" },
  { code: "+49", country: "Germany", flag: "🇩🇪" },
  { code: "+30", country: "Greece", flag: "🇬🇷" },
  { code: "+852", country: "Hong Kong", flag: "🇭🇰" },
  { code: "+91", country: "India", flag: "🇮🇳" },
  { code: "+62", country: "Indonesia", flag: "🇮🇩" },
  { code: "+353", country: "Ireland", flag: "🇮🇪" },
  { code: "+972", country: "Israel", flag: "🇮🇱" },
  { code: "+39", country: "Italy", flag: "🇮🇹" },
  { code: "+81", country: "Japan", flag: "🇯🇵" },
  { code: "+60", country: "Malaysia", flag: "🇲🇾" },
  { code: "+52", country: "Mexico", flag: "🇲🇽" },
  { code: "+31", country: "Netherlands", flag: "🇳🇱" },
  { code: "+64", country: "New Zealand", flag: "🇳🇿" },
  { code: "+234", country: "Nigeria", flag: "🇳🇬" },
  { code: "+47", country: "Norway", flag: "🇳🇴" },
  { code: "+92", country: "Pakistan", flag: "🇵🇰" },
  { code: "+51", country: "Peru", flag: "🇵🇪" },
  { code: "+48", country: "Poland", flag: "🇵🇱" },
  { code: "+351", country: "Portugal", flag: "🇵🇹" },
  { code: "+974", country: "Qatar", flag: "🇶🇦" },
  { code: "+7", country: "Russia", flag: "🇷🇺" },
  { code: "+966", country: "Saudi Arabia", flag: "🇸🇦" },
  { code: "+65", country: "Singapore", flag: "🇸🇬" },
  { code: "+27", country: "South Africa", flag: "🇿🇦" },
  { code: "+82", country: "South Korea", flag: "🇰🇷" },
  { code: "+34", country: "Spain", flag: "🇪🇸" },
  { code: "+46", country: "Sweden", flag: "🇸🇪" },
  { code: "+41", country: "Switzerland", flag: "🇨🇭" },
  { code: "+886", country: "Taiwan", flag: "🇹🇼" },
  { code: "+66", country: "Thailand", flag: "🇹🇭" },
  { code: "+90", country: "Turkey", flag: "🇹🇷" },
  { code: "+971", country: "UAE", flag: "🇦🇪" },
  { code: "+44", country: "United Kingdom", flag: "🇬🇧" },
  { code: "+58", country: "Venezuela", flag: "🇻🇪" },
  { code: "+84", country: "Vietnam", flag: "🇻🇳" },
];

const STEPS = {
  PHONE: 'phone',
  OTP: 'otp',
  IDENTITY_CONFIRM: 'identity',
};

export default function PhoneOTP() {
  const navigate = useNavigate();
  const { session, setSession } = useSession();
  const [step, setStep] = useState(STEPS.PHONE);
  const [countryCode, setCountryCode] = useState('+63'); // Default based on role
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Set default country code based on user role
  useEffect(() => {
    if (session?.role === 'sender') {
      setCountryCode('+1'); // US for senders
    } else {
      setCountryCode('+63'); // PH for recipients
    }
  }, [session?.role]);

  const selectedCountry = COUNTRY_CODES.find(c => c.code === countryCode) || COUNTRY_CODES[0];

  // Filter countries based on search
  const filteredCountries = COUNTRY_CODES.filter(c => 
    c.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.code.includes(searchQuery)
  );

  // Sort with priority countries at top
  const sortedCountries = [...filteredCountries].sort((a, b) => {
    if (a.priority && !b.priority) return -1;
    if (!a.priority && b.priority) return 1;
    return 0;
  });

  const handleSendOtp = (e) => {
    e.preventDefault();
    if (!phone || phone.length < 7) return;
    setStep(STEPS.OTP);
  };

  const handleVerifyOtp = (e) => {
    e.preventDefault();
    if (otp.length !== 6) return;
    
    setLoading(true);
    // Simulate OTP verification
    setTimeout(() => {
      // Store E.164 formatted number (country code + number)
      const e164Phone = `${countryCode}${phone}`;
      setSession(prev => ({
        ...prev,
        phoneVerified: true,
        user: { ...prev.user, phone: e164Phone, countryCode }
      }));
      setLoading(false);
      // Show identity confirmation step
      setStep(STEPS.IDENTITY_CONFIRM);
    }, 1000);
  };

  const handleIdentityConfirm = () => {
    // Next step: Connect Bank
    navigate('/onboarding/bank');
  };

  const progressStep = step === STEPS.PHONE ? 1 : step === STEPS.OTP ? 1 : 2;

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
          <div className={`flex-1 h-1 rounded-full ${progressStep >= 2 ? 'bg-[#F6C94B]' : 'bg-white/20'}`} />
          <div className="flex-1 h-1 rounded-full bg-white/20" />
          <div className="flex-1 h-1 rounded-full bg-white/20" />
        </div>
        <p className={`text-xs ${tw.textOnDarkMuted} mt-2`}>
          Step {progressStep + 1} of 4
        </p>
      </div>

      {/* Content */}
      <main className="max-w-lg mx-auto px-4 py-6">
        <div className={`${tw.cardBg} rounded-2xl p-6 shadow-lg`}>
          {/* Phone Input Step */}
          {step === STEPS.PHONE && (
            <>
              <h1 className={`text-2xl font-bold ${tw.textOnLight} mb-2`}>
                Verify your phone
              </h1>
              <p className={`${tw.textOnLightMuted} mb-6`}>
                We'll send you a verification code to secure your account
              </p>

              <form onSubmit={handleSendOtp}>
                <div className="mb-6">
                  <label className={`text-sm font-medium ${tw.textOnLightMuted} mb-2 block`}>
                    Phone number
                  </label>
                  <div className="flex gap-2">
                    {/* Country Code Dropdown */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setDropdownOpen(!dropdownOpen)}
                        className="h-12 px-3 flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-100 transition min-w-[100px]"
                        data-testid="country-code-dropdown"
                      >
                        <span className="text-lg">{selectedCountry.flag}</span>
                        <span className="font-medium">{countryCode}</span>
                        <svg className={`w-4 h-4 text-gray-400 transition ${dropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>

                      {/* Dropdown Menu */}
                      {dropdownOpen && (
                        <>
                          {/* Backdrop */}
                          <div 
                            className="fixed inset-0 z-10" 
                            onClick={() => setDropdownOpen(false)}
                          />
                          
                          {/* Menu */}
                          <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-xl shadow-lg z-20 overflow-hidden">
                            {/* Search */}
                            <div className="p-2 border-b border-gray-100">
                              <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search country..."
                                className="w-full h-9 px-3 text-sm border border-gray-200 rounded-lg focus:border-[#0A2540] outline-none"
                                autoFocus
                              />
                            </div>
                            
                            {/* Country List */}
                            <div className="max-h-60 overflow-y-auto">
                              {sortedCountries.map((country, idx) => (
                                <button
                                  key={`${country.code}-${country.country}-${idx}`}
                                  type="button"
                                  onClick={() => {
                                    setCountryCode(country.code);
                                    setDropdownOpen(false);
                                    setSearchQuery('');
                                  }}
                                  className={`w-full px-3 py-2.5 flex items-center gap-3 hover:bg-gray-50 transition text-left ${
                                    country.code === countryCode ? 'bg-[#0A2540]/5' : ''
                                  } ${country.priority ? 'border-b border-gray-100' : ''}`}
                                >
                                  <span className="text-lg">{country.flag}</span>
                                  <span className="flex-1 text-sm text-gray-700">{country.country}</span>
                                  <span className="text-sm text-gray-500">{country.code}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Phone Number Input */}
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 12))}
                      className="flex-1 h-12 px-4 border border-gray-200 rounded-xl focus:border-[#0A2540] focus:ring-2 focus:ring-[#0A2540]/10 outline-none"
                      placeholder={countryCode === '+63' ? '917 123 4567' : '(555) 123-4567'}
                      required
                      data-testid="phone-input"
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1.5">
                    {session?.role === 'recipient' 
                      ? 'Default: Philippines (+63) for recipients'
                      : 'Default: United States (+1) for senders'
                    }
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={phone.length < 7}
                  className={`w-full ${tw.btnNavy} rounded-xl h-12 transition disabled:opacity-50`}
                  data-testid="send-otp-btn"
                >
                  Send Code
                </button>
              </form>
            </>
          )}

          {/* OTP Verification Step */}
          {step === STEPS.OTP && (
            <>
              <h1 className={`text-2xl font-bold ${tw.textOnLight} mb-2`}>
                Enter verification code
              </h1>
              <p className={`${tw.textOnLightMuted} mb-6`}>
                We sent a 6-digit code to {countryCode} {phone}
              </p>

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
                  onClick={() => setStep(STEPS.PHONE)}
                  className={`w-full ${tw.textOnLightMuted} font-medium py-3 mt-2`}
                >
                  Use different number
                </button>

                <p className={`text-xs ${tw.textOnLightMuted} text-center mt-4`}>
                  Demo: Enter any 6-digit code
                </p>
              </form>
            </>
          )}

          {/* Connect PBX Identity Confirmation Step */}
          {step === STEPS.IDENTITY_CONFIRM && (
            <>
              <div className="text-center mb-6">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h1 className={`text-2xl font-bold ${tw.textOnLight} mb-2`}>
                  Connect Your PBX Identity
                </h1>
                <p className={`${tw.textOnLightMuted}`}>
                  These allow instant PBX-to-PBX transfers
                </p>
              </div>

              {/* Identity Summary */}
              <div className="bg-gray-50 rounded-xl p-4 mb-6 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#0A2540]/10 flex items-center justify-center">
                    <svg className="w-5 h-5 text-[#0A2540]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-500">Email</p>
                    <p className="font-medium text-[#0A2540]">{session?.user?.email || '—'}</p>
                  </div>
                  <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">Verified</span>
                </div>
                
                <div className="border-t border-gray-200 pt-3 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#0A2540]/10 flex items-center justify-center">
                    <svg className="w-5 h-5 text-[#0A2540]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-500">Phone</p>
                    <p className="font-medium text-[#0A2540]">{session?.user?.phone || '—'}</p>
                  </div>
                  <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">Verified</span>
                </div>
              </div>

              {/* Benefits */}
              <div className="bg-[#C9A24D]/10 border border-[#C9A24D]/20 rounded-xl p-4 mb-6">
                <p className="text-sm font-medium text-[#0A2540] mb-2">With your PBX identity, you can:</p>
                <ul className="text-sm text-gray-600 space-y-1.5">
                  <li className="flex items-center gap-2">
                    <span className="text-[#C9A24D]">✓</span>
                    Send to PBX users instantly (free)
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-[#C9A24D]">✓</span>
                    Receive USD from other PBX users
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-[#C9A24D]">✓</span>
                    Be found by friends & family on PBX
                  </li>
                </ul>
              </div>

              <button
                onClick={handleIdentityConfirm}
                className={`w-full ${tw.btnNavy} rounded-xl h-12 transition`}
                data-testid="identity-confirm-btn"
              >
                Continue
              </button>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
