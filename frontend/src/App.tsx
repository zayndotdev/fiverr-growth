import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import gsap from 'gsap';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/layout/Navbar';
import { OnboardingLayout } from './components/onboarding/OnboardingLayout';
import { OnboardingStep1 } from './components/onboarding/OnboardingStep1';
import { OnboardingStep2 } from './components/onboarding/OnboardingStep2';
import { OnboardingStep3 } from './components/onboarding/OnboardingStep3';
import { GigGeneratorView } from './components/modules/GigGeneratorView';
import { BuyerBriefView } from './components/modules/BuyerBriefView';
import { MarketResearchView } from './components/modules/MarketResearchView';
import { SavedGigsView } from './components/modules/SavedGigsView';
import { SettingsPage } from './components/settings/SettingsPage';
import { AuthModal } from './components/auth/AuthModal';
import { ProtectedRoute, OnboardingGuard } from './components/guards/RouteGuards';

// ─── Animated Page Wrapper ──────────────────────────────────────────────────

const AnimatedPage: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    if (contentRef.current) {
      gsap.fromTo(
        contentRef.current,
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.25, ease: 'power2.out' }
      );
    }
  }, [location.pathname]);

  return <div ref={contentRef}>{children}</div>;
};

// ─── Landing / Home Page ────────────────────────────────────────────────────

