import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { SessionProvider, useSession } from "./contexts/SessionContext.jsx";

// Marketing Pages (Dark Theme)
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

// App Pages (Light Theme)
import AppShell from "./components/AppShell.jsx";
import Home from "./pages/app/Home.jsx";
import Send from "./pages/app/Send.jsx";
import Activity from "./pages/app/Activity.jsx";
import Manage from "./pages/app/Manage.jsx";

// Legal Pages
import Privacy from "./pages/Privacy.jsx";
import DataRetention from "./pages/DataRetention.jsx";
import Terms from "./pages/Terms.jsx";
import Security from "./pages/Security.jsx";

// Import global styles
import "./styles/design-system.css";

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
      {/* ========================================
          MARKETING PAGES (Dark Theme)
          Keep these pages with dark premium theme
         ======================================== */}
      <Route path="/" element={<Landing />} />
      <Route path="/pricing" element={<Pricing />} />
      <Route path="/business" element={<Business />} />
      <Route path="/how-it-works" element={<HowItWorks />} />
      <Route path="/roadmap" element={<Roadmap />} />

      {/* ========================================
          AUTH & ONBOARDING (Light Theme)
          New Remitly-style progressive onboarding
         ======================================== */}
      <Route path="/login" element={<Login />} />
      <Route path="/verify" element={<Verify />} />
      <Route path="/welcome" element={<Welcome />} />
      
      {/* Redirect old onboarding routes to new welcome flow */}
      <Route path="/onboarding/*" element={<Navigate to="/welcome" replace />} />
      <Route path="/get-started" element={<Navigate to="/welcome" replace />} />

      {/* ========================================
          LEGAL PAGES
         ======================================== */}
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/data-retention" element={<DataRetention />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/security" element={<Security />} />

      {/* ========================================
          APP PAGES (Light Theme with AppShell)
          Protected routes with 4-tab navigation
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
