/**
 * RecipientShell - Layout wrapper for recipient dashboard
 * Navy + Gold theme with sidebar navigation
 * Includes compliance footer on every page
 */
import React, { useState } from "react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useSession } from "../contexts/SessionContext";
import { colors, tw } from "../lib/theme";

// Navigation items for recipient dashboard
const navItems = [
  { 
    to: "/recipient/dashboard", 
    label: "Dashboard", 
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  { 
    to: "/recipient/wallets", 
    label: "Wallets", 
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    ),
  },
  { 
    to: "/recipient/convert", 
    label: "Convert", 
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
      </svg>
    ),
  },
  { 
    to: "/recipient/bills", 
    label: "Bills", 
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  { 
    to: "/recipient/transfers", 
    label: "Transfers", 
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
      </svg>
    ),
  },
  { 
    to: "/recipient/statements", 
    label: "Statements", 
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
];

export default function RecipientShell() {
  const { session, logout } = useSession();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-[#F6F8FB] flex flex-col">
      {/* Top Header */}
      <header className="bg-[#0B1F3B] border-b border-[#C9A24D]/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Mobile menu button */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 text-white/70 hover:text-[#C9A24D]"
              data-testid="mobile-menu-btn"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-[#C9A24D]/20 border border-[#C9A24D]/40 flex items-center justify-center">
                <span className="text-[#C9A24D] font-bold text-xs">PBX</span>
              </div>
              <span className="text-[#C9A24D] font-semibold hidden sm:block">Recipient</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <span className="text-sm text-white/70 hidden sm:block">
              {session?.user?.email}
            </span>
            <button
              onClick={handleLogout}
              className="text-sm text-white/70 hover:text-[#C9A24D] transition"
              data-testid="recipient-logout-btn"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar - Desktop */}
        <aside className="hidden lg:flex flex-col w-60 bg-[#0B1F3B] border-r border-[#C9A24D]/20">
          <nav className="flex-1 p-4">
            <ul className="space-y-1">
              {navItems.map(({ to, label, icon }) => (
                <li key={to}>
                  <NavLink
                    to={to}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                        isActive 
                          ? "bg-[#C9A24D]/20 text-[#C9A24D]" 
                          : "text-white/70 hover:bg-white/5 hover:text-white"
                      }`
                    }
                    data-testid={`nav-${label.toLowerCase()}`}
                  >
                    {icon}
                    <span className="font-medium">{label}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
          
          {/* Sidebar footer */}
          <div className="p-4 border-t border-[#C9A24D]/20">
            <NavLink
              to="/"
              className="flex items-center gap-2 text-sm text-white/50 hover:text-[#C9A24D] transition"
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
        <aside className={`lg:hidden fixed top-14 left-0 bottom-0 w-64 bg-[#0B1F3B] border-r border-[#C9A24D]/20 z-50 transform transition-transform ${
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
                          ? "bg-[#C9A24D]/20 text-[#C9A24D]" 
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

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#0B1F3B] border-t border-[#C9A24D]/20 z-40">
        <div className="flex justify-around py-2">
          {navItems.slice(0, 5).map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex flex-col items-center py-1 px-2 ${
                  isActive ? "text-[#C9A24D]" : "text-white/60"
                }`
              }
            >
              {icon}
              <span className="text-[10px] mt-0.5">{label}</span>
            </NavLink>
          ))}
        </div>
        {/* Safe area for iOS */}
        <div className="h-safe-area-inset-bottom bg-[#0B1F3B]" />
      </nav>
    </div>
  );
}
