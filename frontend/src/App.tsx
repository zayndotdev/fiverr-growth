import React, { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/layout/Navbar';
import { AmbientBackdrop } from './components/3d/HeroScene';
import { OnboardingStrategistView } from './components/onboarding/OnboardingStrategistView';
import { GigGeneratorView } from './components/modules/GigGeneratorView';
import { BuyerBriefView } from './components/modules/BuyerBriefView';
import { MarketResearchView } from './components/modules/MarketResearchView';
import { SavedGigsView } from './components/modules/SavedGigsView';
import { AuthModal } from './components/auth/AuthModal';

const AppContent: React.FC = () => {
  // Default to 'strategist' for guidance
  const [activeTab, setActiveTab] = useState<string>('strategist');
  const [savedGigs, setSavedGigs] = useState<any[]>([]);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [prefilledGig, setPrefilledGig] = useState<{ niche: string; skills: string } | null>(null);

  const contentRef = useRef<HTMLDivElement>(null);

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
    fetchSavedGigs();
  }, []);

  // Animate tab transitions with GSAP
  useEffect(() => {
    if (contentRef.current) {
      gsap.fromTo(
        contentRef.current,
        { opacity: 0, y: 12 },
        { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out' }
      );
    }
  }, [activeTab]);

  const handleSelectGigFromBlueprint = (gigData: { niche: string; skills: string }) => {
    setPrefilledGig(gigData);
    setActiveTab('gigs');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#07090e] text-gray-100 selection:bg-emerald-500 selection:text-gray-950 relative overflow-x-hidden">
      {/* Ambient 3D Three.js Glow Backdrop */}
      <AmbientBackdrop />

      {/* Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        gigsCount={savedGigs.length}
        onOpenAuth={() => setIsAuthModalOpen(true)}
      />

      {/* Main Command Center Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-6 py-6 space-y-6 relative z-10">
        {/* Tab Module Views (GSAP Animated) */}
        <div ref={contentRef} className="w-full">
          {activeTab === 'strategist' && (
            <OnboardingStrategistView
              onSelectGigForGeneration={handleSelectGigFromBlueprint}
              onOpenAuth={() => setIsAuthModalOpen(true)}
            />
          )}

          {activeTab === 'gigs' && (
            <GigGeneratorView
              onGigGenerated={fetchSavedGigs}
              initialNiche={prefilledGig?.niche}
              initialSkills={prefilledGig?.skills}
            />
          )}

          {activeTab === 'briefs' && <BuyerBriefView />}

          {activeTab === 'research' && <MarketResearchView />}

          {activeTab === 'saved' && <SavedGigsView gigs={savedGigs} />}
        </div>
      </main>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      {/* Footer */}
      <footer className="glass-panel border-t border-white/5 py-6 px-6 mt-12 text-center text-xs text-gray-500">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          <div>
            FiverrGrowth AI Platform &copy; 2026. Built with React 19, Three.js, GSAP, Node.js & Groq/Gemini AI.
          </div>
          <div className="flex items-center gap-4 text-gray-400">
            <span>Verified Market Strategy Engine</span>
            <span>&bull;</span>
            <span>Human-in-the-Loop Architecture</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
