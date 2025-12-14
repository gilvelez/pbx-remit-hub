import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function DataRetention() {
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
          <h1 className="text-4xl font-bold text-white mb-2">Data Retention & Deletion Policy</h1>
          <p className="text-lg text-slate-400 mb-1">Philippine Bayani Exchange (PBX)</p>
          <p className="text-sm text-slate-500">Last Updated: December 2025</p>
        </div>

        {/* Content Sections */}
        <div className="space-y-8 text-slate-300">
          {/* Overview */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">1. Overview</h2>
            <div className="space-y-3 text-base leading-relaxed">
              <p>
                This Data Retention & Deletion Policy explains how Philippine Bayani Exchange (PBX) retains, stores, and deletes user data in compliance with legal requirements and industry best practices.
              </p>
              <p>
                PBX is committed to protecting user privacy while meeting regulatory obligations for Anti-Money Laundering (AML), Know Your Customer (KYC), and fraud prevention.
              </p>
            </div>
          </section>

          {/* Data Retention Periods */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">2. Data Retention Periods</h2>
            <div className="space-y-4 text-base leading-relaxed">
              <p>
                PBX retains different types of data for varying periods based on legal requirements and operational needs:
              </p>

              <div className="space-y-4 mt-4">
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                  <h3 className="font-bold text-white mb-2">Identity Data</h3>
                  <p className="text-sm mb-2">Name, date of birth, government ID information, address</p>
                  <p className="text-emerald-400 font-semibold">Retention: 7 years after account closure</p>
                  <p className="text-xs text-slate-400 mt-2">Required for AML/KYC compliance under federal law</p>
                </div>

                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                  <h3 className="font-bold text-white mb-2">Transaction Data</h3>
                  <p className="text-sm mb-2">Transfer history, amounts, recipients, dates, payment methods</p>
                  <p className="text-emerald-400 font-semibold">Retention: 7 years after transaction</p>
                  <p className="text-xs text-slate-400 mt-2">Required for financial recordkeeping and tax reporting</p>
                </div>

                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                  <h3 className="font-bold text-white mb-2">Logs & Audit Trails</h3>
                  <p className="text-sm mb-2">Login activity, IP addresses, device information, security events</p>
                  <p className="text-emerald-400 font-semibold">Retention: 2 years</p>
                  <p className="text-xs text-slate-400 mt-2">Required for security monitoring and fraud prevention</p>
                </div>

                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                  <h3 className="font-bold text-white mb-2">Marketing & Communication Data</h3>
                  <p className="text-sm mb-2">Email preferences, promotional consents</p>
                  <p className="text-emerald-400 font-semibold">Retention: Until opt-out or deletion request</p>
                  <p className="text-xs text-slate-400 mt-2">Can be deleted immediately upon request</p>
                </div>

                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                  <h3 className="font-bold text-white mb-2">Support & Communication Records</h3>
                  <p className="text-sm mb-2">Customer service inquiries, emails, chat logs</p>
                  <p className="text-emerald-400 font-semibold">Retention: 3 years</p>
                  <p className="text-xs text-slate-400 mt-2">Required for dispute resolution and service quality</p>
                </div>
              </div>
            </div>
          </section>

          {/* Basis for Retention */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">3. Basis for Data Retention</h2>
            <div className="space-y-3 text-base leading-relaxed">
              <p>
                PBX retains data based on the following legal and operational requirements:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>AML / KYC Regulations:</strong> Federal law requires financial institutions to retain customer identification and transaction records for at least 7 years</li>
                <li><strong>Fraud Prevention:</strong> Historical data is essential for detecting patterns of fraudulent activity and protecting users</li>
                <li><strong>Legal & Regulatory Requirements:</strong> Records may be required for audits, investigations, and legal proceedings</li>
                <li><strong>Tax Reporting:</strong> Transaction records support tax reporting obligations for both PBX and users</li>
                <li><strong>Dispute Resolution:</strong> Historical records are necessary to resolve customer disputes and chargebacks</li>
                <li><strong>Service Improvement:</strong> Anonymized usage data helps improve platform security and user experience</li>
              </ul>
            </div>
          </section>

          {/* User Rights - Data Deletion */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">4. Your Right to Request Data Deletion</h2>
            <div className="space-y-3 text-base leading-relaxed">
              <p>
                <strong>You may request deletion of your personal data</strong> at any time by contacting PBX at:
              </p>
              <div className="mt-4 p-4 rounded-xl bg-slate-900 border border-slate-800">
                <p className="font-semibold text-white mb-2">Data Deletion Requests</p>
                <p>Email: <a href="mailto:info@pbxexchange.com" className="text-emerald-400 hover:text-emerald-300">info@pbxexchange.com</a></p>
                <p className="mt-2 text-sm">Subject Line: &ldquo;Data Deletion Request&rdquo;</p>
                <p className="mt-3 text-sm text-slate-400">
                  <strong>Processing Time:</strong> Requests are processed <strong>within 30 days</strong> of verification.
                </p>
              </div>

              <p className="mt-4">
                <strong>What We Delete:</strong>
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Marketing and communication preferences (immediate)</li>
                <li>Profile information not required for legal compliance</li>
                <li>Device and usage data older than 2 years</li>
                <li>Non-essential account information</li>
              </ul>

              <p className="mt-4 text-amber-300 font-semibold">
                <strong>Important:</strong> Some data cannot be deleted immediately due to legal requirements.
              </p>
            </div>
          </section>

          {/* Legal Retention Exceptions */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">5. Legal Retention Exceptions</h2>
            <div className="space-y-3 text-base leading-relaxed">
              <p>
                <strong>PBX cannot delete certain data</strong> when required by law or for legitimate business purposes:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>AML / KYC Records:</strong> Identity verification data and transaction records must be retained for 7 years under federal law</li>
                <li><strong>Active Investigations:</strong> Data related to fraud investigations, legal disputes, or regulatory inquiries</li>
                <li><strong>Pending Transactions:</strong> Records of incomplete or disputed transactions</li>
                <li><strong>Tax Records:</strong> Transaction data required for tax reporting (7 years)</li>
                <li><strong>Legal Holds:</strong> Data subject to subpoenas, court orders, or legal preservation requirements</li>
                <li><strong>Security Incidents:</strong> Logs and records related to security breaches or fraud attempts</li>
              </ul>

              <p className="mt-4">
                Even when data cannot be deleted, PBX will:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Restrict access to only authorized personnel</li>
                <li>Encrypt data at rest and in transit</li>
                <li>Monitor for unauthorized access</li>
                <li>Delete data as soon as legal obligations expire</li>
              </ul>
            </div>
          </section>

          {/* Data Anonymization */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">6. Data Anonymization</h2>
            <div className="space-y-3 text-base leading-relaxed">
              <p>
                When possible, PBX anonymizes data instead of deleting it entirely. Anonymized data:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Cannot be linked back to individual users</li>
                <li>Is used for statistical analysis and service improvement</li>
                <li>Does not contain personal identifiers</li>
                <li>Is not subject to deletion requests (as it is no longer personal data)</li>
              </ul>
            </div>
          </section>

          {/* Contact for Deletion Requests */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">7. How to Request Data Deletion</h2>
            <div className="space-y-3 text-base leading-relaxed">
              <p>
                <strong>Step 1:</strong> Send an email to <a href="mailto:info@pbxexchange.com" className="text-emerald-400 hover:text-emerald-300">info@pbxexchange.com</a>
              </p>
              <p>
                <strong>Step 2:</strong> Include in your request:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Your full name and email address associated with your PBX account</li>
                <li>Subject line: &ldquo;Data Deletion Request&rdquo;</li>
                <li>Specific data you wish to delete (or request full account deletion)</li>
              </ul>
              <p>
                <strong>Step 3:</strong> We will verify your identity and respond within <strong>30 days</strong> with:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Confirmation of data deleted</li>
                <li>Explanation of data that must be retained for legal compliance</li>
                <li>Timeline for deletion of legally-retained data</li>
              </ul>
            </div>
          </section>

          {/* Updates to This Policy */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">8. Updates to This Policy</h2>
            <div className="space-y-3 text-base leading-relaxed">
              <p>
                PBX may update this Data Retention & Deletion Policy to reflect changes in legal requirements or business practices. Updates will be posted on this page with a revised &ldquo;Last Updated&rdquo; date.
              </p>
            </div>
          </section>
        </div>

        {/* Bottom Notice */}
        <div className="mt-12 pt-8 border-t border-slate-800">
          <p className="text-sm text-slate-500 text-center">
            For questions about data retention or deletion, contact <a href="mailto:info@pbxexchange.com" className="text-emerald-400 hover:text-emerald-300">info@pbxexchange.com</a>
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
