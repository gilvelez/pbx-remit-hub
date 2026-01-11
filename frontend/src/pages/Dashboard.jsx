import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSession } from "../contexts/SessionContext";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Progress } from "../components/ui/progress";
import FXQuoteSimulator from "../components/FXQuoteSimulator";

export default function Dashboard({ balances, remittances }) {
  const { session, logout } = useSession();
  const navigate = useNavigate();
  const userPlan = session?.plan || "Basic";
  const isBusiness = session?.isBusiness || false;
  const isPremium = userPlan === "Premium";
  const userName = session?.user?.fullName?.split(' ')[0] || session?.user?.company?.name || "User";

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Default balances if not provided (in PHP)
  const bal = balances || { php: 50000.00, usd: 0 };
  const txns = remittances || [];

  // Calculate interest for Premium users (1% APY)
  const yearlyRate = 0.01;
  const monthlyInterest = isPremium ? (bal.php * yearlyRate) / 12 : 0;

  // Simulated FX quote lock state (would come from context in real app)
  const [quoteActive, setQuoteActive] = useState(false);
  const [quoteData, setQuoteData] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);

  // Simulate an active quote for demo
  useEffect(() => {
    // Demo: simulate user has an active quote
    const demoQuote = {
      amountUsd: 100,
      rate: 56.00,
      amountPhp: 5600,
    };
    setQuoteData(demoQuote);
    setQuoteActive(true);
    setTimeLeft(12 * 60 + 30); // 12:30 remaining

    const timer = setInterval(() => {
      setTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (secs) => {
    const min = Math.floor(secs / 60);
    const sec = secs % 60;
    return `${min}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-gray-100">
      {/* Header */}
      <header className="border-b border-neutral-800 sticky top-0 z-50 bg-neutral-950/95 backdrop-blur">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-2xl flex items-center justify-center bg-amber-500/20 border border-amber-500/40">
                <span className="font-extrabold text-sm text-amber-400">PBX</span>
              </div>
            </Link>
            <div>
              <div className="font-semibold text-sm text-gray-100">Dashboard</div>
              <div className="flex items-center gap-2">
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400">
                  {userPlan} Plan
                </span>
                {isBusiness && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400">Business</span>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Link
              to="/app/send"
              className="rounded-xl px-4 py-2 text-sm font-semibold bg-red-600 hover:bg-red-700 text-white transition"
              data-testid="dashboard-send-money-btn"
            >
              Send Money
            </Link>
            <button
              onClick={handleLogout}
              className="rounded-xl px-4 py-2 text-sm font-semibold border border-neutral-700 text-gray-300 hover:bg-neutral-800 transition"
              data-testid="dashboard-logout-btn"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold mb-6 text-amber-400" style={{ fontFamily: 'Georgia, serif' }}>
          Hello, {userName} 👋
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Wallet Balance Card */}
            <Card className="bg-neutral-900 border-neutral-800">
              <CardHeader>
                <CardTitle className="text-lg text-gray-300">Your PBX Wallet Balance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-amber-400" data-testid="wallet-balance">
                    ₱{bal.php.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-lg text-gray-500">PHP</span>
                </div>
                
                {/* Yield Indicator */}
                {isPremium ? (
                  <div className="mt-3 p-3 rounded-xl bg-green-500/10 border border-green-500/30">
                    <p className="text-sm text-green-400" data-testid="yield-indicator">
                      💰 Earning ~₱{monthlyInterest.toLocaleString(undefined, { maximumFractionDigits: 2 })} per month in interest (1% APY)
                    </p>
                  </div>
                ) : (
                  <div className="mt-3 p-3 rounded-xl bg-neutral-800 border border-neutral-700">
                    <p className="text-sm text-gray-400">
                      💡 Upgrade to Premium to earn <span className="text-amber-400 font-semibold">1% APY</span> on your balance
                    </p>
                  </div>
                )}

                <div className="mt-4 flex gap-3">
                  <Link
                    to="/app/send"
                    className="rounded-xl px-4 py-2 text-sm font-semibold bg-red-600 hover:bg-red-700 text-white transition"
                  >
                    Send Money
                  </Link>
                  <Link
                    to="/app/wallet"
                    className="rounded-xl px-4 py-2 text-sm font-semibold border border-neutral-700 text-gray-300 hover:bg-neutral-800 transition"
                  >
                    View Wallet
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* FX Rate Lock Timer (if active) */}
            {quoteActive && quoteData && timeLeft > 0 && (
              <Card className="bg-neutral-800 border-neutral-700">
                <CardHeader>
                  <CardTitle className="text-lg text-gray-100 flex items-center gap-2">
                    💱 FX Rate Locked In
                    <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400">Active</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300 mb-2">You have secured an exchange rate for an upcoming transfer:</p>
                  <p className="text-lg mb-3">
                    <strong className="text-amber-400">${quoteData.amountUsd}</strong>
                    <span className="text-gray-400"> = </span>
                    <strong className="text-amber-400">₱{quoteData.amountPhp.toLocaleString()}</strong>
                    <span className="text-gray-500 text-sm ml-2">at rate ₱{quoteData.rate.toFixed(2)} per $1</span>
                  </p>
                  <div className="mb-2">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-400">Rate locked for</span>
                      <span className="font-bold text-amber-400" data-testid="fx-lock-timer">{formatTime(timeLeft)}</span>
                    </div>
                    <Progress value={(timeLeft / (15 * 60)) * 100} className="h-2 bg-neutral-700" />
                  </div>
                  <Button className="mt-3 bg-red-600 hover:bg-red-700 text-white">
                    Complete Transfer Now
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Recent Activity */}
            <Card className="bg-neutral-900 border-neutral-800">
              <CardHeader>
                <CardTitle className="text-lg text-gray-100">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                {txns.length > 0 ? (
                  <ul className="space-y-3">
                    {txns.slice(0, 5).map((tx) => (
                      <li key={tx.id} className="flex items-center justify-between p-3 rounded-xl bg-neutral-800">
                        <div>
                          <div className="font-medium text-sm text-gray-100">{tx.recipientName}</div>
                          <div className="text-xs text-gray-500">
                            {new Date(tx.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-sm text-gray-100">
                            ₱{tx.amountPhp?.toFixed(2) || tx.totalChargeUsd?.toFixed(2)}
                          </div>
                          <div className="text-xs text-green-400">
                            {tx.status || 'Completed'}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-sm text-gray-500">No transactions yet</p>
                    <Link
                      to="/app/send"
                      className="inline-block mt-3 text-sm font-medium text-amber-400 hover:underline"
                    >
                      Make your first transfer →
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* FX Simulator */}
            <FXQuoteSimulator compact />

            {/* Upgrade CTA */}
            {(userPlan === "Basic") && (
              <Card className="bg-amber-500/10 border-2 border-amber-500/40">
                <CardContent className="pt-6">
                  <h3 className="font-bold text-amber-400 mb-2">Upgrade to Premium</h3>
                  <p className="text-sm text-gray-300 mb-4">
                    Get <strong>1% APY</strong> on your balance, recurring transfers, and priority support for just <strong>₱499/month</strong>.
                  </p>
                  <Link
                    to="/pricing"
                    className="inline-block rounded-xl px-4 py-2 text-sm font-semibold bg-red-600 hover:bg-red-700 text-white transition"
                    data-testid="upgrade-cta"
                  >
                    See Upgrade Options
                  </Link>
                </CardContent>
              </Card>
            )}

            {/* Quick Links */}
            <Card className="bg-neutral-900 border-neutral-800">
              <CardContent className="pt-6">
                <h3 className="font-bold text-gray-100 mb-3">Quick Links</h3>
                <ul className="space-y-2 text-sm">
                  <li>
                    <Link to="/pricing" className="text-amber-400 hover:underline">View Pricing Plans</Link>
                  </li>
                  <li>
                    <Link to="/how-it-works" className="text-amber-400 hover:underline">How PBX Works</Link>
                  </li>
                  <li>
                    <Link to="/roadmap" className="text-amber-400 hover:underline">Product Roadmap</Link>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
