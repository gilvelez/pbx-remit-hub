import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { SessionProvider, useSession } from "./contexts/SessionContext.jsx";
import { injectThemeVariables } from "./lib/theme";

// Layouts
import SenderShell from "./components/SenderShell.jsx";
import RecipientShell from "./components/RecipientShell.jsx";
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
import MagicLinkHandler from "./pages/auth/MagicLinkHandler.jsx";

// Onboarding (with role selection)
import Welcome from "./pages/onboarding/Welcome.jsx";
import PhoneOTP from "./pages/onboarding/PhoneOTP.jsx";
import ConnectBank from "./pages/onboarding/ConnectBank.jsx";
import AddRecipient from "./pages/onboarding/AddRecipient.jsx";
import OnboardingPeoplePicker from "./pages/onboarding/PeoplePicker.jsx";
import OnboardingChat from "./pages/onboarding/OnboardingChat.jsx";

// Sender Pages (for employers/businesses)
import Home from "./pages/app/Home.jsx";
import Send from "./pages/app/Send.jsx";
import Activity from "./pages/app/Activity.jsx";
import Manage from "./pages/app/Manage.jsx";
import People from "./pages/sender/People.jsx";
import Chat from "./pages/sender/Chat.jsx";
import Businesses from "./pages/sender/Businesses.jsx";
import SenderPeoplePicker from "./pages/sender/PeoplePicker.jsx";
import SenderBills from "./pages/sender/Bills.jsx";

// Recipient Pages (for end users receiving payments)
import RecipientDashboard from "./pages/recipient/Dashboard.jsx";
import RecipientWallets from "./pages/recipient/Wallets.jsx";
import RecipientConvert from "./pages/recipient/Convert.jsx";
import RecipientBills from "./pages/recipient/Bills.jsx";
import RecipientTransfers from "./pages/recipient/Transfers.jsx";
import RecipientStatements from "./pages/recipient/Statements.jsx";
import NotificationSettings from "./pages/recipient/NotificationSettings.jsx";

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
          AUTH & ONBOARDING
          Role selection determines UX path
         ======================================== */}
      <Route path="/login" element={<Login />} />
      <Route path="/verify" element={<Verify />} />
      
      {/* Progressive Onboarding Flow with Role Selection */}
      <Route path="/welcome" element={<Welcome />} />
      <Route path="/onboarding/phone" element={<PhoneOTP />} />
      <Route path="/onboarding/bank" element={<ConnectBank />} />
      <Route path="/onboarding/recipient" element={<AddRecipient />} />
      <Route path="/onboarding/people" element={<OnboardingPeoplePicker />} />
      <Route path="/onboarding/chat/:conversationId" element={<OnboardingChat />} />
      
      {/* Redirect old routes */}
      <Route path="/onboarding/personal" element={<Navigate to="/welcome" replace />} />
      <Route path="/onboarding/business" element={<Navigate to="/welcome" replace />} />
      <Route path="/get-started" element={<Navigate to="/welcome" replace />} />
      
      {/* Redirect old /app/* to /sender/* */}
      <Route path="/app/*" element={<Navigate to="/sender/dashboard" replace />} />

      {/* ========================================
          LEGAL PAGES (Dark Theme with PublicShell)
         ======================================== */}
      <Route path="/privacy" element={<PublicShell><Privacy /></PublicShell>} />
      <Route path="/data-retention" element={<PublicShell><DataRetention /></PublicShell>} />
      <Route path="/terms" element={<PublicShell><Terms /></PublicShell>} />
      <Route path="/security" element={<PublicShell><Security /></PublicShell>} />

      {/* ========================================
          AUTH ROUTES
         ======================================== */}
      <Route path="/auth/magic" element={<MagicLinkHandler />} />

      {/* ========================================
          SENDER ROUTES (/sender/*)
          For employers, businesses, and payers
          Shows: Home, Send, People, Businesses, Activity, Settings
          Social features: Friends, Chat, In-Chat Payments
         ======================================== */}
      <Route path="/sender" element={<SenderProtectedRoute><SenderShell /></SenderProtectedRoute>}>
        <Route index element={<Navigate to="/sender/dashboard" replace />} />
        <Route path="dashboard" element={<Home />} />
        <Route path="send" element={<Send />} />
        <Route path="send-external" element={<Send />} />
        <Route path="people" element={<People />} />
        <Route path="people/picker" element={<SenderPeoplePicker />} />
        <Route path="businesses" element={<Businesses />} />
        <Route path="bills" element={<SenderBills />} />
        <Route path="chat/:userId" element={<Chat />} />
        <Route path="activity" element={<Activity />} />
        <Route path="settings" element={<Manage />} />
        <Route path="recipients" element={<Manage />} />
        <Route path="*" element={<Navigate to="/sender/dashboard" replace />} />
      </Route>

      {/* ========================================
          RECIPIENT ROUTES (/recipient/*)
          For end users receiving USD payments
          Shows: Dashboard, Wallets, Convert, Bills, Transfers, Statements
          NEVER shows: Batch payouts, Recipient management, Payroll tools
         ======================================== */}
      <Route path="/recipient" element={<RecipientProtectedRoute><RecipientShell /></RecipientProtectedRoute>}>
        <Route index element={<Navigate to="/recipient/dashboard" replace />} />
        <Route path="dashboard" element={<RecipientDashboard />} />
        <Route path="wallets" element={<RecipientWallets />} />
        <Route path="convert" element={<RecipientConvert />} />
        <Route path="bills" element={<RecipientBills />} />
        <Route path="transfers" element={<RecipientTransfers />} />
        <Route path="statements" element={<RecipientStatements />} />
        <Route path="notifications" element={<NotificationSettings />} />
        <Route path="*" element={<Navigate to="/recipient/dashboard" replace />} />
      </Route>

      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

/**
 * SenderProtectedRoute - Access control for sender routes
 * Only allows users with role='sender' (or no role set for backwards compat)
 * Blocks recipient users from accessing sender routes
 */
function SenderProtectedRoute({ children }) {
  const { session } = useSession();
  const location = useLocation();
  
  // Not logged in → redirect to welcome
  if (!session.exists) {
    return <Navigate to="/welcome" replace state={{ from: location }} />;
  }
  
  // Not verified → redirect to verify
  if (!session.verified) {
    return <Navigate to="/verify" replace />;
  }
  
  // Recipient users CANNOT access sender routes
  if (session.role === 'recipient') {
    return <Navigate to="/recipient/dashboard" replace />;
  }
  
  // Allow sender users or users without role set (backwards compat)
  return children;
}

/**
 * RecipientProtectedRoute - Access control for recipient routes
 * Only allows users with role='recipient'
 * Blocks sender users from accessing recipient routes
 */
function RecipientProtectedRoute({ children }) {
  const { session } = useSession();
  const location = useLocation();
  
  // Not logged in → redirect to welcome
  if (!session.exists) {
    return <Navigate to="/welcome" replace state={{ from: location }} />;
  }
  
  // Not verified → redirect to verify
  if (!session.verified) {
    return <Navigate to="/verify" replace />;
  }
  
  // Sender users CANNOT access recipient routes
  if (session.role === 'sender' || (!session.role && session.exists)) {
    return <Navigate to="/sender/dashboard" replace />;
  }
  
  // Allow recipient users only
  return children;
}
