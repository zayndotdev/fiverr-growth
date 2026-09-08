import React, { useState, useRef, useEffect } from 'react';
import {
  User,
  LogOut,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  Compass,
  Sparkles,
  Send,
  Bookmark,
  Copy,
  Check,
  Zap,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface ProfileDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAuth: () => void;
  onNavigateTab: (tab: string) => void;
  savedGigsCount: number;
}

export const ProfileDropdown: React.FC<ProfileDropdownProps> = ({
  isOpen,
  onClose,
  onOpenAuth,
  onNavigateTab,
  savedGigsCount,
}) => {
  const { user, userContext, logout } = useAuth();
  const [copiedId, setCopiedId] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleCopyId = () => {
    if (user?.id) {
      navigator.clipboard.writeText(user.id);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  const hasStrategy = !!userContext?.strategy;

  return (
    <div
      ref={dropdownRef}
      style={{ backgroundColor: 'rgba(9, 13, 22, 0.98)', backdropFilter: 'blur(28px)', WebkitBackdropFilter: 'blur(28px)' }}
      className="absolute right-0 top-full mt-2.5 w-76 sm:w-84 border border-emerald-500/30 rounded-2xl shadow-2xl shadow-black/95 p-4 z-[100] animate-in fade-in zoom-in-95 duration-150 text-left"
    >
      {user ? (
        <div className="space-y-3">
          {/* User Header */}
          <div className="flex items-center gap-3 pb-3 border-b border-white/10">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center text-gray-950 font-black text-sm shadow-md shadow-emerald-500/30 shrink-0">
              {user.username.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-bold text-white truncate flex items-center gap-1.5">
                <span>{user.username}</span>
                {hasStrategy && (
                  <span title="Context Locked & Active">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  </span>
                )}
              </div>
              <div className="text-[11px] text-gray-400 truncate">{user.email}</div>
            </div>
          </div>

          {/* User ID Pill with 1-Click Copy */}
          <div className="flex items-center justify-between bg-gray-900/90 p-2 rounded-xl border border-white/5 text-[10px]">
            <span className="text-gray-400 font-mono truncate">ID: {user.id}</span>
            <button
              onClick={handleCopyId}
              className="text-gray-400 hover:text-white flex items-center gap-1 transition-colors cursor-pointer shrink-0 ml-2"
              title="Copy User ID"
            >
              {copiedId ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copiedId ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          {/* Fiverr Profile Link Status */}
          {user.fiverr_profile_url && (
            <div className="bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20 text-[11px]">
              <div className="text-[10px] text-emerald-400 font-semibold mb-0.5">Linked Fiverr Account</div>
              <a
                href={user.fiverr_profile_url}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-white hover:underline flex items-center gap-1.5 font-medium truncate"
              >
                <span className="truncate">{user.fiverr_profile_url}</span>
                <ExternalLink className="w-3 h-3 text-emerald-400 shrink-0" />
              </a>
            </div>
          )}

          {/* Strategy Context Status */}
          <div className="bg-gray-900/60 p-2.5 rounded-xl border border-white/5 space-y-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-gray-400 font-medium">Growth Blueprint</span>
              {hasStrategy ? (
                <span className="text-emerald-400 font-bold flex items-center gap-1 text-[10px]">
                  <ShieldCheck className="w-3 h-3" />
                  Locked in DB
                </span>
              ) : (
                <span className="text-amber-400 font-bold flex items-center gap-1 text-[10px]">
                  <Zap className="w-3 h-3" />
                  Audit Pending
                </span>
              )}
            </div>
            {hasStrategy ? (
              <div className="text-[11px] text-gray-300 font-medium truncate">
                {userContext.strategy.profile_positioning?.recommended_title || 'AI Solutions Engineer'}
              </div>
            ) : (
              <div className="text-[10px] text-gray-400">
                Complete your diagnostic to unlock high-converting gigs.
              </div>
            )}
          </div>

          {/* Action Navigation Options */}
          <div className="space-y-1.5 pt-1">
            <button
              onClick={() => {
                onNavigateTab('strategist');
                onClose();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-gray-200 hover:text-white bg-gray-900/80 hover:bg-gray-800 border border-white/5 hover:border-emerald-500/30 transition-all text-left cursor-pointer shadow-sm"
            >
              <Compass className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Strategy & Diagnostics</span>
            </button>

            <button
              onClick={() => {
                onNavigateTab('gigs');
                onClose();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-gray-200 hover:text-white bg-gray-900/80 hover:bg-gray-800 border border-white/5 hover:border-cyan-500/30 transition-all text-left cursor-pointer shadow-sm"
            >
              <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>5-Tag SEO Gig Studio</span>
            </button>

            <button
              onClick={() => {
                onNavigateTab('briefs');
                onClose();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-gray-200 hover:text-white bg-gray-900/80 hover:bg-gray-800 border border-white/5 hover:border-teal-500/30 transition-all text-left cursor-pointer shadow-sm"
            >
              <Send className="w-4 h-4 text-teal-400 shrink-0" />
              <span>Live Buyer Briefs Radar</span>
            </button>

            <button
              onClick={() => {
                onNavigateTab('saved');
                onClose();
              }}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-gray-200 hover:text-white bg-gray-900/80 hover:bg-gray-800 border border-white/5 hover:border-purple-500/30 transition-all text-left cursor-pointer shadow-sm"
            >
              <div className="flex items-center gap-2.5">
                <Bookmark className="w-4 h-4 text-purple-400 shrink-0" />
                <span>Saved Assets Library</span>
              </div>
              <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 text-[10px] font-mono font-bold border border-purple-500/30">
                {savedGigsCount}
              </span>
            </button>
          </div>

          {/* Sign Out Button */}
          <div className="pt-2 border-t border-white/10">
            <button
              onClick={() => {
                logout();
                onClose();
              }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition-all text-left cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out Account</span>
            </button>
          </div>
        </div>
      ) : (
        /* Guest State */
        <div className="space-y-3 py-1">
          <div className="text-center pb-2 border-b border-white/5">
            <div className="w-10 h-10 rounded-xl bg-gray-900 border border-white/10 flex items-center justify-center mx-auto mb-2 text-emerald-400">
              <User className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-white">Freelancer Guest Mode</h4>
            <p className="text-[11px] text-gray-400 mt-0.5">
              Sign in to save your strategy blueprint, persistent gigs, and client proposals.
            </p>
          </div>

          <button
            onClick={() => {
              onClose();
              onOpenAuth();
            }}
            className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-gray-950 font-bold text-xs shadow-md shadow-emerald-500/20 hover:opacity-90 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <User className="w-3.5 h-3.5" />
            <span>Sign In / Create Account</span>
          </button>
        </div>
      )}
    </div>
  );
};
