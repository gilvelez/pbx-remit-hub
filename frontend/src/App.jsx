import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { SessionProvider, useSession } from "./contexts/SessionContext.jsx";
import { injectThemeVariables } from "./lib/theme";

// Layouts
import AppShell from "./components/AppShell.jsx";
import PublicShell from "./components/PublicShell.jsx";

// Marketing Pages (Dark Theme - wrapped in PublicShell)
import { Landing } from "./pages/Landing.jsx";
import Pricing from "./pages/Pricing.jsx";
import Business from "./pages/Business.jsx";
import HowItWorks from "./pages/HowItWorks.jsx";
import Roadmap from "./pages/Roadmap.jsx";

// Auth Pages
import Login from "./pages/Login.jsx";
import Verify from "./pages/Verify.jsx";

// New Onboarding (Remitly-style)
import Welcome from "./pages/onboarding/Welcome.jsx";
import PhoneOTP from "./pages/onboarding/PhoneOTP.jsx";
import ConnectBank from "./pages/onboarding/ConnectBank.jsx";
import AddRecipient from "./pages/onboarding/AddRecipient.jsx";

// App Pages (Light Theme - wrapped in AppShell)
import Home from "./pages/app/Home.jsx";
import Send from "./pages/app/Send.jsx";
import Activity from "./pages/app/Activity.jsx";
import Manage from "./pages/app/Manage.jsx";

// Recipient Dashboard (Navy + Gold theme)
import RecipientShell from "./components/RecipientShell.jsx";
import RecipientDashboard from "./pages/recipient/Dashboard.jsx";
import RecipientWallets from "./pages/recipient/Wallets.jsx";
import RecipientConvert from "./pages/recipient/Convert.jsx";
import RecipientBills from "./pages/recipient/Bills.jsx";
import RecipientTransfers from "./pages/recipient/Transfers.jsx";
import RecipientStatements from "./pages/recipient/Statements.jsx";

// Legal Pages
import Privacy from "./pages/Privacy.jsx";
import DataRetention from "./pages/DataRetention.jsx";
import Terms from "./pages/Terms.jsx";
import Security from "./pages/Security.jsx";

// Import global styles
import "./styles/design-system.css";

export default function App() {
  // Initialize theme CSS variables on mount
  useEffect(() => {
    injectThemeVariables();
  }, []);

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
      {/* ========================================
          MARKETING PAGES (Dark Theme with PublicShell)
          Uses unified Navy + Gold theme tokens
         ======================================== */}
      <Route path="/" element={<Landing />} />
      <Route path="/pricing" element={<PublicShell><Pricing /></PublicShell>} />
      <Route path="/business" element={<PublicShell><Business /></PublicShell>} />
      <Route path="/how-it-works" element={<PublicShell><HowItWorks /></PublicShell>} />
      <Route path="/roadmap" element={<PublicShell><Roadmap /></PublicShell>} />

      {/* ========================================
          AUTH & ONBOARDING (Navy theme background)
          New Remitly-style progressive onboarding
         ======================================== */}
      <Route path="/login" element={<Login />} />
      <Route path="/verify" element={<Verify />} />
      
      {/* Progressive Onboarding Flow */}
      <Route path="/welcome" element={<Welcome />} />
      <Route path="/onboarding/phone" element={<PhoneOTP />} />
      <Route path="/onboarding/bank" element={<ConnectBank />} />
      <Route path="/onboarding/recipient" element={<AddRecipient />} />
      
      {/* Redirect old onboarding routes to new welcome flow */}
      <Route path="/onboarding/personal" element={<Navigate to="/welcome" replace />} />
      <Route path="/onboarding/business" element={<Navigate to="/welcome" replace />} />
      <Route path="/get-started" element={<Navigate to="/welcome" replace />} />

      {/* ========================================
          LEGAL PAGES (Dark Theme with PublicShell)
         ======================================== */}
      <Route path="/privacy" element={<PublicShell><Privacy /></PublicShell>} />
      <Route path="/data-retention" element={<PublicShell><DataRetention /></PublicShell>} />
      <Route path="/terms" element={<PublicShell><Terms /></PublicShell>} />
      <Route path="/security" element={<PublicShell><Security /></PublicShell>} />

      {/* ========================================
          APP PAGES (AppShell enforced for /app/*)
          Protected routes with 4-tab navigation
          Navy shell, off-white cards for readability
         ======================================== */}
      <Route path="/app" element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
        <Route index element={<Navigate to="/app/home" replace />} />
        <Route path="home" element={<Home />} />
        <Route path="send" element={<Send />} />
        <Route path="activity" element={<Activity />} />
        <Route path="manage" element={<Manage />} />
        {/* Catch-all for unknown app routes */}
        <Route path="*" element={<Navigate to="/app/home" replace />} />
      </Route>

      {/* ========================================
          RECIPIENT DASHBOARD (RecipientShell for /recipient/*)
          Protected routes for Philippine-based recipients
          USD/PHP wallets, FX conversion, bills, transfers
         ======================================== */}
      <Route path="/recipient" element={<ProtectedRoute><RecipientShell /></ProtectedRoute>}>
        <Route index element={<Navigate to="/recipient/dashboard" replace />} />
        <Route path="dashboard" element={<RecipientDashboard />} />
        <Route path="wallets" element={<RecipientWallets />} />
        <Route path="convert" element={<RecipientConvert />} />
        <Route path="bills" element={<RecipientBills />} />
        <Route path="transfers" element={<RecipientTransfers />} />
        <Route path="statements" element={<RecipientStatements />} />
        {/* Catch-all for unknown recipient routes */}
        <Route path="*" element={<Navigate to="/recipient/dashboard" replace />} />
      </Route>

      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

// Protected Route - requires session and verification
function ProtectedRoute({ children }) {
  const { session } = useSession();
  
  // Not logged in → redirect to welcome
  if (!session.exists) {
    return <Navigate to="/welcome" replace />;
  }
  
  // Not verified → redirect to verify
  if (!session.verified) {
    return <Navigate to="/verify" replace />;
  }
  
  return children;
}
