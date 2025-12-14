import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '../contexts/SessionContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const { login } = useSession();
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    if (!email) return;

    login(email);
    navigate('/verify');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="rounded-3xl border border-slate-800 bg-slate-950 p-8 shadow-xl shadow-black/30">
          <div className="mb-6 text-center">
            <h1 className="text-3xl font-bold text-white mb-2">Welcome to PBX</h1>
            <p className="text-sm text-slate-400">Philippine Bayani Exchange</p>
          </div>

          <form onSubmit={handleLogin}>
            <div className="mb-4">
              <label className="mb-2 block text-xs font-semibold text-slate-300">
                Email Address
              </label>
              <input
                type="email"
                className="w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-white outline-none focus:border-emerald-400"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-bold text-slate-950 hover:bg-emerald-400 transition"
            >
              Login
            </button>
          </form>

          <p className="mt-4 text-center text-xs text-slate-500">
            Demo mode: Any email works for sandbox testing
          </p>
        </div>
      </div>
    </div>
  );
}
