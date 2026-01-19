/**
 * SenderShell - Layout wrapper for sender dashboard
 * UI MERGE: Same navigation for Personal and Business profiles
 * Shows: Home, Send, People, Businesses, Activity, Settings
 * 
 * HEADER: Shows Active Profile indicator (avatar + handle + type)
 */
import React, { useState } from "react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useSession } from "../contexts/SessionContext";
import ProfileSwitcher from "./ProfileSwitcher";

// Navigation items for sender dashboard - 7 tabs (SAME FOR BOTH PROFILES)
// Bills is now a first-class destination in the sidebar
const navItems = [
  { 
    to: "/sender/dashboard", 
    label: "Home", 
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  { 
    to: "/sender/send", 
    label: "Send", 
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
      </svg>
    ),
  },
  { 
    to: "/sender/bills", 
    label: "Bills", 
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
  },
  { 
    to: "/sender/people", 
    label: "People", 
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
  { 
    to: "/sender/businesses", 
    label: "Businesses", 
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
  { 
    to: "/sender/activity", 
    label: "Activity", 
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  { 
    to: "/sender/settings", 
    label: "Settings", 
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

// Mobile bottom nav items (5 items - Bills accessible via Home)
const mobileNavItems = [
  navItems[0], // Home
  navItems[1], // Send
  navItems[3], // People
  navItems[5], // Activity
  navItems[6], // Settings
];

export default function SenderShell() {
  const { session, logout } = useSession();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  // Active profile info
  const activeProfile = session?.activeProfile;
  const isBusinessProfile = activeProfile?.type === "business";
  const displayName = isBusinessProfile 
    ? (activeProfile?.business_name || "Business")
    : (activeProfile?.display_name || session?.user?.email?.split("@")[0] || "User");
  const handle = activeProfile?.handle;

  return (
    <div className="min-h-screen bg-[#F6F8FB] flex flex-col">
      {/* Top Header - Shows Active Profile Indicator */}
      <header className="bg-[#0A2540] border-b border-[#F6C94B]/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          {/* Left: Logo + Active Profile Indicator */}
          <div className="flex items-center gap-3">
            {/* Mobile menu button */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 text-white/70 hover:text-[#F6C94B]"
              data-testid="sender-mobile-menu-btn"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            
            {/* Active Profile Indicator - Left side */}
            <div className="flex items-center gap-2">
              <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold ${
                isBusinessProfile 
                  ? 'bg-purple-500 text-white' 
                  : 'bg-[#F6C94B]/20 text-[#F6C94B] border border-[#F6C94B]/40'
              }`}>
                {displayName?.[0]?.toUpperCase() || "?"}
              </div>
              <div className="hidden sm:block">
                <div className="flex items-center gap-1.5">
                  {handle && (
                    <span className="text-white/90 text-sm font-medium">@{handle}</span>
                  )}
                  <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded ${
                    isBusinessProfile 
                      ? 'bg-purple-500/30 text-purple-200' 
                      : 'bg-[#F6C94B]/20 text-[#F6C94B]'
                  }`}>
                    {isBusinessProfile ? "Business" : "Personal"}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Right: Profile Switcher + Logout */}
          <div className="flex items-center gap-3">
            {/* Profile Switcher Dropdown */}
            <ProfileSwitcher />
            
            <button
              onClick={handleLogout}
              className="text-sm text-white/70 hover:text-[#F6C94B] transition hidden sm:block"
              data-testid="sender-logout-btn"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar - Desktop */}
        <aside className="hidden lg:flex flex-col w-60 bg-[#0A2540] border-r border-[#F6C94B]/20">
          <nav className="flex-1 p-4">
            <ul className="space-y-1">
              {navItems.map(({ to, label, icon }) => (
                <li key={to}>
                  <NavLink
                    to={to}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                        isActive 
                          ? "bg-[#F6C94B]/20 text-[#F6C94B]" 
                          : "text-white/70 hover:bg-white/5 hover:text-white"
                      }`
                    }
                    data-testid={`sender-nav-${label.toLowerCase()}`}
                  >
                    {icon}
                    <span className="font-medium">{label}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
          
          {/* Sidebar footer */}
          <div className="p-4 border-t border-[#F6C94B]/20">
            <NavLink
              to="/"
              className="flex items-center gap-2 text-sm text-white/50 hover:text-[#F6C94B] transition"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to PBX Home
            </NavLink>
          </div>
        </aside>

        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div 
            className="lg:hidden fixed inset-0 bg-black/50 z-40"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Mobile Sidebar */}
        <aside className={`lg:hidden fixed top-14 left-0 bottom-0 w-64 bg-[#0A2540] border-r border-[#F6C94B]/20 z-50 transform transition-transform ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
          <nav className="p-4">
            <ul className="space-y-1">
              {navItems.map(({ to, label, icon }) => (
                <li key={to}>
                  <NavLink
                    to={to}
                    onClick={() => setSidebarOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                        isActive 
                          ? "bg-[#F6C94B]/20 text-[#F6C94B]" 
                          : "text-white/70 hover:bg-white/5 hover:text-white"
                      }`
                    }
                  >
                    {icon}
                    <span className="font-medium">{label}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
          
          {/* Mobile logout */}
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-[#F6C94B]/20">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-3 py-2 text-white/70 hover:text-[#F6C94B] transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign out
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">
            <Outlet />
          </div>
          
          {/* Compliance Footer - REQUIRED on every page */}
          <footer className="border-t border-gray-200 mt-8 py-6 px-4">
            <p className="text-xs text-center text-gray-500 max-w-3xl mx-auto">
              PBX is a technology platform facilitating payment routing and settlement through licensed third-party financial institutions. PBX does not hold customer deposits or provide banking or remittance services.
            </p>
          </footer>
        </main>
      </div>

      {/* Mobile Bottom Navigation - 5 tabs (Bills accessible via Home) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#0A2540] border-t border-[#F6C94B]/20 z-40">
        <div className="flex justify-around py-2">
          {mobileNavItems.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex flex-col items-center py-1 px-2 min-w-0 ${
                  isActive ? "text-[#F6C94B]" : "text-white/60"
                }`
              }
            >
              {icon}
              <span className="text-[10px] mt-0.5 truncate">{label}</span>
            </NavLink>
          ))}
        </div>
        {/* Safe area for iOS */}
        <div className="h-safe-area-inset-bottom bg-[#0A2540]" />
      </nav>
    </div>
  );
}
