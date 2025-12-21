import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '../contexts/SessionContext';

export default function Verify() {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const { session, setSession } = useSession();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to login if no session
    if (!session.exists) {
      navigate('/login');
      return;
    }
    // Redirect to main app if already verified
    if (session.verified) {
      navigate('/app/send');
    }
  }, [session.exists, session.verified, navigate]);

  const handleVerify = (e) => {
    e.preventDefault();
    setError('');

    // Demo: any 6-digit code works (LOCAL VERIFICATION - NO BACKEND CALL)
    const isSixDigits = /^\d{6}$/.test(code);
    if (!isSixDigits) {
      setError('Enter any 6-digit code (demo).');
      return;
    }

    // Set verified locally (MVP sandbox-only)
    setSession({ ...session, verified: true });
    navigate('/app/send');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="rounded-3xl border border-slate-800 bg-slate-950 p-8 shadow-xl shadow-black/30">
          <div className="mb-6 text-center">
            <div className="mb-3 text-4xl">🔐</div>
            <h1 className="text-2xl font-bold text-white mb-2">Verify Your Identity</h1>
            <p className="text-sm text-slate-400">
              Enter the 6-digit verification code
            </p>
            {session.user?.email && (
              <p className="text-xs text-slate-500 mt-1">
                Sent to {session.user.email}
              </p>
            )}
          </div>

          <form onSubmit={handleVerify}>
            <div className="mb-4">
              <label className="mb-2 block text-xs font-semibold text-slate-300">
                Verification Code
              </label>
              <input
                type="text"
                className="w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-center text-2xl font-mono text-white outline-none focus:border-emerald-400"
                placeholder="000000"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
                required
              />
            </div>

            {error && (
              <div className="mb-4 rounded-xl bg-rose-500/15 px-3 py-2 text-sm text-rose-200">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={code.length !== 6}
              className="w-full rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-bold text-slate-950 hover:bg-emerald-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Verify
            </button>
          </form>

          <p className="mt-4 text-center text-xs text-slate-500">
            Demo mode: Any 6-digit code works for sandbox testing
          </p>
        </div>
      </div>
    </div>
  );
}
