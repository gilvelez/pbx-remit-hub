import React, { useState } from 'react';
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
            <h1 className="text-3xl font-bold mb-2" style={{ color: theme.navy, fontFamily: 'Georgia, serif' }}>
              Welcome to PBX
            </h1>
            <p className="text-sm" style={{ color: '#64748b' }}>Philippine Bayani Exchange</p>
          </div>

          <form onSubmit={handleLogin}>
            <div className="mb-5">
              <label className="mb-2 block text-xs font-semibold" style={{ color: theme.navy }}>
                Email Address
              </label>
              <input
                type="email"
                className="w-full rounded-xl px-4 py-3 text-sm outline-none transition"
                style={{ 
                  backgroundColor: theme.offWhite,
                  border: '1px solid #e2e8f0',
                  color: theme.navy,
                }}
                onFocus={(e) => e.target.style.borderColor = theme.gold}
                onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-2xl px-4 py-3.5 text-sm font-bold transition shadow-lg hover:brightness-105"
              style={{ 
                backgroundColor: theme.gold,
                color: theme.navyDark,
              }}
            >
              Login
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
            Any email works for sandbox testing
          </p>
        </div>

        {/* Back to landing */}
        <div className="mt-6 text-center">
          <Link 
            to="/"
            className="text-sm font-medium hover:underline"
            style={{ color: theme.navy }}
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
