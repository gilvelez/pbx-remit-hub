/**
 * Notification Settings Page
 * Simple SMS and Email notification toggles
 */
import React, { useState, useEffect } from "react";
import { useSession } from "../../contexts/SessionContext";

const API_URL = process.env.REACT_APP_BACKEND_URL || "";

export default function NotificationSettings() {
  const { session } = useSession();
  const [smsEnabled, setSmsEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        const response = await fetch(`${API_URL}/api/notifications/preferences`, {
          headers: {
            "X-Session-Token": session?.token || "",
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          setSmsEnabled(data.sms_enabled);
          setEmailEnabled(data.email_enabled);
        }
      } catch (error) {
        console.error("Failed to fetch notification preferences:", error);
      } finally {
        setLoading(false);
      }
    };

    if (session?.token) {
      fetchPreferences();
    } else {
      setLoading(false);
    }
  }, [session?.token]);

  const savePreferences = async (sms, email) => {
    setSaving(true);
    setSaved(false);
    
    try {
      const response = await fetch(`${API_URL}/api/notifications/preferences`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-Session-Token": session?.token || "",
        },
        body: JSON.stringify({
          sms_enabled: sms,
          email_enabled: email,
        }),
      });
      
      if (response.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch (error) {
      console.error("Failed to save notification preferences:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleSmsToggle = () => {
    const newValue = !smsEnabled;
    setSmsEnabled(newValue);
    savePreferences(newValue, emailEnabled);
  };

  const handleEmailToggle = () => {
    const newValue = !emailEnabled;
    setEmailEnabled(newValue);
    savePreferences(smsEnabled, newValue);
  };

  if (loading) {
    return (
      <div className="p-6 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0A2540]"></div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto p-6" data-testid="notification-settings">
      <h1 className="text-2xl font-bold text-[#0A2540] mb-2">Notification Settings</h1>
      <p className="text-gray-600 mb-6">
        Choose how you want to receive updates about your transfers.
      </p>

      {/* SMS Toggle */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-[#0A2540]">SMS Notifications</p>
              <p className="text-sm text-gray-500">Receive text messages for transfers</p>
            </div>
          </div>
          <button
            onClick={handleSmsToggle}
            className={`relative w-12 h-6 rounded-full transition-colors ${
              smsEnabled ? "bg-green-500" : "bg-gray-300"
            }`}
            data-testid="sms-toggle"
          >
            <div
              className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                smsEnabled ? "translate-x-6" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>
      </div>

      {/* Email Toggle */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-[#0A2540]">Email Notifications</p>
              <p className="text-sm text-gray-500">Receive emails with secure login links</p>
            </div>
          </div>
          <button
            onClick={handleEmailToggle}
            className={`relative w-12 h-6 rounded-full transition-colors ${
              emailEnabled ? "bg-green-500" : "bg-gray-300"
            }`}
            data-testid="email-toggle"
          >
            <div
              className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                emailEnabled ? "translate-x-6" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
        <p className="text-sm text-blue-800">
          <strong>⚡ PBX notifications are instant and free.</strong><br />
          We&apos;ll notify you immediately when you receive money or when a transfer completes.
        </p>
      </div>

      {/* Trust Footer */}
      <div className="text-center text-sm text-gray-500">
        <p>PBX will never ask for your password via SMS or email.</p>
        <p className="mt-1">
          <a href="/support" className="text-[#0A2540] underline">Report suspicious messages</a>
        </p>
      </div>

      {/* Save Status */}
      {(saving || saved) && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-[#0A2540] text-white px-4 py-2 rounded-full shadow-lg">
          {saving ? "Saving..." : "✓ Saved"}
        </div>
      )}
    </div>
  );
}
