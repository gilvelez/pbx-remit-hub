import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Privacy() {
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto max-w-4xl px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-500 font-black text-slate-950">
                PBX
              </div>
              <div>
                <div className="text-base font-semibold tracking-wide">
                  Philippine Bayani Exchange
                </div>
              </div>
            </div>
            <button
              onClick={() => navigate('/')}
              className="rounded-xl bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-300 hover:bg-slate-700 transition"
            >
              Back to Home
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-4xl px-4 py-12">
        {/* Title */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">PBX Privacy Policy</h1>
          <p className="text-lg text-slate-400 mb-1">Philippine Bayani Exchange (PBX)</p>
          <p className="text-sm text-slate-500">Last Updated: December 2025</p>
        </div>

        {/* Content Sections */}
        <div className="space-y-8 text-slate-300">
          {/* Data Collection */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">1. Data Collection</h2>
            <div className="space-y-3 text-base leading-relaxed">
              <p>
                PBX collects the following information to provide our remittance and financial services:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Personal Information:</strong> Name, email address, phone number, date of birth, and address</li>
                <li><strong>Identity Verification:</strong> Government-issued ID information for KYC (Know Your Customer) compliance</li>
                <li><strong>Financial Information:</strong> Bank account details (via Plaid), transaction history, and wallet addresses</li>
                <li><strong>Device & Usage Data:</strong> IP address, browser type, device information, and app usage patterns</li>
                <li><strong>Transaction Data:</strong> Transfer amounts, recipients, payment methods, and timestamps</li>
              </ul>
              <p className="mt-3">
                <strong>Important:</strong> PBX does not store your bank login credentials. Bank authentication is securely handled by our third-party partner, Plaid.
              </p>
            </div>
          </section>

          {/* Purpose of Data Usage */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">2. Purpose of Data Usage</h2>
            <div className="space-y-3 text-base leading-relaxed">
              <p>We use your data for the following purposes:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Service Delivery:</strong> Processing money transfers, currency exchanges, and wallet transactions</li>
                <li><strong>Compliance:</strong> Meeting legal obligations including AML (Anti-Money Laundering) and KYC requirements</li>
                <li><strong>Security:</strong> Fraud prevention, identity verification, and transaction monitoring</li>
                <li><strong>Customer Support:</strong> Responding to inquiries and resolving issues</li>
                <li><strong>Service Improvement:</strong> Analyzing usage patterns to enhance our platform</li>
                <li><strong>Communication:</strong> Sending transaction confirmations, security alerts, and service updates</li>
              </ul>
              <p className="mt-3 font-semibold text-emerald-400">
                PBX does not sell your personal data to third parties.
              </p>
            </div>
          </section>

          {/* Plaid Data Disclosure */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">3. Plaid Data Disclosure</h2>
            <div className="space-y-3 text-base leading-relaxed">
              <p>
                PBX uses <strong>Plaid Technologies, Inc.</strong> (&ldquo;Plaid&rdquo;) to link your bank accounts securely.
              </p>
              <p>
                <strong>What Plaid Does:</strong>
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Plaid facilitates the connection between your bank account and PBX</li>
                <li>Plaid retrieves your account balance, transaction history, and account details</li>
                <li>Plaid encrypts and securely transmits this information to PBX</li>
              </ul>
              <p className="mt-3">
                <strong>What PBX Receives from Plaid:</strong>
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Bank account and routing numbers</li>
                <li>Account balance information</li>
                <li>Recent transaction history</li>
                <li>Account holder name and ownership details</li>
              </ul>
              <p className="mt-3">
                <strong className="text-emerald-400">Important Security Notice:</strong> PBX never receives or stores your bank login credentials. All authentication is handled directly by Plaid using bank-grade encryption.
              </p>
              <p className="mt-3">
                By connecting your bank account via Plaid, you agree to Plaid&apos;s Privacy Policy available at: 
                <a href="https://plaid.com/legal" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:text-emerald-300 ml-1">
                  https://plaid.com/legal
                </a>
              </p>
            </div>
          </section>

          {/* Circle Data Disclosure */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">4. Circle Data Disclosure</h2>
            <div className="space-y-3 text-base leading-relaxed">
              <p>
                PBX uses <strong>Circle Internet Financial, LLC</strong> ("Circle") for digital wallet services and USDC (USD Coin) stablecoin transactions.
              </p>
              <p>
                <strong>What Circle Does:</strong>
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Circle provides blockchain-based wallet infrastructure for USDC storage and transfers</li>
                <li>Circle processes USDC minting and burning operations</li>
                <li>Circle maintains transaction records on public blockchains</li>
              </ul>
              <p className="mt-3">
                <strong>What Data is Shared with Circle:</strong>
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>User identity information for KYC compliance</li>
                <li>Wallet addresses and transaction amounts</li>
                <li>Transaction timestamps and destinations</li>
                <li>Compliance and risk assessment data</li>
              </ul>
              <p className="mt-3">
                <strong className="text-emerald-400">Blockchain Transparency:</strong> USDC transactions are recorded on public blockchains. While wallet addresses are pseudonymous, transaction amounts and timestamps are publicly visible.
              </p>
              <p className="mt-3">
                By using PBX's USDC services, you agree to Circle's Privacy Policy available at: 
                <a href="https://www.circle.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:text-emerald-300 ml-1">
                  https://www.circle.com/legal/privacy-policy
                </a>
              </p>
            </div>
          </section>

          {/* Data Retention & Deletion Rights */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">5. Data Retention & Deletion Rights</h2>
            <div className="space-y-3 text-base leading-relaxed">
              <p>
                <strong>Data Retention:</strong>
              </p>
              <p>
                PBX retains your personal data for as long as necessary to provide our services and comply with legal obligations.
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Active Accounts:</strong> Data is retained while your account is active</li>
                <li><strong>Closed Accounts:</strong> Transaction records are retained for 7 years for AML/KYC compliance</li>
                <li><strong>Marketing Data:</strong> Retained until you opt out or request deletion</li>
              </ul>
              <p className="mt-4">
                <strong>Your Rights:</strong>
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Access:</strong> Request a copy of your personal data</li>
                <li><strong>Correction:</strong> Update or correct inaccurate information</li>
                <li><strong>Deletion:</strong> Request deletion of your personal data (subject to legal exceptions)</li>
                <li><strong>Portability:</strong> Export your data in a machine-readable format</li>
                <li><strong>Opt-Out:</strong> Unsubscribe from marketing communications</li>
              </ul>
              <p className="mt-4">
                <strong>Legal Retention Exceptions:</strong>
              </p>
              <p>
                We cannot delete data if required for:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>AML/KYC compliance (7-year legal requirement)</li>
                <li>Fraud prevention and investigation</li>
                <li>Pending or active legal disputes</li>
                <li>Tax reporting obligations</li>
              </ul>
              <p className="mt-4">
                <strong>Deletion Processing Time:</strong> Data deletion requests are processed <strong>within 30 days</strong> of verification.
              </p>
            </div>
          </section>

          {/* Contact Information */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">6. Contact Information</h2>
            <div className="space-y-3 text-base leading-relaxed">
              <p>
                For privacy-related inquiries, data requests, or concerns, please contact us:
              </p>
              <div className="mt-4 p-4 rounded-xl bg-slate-900 border border-slate-800">
                <p className="font-semibold text-white mb-2">PBX Privacy Team</p>
                <p>Email: <a href="mailto:info@pbxexchange.com" className="text-emerald-400 hover:text-emerald-300">info@pbxexchange.com</a></p>
                <p className="mt-2 text-sm text-slate-400">
                  Please include "Privacy Request" in your email subject line for faster processing.
                </p>
              </div>
              <p className="mt-4">
                We will respond to verified requests within 30 days.
              </p>
            </div>
          </section>

          {/* Updates to This Policy */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">7. Updates to This Policy</h2>
            <div className="space-y-3 text-base leading-relaxed">
              <p>
                PBX may update this Privacy Policy from time to time to reflect changes in our practices, technology, legal requirements, or other operational needs.
              </p>
              <p>
                <strong>How We Notify You:</strong>
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>We will update the "Last Updated" date at the top of this page</li>
                <li>Material changes will be communicated via email to your registered address</li>
                <li>Continued use of PBX services after updates constitutes acceptance of the revised policy</li>
              </ul>
              <p className="mt-3">
                We encourage you to review this Privacy Policy periodically to stay informed about how we protect your information.
              </p>
            </div>
          </section>
        </div>

        {/* Bottom Notice */}
        <div className="mt-12 pt-8 border-t border-slate-800">
          <p className="text-sm text-slate-500 text-center">
            This Privacy Policy is effective as of the last updated date stated above.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950 mt-16">
        <div className="mx-auto max-w-4xl px-4 py-6">
          <p className="text-center text-sm text-slate-500">
            © {currentYear} Philippine Bayani Exchange (PBX). All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