const LandingRedirect: React.FC<{ onOpenAuth: () => void }> = ({ onOpenAuth }) => {
  const { user, isOnboardingRequired } = useAuth();

  // If logged in, redirect to appropriate page
  if (user) {
    if (isOnboardingRequired()) {
      return <Navigate to="/onboarding" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  // Guest landing page - show a simple CTA
  return (
    <div className="flex-1 flex flex-col items-center justify-center py-20 px-4 text-center">
      <div className="max-w-lg">
        <h1 className="text-3xl md:text-4xl font-bold text-[#222325] mb-4">
          Grow Your Fiverr Business
          <span className="text-[#1dbf73]">.</span>
        </h1>
        <p className="text-[#74767e] text-sm md:text-base mb-8 leading-relaxed">
          AI-powered growth engine for Fiverr freelancers. Identify your ideal clients,
          generate optimized gigs, and match with live buyer briefs — all grounded in your real profile data.
        </p>
        <button
          onClick={onOpenAuth}
          className="fiverr-btn-green px-8 py-3 rounded-md text-sm font-bold cursor-pointer shadow-xs"
        >
          Get Started — It's Free
        </button>
      </div>
    </div>
  );
};

// ─── Dashboard Page (replaces the old strategist default) ───────────────────

const DashboardPage: React.FC = () => {
  const { user, userContext } = useAuth();

  return (
    <div className="space-y-6">
      {/* Onboarding skipped banner */}
      {user && !user.onboardingCompleted && user.onboardingSkipped && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-amber-600 text-lg">⚠️</span>
            <div>
              <p className="text-sm font-semibold text-amber-800">Onboarding Incomplete</p>
              <p className="text-xs text-amber-700">Complete your onboarding for personalized recommendations.</p>
            </div>
          </div>
          <a
            href="/onboarding"
            className="fiverr-btn-green px-4 py-1.5 rounded text-xs font-bold cursor-pointer"
          >
            Complete Now
          </a>
        </div>
      )}

      {/* Welcome card */}
      <div className="bg-white border border-[#dadbdd] rounded-xl p-6 shadow-xs">
        <h2 className="text-xl font-bold text-[#222325]">
          Welcome{user ? `, ${user.username}` : ''}
          <span className="text-[#1dbf73]">.</span>
        </h2>
        <p className="text-sm text-[#74767e] mt-1">
          {userContext?.strategy
            ? `Your growth strategy is active. Use the tools below to generate gigs, find briefs, and research markets.`
            : `Explore the platform tools below to grow your Fiverr business.`}
        </p>
      </div>

      {/* Quick navigation grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Gig Studio', desc: 'Generate SEO-optimized gig packages', href: '/gigs', icon: '✨' },
          { label: 'Buyer Briefs', desc: 'Match with live client opportunities', href: '/briefs', icon: '📨' },
          { label: 'Market Research', desc: 'Analyze niches and competitors', href: '/research', icon: '📊' },
          { label: 'Saved Library', desc: 'View your saved gigs and proposals', href: '/saved', icon: '📁' },
        ].map((item) => (
          <a
            key={item.href}
            href={item.href}
            className="bg-white border border-[#dadbdd] rounded-lg p-4 hover:border-[#1dbf73] hover:shadow-md transition-all group"
          >
            <div className="text-2xl mb-2">{item.icon}</div>
            <h3 className="text-sm font-bold text-[#222325] group-hover:text-[#1dbf73]">{item.label}</h3>
            <p className="text-xs text-[#74767e] mt-0.5">{item.desc}</p>
          </a>
        ))}
      </div>
    </div>
  );
};

// ─── App Content (inside BrowserRouter) ─────────────────────────────────────

const AppContent: React.FC = () => {
  const [savedGigs, setSavedGigs] = useState<any[]>([]);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const { user } = useAuth();

  const fetchSavedGigs = async () => {
    try {
      const res = await fetch('/api/v1/gigs');
      const json = await res.json();
      if (json.success) {
        setSavedGigs(json.data);
      }
    } catch (err) {
      console.warn('Backend not yet connected or starting:', err);
    }
  };

  useEffect(() => {
    if (user) fetchSavedGigs();
  }, [user]);

  return (
    <div className="min-h-screen flex flex-col bg-[#f7f7f7] text-[#222325] selection:bg-[#1dbf73] selection:text-white relative overflow-x-hidden font-sans">
      {/* Navbar */}
      <Navbar
        gigsCount={savedGigs.length}
        onOpenAuth={() => setIsAuthModalOpen(true)}
      />

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-6 py-6 space-y-6 relative z-10">
        <AnimatedPage>
          <Routes>
            {/* Public: Landing */}
            <Route path="/" element={<LandingRedirect onOpenAuth={() => setIsAuthModalOpen(true)} />} />

            {/* Protected: Onboarding Flow */}
            <Route
              path="/onboarding"
              element={
                <ProtectedRoute>
                  <OnboardingLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/onboarding/step/1" replace />} />
              <Route path="step/1" element={<OnboardingStep1 />} />
              <Route path="step/2" element={<OnboardingStep2 />} />
              <Route path="step/3" element={<OnboardingStep3 />} />
            </Route>

            {/* Protected + Onboarding Guard: Main App Pages */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <OnboardingGuard>
                    <DashboardPage />
                  </OnboardingGuard>
                </ProtectedRoute>
              }
            />
            <Route
              path="/gigs"
              element={
                <ProtectedRoute>
                  <OnboardingGuard>
                    <GigGeneratorView onGigGenerated={fetchSavedGigs} />
                  </OnboardingGuard>
                </ProtectedRoute>
              }
            />
            <Route
              path="/briefs"
              element={
                <ProtectedRoute>
                  <OnboardingGuard>
                    <BuyerBriefView />
                  </OnboardingGuard>
                </ProtectedRoute>
              }
            />
            <Route
              path="/research"
              element={
                <ProtectedRoute>
                  <OnboardingGuard>
                    <MarketResearchView />
                  </OnboardingGuard>
                </ProtectedRoute>
              }
            />
            <Route
              path="/saved"
              element={
                <ProtectedRoute>
                  <OnboardingGuard>
                    <SavedGigsView gigs={savedGigs} />
                  </OnboardingGuard>
                </ProtectedRoute>
              }
            />

            {/* Protected (no onboarding required): Settings */}
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <SettingsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings/:tab"
              element={
                <ProtectedRoute>
                  <SettingsPage />
                </ProtectedRoute>
              }
            />

            {/* Catch-all: Redirect to landing */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AnimatedPage>
      </main>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      {/* Footer */}
      <footer className="bg-white border-t border-[#dadbdd] py-6 px-6 mt-12 text-center text-xs text-[#74767e]">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#222325]">fiverr<span className="text-[#1dbf73]">.</span></span>
            <span>Growth Intelligence Engine &copy; 2026.</span>
          </div>
          <div className="flex items-center gap-4 text-[#74767e]">
            <span>Verified Fiverr Marketplace Scraping</span>
            <span>&bull;</span>
            <span>Strategic Growth Architecture</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

// ─── Root App ───────────────────────────────────────────────────────────────

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
