/**
 * Register.jsx - New user registration page
 */
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useSession } from "../contexts/SessionContext";

export default function Register() {
  const navigate = useNavigate();
  const { register } = useSession();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    
    if (!email || !password) {
      setError("Email and password are required");
      return;
    }
    
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    
    setLoading(true);
    
    try {
      await register(email, password, displayName || undefined);
      navigate("/welcome");
    } catch (err) {
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A2540] to-[#1a365d] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">PBX</h1>
          <p className="text-white/70">Philippine Bayani Exchange</p>
        </div>

        {/* Register Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-[#0A2540] mb-6 text-center">
            Create Account
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Display Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Display Name (optional)
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name"
                className="w-full h-12 px-4 border border-gray-200 rounded-xl focus:border-[#0A2540] focus:ring-1 focus:ring-[#0A2540] outline-none"
                data-testid="register-displayname-input"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full h-12 px-4 border border-gray-200 rounded-xl focus:border-[#0A2540] focus:ring-1 focus:ring-[#0A2540] outline-none"
                data-testid="register-email-input"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a password (min 6 characters)"
                required
                minLength={6}
                className="w-full h-12 px-4 border border-gray-200 rounded-xl focus:border-[#0A2540] focus:ring-1 focus:ring-[#0A2540] outline-none"
                data-testid="register-password-input"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm" data-testid="register-error">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-[#0A2540] text-white font-semibold rounded-xl hover:bg-[#0A2540]/90 transition disabled:opacity-50"
              data-testid="register-submit-btn"
            >
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Already have an account?{" "}
              <Link to="/login" className="text-[#0A2540] font-semibold hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-white/50 text-sm mt-6">
          By creating an account, you agree to our Terms & Privacy Policy
        </p>
      </div>
    </div>
  );
}
