/**
 * ProfileSwitcher - Instagram-style account switcher
 * Allows switching between personal and business profiles
 */
import React, { useState, useRef, useEffect } from "react";
import { useSession } from "../contexts/SessionContext";
import { useNavigate } from "react-router-dom";

export default function ProfileSwitcher() {
  const { session, switchProfile } = useSession();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);
  
  const activeProfile = session?.activeProfile;
  const profiles = session?.profiles || [];
  
  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  
  const handleSwitch = async (profile) => {
    await switchProfile(profile);
    setOpen(false);
    // Optionally navigate to dashboard after switching
    // navigate("/sender/dashboard");
  };
  
  const getProfileName = (profile) => {
    if (profile?.type === "business") {
      return profile.business_name || profile.handle || "Business";
    }
    return profile?.display_name || profile?.handle || session?.user?.email?.split("@")[0] || "Personal";
  };
  
  const getProfileInitial = (profile) => {
    const name = getProfileName(profile);
    return name?.[0]?.toUpperCase() || "?";
  };
  
  const isBusinessProfile = (profile) => profile?.type === "business";
  
  if (!activeProfile && profiles.length === 0) {
    return null;
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Profile Button */}
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/10 transition"
        data-testid="profile-switcher-btn"
      >
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
          isBusinessProfile(activeProfile)
            ? "bg-[#F6C94B]/20 text-[#F6C94B] border border-[#F6C94B]/40"
            : "bg-white/20 text-white"
        }`}>
          {getProfileInitial(activeProfile)}
        </div>
        <div className="hidden sm:block text-left">
          <p className="text-sm font-medium text-white leading-tight">
            {getProfileName(activeProfile)}
          </p>
          <p className="text-xs text-white/60 leading-tight">
            {isBusinessProfile(activeProfile) ? "Business" : "Personal"}
          </p>
        </div>
        <svg
          className={`w-4 h-4 text-white/60 transition ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-50">
          {/* Current Profile */}
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-xs font-medium text-gray-500 uppercase">Active Profile</p>
            <div className="flex items-center gap-3 mt-2">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                isBusinessProfile(activeProfile)
                  ? "bg-[#0A2540] text-[#F6C94B]"
                  : "bg-gradient-to-br from-[#0A2540] to-[#1a4a7c] text-white"
              }`}>
                {getProfileInitial(activeProfile)}
              </div>
              <div>
                <p className="font-semibold text-[#0A2540]">{getProfileName(activeProfile)}</p>
                <div className="flex items-center gap-1">
                  {isBusinessProfile(activeProfile) && (
                    <span className="px-1.5 py-0.5 bg-[#0A2540] text-[#F6C94B] text-[10px] font-medium rounded">
                      Business
                    </span>
                  )}
                  {activeProfile?.handle && (
                    <span className="text-xs text-gray-500">@{activeProfile.handle}</span>
                  )}
                </div>
              </div>
              <svg className="w-5 h-5 text-green-500 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
          </div>

          {/* Other Profiles */}
          {profiles.length > 1 && (
            <div className="max-h-64 overflow-y-auto">
              <p className="px-4 py-2 text-xs font-medium text-gray-500 uppercase bg-gray-50">
                Switch to
              </p>
              {profiles
                .filter(p => p.profile_id !== activeProfile?.profile_id)
                .map(profile => (
                  <button
                    key={profile.profile_id}
                    onClick={() => handleSwitch(profile)}
                    className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition"
                    data-testid={`switch-profile-${profile.profile_id}`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                      isBusinessProfile(profile)
                        ? "bg-gray-100 text-[#0A2540] border border-gray-200"
                        : "bg-gray-200 text-gray-600"
                    }`}>
                      {getProfileInitial(profile)}
                    </div>
                    <div className="text-left flex-1">
                      <p className="font-medium text-[#0A2540]">{getProfileName(profile)}</p>
                      <div className="flex items-center gap-1">
                        {isBusinessProfile(profile) && (
                          <span className="px-1.5 py-0.5 bg-gray-200 text-gray-600 text-[10px] font-medium rounded">
                            Business
                          </span>
                        )}
                        {profile.handle && (
                          <span className="text-xs text-gray-500">@{profile.handle}</span>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
            </div>
          )}

          {/* Actions */}
          <div className="border-t border-gray-100 p-2">
            <button
              onClick={() => {
                setOpen(false);
                navigate("/sender/settings");
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition"
              data-testid="add-business-profile-btn"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Business Profile
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
