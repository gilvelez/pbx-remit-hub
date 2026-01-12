import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useSession } from '../contexts/SessionContext';
import { Button } from '../components/ui/button';

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
      navigate('/app/dashboard');
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
    navigate('/app/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-neutral-950">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
              <span className="font-extrabold text-lg text-amber-400">PBX</span>
            </div>
          </Link>
        </div>

        <div className="rounded-3xl p-8 bg-neutral-900 border border-neutral-800 shadow-xl">
          <div className="mb-6 text-center">
            <div className="mb-4 inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-500/20">
              <svg className="w-8 h-8 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold mb-2 text-amber-400" style={{ fontFamily: 'Georgia, serif' }}>
              Verify Your Identity
            </h1>
            <p className="text-sm text-gray-400">
              Enter the 6-digit verification code
            </p>
            {session.user?.email && (
              <p className="text-xs mt-1 text-gray-500">
                Sent to {session.user.email}
              </p>
            )}
          </div>

          <form onSubmit={handleVerify}>
            <div className="mb-5">
              <label className="mb-2 block text-xs font-semibold text-gray-300">
                Verification Code
              </label>
              <input
                type="text"
                className="w-full rounded-xl px-4 py-4 text-center text-2xl font-mono outline-none transition bg-neutral-800 border border-neutral-700 text-gray-100 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                style={{ letterSpacing: '0.5em' }}
                placeholder="000000"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
                required
                data-testid="verify-code-input"
              />
            </div>

            {error && (
              <div className="mb-4 rounded-xl px-3 py-2 text-sm bg-red-500/15 text-red-400">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={code.length !== 6}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold rounded-2xl py-3.5 disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid="verify-submit-btn"
            >
              Verify
            </Button>
          </form>

          <div className="mt-5 text-center">
            <span className="inline-block px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-400">
              Demo Mode (Sandbox)
            </span>
          </div>

          <p className="mt-3 text-center text-xs text-gray-500">
            Any 6-digit code works for sandbox testing
          </p>
        </div>

        {/* Back to login */}
        <div className="mt-6 text-center">
          <Link 
            to="/login"
            className="text-sm font-medium text-gray-400 hover:text-amber-400 transition"
          >
            ← Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
