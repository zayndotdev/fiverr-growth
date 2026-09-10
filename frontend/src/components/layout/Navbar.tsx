import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Sparkles, BarChart3, Send, Bookmark, LayoutDashboard, User, Users2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ProfileDropdown } from './ProfileDropdown';

interface NavbarProps {
  gigsCount: number;
  onOpenAuth: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ gigsCount, onOpenAuth }) => {
  const { user } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Only show nav tabs when user is logged in and past onboarding
  const showNavTabs = user && (user.onboardingCompleted || user.onboardingSkipped);

  const tabs = [
    { id: 'dashboard', path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'competitors', path: '/competitors', label: 'Competitors', icon: Users2 },
    { id: 'gigs', path: '/gigs', label: 'Gigs', icon: Sparkles },
    { id: 'briefs', path: '/briefs', label: 'Briefs', icon: Send },
    { id: 'research', path: '/research', label: 'Research', icon: BarChart3 },
    { id: 'saved', path: '/saved', label: `Saved (${gigsCount})`, icon: Bookmark },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="w-full bg-white border-b border-[#dadbdd] sticky top-0 z-50 px-4 md:px-6 py-2.5 shadow-xs">
      <div className="max-w-7xl mx-auto flex items-center justify-between relative">
        {/* Left Side: Logo */}
        <div
          onClick={() => navigate(user ? '/dashboard' : '/')}
          className="flex items-center gap-1.5 cursor-pointer shrink-0 select-none group"
          title="FiverrGrowth Home"
        >
          <span className="font-black text-2xl tracking-tighter text-[#222325]">
            fiverr<span className="text-[#1dbf73]">.</span>
          </span>
          <span className="text-[10px] font-bold uppercase tracking-wider text-white bg-[#222325] px-1.5 py-0.5 rounded ml-1">
            Growth
          </span>
        </div>

        {/* Center: Navigation Tabs (only shown when logged in + past onboarding) */}
        {showNavTabs && (
          <div className="flex-1 flex justify-center px-4">
            <nav className="flex items-center bg-[#f5f5f5] p-1 rounded-full border border-[#dadbdd] gap-1 overflow-x-auto max-w-[60vw] sm:max-w-none">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const active = isActive(tab.path);
                return (
                  <button
                    key={tab.id}
                    onClick={() => navigate(tab.path)}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                      active
                        ? 'bg-white text-[#1dbf73] shadow-xs border border-[#dadbdd]/70'
                        : 'text-[#62646a] hover:text-[#222325] hover:bg-white/50'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${active ? 'text-[#1dbf73]' : 'text-[#74767e]'}`} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        )}

        {/* Right Side: Profile / Join CTA */}
        <div className="shrink-0 flex items-center gap-3 relative">
          {!user && (
            <button
              onClick={onOpenAuth}
              className="fiverr-btn-green px-4 py-1.5 text-xs font-bold rounded cursor-pointer hidden sm:inline-flex items-center gap-1"
            >
              Sign In / Join
            </button>
          )}

          <div className="relative">
            <button
              onClick={() => setIsProfileOpen((prev) => !prev)}
              className={`w-8 h-8 md:w-9 md:h-9 rounded-full flex items-center justify-center transition-all cursor-pointer border relative ${
                isProfileOpen
                  ? 'border-[#1dbf73] bg-[#1dbf73]/10 shadow-xs'
                  : 'border-[#dadbdd] bg-[#f5f5f5] hover:bg-[#e4e5e7] hover:border-[#b5b6ba]'
              }`}
              title="Profile & Options"
            >
              {user ? (
                <div className="w-full h-full rounded-full bg-[#1dbf73] flex items-center justify-center text-white text-xs font-bold">
                  {user.username.charAt(0).toUpperCase()}
                </div>
              ) : (
                <User className="w-4 h-4 text-[#74767e]" />
              )}

              {/* Active Strategy Status Indicator Dot */}
              {user && user.onboardingCompleted && (
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-[#1dbf73] rounded-full border-2 border-white shadow-xs" />
              )}
            </button>

            {/* Profile Dropdown Popup */}
            <ProfileDropdown
              isOpen={isProfileOpen}
              onClose={() => setIsProfileOpen(false)}
              onOpenAuth={onOpenAuth}
            />
          </div>
        </div>
      </div>
    </header>
  );
};
