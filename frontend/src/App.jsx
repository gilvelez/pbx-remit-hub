import React, { useMemo, useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate, Link } from "react-router-dom";
import { SessionProvider, useSession } from "./contexts/SessionContext.jsx";
import SendMoney from "./pages/SendMoney.jsx";
import Wallet from "./pages/Wallet.jsx";
import Login from "./pages/Login.jsx";
import Verify from "./pages/Verify.jsx";
import PlaidGateTest from "./pages/PlaidGateTest.jsx";
import Privacy from "./pages/Privacy.jsx";
import DataRetention from "./pages/DataRetention.jsx";
import Terms from "./pages/Terms.jsx";
import Security from "./pages/Security.jsx";
import { Landing } from "./pages/Landing.jsx";
import Pricing from "./pages/Pricing.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import OnboardingPersonal from "./pages/OnboardingPersonal.jsx";
import OnboardingBusiness from "./pages/OnboardingBusiness.jsx";
import HowItWorks from "./pages/HowItWorks.jsx";
import Business from "./pages/Business.jsx";
import Roadmap from "./pages/Roadmap.jsx";
import {
  initialRecipients,
  initialBalances,
  initialTransfers,
} from "./lib/mockData.js";

// Theme colors - consistent across all pages
const theme = {
  navy: '#0A2540',
  navyDark: '#061C33',
  gold: '#F6C94B',
  goldDark: '#D4A520',
  red: '#C1121F',
  offWhite: '#FAFAF7',
};

export default function App() {
  return (
    <BrowserRouter>
      <SessionProvider>
        <AppRoutes />
      </SessionProvider>
    </BrowserRouter>
  );
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public Landing Page */}
      <Route path="/" element={<Landing />} />
      
      {/* Public routes - NO PROTECTION */}
      <Route path="/login" element={<Login />} />
      <Route path="/verify" element={<Verify />} />
      
      {/* Legal & Compliance Pages - Public */}
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/data-retention" element={<DataRetention />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/security" element={<Security />} />
      
      {/* Test page - accessible in all states for screenshots */}
      <Route path="/plaid-gate-test" element={<PlaidGateTest />} />
      
      {/* Protected routes - require session + verification */}
      <Route path="/app/*" element={<ProtectedRoute><MainApp /></ProtectedRoute>} />
    </Routes>
  );
}

function ProtectedRoute({ children }) {
  const { session } = useSession();
  
  if (!session.exists) {
    return <Navigate to="/login" replace />;
  }
  
  if (!session.verified) {
    return <Navigate to="/verify" replace />;
  }
  
  return children;
}

