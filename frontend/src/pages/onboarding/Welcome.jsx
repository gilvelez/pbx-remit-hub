/**
 * Welcome - First step in onboarding
 * CRITICAL: Role selection determines entire UX path
 * Flow: Welcome → Role Selection → Corridor → Signup → (Phone OTP → Connect Bank → Add Recipient)
 */
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useSession } from "../../contexts/SessionContext";
import { tw } from "../../lib/theme";

const STEPS = {
  WELCOME: 'welcome',
  ROLE: 'role',           // NEW: Role selection step
  CORRIDOR: 'corridor',
  SIGNUP: 'signup',
  ACCOUNT_TYPE: 'account_type',
};

export default function Welcome() {
  const { login, setSession, setRole } = useSession();
  const navigate = useNavigate();
  const [step, setStep] = useState(STEPS.WELCOME);
  
  // Form data
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRoleLocal] = useState(null);  // 'sender' or 'recipient'
  const [accountType, setAccountType] = useState('personal');

  const handleSignup = (e) => {
    e.preventDefault();
    if (!email) return;
    login(email);
    setStep(STEPS.ACCOUNT_TYPE);
  };

  const handleRoleSelection = async (selectedRole) => {
    setRoleLocal(selectedRole);
    // Save role to session (triggers backend persistence via setRole)
    await setRole(selectedRole);
    setStep(STEPS.CORRIDOR);
  };

  const handleAccountType = () => {
    setSession(prev => ({ ...prev, accountType, role: role }));
    // Next step: Phone OTP (separate page)
    navigate('/onboarding/phone');
  };

  // Calculate progress based on current step
  const getProgressStep = () => {
    switch (step) {
      case STEPS.ROLE: return 1;
      case STEPS.CORRIDOR: return 2;
      case STEPS.SIGNUP: return 3;
      case STEPS.ACCOUNT_TYPE: return 4;
      default: return 0;
    }
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
          {step !== STEPS.WELCOME && (
            <button
              onClick={() => navigate('/')}
              className={`text-sm ${tw.textOnDarkMuted}`}
            >
              Cancel
            </button>
          )}
        </div>
      </header>

      {/* Progress indicator (only after welcome) */}
      {step !== STEPS.WELCOME && (
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div 
                key={i}
                className={`flex-1 h-1 rounded-full ${getProgressStep() >= i ? 'bg-[#F6C94B]' : 'bg-white/20'}`} 
              />
            ))}
          </div>
          <p className={`text-xs ${tw.textOnDarkMuted} mt-2`}>Step {getProgressStep()} of 4</p>
        </div>
      )}

      {/* Content */}
      <main className="max-w-lg mx-auto px-4 py-6">
        {step === STEPS.WELCOME && (
          <WelcomeStep onContinue={() => setStep(STEPS.ROLE)} />
        )}

        {step === STEPS.ROLE && (
          <div className={`${tw.cardBg} rounded-2xl p-6 shadow-lg`}>
            <RoleSelectionStep onSelect={handleRoleSelection} />
          </div>
        )}

        {step === STEPS.CORRIDOR && (
          <div className={`${tw.cardBg} rounded-2xl p-6 shadow-lg`}>
            <CorridorStep role={role} onContinue={() => setStep(STEPS.SIGNUP)} />
          </div>
        )}

        {step === STEPS.SIGNUP && (
          <div className={`${tw.cardBg} rounded-2xl p-6 shadow-lg`}>
            <SignupStep
              email={email}
              setEmail={setEmail}
              password={password}
              setPassword={setPassword}
              onSubmit={handleSignup}
            />
          </div>
        )}

        {step === STEPS.ACCOUNT_TYPE && (
          <div className={`${tw.cardBg} rounded-2xl p-6 shadow-lg`}>
            <AccountTypeStep
              role={role}
              accountType={accountType}
              setAccountType={setAccountType}
              onContinue={handleAccountType}
            />
          </div>
        )}
      </main>

      {/* Compliance Footer */}
      <footer className="max-w-lg mx-auto px-4 py-6">
        <p className="text-xs text-center text-white/40">
          PBX is a technology platform facilitating payment routing and settlement through licensed third-party financial institutions. PBX does not hold customer deposits or provide banking or remittance services.
        </p>
      </footer>
    </div>
  );
}

