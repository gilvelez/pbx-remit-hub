/**
 * PublicShell - Unified layout for public/marketing pages
 * Uses the same Navy + Gold theme as AppShell
 * Allows for "marketing hero" sections while keeping consistent tokens
 */
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { colors, tw } from "../lib/theme";

export default function PublicShell({ children }) {
  const location = useLocation();
  const isHome = location.pathname === '/';
  
  return (
    <div className="min-h-screen bg-neutral-950 text-gray-100">
      {/* Sticky Navigation - Navy themed */}
      {!isHome && (
        <nav className={`${tw.shellBgSolid} border-b ${tw.borderOnDark} sticky top-0 z-50`}>
          <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-2xl flex items-center justify-center bg-[#F6C94B]/20 border border-[#F6C94B]/40">
                <span className="font-extrabold text-sm text-[#F6C94B]">PBX</span>
              </div>
              <span className={`font-bold text-lg ${tw.textGold}`}>PBX</span>
            </Link>
            
            <div className="hidden md:flex items-center gap-6 text-sm">
              <NavLink to="/pricing" label="Pricing" />
              <NavLink to="/how-it-works" label="How It Works" />
              <NavLink to="/business" label="Business" />
              <Link
                to="/welcome"
                className={`rounded-xl ${tw.btnCta} px-5 py-2.5 transition`}
                data-testid="nav-get-started"
              >
                Get Started
              </Link>
            </div>
            
            {/* Mobile menu button */}
            <button className="md:hidden text-white/70 hover:text-white">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </nav>
      )}
      
      {/* Page Content */}
      <main>
        {children}
      </main>
      
      {/* Footer - Navy themed */}
      <footer className={`${tw.shellBgSolid} py-10 border-t ${tw.borderOnDark}`}>
        <div className="mx-auto max-w-7xl px-6 text-center text-xs text-white/50">
          <div className="flex justify-center items-center gap-3 mb-4">
            <div className="h-9 w-9 rounded-2xl bg-[#F6C94B]/20 border border-[#F6C94B]/40 flex items-center justify-center">
              <span className="font-extrabold text-xs text-[#F6C94B]">PBX</span>
            </div>
            <div className="font-semibold text-white/70">PBX • Built in the United States</div>
          </div>
          <div className="flex flex-wrap justify-center gap-4 mb-4">
            <Link to="/privacy" className="hover:text-[#F6C94B] transition">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-[#F6C94B] transition">Terms of Service</Link>
            <Link to="/security" className="hover:text-[#F6C94B] transition">Security</Link>
          </div>
          <p className="max-w-2xl mx-auto text-white/40">
            PBX is a financial technology platform and does not provide banking or money transmission services directly. 
            Services may be provided by licensed financial partners where required. 
            Demo estimates shown; actual rates, fees, and availability vary.
          </p>
          <p className="mt-4">© {new Date().getFullYear()} Philippine Bayani Exchange (PBX). All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

function NavLink({ to, label }) {
  const location = useLocation();
  const isActive = location.pathname === to;
  
  return (
    <Link 
      to={to} 
      className={`transition ${isActive ? 'text-[#F6C94B]' : 'text-white/70 hover:text-[#F6C94B]'}`}
    >
      {label}
    </Link>
  );
}