function MainApp() {
  const [page, setPage] = useState("send");
  const [recipients] = useState(initialRecipients);

  const [balances, setBalances] = useState(initialBalances);
  const [transfers, setTransfers] = useState(initialTransfers);
  const [remittances, setRemittances] = useState([]);

  const makeRemittance = ({ recipientHandle, recipientName, payoutMethod, quote }) => ({
    id: `rem_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
    recipientHandle,
    recipientName,
    payoutMethod,
    amountUsd: quote.amountUsd,
    amountPhp: quote.amountPhp,
    fxRate: quote.fxRate,
    feeUsd: quote.feeUsd,
    totalChargeUsd: quote.totalChargeUsd,
    status: "completed",
  });

  const addRemittance = (remittance) => {
    setRemittances((prev) => [remittance, ...prev]);
  };

  const onPayoutComplete = (payoutData) => {
    const transfer = {
      id: payoutData.txId,
      recipientId: recipients.find(r => r.name === payoutData.recipient_name)?.id || "unknown",
      amountUsd: payoutData.amount_usd,
      status: "completed",
      createdAt: payoutData.created_at,
      note: `GCash payout`,
    };
    setTransfers((prev) => [transfer, ...prev]);

    if (payoutData.fx) {
      const remittance = {
        id: payoutData.txId,
        createdAt: payoutData.created_at,
        recipientHandle: recipients.find(r => r.name === payoutData.recipient_name)?.handle || "",
        recipientName: payoutData.recipient_name,
        payoutMethod: "gcash",
        amountUsd: payoutData.amount_usd,
        amountPhp: payoutData.fx.estimated_php,
        fxRate: payoutData.fx.pbx_rate,
        feeUsd: payoutData.fee_usd,
        totalChargeUsd: payoutData.amount_usd + payoutData.fee_usd,
        status: "completed",
      };
      addRemittance(remittance);
    }
  };

  const createTransfer = async ({ recipientId, amountUsd, note, quote, selectedRecipient }) => {
    const now = new Date().toISOString();
    const newTransfer = {
      id: crypto.randomUUID(),
      recipientId,
      amountUsd,
      note: note || "",
      status: "processing",
      createdAt: now,
    };

    setTransfers((prev) => [newTransfer, ...prev]);
    setBalances((b) => ({
      ...b,
      usd: round2(b.usd - amountUsd),
      pendingUsd: round2(b.pendingUsd + amountUsd),
    }));

    await sleep(1200);

    const success = Math.random() < 0.92;
    if (success) {
      setTransfers((prev) =>
        prev.map((t) =>
          t.id === newTransfer.id ? { ...t, status: "completed" } : t
        )
      );
      setBalances((b) => ({
        ...b,
        pendingUsd: round2(b.pendingUsd - amountUsd),
        usdc: round2(b.usdc + amountUsd),
      }));

      if (quote && selectedRecipient) {
        const rem = makeRemittance({
          recipientHandle: selectedRecipient.handle,
          recipientName: selectedRecipient.name,
          payoutMethod: "gcash",
          quote,
        });
        addRemittance(rem);
      }

      return { ok: true, transfer: { ...newTransfer, status: "completed" } };
    } else {
      setTransfers((prev) =>
        prev.map((t) =>
          t.id === newTransfer.id
            ? { ...t, status: "failed", error: "Mock failure" }
            : t
        )
      );
      setBalances((b) => ({
        ...b,
        pendingUsd: round2(b.pendingUsd - amountUsd),
        usd: round2(b.usd + amountUsd),
      }));
      return { ok: false, error: "Mock failure" };
    }
  };

  const value = useMemo(
    () => ({
      page,
      setPage,
      recipients,
      balances,
      transfers,
      remittances,
      createTransfer,
      onPayoutComplete,
      refreshBalances: async () => {
        await sleep(400);
        setBalances((b) => ({ ...b }));
      },
    }),
    [page, recipients, balances, transfers, remittances, createTransfer, onPayoutComplete]
  );

  return (
    <div 
      className="min-h-screen"
      style={{ 
        backgroundColor: theme.offWhite,
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23D4A520' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      }}
    >
      <TopNav page={page} setPage={setPage} />
      <FXRateBar />
      <main className="mx-auto w-full max-w-5xl px-4 py-6">
        <Routes>
          <Route path="/" element={<Navigate to="/app/send" replace />} />
          <Route path="/send" element={<SendMoney {...value} />} />
          <Route path="/wallet" element={<Wallet {...value} />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

// Real-time FX Rate Bar (read-only, indicative)
function FXRateBar() {
  const [rate, setRate] = useState(58.25);
  const [lastUpdated, setLastUpdated] = useState(15);

  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdated(prev => {
        if (prev >= 60) {
          setRate(58.20 + Math.random() * 0.15);
          return 0;
        }
        return prev + 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div 
      className="py-2 border-b"
      style={{ 
        backgroundColor: 'white',
        borderColor: 'rgba(10, 37, 64, 0.1)',
      }}
    >
      <div className="mx-auto max-w-5xl px-4 flex flex-wrap items-center justify-center gap-3 text-sm">
        {/* PH Flag */}
        <div className="flex items-center gap-2">
          <div className="w-5 h-3.5 rounded-sm overflow-hidden shadow-sm flex flex-col border border-slate-200">
            <div className="h-1/2 bg-[#0038a8]" />
            <div className="h-1/2 bg-[#ce1126]" />
          </div>
          <span style={{ color: theme.navy }} className="font-medium">USD → PHP</span>
        </div>
        
        <span className="font-bold text-lg" style={{ color: theme.navy }}>₱{rate.toFixed(2)}</span>
        
        <span 
          className="px-2 py-0.5 rounded-full text-xs font-semibold"
          style={{ 
            backgroundColor: `${theme.gold}30`,
            color: theme.goldDark,
          }}
        >
          Indicative
        </span>
        
        <span className="text-xs" style={{ color: '#94a3b8' }}>
          Updated {lastUpdated}s ago
        </span>
      </div>
    </div>
  );
}

function TopNav({ page, setPage }) {
  const { logout } = useSession();
  const navigate = useNavigate();
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  return (
    <header 
      className="sticky top-0 z-50 border-b backdrop-blur"
      style={{ 
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: 'rgba(10, 37, 64, 0.1)',
      }}
    >
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2">
            <div 
              className="h-10 w-10 rounded-2xl flex items-center justify-center"
              style={{ 
                backgroundColor: `${theme.gold}20`,
                border: `1px solid ${theme.gold}40`,
              }}
            >
              <span className="font-extrabold text-sm" style={{ color: theme.navy }}>PBX</span>
            </div>
          </Link>
          <div>
            <div className="text-sm font-semibold tracking-wide" style={{ color: theme.navy }}>
              PBX Cross-Border Transfer
            </div>
            <div className="flex items-center gap-2">
              <span 
                className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                style={{ 
                  backgroundColor: `${theme.gold}30`,
                  color: theme.goldDark,
                }}
              >
                Demo Mode (Sandbox)
              </span>
            </div>
          </div>
        </div>

        <nav className="flex gap-2 items-center">
          <NavButton active={page === "send"} onClick={() => { setPage("send"); navigate("/app/send"); }}>
            Send Money
          </NavButton>
          <NavButton active={page === "wallet"} onClick={() => { setPage("wallet"); navigate("/app/wallet"); }}>
            Wallet
          </NavButton>
          <button
            onClick={handleLogout}
            className="ml-2 rounded-xl px-3 py-2 text-xs font-semibold transition"
            style={{ 
              backgroundColor: theme.offWhite,
              color: theme.navy,
              border: `1px solid rgba(10, 37, 64, 0.15)`,
            }}
          >
            Logout
          </button>
        </nav>
      </div>
    </header>
  );
}

function NavButton({ active, children, ...props }) {
  return (
    <button
      {...props}
      className="rounded-xl px-4 py-2 text-sm font-semibold transition"
      style={{ 
        backgroundColor: active ? theme.gold : 'transparent',
        color: active ? theme.navyDark : theme.navy,
        border: active ? 'none' : `1px solid rgba(10, 37, 64, 0.15)`,
      }}
    >
      {children}
    </button>
  );
}

function Footer() {
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();
  
  return (
    <footer 
      className="border-t mt-8 py-8"
      style={{ 
        backgroundColor: theme.navyDark,
        borderColor: 'rgba(10, 37, 64, 0.2)',
      }}
    >
      <div className="mx-auto max-w-5xl px-4">
        <div className="flex flex-col items-center gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div 
              className="h-8 w-8 rounded-xl flex items-center justify-center"
              style={{ 
                backgroundColor: `${theme.gold}20`,
                border: `1px solid ${theme.gold}40`,
              }}
            >
              <span className="font-extrabold text-xs" style={{ color: theme.gold }}>PBX</span>
            </div>
            <span className="font-semibold text-white">PBX • Built in the United States</span>
          </div>
          
          {/* Links */}
          <div className="flex flex-wrap items-center justify-center gap-3 text-xs">
            <button
              onClick={() => navigate('/privacy')}
              className="transition hover:underline"
              style={{ color: 'rgba(255, 255, 255, 0.6)' }}
            >
              Privacy Policy
            </button>
            <span style={{ color: 'rgba(255, 255, 255, 0.3)' }}>•</span>
            <button
              onClick={() => navigate('/terms')}
              className="transition hover:underline"
              style={{ color: 'rgba(255, 255, 255, 0.6)' }}
            >
              Terms of Service
            </button>
            <span style={{ color: 'rgba(255, 255, 255, 0.3)' }}>•</span>
            <button
              onClick={() => navigate('/data-retention')}
              className="transition hover:underline"
              style={{ color: 'rgba(255, 255, 255, 0.6)' }}
            >
              Data Retention
            </button>
            <span style={{ color: 'rgba(255, 255, 255, 0.3)' }}>•</span>
            <button
              onClick={() => navigate('/security')}
              className="transition hover:underline"
              style={{ color: 'rgba(255, 255, 255, 0.6)' }}
            >
              Security
            </button>
          </div>
          
          {/* Compliance text */}
          <p className="text-xs text-center max-w-2xl" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
            PBX is a financial technology platform and does not provide banking or money transmission services directly. 
            Services may be provided by licensed financial partners where required. 
            Demo estimates shown; actual rates, fees, and availability vary.
          </p>
          
          <p className="text-xs" style={{ color: 'rgba(255, 255, 255, 0.4)' }}>
            © {currentYear} Philippine Bayani Exchange (PBX). All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const round2 = (n) => Math.round(n * 100) / 100;
