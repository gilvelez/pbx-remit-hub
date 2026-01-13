import React from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useSession } from "../contexts/SessionContext";

// Icons with unified gold/white colors
const HomeIcon = ({ active }) => (
  <svg className={`w-6 h-6 ${active ? 'text-[#F6C94B]' : 'text-white/60'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 2.5 : 2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);

const SendIcon = ({ active }) => (
  <svg className={`w-6 h-6 ${active ? 'text-[#F6C94B]' : 'text-white/60'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 2.5 : 2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
  </svg>
);

const ActivityIcon = ({ active }) => (
  <svg className={`w-6 h-6 ${active ? 'text-[#F6C94B]' : 'text-white/60'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 2.5 : 2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
  </svg>
);

const ManageIcon = ({ active }) => (
  <svg className={`w-6 h-6 ${active ? 'text-[#F6C94B]' : 'text-white/60'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 2.5 : 2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const navItems = [
  { to: "/app/home", label: "Home", Icon: HomeIcon },
  { to: "/app/send", label: "Send", Icon: SendIcon },
  { to: "/app/activity", label: "Activity", Icon: ActivityIcon },
  { to: "/app/manage", label: "Manage", Icon: ManageIcon },
];

export default function AppShell() {
  const { session, logout } = useSession();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0A2540] to-[#061C33]">
      {/* Top Header - Navy theme */}
      <header className="bg-[#0A2540] border-b border-white/10 sticky top-0 z-40">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-[#F6C94B]/20 border border-[#F6C94B]/40 flex items-center justify-center">
              <span className="text-[#F6C94B] font-bold text-xs">PBX</span>
            </div>
          </div>
          
          <button
            onClick={handleLogout}
            className="text-sm text-white/70 hover:text-[#F6C94B] transition"
            data-testid="app-logout-btn"
          >
            Sign out
          </button>
        </div>
      </header>

      {/* Main Content Area - Cards are off-white */}
      <main className="pb-20">
        <div className="max-w-lg mx-auto">
          <Outlet />
        </div>
      </main>

      {/* Bottom Tab Navigation - Navy theme */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[#0A2540] border-t border-white/10 z-50">
        <div className="max-w-lg mx-auto px-4">
          <div className="flex justify-around">
            {navItems.map(({ to, label, Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex flex-col items-center py-2 px-4 transition-colors ${
                    isActive ? "text-[#F6C94B]" : "text-white/60"
                  }`
                }
                data-testid={`nav-${label.toLowerCase()}`}
              >
                {({ isActive }) => (
                  <>
                    <Icon active={isActive} />
                    <span className={`text-xs mt-1 font-medium ${isActive ? "text-[#F6C94B]" : "text-white/60"}`}>
                      {label}
                    </span>
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </div>
        {/* Safe area for iOS */}
        <div className="h-safe-area-inset-bottom bg-[#0A2540]" />
      </nav>
    </div>
  );
}
