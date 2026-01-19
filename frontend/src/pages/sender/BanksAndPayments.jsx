/**
 * BanksAndPayments.jsx - Manage linked bank accounts
 * Phase 4: Bank Management
 * 
 * Features:
 * - List linked banks with institution name, last 4 digits, status
 * - Link new bank via Plaid
 * - Remove bank with confirmation
 * - Recurring Transfers placeholder (Phase 6)
 */
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useSession } from "../../contexts/SessionContext";
import { getLinkedBanks, unlinkBank, linkBank } from "../../lib/bankApi";
import { usePlaidLink } from "react-plaid-link";

export default function BanksAndPayments() {
  const navigate = useNavigate();
  const { session } = useSession();
  const [linkedBanks, setLinkedBanks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [linkToken, setLinkToken] = useState(null);
  const [linkingBank, setLinkingBank] = useState(false);
  const [unlinkingBank, setUnlinkingBank] = useState(null);
  const [showUnlinkConfirm, setShowUnlinkConfirm] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Fetch linked banks
  const fetchBanks = useCallback(async () => {
    try {
      const banks = await getLinkedBanks(session?.token);
      // Ensure banks is always an array
      setLinkedBanks(Array.isArray(banks) ? banks : []);
    } catch (err) {
      console.error("Failed to fetch banks:", err);
      // Set empty array on error - don't crash the UI
      setLinkedBanks([]);
    } finally {
      setLoading(false);
    }
  }, [session?.token]);

  useEffect(() => {
    fetchBanks();
  }, [fetchBanks]);

  // Get Plaid Link token
  const getLinkToken = async () => {
    setError("");
    setLinkingBank(true);
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || '';
      const res = await fetch(`${backendUrl}/api/plaid/link-token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Session-Token": session?.token || "",
        },
        body: JSON.stringify({ client_user_id: session?.token || "pbx-user" }),
      });
      
      // Safely parse JSON response once
      let data = {};
      try {
        const text = await res.text();
        if (text && text.trim()) {
          data = JSON.parse(text);
        }
      } catch (parseErr) {
        console.warn("Failed to parse Plaid link-token response:", parseErr);
      }
      
      if (!res.ok) {
        throw new Error(data.error || data.detail || "Failed to create link token");
      }
      
      if (!data.link_token) {
        throw new Error("No link token received from server");
      }
      
      setLinkToken(data.link_token);
    } catch (err) {
      setError(err.message || "Failed to initialize bank linking");
      setLinkingBank(false);
    }
  };

  // Plaid Link success handler
  const onPlaidSuccess = useCallback(async (public_token, metadata) => {
    try {
      const result = await linkBank(session?.token, {
        public_token,
        institution: metadata.institution,
        accounts: metadata.accounts,
      });
      
      setSuccess("Bank account linked successfully!");
      setLinkToken(null);
      fetchBanks();
      
      // Clear success message after 3s
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.message || "Failed to link bank account");
    } finally {
      setLinkingBank(false);
    }
  }, [session?.token, fetchBanks]);

  // Plaid Link config
  const { open: openPlaid, ready: plaidReady } = usePlaidLink({
    token: linkToken,
    onSuccess: onPlaidSuccess,
    onExit: () => {
      setLinkingBank(false);
      setLinkToken(null);
    },
  });

  // Open Plaid when token is ready
  useEffect(() => {
    if (linkToken && plaidReady) {
      openPlaid();
    }
  }, [linkToken, plaidReady, openPlaid]);

  // Handle unlink bank
  const handleUnlinkBank = async (bankId) => {
    setUnlinkingBank(bankId);
    setError("");
    
    try {
      await unlinkBank(session?.token, bankId);
      setLinkedBanks(banks => banks.filter(b => b.id !== bankId));
      setSuccess("Bank account removed successfully");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.message || "Failed to remove bank account");
    } finally {
      setUnlinkingBank(null);
      setShowUnlinkConfirm(null);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0A2540]"></div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 rounded-full transition"
          data-testid="banks-back-btn"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-xl font-bold text-[#0A2540]">Banks & Payment Methods</h1>
      </div>

      {/* Success Message */}
      {success && (
        <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-xl flex items-center gap-2">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          {success}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl flex items-center gap-2">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}

      {/* Linked Banks Section */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden mb-6">
        <div className="p-4 border-b border-gray-100">
          <h2 className="font-semibold text-[#0A2540]">Linked Bank Accounts</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {linkedBanks.length === 0 
              ? "No bank accounts linked yet" 
              : `${linkedBanks.length} account${linkedBanks.length > 1 ? 's' : ''} linked`
            }
          </p>
        </div>

        {linkedBanks.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
              </svg>
            </div>
            <p className="text-gray-500 mb-1">No banks linked</p>
            <p className="text-sm text-gray-400">Link a bank to add or withdraw money</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {linkedBanks.map((bank) => (
              <div key={bank.id} className="p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                  </svg>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-[#0A2540]">{bank.institution_name}</div>
                  <div className="text-sm text-gray-500">
                    {bank.account_type} ••••{bank.last4}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`inline-flex items-center gap-1 text-xs font-medium ${
                      bank.status === 'verified' 
                        ? 'text-green-600' 
                        : 'text-amber-600'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        bank.status === 'verified' ? 'bg-green-500' : 'bg-amber-500'
                      }`}></span>
                      {bank.status === 'verified' ? 'Verified' : 'Pending'}
                    </span>
                    {bank.last_used_at && (
                      <span className="text-xs text-gray-400">
                        Last used {new Date(bank.last_used_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
                
                <button
                  onClick={() => setShowUnlinkConfirm(bank.id)}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                  data-testid={`remove-bank-${bank.id}`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Link Another Bank Button */}
        <div className="p-4 border-t border-gray-100">
          <button
            onClick={getLinkToken}
            disabled={linkingBank}
            className="w-full h-12 bg-[#0A2540] text-white font-semibold rounded-xl hover:bg-[#0A2540]/90 transition flex items-center justify-center gap-2 disabled:opacity-50"
            data-testid="link-new-bank-btn"
          >
            {linkingBank ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                Connecting...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Link a Bank Account
              </>
            )}
          </button>
        </div>
      </div>

      {/* Recurring Transfers Section - Phase 6 Placeholder */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h2 className="font-semibold text-[#0A2540]">Recurring Transfers</h2>
          <p className="text-sm text-gray-500 mt-0.5">Set up automatic transfers</p>
        </div>
        
        <div className="p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-blue-50 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-gray-500 mb-1">Coming Soon</p>
          <p className="text-sm text-gray-400">
            Schedule automatic transfers to your PBX wallet
          </p>
        </div>
      </div>

      {/* Security Note */}
      <div className="mt-6 flex items-start gap-2 text-xs text-gray-500">
        <svg className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        <span>
          Bank connections are secured with bank-grade 256-bit encryption. PBX never stores your login credentials.
        </span>
      </div>

      {/* Unlink Confirmation Modal */}
      {showUnlinkConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6">
            <div className="text-center mb-6">
              <div className="w-12 h-12 mx-auto mb-3 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-[#0A2540]">Remove Bank Account?</h3>
              <p className="text-sm text-gray-500 mt-1">
                You will not be able to add or withdraw money using this account.
              </p>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowUnlinkConfirm(null)}
                className="flex-1 h-11 border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleUnlinkBank(showUnlinkConfirm)}
                disabled={unlinkingBank === showUnlinkConfirm}
                className="flex-1 h-11 bg-red-600 text-white font-medium rounded-xl hover:bg-red-700 transition disabled:opacity-50"
                data-testid="confirm-remove-bank-btn"
              >
                {unlinkingBank === showUnlinkConfirm ? "Removing..." : "Remove"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