// Welcome Carousel Step
function WelcomeStep({ onContinue }) {
  const [slide, setSlide] = useState(0);
  
  const slides = [
    {
      icon: (
        <svg className="w-16 h-16 text-[#F6C94B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      title: "Send & receive payments",
      subtitle: "Fast, secure transfers between the US and Philippines"
    },
    {
      icon: (
        <svg className="w-16 h-16 text-[#F6C94B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      title: "Safe & secure",
      subtitle: "Bank-level encryption protects your money and data"
    },
    {
      icon: (
        <svg className="w-16 h-16 text-[#F6C94B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
      title: "Great rates, no fees",
      subtitle: "Competitive exchange rates with transparent pricing"
    }
  ];

  return (
    <div className="text-center">
      {/* Slide content */}
      <div className="py-12">
        <div className="flex justify-center mb-6">
          {slides[slide].icon}
        </div>
        <h1 className={`text-2xl font-bold ${tw.textOnDark} mb-3`}>
          {slides[slide].title}
        </h1>
        <p className={`${tw.textOnDarkMuted} max-w-xs mx-auto`}>
          {slides[slide].subtitle}
        </p>
      </div>

      {/* Dots */}
      <div className="flex justify-center gap-2 mb-8">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setSlide(i)}
            className={`h-2 rounded-full transition ${
              i === slide ? 'bg-[#F6C94B] w-6' : 'bg-white/30 w-2'
            }`}
          />
        ))}
      </div>

      {/* Actions */}
      <div className="space-y-3">
        <button
          onClick={onContinue}
          className={`w-full ${tw.btnPrimary} rounded-xl h-12 transition`}
          data-testid="welcome-get-started"
        >
          Get Started
        </button>
        <Link
          to="/login"
          className={`block w-full text-center ${tw.textOnDarkMuted} font-medium py-3`}
        >
          Already have an account? Log in
        </Link>
      </div>
    </div>
  );
}

