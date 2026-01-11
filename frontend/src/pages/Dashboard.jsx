import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSession } from "../contexts/SessionContext";
import FXSimulator from "../components/FXSimulator";

// Theme colors
const theme = {
  navy: '#0A2540',
  navyDark: '#061C33',
  gold: '#F6C94B',
  goldDark: '#D4A520',
  offWhite: '#FAFAF7',
};

export default function Dashboard({ balances, remittances }) {
  const { session, logout } = useSession();
  const navigate = useNavigate();
  const userPlan = session?.plan || "Basic";
  const isBusiness = session?.isBusiness || false;

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Default balances if not provided
  const bal = balances || { usd: 1250.00, usdc: 0 };
  const txns = remittances || [];

  return (
    <div className="min-h-screen" style={{ backgroundColor: theme.offWhite }}>
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-2xl flex items-center justify-center" style={{ backgroundColor: `${theme.gold}20`, border: `1px solid ${theme.gold}40` }}>
                <span className="font-extrabold text-sm" style={{ color: theme.navy }}>PBX</span>
              </div>
            </Link>
            <div>
              <div className="font-semibold text-sm" style={{ color: theme.navy }}>Dashboard</div>
              <div className="flex items-center gap-2">
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: `${theme.gold}30`, color: theme.goldDark }}>
                  {userPlan} Plan
                </span>
                {isBusiness && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">Business</span>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Link
              to="/app/send"
              className="rounded-xl px-4 py-2 text-sm font-semibold transition"
              style={{ backgroundColor: theme.gold, color: theme.navyDark }}
            >
              Send Money
            </Link>
            <button
              onClick={handleLogout}
              className="rounded-xl px-4 py-2 text-sm font-semibold border border-slate-200 transition hover:bg-slate-50"
              style={{ color: theme.navy }}
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold mb-6" style={{ color: theme.navy, fontFamily: 'Georgia, serif' }}>
          Welcome back{session?.user?.fullName ? `, ${session.user.fullName.split(' ')[0]}` : ''}!
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Wallet Balance Card */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
              <h2 className="text-sm font-medium mb-3" style={{ color: '#64748b' }}>Wallet Balance</h2>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold" style={{ color: theme.navy }}>
                  ${bal.usd.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
                <span className="text-lg" style={{ color: '#64748b' }}>USD</span>
              </div>
              {bal.usdc > 0 && (
                <p className="mt-2 text-sm" style={{ color: '#64748b' }}>
                  USDC: ${bal.usdc.toFixed(2)}
                </p>
              )}
              <div className="mt-4 flex gap-3">
                <Link
                  to="/app/send"
                  className="rounded-xl px-4 py-2 text-sm font-semibold transition"
                  style={{ backgroundColor: theme.gold, color: theme.navyDark }}
                >
                  Send Money
                </Link>
                <Link
                  to="/app/wallet"
                  className="rounded-xl px-4 py-2 text-sm font-semibold border border-slate-200 transition hover:bg-slate-50"
                  style={{ color: theme.navy }}
                >
                  View Wallet
                </Link>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
              <h2 className="text-lg font-bold mb-4" style={{ color: theme.navy }}>Recent Activity</h2>
              {txns.length > 0 ? (
                <ul className="space-y-3">
                  {txns.slice(0, 5).map((tx) => (
                    <li key={tx.id} className="flex items-center justify-between p-3 rounded-xl" style={{ backgroundColor: theme.offWhite }}>
                      <div>
                        <div className="font-medium text-sm" style={{ color: theme.navy }}>{tx.recipientName}</div>
                        <div className="text-xs" style={{ color: '#94a3b8' }}>
                          {new Date(tx.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-sm" style={{ color: theme.navy }}>
                          ${tx.amountUsd?.toFixed(2) || tx.totalChargeUsd?.toFixed(2)}
                        </div>
                        <div className="text-xs" style={{ color: '#10b981' }}>
                          {tx.status || 'Completed'}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-center py-8">
                  <p className="text-sm" style={{ color: '#94a3b8' }}>No transactions yet</p>
                  <Link
                    to="/app/send"
                    className="inline-block mt-3 text-sm font-medium hover:underline"
                    style={{ color: theme.gold }}
                  >
                    Make your first transfer →
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* FX Simulator */}
            <FXSimulator compact />

            {/* Upgrade CTA */}
            {(userPlan === "Basic" || userPlan === "SME") && (
              <div className="rounded-2xl p-5 border-2" style={{ backgroundColor: `${theme.gold}10`, borderColor: `${theme.gold}40` }}>
                <h3 className="font-bold mb-2" style={{ color: theme.navy }}>
                  {userPlan === "Basic" ? "Upgrade to Premium" : "Explore Enterprise"}
                </h3>
                <p className="text-sm mb-4" style={{ color: '#64748b' }}>
                  {userPlan === "Basic"
                    ? "Get better FX rates (~0.8% spread) and zero transfer fees for just $10/month."
                    : "Unlock custom pricing, unlimited volume, and dedicated account management."}
                </p>
                <Link
                  to="/pricing"
                  className="inline-block rounded-xl px-4 py-2 text-sm font-semibold transition"
                  style={{ backgroundColor: theme.gold, color: theme.navyDark }}
                >
                  See Upgrade Options
                </Link>
              </div>
            )}

            {/* Quick Links */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
              <h3 className="font-bold mb-3" style={{ color: theme.navy }}>Quick Links</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link to="/pricing" className="hover:underline" style={{ color: theme.gold }}>View Pricing Plans</Link>
                </li>
                <li>
                  <Link to="/how-it-works" className="hover:underline" style={{ color: theme.gold }}>How PBX Works</Link>
                </li>
                <li>
                  <Link to="/roadmap" className="hover:underline" style={{ color: theme.gold }}>Product Roadmap</Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
