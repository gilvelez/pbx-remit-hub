import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useSession } from '../contexts/SessionContext';

// Theme colors
const theme = {
  navy: '#0A2540',
  navyDark: '#061C33',
  gold: '#F6C94B',
  goldDark: '#D4A520',
  red: '#C1121F',
  offWhite: '#FAFAF7',
};

export default function Verify() {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const { session, setSession } = useSession();
  const navigate = useNavigate();

  useEffect(() => {
    if (!session.exists) {
      navigate('/login');
      return;
    }
    if (session.verified) {
      navigate('/app/send');
    }
  }, [session.exists, session.verified, navigate]);

  const handleVerify = (e) => {
    e.preventDefault();
    setError('');

    const isSixDigits = /^\d{6}$/.test(code);
    if (!isSixDigits) {
      setError('Enter any 6-digit code (demo).');
      return;
    }

    setSession({ ...session, verified: true });
    navigate('/app/send');
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4"
      style={{ 
        backgroundColor: theme.offWhite,
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23D4A520' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      }}
    >
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-[#f6c94b]/20 border border-[#f6c94b]/40 flex items-center justify-center">
              <span className="font-extrabold text-lg" style={{ color: theme.navy }}>PBX</span>
            </div>
          </Link>
        </div>

        <div 
          className="rounded-3xl p-8 shadow-xl"
          style={{ 
            backgroundColor: 'white',
            border: '1px solid rgba(10, 37, 64, 0.1)',
          }}
        >
          <div className="mb-6 text-center">
            <div className="mb-4 inline-flex items-center justify-center w-16 h-16 rounded-full" style={{ backgroundColor: `${theme.gold}20` }}>
              <svg className="w-8 h-8" style={{ color: theme.gold }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold mb-2" style={{ color: theme.navy, fontFamily: 'Georgia, serif' }}>
              Verify Your Identity
            </h1>
            <p className="text-sm" style={{ color: '#64748b' }}>
              Enter the 6-digit verification code
            </p>
            {session.user?.email && (
              <p className="text-xs mt-1" style={{ color: '#94a3b8' }}>
                Sent to {session.user.email}
              </p>
            )}
          </div>

          <form onSubmit={handleVerify}>
            <div className="mb-5">
              <label className="mb-2 block text-xs font-semibold" style={{ color: theme.navy }}>
                Verification Code
              </label>
              <input
                type="text"
                className="w-full rounded-xl px-4 py-4 text-center text-2xl font-mono outline-none transition"
                style={{ 
                  backgroundColor: theme.offWhite,
                  border: '1px solid #e2e8f0',
                  color: theme.navy,
                  letterSpacing: '0.5em',
                }}
                onFocus={(e) => e.target.style.borderColor = theme.gold}
                onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                placeholder="000000"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
                required
              />
            </div>

            {error && (
              <div 
                className="mb-4 rounded-xl px-3 py-2 text-sm"
                style={{ 
                  backgroundColor: `${theme.red}15`,
                  color: theme.red,
                }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={code.length !== 6}
              className="w-full rounded-2xl px-4 py-3.5 text-sm font-bold transition shadow-lg hover:brightness-105 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ 
                backgroundColor: theme.gold,
                color: theme.navyDark,
              }}
            >
              Verify
            </button>
          </form>

          <div className="mt-5 text-center">
            <span 
              className="inline-block px-3 py-1.5 rounded-full text-xs font-semibold"
              style={{ 
                backgroundColor: `${theme.gold}20`,
                color: theme.goldDark,
              }}
            >
              Demo Mode (Sandbox)
            </span>
          </div>

          <p className="mt-3 text-center text-xs" style={{ color: '#94a3b8' }}>
            Any 6-digit code works for sandbox testing
          </p>
        </div>

        {/* Back to login */}
        <div className="mt-6 text-center">
          <Link 
            to="/login"
            className="text-sm font-medium hover:underline"
            style={{ color: theme.navy }}
          >
            ← Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
