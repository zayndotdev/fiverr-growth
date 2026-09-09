import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

// ─── ProtectedRoute: Requires authentication ────────────────────────────────
// Redirects unauthenticated users to "/" (where they can sign in)

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f7f7f7]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-[#1dbf73] border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-[#74767e] font-medium">Loading...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    // Save the attempted URL so we can redirect after login
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

// ─── OnboardingGuard: Requires completed/skipped onboarding ─────────────────
// Wraps protected pages that need onboarding to be done first

interface OnboardingGuardProps {
  children: React.ReactNode;
}

export const OnboardingGuard: React.FC<OnboardingGuardProps> = ({ children }) => {
  const { user, isOnboardingRequired } = useAuth();

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (isOnboardingRequired()) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
};
