import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useSession } from "../../contexts/SessionContext";
import { getRecipients, getPaymentMethods, DELIVERY_METHODS } from "../../lib/mockApi";

const SECTIONS = {
  MAIN: 'main',
  PROFILE: 'profile',
  PAYMENTS: 'payments',
  RECIPIENTS: 'recipients',
  SECURITY: 'security',
  LEGAL: 'legal',
};

export default function Manage() {
  const { session, logout } = useSession();
  const navigate = useNavigate();
  const [section, setSection] = useState(SECTIONS.MAIN);
  const [recipients, setRecipients] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);

  useEffect(() => {
    getRecipients().then(setRecipients);
    getPaymentMethods().then(setPaymentMethods);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  if (section !== SECTIONS.MAIN) {
    return (
      <div className="px-4 py-6">
        <button
          onClick={() => setSection(SECTIONS.MAIN)}
          className="flex items-center gap-2 text-gray-600 mb-6"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        {section === SECTIONS.PROFILE && <ProfileSection session={session} />}
        {section === SECTIONS.PAYMENTS && <PaymentMethodsSection methods={paymentMethods} />}
        {section === SECTIONS.RECIPIENTS && <RecipientsSection recipients={recipients} />}
        {section === SECTIONS.SECURITY && <SecuritySection />}
        {section === SECTIONS.LEGAL && <LegalSection />}
      </div>
    );
  }

  return (
    <div className="px-4 py-6">
      {/* Profile Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-16 h-16 rounded-full bg-[#0A2540] flex items-center justify-center text-white text-xl font-bold">
          {session?.user?.email?.[0]?.toUpperCase() || 'U'}
        </div>
        <div>
          <div className="font-semibold text-[#1A1A1A]">
            {session?.user?.fullName || session?.user?.email?.split('@')[0] || 'User'}
          </div>
          <div className="text-sm text-gray-500">{session?.user?.email}</div>
        </div>
      </div>

      {/* Menu Items */}
      <div className="space-y-2">
        <MenuItem
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          }
          label="Profile"
          onClick={() => setSection(SECTIONS.PROFILE)}
        />
        
        <MenuItem
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          }
          label="Payment Methods"
          badge={paymentMethods.length > 0 ? paymentMethods.length : null}
          onClick={() => setSection(SECTIONS.PAYMENTS)}
        />
        
        <MenuItem
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          }
          label="Recipients"
          badge={recipients.length > 0 ? recipients.length : null}
          onClick={() => setSection(SECTIONS.RECIPIENTS)}
        />
        
        <MenuItem
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          }
          label="Security"
          onClick={() => setSection(SECTIONS.SECURITY)}
        />
        
        <MenuItem
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
          label="Legal"
          onClick={() => setSection(SECTIONS.LEGAL)}
        />
      </div>

      {/* Sign Out */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 text-red-600 font-medium py-3"
          data-testid="manage-logout-btn"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Sign out
        </button>
      </div>

      {/* App Version */}
      <div className="mt-6 text-center text-xs text-gray-400">
        PBX v1.0.0 • Built in the United States
      </div>
    </div>
  );
}

function MenuItem({ icon, label, badge, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100 hover:border-gray-200 transition"
    >
      <div className="flex items-center gap-3">
        <div className="text-gray-600">{icon}</div>
        <span className="font-medium text-[#1A1A1A]">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        {badge && (
          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
            {badge}
          </span>
        )}
        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </button>
  );
}

function ProfileSection({ session }) {
  return (
    <div>
      <h1 className="text-xl font-bold text-[#1A1A1A] mb-6">Profile</h1>
      
      <div className="space-y-4">
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <label className="text-sm text-gray-500 mb-1 block">Email</label>
          <div className="font-medium text-[#1A1A1A]">{session?.user?.email || 'Not set'}</div>
        </div>
        
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <label className="text-sm text-gray-500 mb-1 block">Full Name</label>
          <div className="font-medium text-[#1A1A1A]">{session?.user?.fullName || 'Not set'}</div>
        </div>
        
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <label className="text-sm text-gray-500 mb-1 block">Phone</label>
          <div className="font-medium text-[#1A1A1A]">{session?.user?.phone || 'Not set'}</div>
        </div>
      </div>
    </div>
  );
}

function PaymentMethodsSection({ methods }) {
  return (
    <div>
      <h1 className="text-xl font-bold text-[#1A1A1A] mb-6">Payment Methods</h1>
      
      {methods.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No payment methods saved</p>
          <p className="text-sm text-gray-400 mt-1">Add one when you make a transfer</p>
        </div>
      ) : (
        <div className="space-y-3">
          {methods.map((method) => (
            <div key={method.id} className="bg-white rounded-xl p-4 border border-gray-100">
              <div className="font-medium text-[#1A1A1A]">{method.institution || method.name}</div>
              <div className="text-sm text-gray-500">
                {method.accountType} •••• {method.last4}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function RecipientsSection({ recipients }) {
  return (
    <div>
      <h1 className="text-xl font-bold text-[#1A1A1A] mb-6">Recipients</h1>
      
      {recipients.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No recipients saved</p>
          <p className="text-sm text-gray-400 mt-1">Recipients are saved automatically when you send</p>
        </div>
      ) : (
        <div className="space-y-3">
          {recipients.map((r) => (
            <div key={r.id} className="bg-white rounded-xl p-4 border border-gray-100 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-lg">
                {r.fullName?.[0]?.toUpperCase() || '?'}
              </div>
              <div className="flex-1">
                <div className="font-medium text-[#1A1A1A]">{r.fullName}</div>
                <div className="text-sm text-gray-500">
                  {DELIVERY_METHODS.find(d => d.id === r.deliveryMethod)?.name} • {r.phone || r.accountNumber}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SecuritySection() {
  return (
    <div>
      <h1 className="text-xl font-bold text-[#1A1A1A] mb-6">Security</h1>
      
      <div className="space-y-3">
        <div className="bg-white rounded-xl p-4 border border-gray-100 flex items-center justify-between">
          <div>
            <div className="font-medium text-[#1A1A1A]">Face ID</div>
            <div className="text-sm text-gray-500">Use biometrics to log in</div>
          </div>
          <div className="w-12 h-7 rounded-full bg-gray-200 p-0.5">
            <div className="w-6 h-6 rounded-full bg-white shadow" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <div className="font-medium text-[#1A1A1A]">Change Password</div>
          <div className="text-sm text-gray-500">Update your password</div>
        </div>
        
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <div className="font-medium text-[#1A1A1A]">Two-Factor Authentication</div>
          <div className="text-sm text-gray-500">Add extra security to your account</div>
        </div>
      </div>
    </div>
  );
}

function LegalSection() {
  return (
    <div>
      <h1 className="text-xl font-bold text-[#1A1A1A] mb-6">Legal</h1>
      
      <div className="space-y-3">
        <Link to="/terms" className="block bg-white rounded-xl p-4 border border-gray-100">
          <div className="font-medium text-[#1A1A1A]">Terms of Service</div>
        </Link>
        
        <Link to="/privacy" className="block bg-white rounded-xl p-4 border border-gray-100">
          <div className="font-medium text-[#1A1A1A]">Privacy Policy</div>
        </Link>
        
        <Link to="/security" className="block bg-white rounded-xl p-4 border border-gray-100">
          <div className="font-medium text-[#1A1A1A]">Security</div>
        </Link>
        
        <Link to="/data-retention" className="block bg-white rounded-xl p-4 border border-gray-100">
          <div className="font-medium text-[#1A1A1A]">Data Retention</div>
        </Link>
      </div>
    </div>
  );
}
