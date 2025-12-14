import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Security() {
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
          <h1 className="text-4xl font-bold text-white mb-2">Security & Data Protection</h1>
          <p className="text-lg text-slate-400 mb-1">Philippine Bayani Exchange (PBX)</p>
          <p className="text-sm text-slate-500">Last Updated: December 2025</p>
        </div>

        {/* Content Sections */}
        <div className="space-y-8 text-slate-300">
          {/* Overview */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">1. Security Commitment</h2>
            <div className="space-y-3 text-base leading-relaxed">
              <p>
                At PBX, security is our top priority. We implement industry-standard security measures to protect your data, transactions, and financial information from unauthorized access, fraud, and cyber threats.
              </p>
              <p>
                This page describes the security controls and data protection practices we use to safeguard your information.
              </p>
            </div>
          </section>

          {/* Encryption */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">2. Encryption in Transit and at Rest</h2>
            <div className="space-y-3 text-base leading-relaxed">
              <p>
                PBX uses encryption to protect your data at all stages:
              </p>
              <div className="p-4 rounded-xl bg-slate-900 border border-emerald-800 mt-4">
                <h3 className="font-bold text-emerald-400 mb-2">✅ Encryption in Transit</h3>
                <ul className="list-disc list-inside space-y-2 ml-4 text-sm">
                  <li><strong>TLS 1.3:</strong> All data transmitted between your device and PBX servers is encrypted using Transport Layer Security (TLS) 1.3</li>
                  <li><strong>HTTPS Only:</strong> Our website and API endpoints use HTTPS exclusively</li>
                  <li><strong>Secure Communication:</strong> All API calls to third-party partners (Plaid, Circle) use encrypted channels</li>
                </ul>
              </div>
              <div className="p-4 rounded-xl bg-slate-900 border border-emerald-800 mt-4">
                <h3 className="font-bold text-emerald-400 mb-2">✅ Encryption at Rest</h3>
                <ul className="list-disc list-inside space-y-2 ml-4 text-sm">
                  <li><strong>Database Encryption:</strong> All stored data is encrypted using AES-256 encryption</li>
                  <li><strong>Backup Encryption:</strong> Database backups are encrypted before storage</li>
                  <li><strong>Key Management:</strong> Encryption keys are securely managed and rotated regularly</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Access Controls */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">3. Role-Based Access Controls</h2>
            <div className="space-y-3 text-base leading-relaxed">
              <p>
                PBX implements strict access controls to limit who can view or modify sensitive data:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Principle of Least Privilege:</strong> Employees only have access to data necessary for their role</li>
                <li><strong>Role Segregation:</strong> Different teams have different access levels (e.g., support, engineering, compliance)</li>
                <li><strong>Access Logging:</strong> All access to sensitive data is logged and monitored</li>
                <li><strong>Regular Reviews:</strong> Access permissions are reviewed quarterly</li>
                <li><strong>Immediate Revocation:</strong> Access is revoked immediately when employees leave or change roles</li>
              </ul>
            </div>
          </section>

          {/* Multi-Factor Authentication */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">4. Multi-Factor Authentication (MFA)</h2>
            <div className="space-y-3 text-base leading-relaxed">
              <p>
                MFA adds an extra layer of security to prevent unauthorized access:
              </p>
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 mt-4">
                <h3 className="font-bold text-white mb-2">User Accounts</h3>
                <p className="text-sm">Users are required to verify their identity through email or SMS before accessing their accounts or initiating transactions.</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 mt-4">
                <h3 className="font-bold text-white mb-2">Internal Systems</h3>
                <p className="text-sm">All PBX employees must use MFA to access internal systems, databases, and administrative tools. We use hardware security keys and time-based one-time passwords (TOTP).</p>
              </div>
            </div>
          </section>

          {/* Vendor Security */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">5. Vendor Security Reviews</h2>
            <div className="space-y-3 text-base leading-relaxed">
              <p>
                PBX carefully vets all third-party service providers to ensure they meet our security standards:
              </p>
              <div className="space-y-4 mt-4">
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                  <h3 className="font-bold text-white mb-2">Plaid Technologies, Inc.</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Bank-grade encryption and security</li>
                    <li>SOC 2 Type II certified</li>
                    <li>Trusted by thousands of financial institutions</li>
                    <li>Regular security audits and compliance reviews</li>
                  </ul>
                </div>
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                  <h3 className="font-bold text-white mb-2">Circle Internet Financial, LLC</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Industry-leading blockchain security</li>
                    <li>Regulated financial institution</li>
                    <li>USDC reserves held in US banks</li>
                    <li>Monthly attestation reports</li>
                  </ul>
                </div>
              </div>
              <p className="mt-4">
                PBX conducts vendor security assessments before integration and monitors third-party security practices on an ongoing basis.
              </p>
            </div>
          </section>

          {/* Monitoring */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">6. Monitoring for Fraud and Unauthorized Access</h2>
            <div className="space-y-3 text-base leading-relaxed">
              <p>
                PBX employs automated monitoring systems to detect and prevent security threats:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Real-Time Monitoring:</strong> 24/7 monitoring of system activity, login attempts, and transactions</li>
                <li><strong>Anomaly Detection:</strong> Machine learning models detect unusual patterns that may indicate fraud</li>
                <li><strong>Failed Login Tracking:</strong> Multiple failed login attempts trigger account lockouts</li>
                <li><strong>Geographic Anomalies:</strong> Logins from unusual locations trigger additional verification</li>
                <li><strong>Transaction Monitoring:</strong> Large or suspicious transactions are flagged for review</li>
                <li><strong>Security Alerts:</strong> Users receive immediate notifications of security events</li>
              </ul>
            </div>
          </section>

          {/* Incident Response */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">7. Incident Response Procedures</h2>
            <div className="space-y-3 text-base leading-relaxed">
              <p>
                In the event of a security incident, PBX follows a structured response protocol:
              </p>
              <div className="space-y-3 mt-4">
                <div className="p-3 rounded-xl bg-slate-900 border-l-4 border-emerald-500">
                  <p className="font-bold text-white">Step 1: Detection & Containment</p>
                  <p className="text-sm">Identify and contain the incident to prevent further damage</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-900 border-l-4 border-emerald-500">
                  <p className="font-bold text-white">Step 2: Investigation</p>
                  <p className="text-sm">Determine the scope, cause, and impact of the incident</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-900 border-l-4 border-emerald-500">
                  <p className="font-bold text-white">Step 3: Notification</p>
                  <p className="text-sm">Notify affected users and regulatory authorities as required by law</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-900 border-l-4 border-emerald-500">
                  <p className="font-bold text-white">Step 4: Remediation</p>
                  <p className="text-sm">Implement fixes to prevent recurrence</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-900 border-l-4 border-emerald-500">
                  <p className="font-bold text-white">Step 5: Post-Incident Review</p>
                  <p className="text-sm">Analyze the incident and update security procedures</p>
                </div>
              </div>
              <p className="mt-4 font-semibold text-emerald-400">
                PBX is committed to transparency. Users will be notified promptly if their data is affected by a security incident.
              </p>
            </div>
          </section>

          {/* User Security Best Practices */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">8. User Security Best Practices</h2>
            <div className="space-y-3 text-base leading-relaxed">
              <p>
                You can help keep your account secure by following these best practices:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Use Strong Passwords:</strong> Create unique passwords with a mix of letters, numbers, and symbols</li>
                <li><strong>Enable MFA:</strong> Always enable multi-factor authentication for your account</li>
                <li><strong>Keep Software Updated:</strong> Use the latest version of your browser and operating system</li>
                <li><strong>Avoid Public Wi-Fi:</strong> Do not access your PBX account on public or unsecured networks</li>
                <li><strong>Verify URLs:</strong> Always check that you are on the official PBX website before logging in</li>
                <li><strong>Report Suspicious Activity:</strong> Contact PBX immediately if you notice unauthorized transactions</li>
              </ul>
            </div>
          </section>

          {/* Reporting Security Issues */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">9. Reporting Security Concerns</h2>
            <div className="space-y-3 text-base leading-relaxed">
              <p>
                If you discover a security vulnerability or have concerns about your account security, please contact us immediately:
              </p>
              <div className="mt-4 p-4 rounded-xl bg-slate-900 border border-slate-800">
                <p className="font-semibold text-white mb-2">PBX Security Team</p>
                <p>Email: <a href="mailto:info@pbxexchange.com" className="text-emerald-400 hover:text-emerald-300">info@pbxexchange.com</a></p>
                <p className="mt-2 text-sm">Subject Line: &ldquo;Security Report&rdquo;</p>
              </div>
              <p className="mt-4 text-sm text-slate-400">
                We take all security reports seriously and will respond promptly to verified concerns.
              </p>
            </div>
          </section>
        </div>

        {/* Bottom Notice */}
        <div className="mt-12 pt-8 border-t border-slate-800">
          <p className="text-sm text-slate-500 text-center">
            PBX is committed to maintaining the highest standards of security and data protection.
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
