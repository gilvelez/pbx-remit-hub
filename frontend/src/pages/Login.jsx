import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useSession } from '../contexts/SessionContext';
import { Button } from '../components/ui/button';

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
            <h1 className="text-3xl font-bold text-amber-400 mb-2" style={{ fontFamily: 'Georgia, serif' }}>
              Welcome to PBX
            </h1>
            <p className="text-sm text-gray-400">Philippine Bayani Exchange</p>
          </div>

          <form onSubmit={handleLogin}>
            <div className="mb-5">
              <label className="mb-2 block text-xs font-semibold text-gray-300">
                Email Address
              </label>
              <input
                type="email"
                className="w-full rounded-xl px-4 py-3 text-sm outline-none transition bg-neutral-800 border border-neutral-700 text-gray-100 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                data-testid="login-email-input"
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold rounded-2xl py-3.5"
              data-testid="login-submit-btn"
            >
              Login
            </Button>
          </form>

          <div className="mt-5 text-center">
            <span className="inline-block px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-400">
              Demo Mode (Sandbox)
            </span>
          </div>

          <p className="mt-3 text-center text-xs text-gray-500">
            Any email works for sandbox testing
          </p>
        </div>

        {/* Back to landing */}
        <div className="mt-6 text-center">
          <Link 
            to="/"
            className="text-sm font-medium text-gray-400 hover:text-amber-400 transition"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
