import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSession } from '../contexts/SessionContext';

/**
 * ProtectedRoute: Only allows access if session exists AND is verified
 * Redirects to /login if no session
 * Redirects to /verify if session exists but not verified
 */
export default function ProtectedRoute({ children }) {
  const { session } = useSession();

  if (!session.exists) {
    return <Navigate to="/login" replace />;
  }

  if (!session.verified) {
    return <Navigate to="/verify" replace />;
  }

  return children;
}
