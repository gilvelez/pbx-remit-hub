import React from 'react';
import { useSession } from '../contexts/SessionContext';

export default function PlaidGateTest() {
  const { session } = useSession();

  const getStatusDisplay = () => {
    if (!session.exists) {
      return {
        icon: '❌',
        title: 'Blocked: No Session',
        message: 'User must log in before accessing Plaid Link',
        color: 'rose',
      };
    }

    if (!session.verified) {
      return {
        icon: '⚠️',
        title: 'Blocked: Verification Required',
        message: 'Verification required before connecting a bank',
        color: 'amber',
      };
    }

    return {
      icon: '✅',
      title: 'Verified ✅ — Plaid Link enabled',
      message: 'User has completed verification and can connect bank accounts',
      color: 'emerald',
    };
  };

  const status = getStatusDisplay();

  return (
    <div className="min-h-screen bg-slate-950 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">Plaid Gate Test</h1>
          <p className="text-sm text-slate-400">
            Internal testing page for Plaid compliance verification
          </p>
        </div>

        {/* Status Card */}
        <div
          className={`rounded-3xl border p-6 mb-6 ${
            status.color === 'rose'
              ? 'border-rose-800 bg-rose-950/30'
              : status.color === 'amber'
              ? 'border-amber-800 bg-amber-950/30'
              : 'border-emerald-800 bg-emerald-950/30'
          }`}
        >
          <div className="flex items-start gap-4">
            <div className="text-4xl">{status.icon}</div>
            <div className="flex-1">
              <h2
                className={`text-xl font-bold mb-2 ${
                  status.color === 'rose'
                    ? 'text-rose-200'
                    : status.color === 'amber'
                    ? 'text-amber-200'
                    : 'text-emerald-200'
                }`}
              >
                {status.title}
              </h2>
              <p
                className={`text-sm ${
                  status.color === 'rose'
                    ? 'text-rose-300'
                    : status.color === 'amber'
                    ? 'text-amber-300'
                    : 'text-emerald-300'
                }`}
              >
                {status.message}
              </p>
            </div>
          </div>
        </div>

        {/* Session Details */}
        <div className="rounded-3xl border border-slate-800 bg-slate-950 p-6">
          <h3 className="text-lg font-bold text-white mb-4">Session Details</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-400">Session Exists:</span>
              <span className={session.exists ? 'text-emerald-400' : 'text-rose-400'}>
                {session.exists ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Verified:</span>
              <span className={session.verified ? 'text-emerald-400' : 'text-amber-400'}>
                {session.verified ? 'Yes' : 'No'}
              </span>
            </div>
            {session.user?.email && (
              <div className="flex justify-between">
                <span className="text-slate-400">User Email:</span>
                <span className="text-slate-200">{session.user.email}</span>
              </div>
            )}
            {session.token && (
              <div className="flex justify-between">
                <span className="text-slate-400">Session Token:</span>
                <span className="text-slate-200 font-mono text-xs">
                  {session.token.substring(0, 8)}...{session.token.substring(session.token.length - 8)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Test Scenarios */}
        <div className="mt-6 rounded-3xl border border-slate-800 bg-slate-950 p-6">
          <h3 className="text-lg font-bold text-white mb-4">Test Scenarios</h3>
          <div className="space-y-2 text-sm text-slate-300">
            <p>✓ Not logged in → Plaid Link blocked</p>
            <p>✓ Logged in but not verified → Plaid Link blocked</p>
            <p>✓ Logged in + verified → Plaid Link enabled</p>
          </div>
        </div>
      </div>
    </div>
  );
}
