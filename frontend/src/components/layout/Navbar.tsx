import React, { useState } from 'react';
import { Sparkles, BarChart3, Send, Bookmark, Compass, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ProfileDropdown } from './ProfileDropdown';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  gigsCount: number;
  onOpenAuth: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  gigsCount,
  onOpenAuth,
}) => {
  const { user, userContext } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const tabs = [
    {
      id: 'strategist',
      label: 'Strategist',
      icon: Compass,
      badge: !userContext?.strategy ? 'New' : undefined,
    },
    { id: 'gigs', label: 'Gigs', icon: Sparkles },
    { id: 'briefs', label: 'Briefs', icon: Send },
    { id: 'research', label: 'Research', icon: BarChart3 },
    { id: 'saved', label: `Saved (${gigsCount})`, icon: Bookmark },
  ];

  return (
    <header className="w-full glass-panel border-b border-white/5 sticky top-0 z-50 px-4 md:px-6 py-2.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between relative">
        {/* Left Side: ONLY the Logo */}
        <div
          onClick={() => setActiveTab('strategist')}
          className="flex items-center gap-2.5 cursor-pointer shrink-0 group select-none"
          title="FiverrGrowth Home"
        >
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-500 flex items-center justify-center shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-black text-base tracking-tight text-white group-hover:text-emerald-300 transition-colors">
            Fiverr<span className="text-emerald-400">Growth</span>
          </span>
        </div>

        {/* Center: Navigation Bar with Compact Navlinks */}
        <div className="flex-1 flex justify-center px-2">
          <nav className="flex items-center bg-gray-900/90 p-1 rounded-xl border border-white/10 gap-0.5 md:gap-1 scrollbar-none overflow-x-auto max-w-[60vw] sm:max-w-none shadow-sm">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-2.5 md:px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-gray-950 shadow-md shadow-emerald-500/20 font-bold'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-gray-950' : 'text-gray-400'}`} />
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[9px] font-extrabold ${
                        isActive ? 'bg-gray-950 text-emerald-400' : 'bg-cyan-400 text-gray-950 animate-pulse'
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Right Side: Profile Icon & Pop-up Dropdown */}
        <div className="shrink-0 relative">
          <button
            onClick={() => setIsProfileOpen((prev) => !prev)}
            className={`w-8 h-8 md:w-9 md:h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer border relative ${
              isProfileOpen
                ? 'border-emerald-500/60 bg-emerald-500/20 shadow-lg shadow-emerald-500/20'
                : 'border-white/10 bg-gray-900/90 hover:bg-white/5 hover:border-white/20'
            }`}
            title="Profile & Options"
          >
            {user ? (
              <div className="w-full h-full rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center text-gray-950 text-xs font-black">
                {user.username.charAt(0).toUpperCase()}
              </div>
            ) : (
              <User className="w-4 h-4 text-gray-300" />
            )}

            {/* Active Strategy Status Indicator Dot */}
            {user && userContext?.strategy && (
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-gray-950" />
            )}
          </button>

          {/* Profile Dropdown Popup */}
          <ProfileDropdown
            isOpen={isProfileOpen}
            onClose={() => setIsProfileOpen(false)}
            onOpenAuth={onOpenAuth}
            onNavigateTab={setActiveTab}
            savedGigsCount={gigsCount}
          />
        </div>
      </div>
    </header>
  );
};
