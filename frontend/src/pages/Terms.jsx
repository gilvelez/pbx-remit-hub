import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Terms() {
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
          <h1 className="text-4xl font-bold text-white mb-2">Terms of Service</h1>
          <p className="text-lg text-slate-400 mb-1">Philippine Bayani Exchange (PBX)</p>
          <p className="text-sm text-slate-500">Last Updated: December 2025</p>
        </div>

        {/* Content Sections */}
        <div className="space-y-8 text-slate-300">
          {/* Acceptance of Terms */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">1. Acceptance of Terms</h2>
            <div className="space-y-3 text-base leading-relaxed">
              <p>
                By accessing or using Philippine Bayani Exchange (&ldquo;PBX&rdquo;), you agree to be bound by these Terms of Service. If you do not agree to these terms, you may not use our services.
              </p>
              <p>
                These terms apply to all users, including visitors, registered users, and transaction participants.
              </p>
            </div>
          </section>

          {/* Eligibility */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">2. Eligibility to Use PBX</h2>
            <div className="space-y-3 text-base leading-relaxed">
              <p>
                To use PBX services, you must:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Be at least 18 years of age</li>
                <li>Have the legal capacity to enter into binding contracts</li>
                <li>Not be prohibited from using financial services under applicable law</li>
                <li>Reside in a jurisdiction where PBX services are available</li>
                <li>Provide accurate and complete identity verification information</li>
              </ul>
              <p className="mt-3 text-amber-300">
                <strong>Important:</strong> PBX reserves the right to refuse service to anyone for any lawful reason.
              </p>
            </div>
          </section>

          {/* User Responsibilities */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">3. User Responsibilities</h2>
            <div className="space-y-3 text-base leading-relaxed">
              <p>
                As a user of PBX, you agree to:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Provide Accurate Information:</strong> Keep your account information up to date and accurate</li>
                <li><strong>Secure Your Account:</strong> Maintain the confidentiality of your login credentials and enable multi-factor authentication</li>
                <li><strong>Comply with Laws:</strong> Use PBX services in compliance with all applicable laws and regulations</li>
                <li><strong>Report Suspicious Activity:</strong> Notify PBX immediately of any unauthorized access or security concerns</li>
                <li><strong>Pay Applicable Fees:</strong> Pay all fees and charges associated with your transactions</li>
                <li><strong>Review Transactions:</strong> Verify transaction details before confirming transfers</li>
              </ul>
            </div>
          </section>

          {/* Prohibited Activities */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">4. Prohibited Activities</h2>
            <div className="space-y-3 text-base leading-relaxed">
              <p>
                You may not use PBX for any of the following purposes:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Fraud or Deception:</strong> Provide false information, impersonate others, or engage in fraudulent transactions</li>
                <li><strong>Money Laundering:</strong> Use PBX to launder money or finance illegal activities</li>
                <li><strong>Unauthorized Access:</strong> Attempt to hack, disrupt, or gain unauthorized access to PBX systems</li>
                <li><strong>Illegal Transactions:</strong> Send or receive funds for illegal goods, services, or activities</li>
                <li><strong>Abuse or Harassment:</strong> Harass, threaten, or abuse other users or PBX staff</li>
                <li><strong>Circumvention:</strong> Attempt to bypass security measures, KYC requirements, or transaction limits</li>
                <li><strong>Automated Access:</strong> Use bots, scripts, or automated tools to access PBX without permission</li>
              </ul>
              <p className="mt-3 text-rose-300 font-semibold">
                Violation of these prohibitions may result in immediate account termination and legal action.
              </p>
            </div>
          </section>

          {/* Third-Party Services */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">5. Third-Party Service Disclaimer</h2>
            <div className="space-y-3 text-base leading-relaxed">
              <p>
                PBX uses third-party service providers to deliver our services, including:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Plaid Technologies, Inc.</strong> for bank account linking and verification</li>
                <li><strong>Circle Internet Financial, LLC</strong> for USDC wallets and blockchain transactions</li>
                <li><strong>Payment Partners</strong> for money transfer processing</li>
              </ul>
              <p className="mt-3">
                These third-party services are governed by their own terms of service and privacy policies:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Plaid Terms: <a href="https://plaid.com/legal" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:text-emerald-300">https://plaid.com/legal</a></li>
                <li>Circle Terms: <a href="https://www.circle.com/legal" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:text-emerald-300">https://www.circle.com/legal</a></li>
              </ul>
              <p className="mt-3 font-semibold text-amber-300">
                PBX is not responsible for the actions, policies, or service interruptions of third-party providers.
              </p>
            </div>
          </section>

          {/* Limitation of Liability */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">6. Limitation of Liability</h2>
            <div className="space-y-3 text-base leading-relaxed">
              <p>
                To the maximum extent permitted by law:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>PBX is provided &ldquo;as is&rdquo; without warranties of any kind</li>
                <li>PBX is not liable for indirect, incidental, or consequential damages</li>
                <li>PBX is not responsible for losses caused by user error, unauthorized access, or third-party failures</li>
                <li>PBX&apos;s total liability is limited to the amount of fees paid by you in the 12 months prior to the claim</li>
              </ul>
              <p className="mt-3">
                <strong>Examples of non-liability:</strong>
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Exchange rate fluctuations</li>
                <li>Delays caused by third-party banks or payment processors</li>
                <li>Loss of funds due to user error (e.g., incorrect recipient information)</li>
                <li>Service interruptions due to maintenance or technical issues</li>
              </ul>
            </div>
          </section>

          {/* Service Availability */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">7. Service Availability</h2>
            <div className="space-y-3 text-base leading-relaxed">
              <p>
                PBX strives to provide reliable service but does not guarantee:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Uninterrupted or error-free operation</li>
                <li>Availability at all times (maintenance windows may occur)</li>
                <li>Compatibility with all devices or browsers</li>
                <li>Specific transaction processing times</li>
              </ul>
              <p className="mt-3">
                PBX may suspend or terminate services at any time for maintenance, security, or legal reasons.
              </p>
            </div>
          </section>

          {/* Termination Rights */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">8. Termination Rights</h2>
            <div className="space-y-3 text-base leading-relaxed">
              <p>
                <strong>PBX may terminate or suspend your account if:</strong>
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>You violate these Terms of Service</li>
                <li>You engage in fraudulent or illegal activity</li>
                <li>Your account poses a security risk</li>
                <li>Required by law or regulatory order</li>
                <li>You fail to complete identity verification</li>
              </ul>
              <p className="mt-3">
                <strong>You may close your account at any time by:</strong>
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Contacting PBX support at <a href="mailto:info@pbxexchange.com" className="text-emerald-400 hover:text-emerald-300">info@pbxexchange.com</a></li>
                <li>Completing all pending transactions before closure</li>
                <li>Withdrawing all remaining balances</li>
              </ul>
              <p className="mt-3 text-amber-300">
                <strong>Note:</strong> Some data must be retained for 7 years after account closure for AML/KYC compliance.
              </p>
            </div>
          </section>

          {/* Governing Law */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">9. Governing Law & Dispute Resolution</h2>
            <div className="space-y-3 text-base leading-relaxed">
              <p>
                These Terms of Service are governed by the laws of the <strong>State of Florida, United States</strong>, without regard to conflict of law principles.
              </p>
              <p>
                <strong>Dispute Resolution:</strong>
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Disputes should first be resolved through informal negotiation with PBX support</li>
                <li>If informal resolution fails, disputes will be resolved through binding arbitration in Florida</li>
                <li>You waive the right to participate in class-action lawsuits against PBX</li>
              </ul>
            </div>
          </section>

          {/* Changes to Terms */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">10. Changes to These Terms</h2>
            <div className="space-y-3 text-base leading-relaxed">
              <p>
                PBX may update these Terms of Service at any time. Changes will be effective upon posting with an updated &ldquo;Last Updated&rdquo; date.
              </p>
              <p>
                Material changes will be communicated via email. Continued use of PBX after changes constitutes acceptance of the updated terms.
              </p>
            </div>
          </section>

          {/* Contact Information */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">11. Contact Information</h2>
            <div className="space-y-3 text-base leading-relaxed">
              <p>
                For questions about these Terms of Service, contact:
              </p>
              <div className="mt-4 p-4 rounded-xl bg-slate-900 border border-slate-800">
                <p className="font-semibold text-white mb-2">PBX Legal Team</p>
                <p>Email: <a href="mailto:info@pbxexchange.com" className="text-emerald-400 hover:text-emerald-300">info@pbxexchange.com</a></p>
              </div>
            </div>
          </section>
        </div>

        {/* Bottom Notice */}
        <div className="mt-12 pt-8 border-t border-slate-800">
          <p className="text-sm text-slate-500 text-center">
            By using PBX, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
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
