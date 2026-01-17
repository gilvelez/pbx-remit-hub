/**
 * Magic Link Authentication Handler
 * Verifies magic link token and authenticates user automatically
 */
import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useSession } from "../../contexts/SessionContext";

const API_URL = process.env.REACT_APP_BACKEND_URL || "";

export default function MagicLinkHandler() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setSession } = useSession();
  const [status, setStatus] = useState("verifying"); // verifying, success, error
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const verifyToken = async () => {
      const token = searchParams.get("token");
      
      if (!token) {
        setStatus("error");
        setErrorMessage("No token provided");
        return;
      }

      try {
        const response = await fetch(`${API_URL}/api/auth/magic/verify`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token }),
        });

        const text = await response.text();
        let data;
        try {
          data = JSON.parse(text);
        } catch {
          throw new Error("Invalid response from server");
        }

        if (!response.ok) {
          throw new Error(data.detail || "Invalid or expired link");
        }

        // Set session in localStorage
        const sessionData = {
          exists: true,
          verified: true,
          token: data.user_id,
          user: { email: data.email },
          role: "recipient", // Magic links are for recipients
        };
        
        localStorage.setItem("pbx_session", JSON.stringify(sessionData));
        setSession(sessionData);

        setStatus("success");

        // Redirect after brief success message
        setTimeout(() => {
          navigate(data.redirect_path || "/recipient/wallets");
        }, 1500);

      } catch (error) {
        console.error("Magic link verification error:", error);
        setStatus("error");
        setErrorMessage(error.message || "This link has expired or is invalid");
      }
    };

    verifyToken();
  }, [searchParams, navigate, setSession]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0A2540] to-[#0f3460] flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        {status === "verifying" && (
          <>
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-blue-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-blue-600 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-[#0A2540] mb-2">Verifying your link...</h1>
            <p className="text-gray-600">Please wait while we log you in securely.</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-[#0A2540] mb-2">Welcome back!</h1>
            <p className="text-gray-600">Redirecting you to your wallet...</p>
          </>
        )}

        {status === "error" && (
          <>
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-[#0A2540] mb-2">Link Expired</h1>
            <p className="text-gray-600 mb-6">{errorMessage}</p>
            <p className="text-sm text-gray-500 mb-6">
              Magic links expire after 15 minutes for security. Please request a new one or log in manually.
            </p>
            <button
              onClick={() => navigate("/onboarding/welcome")}
              className="w-full py-3 bg-[#0A2540] text-white rounded-xl font-semibold hover:bg-[#0A2540]/90 transition"
              data-testid="login-btn"
            >
              Go to Login
            </button>
          </>
        )}
      </div>
    </div>
  );
}