// NEW: Role Selection Step - MANDATORY
function RoleSelectionStep({ onSelect }) {
  return (
    <div>
      <h1 className={`text-2xl font-bold ${tw.textOnLight} mb-2`}>How will you use PBX?</h1>
      <p className={`${tw.textOnLightMuted} mb-6`}>This determines your dashboard and available features</p>

      <div className="space-y-4">
        {/* Sender Option */}
        <button
          onClick={() => onSelect('sender')}
          className="w-full flex items-start gap-4 p-5 bg-white rounded-xl border-2 border-gray-200 hover:border-[#0A2540] transition text-left group"
          data-testid="role-sender"
        >
          <div className="w-14 h-14 rounded-full bg-[#0A2540]/10 flex items-center justify-center flex-shrink-0">
            <svg className="w-7 h-7 text-[#0A2540]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </div>
          <div className="flex-1">
            <div className="font-semibold text-[#0A2540] text-lg mb-1">I am sending payments</div>
            <div className="text-sm text-gray-500">
              Employer, business, or payer sending funds to recipients in the Philippines
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              <span className="text-xs bg-gray-100 px-2 py-1 rounded">Batch payouts</span>
              <span className="text-xs bg-gray-100 px-2 py-1 rounded">Recipient management</span>
              <span className="text-xs bg-gray-100 px-2 py-1 rounded">Reports</span>
            </div>
          </div>
          <svg className="w-5 h-5 text-gray-400 group-hover:text-[#0A2540] flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Recipient Option */}
        <button
          onClick={() => onSelect('recipient')}
          className="w-full flex items-start gap-4 p-5 bg-white rounded-xl border-2 border-gray-200 hover:border-[#0A2540] transition text-left group"
          data-testid="role-recipient"
        >
          <div className="w-14 h-14 rounded-full bg-[#C9A24D]/10 flex items-center justify-center flex-shrink-0">
            <svg className="w-7 h-7 text-[#C9A24D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>
          <div className="flex-1">
            <div className="font-semibold text-[#0A2540] text-lg mb-1">I am receiving payments</div>
            <div className="text-sm text-gray-500">
              Recipient or end user receiving USD income from employers or platforms
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              <span className="text-xs bg-[#C9A24D]/10 text-[#C9A24D] px-2 py-1 rounded">USD wallet</span>
              <span className="text-xs bg-[#C9A24D]/10 text-[#C9A24D] px-2 py-1 rounded">FX conversion</span>
              <span className="text-xs bg-[#C9A24D]/10 text-[#C9A24D] px-2 py-1 rounded">Pay bills</span>
            </div>
          </div>
          <svg className="w-5 h-5 text-gray-400 group-hover:text-[#0A2540] flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// Corridor Selection Step
function CorridorStep({ role, onContinue }) {
  return (
    <div>
      <h1 className={`text-2xl font-bold ${tw.textOnLight} mb-2`}>
        {role === 'sender' ? 'Where are you sending?' : 'Where are you receiving from?'}
      </h1>
      <p className={`${tw.textOnLightMuted} mb-6`}>Select your transfer corridor</p>

      <button
        onClick={onContinue}
        className="w-full flex items-center gap-4 p-4 bg-white rounded-xl border-2 border-[#0A2540] mb-4 hover:bg-gray-50 transition"
        data-testid="corridor-us-ph"
      >
        <div className="flex items-center gap-2">
          <span className="text-2xl">🇺🇸</span>
          <span className="text-gray-400">{role === 'sender' ? '→' : '←'}</span>
          <span className="text-2xl">🇵🇭</span>
        </div>
        <div className="text-left flex-1">
          <div className="font-semibold text-[#1A1A1A]">
            {role === 'sender' ? 'United States → Philippines' : 'United States → Philippines'}
          </div>
          <div className="text-sm text-gray-500">USD to PHP</div>
        </div>
        <div className="w-6 h-6 rounded-full bg-[#0A2540] flex items-center justify-center">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      </button>

      <div className={`text-center text-sm ${tw.textOnLightMuted} mt-8`}>
        More corridors coming soon
      </div>
    </div>
  );
}

// Signup Step
function SignupStep({ email, setEmail, password, setPassword, onSubmit }) {
  return (
    <div>
      <h1 className={`text-2xl font-bold ${tw.textOnLight} mb-2`}>Create your account</h1>
      <p className={`${tw.textOnLightMuted} mb-6`}>Enter your email to get started</p>

      <form onSubmit={onSubmit}>
        <div className="mb-4">
          <label className={`text-sm font-medium ${tw.textOnLightMuted} mb-2 block`}>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full h-12 px-4 border border-gray-200 rounded-xl focus:border-[#0A2540] focus:ring-2 focus:ring-[#0A2540]/10 outline-none"
            placeholder="you@example.com"
            required
            data-testid="signup-email"
          />
        </div>

        <div className="mb-6">
          <label className={`text-sm font-medium ${tw.textOnLightMuted} mb-2 block`}>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full h-12 px-4 border border-gray-200 rounded-xl focus:border-[#0A2540] focus:ring-2 focus:ring-[#0A2540]/10 outline-none"
            placeholder="Create a password"
            data-testid="signup-password"
          />
        </div>

        <button
          type="submit"
          className={`w-full ${tw.btnNavy} rounded-xl h-12 transition mb-4`}
          data-testid="signup-submit"
        >
          Continue
        </button>
      </form>

      {/* Social Login */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-white text-gray-500">or continue with</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button className="flex items-center justify-center gap-2 h-12 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition">
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          <span className="font-medium text-gray-700">Google</span>
        </button>
        <button className="flex items-center justify-center gap-2 h-12 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
          </svg>
          <span className="font-medium text-gray-700">Apple</span>
        </button>
      </div>

      <p className={`text-xs ${tw.textOnLightMuted} text-center mt-6`}>
        By continuing, you agree to our <a href="/terms" className="text-[#0A2540] underline">Terms</a> and <a href="/privacy" className="text-[#0A2540] underline">Privacy Policy</a>
      </p>
    </div>
  );
}

// Account Type Step
function AccountTypeStep({ role, accountType, setAccountType, onContinue }) {
  // For recipients, skip this step or show different options
  if (role === 'recipient') {
    return (
      <div>
        <h1 className={`text-2xl font-bold ${tw.textOnLight} mb-2`}>Almost there!</h1>
        <p className={`${tw.textOnLightMuted} mb-6`}>
          Your recipient account is being set up. You&apos;ll be able to receive USD and convert to PHP.
        </p>

        <div className="bg-[#C9A24D]/10 border border-[#C9A24D]/20 rounded-xl p-4 mb-6">
          <h3 className="font-medium text-[#0A2540] mb-2">What you can do:</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-center gap-2">
              <svg className="w-4 h-4 text-[#C9A24D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Hold USD in your wallet
            </li>
            <li className="flex items-center gap-2">
              <svg className="w-4 h-4 text-[#C9A24D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Convert USD to PHP at great rates
            </li>
            <li className="flex items-center gap-2">
              <svg className="w-4 h-4 text-[#C9A24D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Pay bills directly from your balance
            </li>
            <li className="flex items-center gap-2">
              <svg className="w-4 h-4 text-[#C9A24D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Transfer to GCash, Maya, or bank
            </li>
          </ul>
        </div>

        <button
          onClick={onContinue}
          className={`w-full ${tw.btnNavy} rounded-xl h-12 transition`}
          data-testid="account-type-continue"
        >
          Continue
        </button>
      </div>
    );
  }

  // For senders, show business/personal selection
  return (
    <div>
      <h1 className={`text-2xl font-bold ${tw.textOnLight} mb-2`}>What type of account?</h1>
      <p className={`${tw.textOnLightMuted} mb-6`}>Choose the account that best fits your needs</p>

      <div className="space-y-3 mb-6">
        <button
          onClick={() => setAccountType('personal')}
          className={`w-full flex items-center gap-4 p-4 bg-white rounded-xl border-2 transition ${
            accountType === 'personal' ? 'border-[#0A2540]' : 'border-gray-200'
          }`}
          data-testid="account-personal"
        >
          <div className="w-12 h-12 rounded-full bg-[#0A2540]/10 flex items-center justify-center">
            <svg className="w-6 h-6 text-[#0A2540]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div className="text-left flex-1">
            <div className="font-semibold text-[#1A1A1A]">Personal</div>
            <div className="text-sm text-gray-500">Send money to family & friends</div>
          </div>
          {accountType === 'personal' && (
            <div className="w-6 h-6 rounded-full bg-[#0A2540] flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          )}
        </button>

        <button
          onClick={() => setAccountType('business')}
          className={`w-full flex items-center gap-4 p-4 bg-white rounded-xl border-2 transition ${
            accountType === 'business' ? 'border-[#0A2540]' : 'border-gray-200'
          }`}
          data-testid="account-business"
        >
          <div className="w-12 h-12 rounded-full bg-[#0A2540]/10 flex items-center justify-center">
            <svg className="w-6 h-6 text-[#0A2540]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <div className="text-left flex-1">
            <div className="font-semibold text-[#1A1A1A]">Business</div>
            <div className="text-sm text-gray-500">Payroll, suppliers & more</div>
          </div>
          {accountType === 'business' && (
            <div className="w-6 h-6 rounded-full bg-[#0A2540] flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          )}
        </button>
      </div>

      <button
        onClick={onContinue}
        className={`w-full ${tw.btnNavy} rounded-xl h-12 transition`}
        data-testid="account-type-continue"
      >
        Continue
      </button>
    </div>
  );
}
