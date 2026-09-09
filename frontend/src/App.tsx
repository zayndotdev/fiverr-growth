import React, { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/layout/Navbar';
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

  // Animate tab transitions with GSAP and ensure window stays anchored at top
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    if (contentRef.current) {
      gsap.fromTo(
        contentRef.current,
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.25, ease: 'power2.out' }
      );
    }
  }, [activeTab]);

  const handleSelectGigFromBlueprint = (gigData: { niche: string; skills: string }) => {
    setPrefilledGig(gigData);
    setActiveTab('gigs');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f7f7f7] text-[#222325] selection:bg-[#1dbf73] selection:text-white relative overflow-x-hidden font-sans">
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

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
