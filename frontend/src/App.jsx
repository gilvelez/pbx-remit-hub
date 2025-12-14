import React, { useMemo, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { SessionProvider, useSession } from "./contexts/SessionContext.jsx";
import SendMoney from "./pages/SendMoney.jsx";
import Wallet from "./pages/Wallet.jsx";
import Login from "./pages/Login.jsx";
import Verify from "./pages/Verify.jsx";
import PlaidGateTest from "./pages/PlaidGateTest.jsx";
import Privacy from "./pages/Privacy.jsx";
import {
  initialRecipients,
  initialBalances,
  initialTransfers,
} from "./lib/mockData.js";

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
      {/* Public routes - NO PROTECTION */}
      <Route path="/login" element={<Login />} />
      <Route path="/verify" element={<Verify />} />
      <Route path="/privacy" element={<Privacy />} />
      
      {/* Test page - accessible in all states for screenshots */}
      <Route path="/plaid-gate-test" element={<PlaidGateTest />} />
      
      {/* Protected routes - require session + verification */}
      <Route path="/*" element={<ProtectedRoute><MainApp /></ProtectedRoute>} />
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
  const [page, setPage] = useState("send"); // "send" | "wallet"
  const [recipients] = useState(initialRecipients);

  const [balances, setBalances] = useState(initialBalances);
  const [transfers, setTransfers] = useState(initialTransfers);
  const [remittances, setRemittances] = useState([]);

  // Helper to create a remittance record from quote
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

  // Handle successful payout from create-gcash-payout
  const onPayoutComplete = (payoutData) => {
    // Add to transfers (Recent Activity)
    const transfer = {
      id: payoutData.txId,
      recipientId: recipients.find(r => r.name === payoutData.recipient_name)?.id || "unknown",
      amountUsd: payoutData.amount_usd,
      status: "completed",
      createdAt: payoutData.created_at,
      note: `GCash payout`,
    };
    setTransfers((prev) => [transfer, ...prev]);

    // Add to remittances (PH Payouts) if FX data available
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

  // helper to create a new transfer and mutate balances
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

    // optimistic UI: mark pending + reduce USD immediately
    setTransfers((prev) => [newTransfer, ...prev]);
    setBalances((b) => ({
      ...b,
      usd: round2(b.usd - amountUsd),
      pendingUsd: round2(b.pendingUsd + amountUsd),
    }));

    // Mock async "backend"
    await sleep(1200);

    // 92% success rate mock
    const success = Math.random() < 0.92;
    if (success) {
      // completed: move pending -> USDC (1:1 mock)
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

      // Create remittance record if quote and recipient provided
      if (quote && selectedRecipient) {
        console.log("[App] Creating remittance with quote:", quote);
        console.log("[App] Recipient:", selectedRecipient);
        const rem = makeRemittance({
          recipientHandle: selectedRecipient.handle,
          recipientName: selectedRecipient.name,
          payoutMethod: "gcash",
          quote,
        });
        console.log("[App] Remittance created:", rem);
        addRemittance(rem);
        console.log("[App] Remittance added to state");
      } else {
        console.log("[App] No remittance created - quote:", !!quote, "recipient:", !!selectedRecipient);
      }

      return { ok: true, transfer: { ...newTransfer, status: "completed" } };
    } else {
      // failed: refund USD
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
        // mock refresh
        await sleep(400);
        setBalances((b) => ({ ...b }));
      },
    }),
    [page, recipients, balances, transfers, remittances, createTransfer, onPayoutComplete]
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <TopNav page={page} setPage={setPage} />
      <main className="mx-auto w-full max-w-5xl px-4 py-6">
        <Routes>
          <Route path="/" element={<Navigate to="/send" replace />} />
          <Route path="/send" element={<SendMoney {...value} />} />
          <Route path="/wallet" element={<Wallet {...value} />} />
        </Routes>
      </main>
      <Footer />
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
    <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/80 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-500 font-black text-slate-950">
            PBX
          </div>
          <div>
            <div className="text-sm font-semibold tracking-wide">
              Philippine Bayani Exchange
            </div>
            <div className="text-xs text-slate-400">Sandbox MVP</div>
          </div>
        </div>

        <nav className="flex gap-2 items-center">
          <NavButton active={page === "send"} onClick={() => { setPage("send"); navigate("/send"); }}>
            Send Money
          </NavButton>
          <NavButton active={page === "wallet"} onClick={() => { setPage("wallet"); navigate("/wallet"); }}>
            Wallet
          </NavButton>
          <button
            onClick={handleLogout}
            className="ml-2 rounded-xl bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 transition"
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
      className={[
        "rounded-xl px-3 py-2 text-sm font-semibold transition",
        active
          ? "bg-slate-100 text-slate-950"
          : "bg-slate-900 text-slate-200 hover:bg-slate-800",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function Footer() {
  const { logout } = useSession();
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="border-t border-slate-800 bg-slate-950 mt-8">
      <div className="mx-auto max-w-5xl px-4 py-6">
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center gap-4 text-xs">
            <button
              onClick={() => navigate('/privacy')}
              className="text-slate-400 hover:text-emerald-400 transition"
            >
              Privacy Policy
            </button>
            <span className="text-slate-700">•</span>
            <span className="text-slate-500">PBX Sandbox MVP</span>
          </div>
          <p className="text-xs text-slate-500">
            © {currentYear} Philippine Bayani Exchange (PBX). All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const round2 = (n) => Math.round(n * 100) / 100;
