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
      className="absolute right-0 top-full mt-2.5 w-76 sm:w-84 bg-white border border-[#dadbdd] rounded-xl shadow-xl p-4 z-[100] animate-in fade-in zoom-in-95 duration-150 text-left text-[#222325]"
    >
      {user ? (
        <div className="space-y-3">
          {/* User Header */}
          <div className="flex items-center gap-3 pb-3 border-b border-[#efeff0]">
            <div className="w-10 h-10 rounded-full bg-[#1dbf73] flex items-center justify-center text-white font-bold text-sm shadow-xs shrink-0">
              {user.username.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-bold text-[#222325] truncate flex items-center gap-1.5">
                <span>{user.username}</span>
                {hasStrategy && (
                  <span title="Context Locked & Active">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#1dbf73] shrink-0" />
                  </span>
                )}
              </div>
              <div className="text-xs text-[#74767e] truncate">{user.email}</div>
            </div>
          </div>

          {/* User ID Pill with 1-Click Copy */}
          <div className="flex items-center justify-between bg-[#f5f5f5] p-2 rounded-lg border border-[#dadbdd] text-xs">
            <span className="text-[#62646a] font-mono truncate text-[11px]">ID: {user.id}</span>
            <button
              onClick={handleCopyId}
              className="text-[#74767e] hover:text-[#222325] flex items-center gap-1 transition-colors cursor-pointer shrink-0 ml-2 font-medium"
              title="Copy User ID"
            >
              {copiedId ? <Check className="w-3 h-3 text-[#1dbf73]" /> : <Copy className="w-3 h-3" />}
              <span>{copiedId ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          {/* Fiverr Profile Link Status */}
          {user.fiverr_profile_url && (
            <div className="bg-[#1dbf73]/10 p-2.5 rounded-lg border border-[#1dbf73]/20 text-xs">
              <div className="text-[10px] text-[#19a463] font-bold uppercase tracking-wider mb-0.5">Linked Fiverr Account</div>
              <a
                href={user.fiverr_profile_url}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-[#222325] hover:text-[#1dbf73] hover:underline flex items-center gap-1.5 font-medium truncate"
              >
                <span className="truncate">{user.fiverr_profile_url}</span>
                <ExternalLink className="w-3 h-3 text-[#1dbf73] shrink-0" />
              </a>
            </div>
          )}

          {/* Strategy Context Status */}
          <div className="bg-[#f5f5f5] p-2.5 rounded-lg border border-[#dadbdd] space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#62646a] font-medium">Growth Blueprint</span>
              {hasStrategy ? (
                <span className="text-[#19a463] font-bold flex items-center gap-1 text-[11px]">
                  <ShieldCheck className="w-3 h-3 text-[#1dbf73]" />
                  Active
                </span>
              ) : (
                <span className="text-amber-600 font-bold flex items-center gap-1 text-[11px]">
                  <Zap className="w-3 h-3 text-amber-500" />
                  In Progress
                </span>
              )}
            </div>
            {hasStrategy ? (
              <div className="text-xs text-[#222325] font-semibold truncate">
                {userContext.strategy.profile_positioning?.recommended_title || 'AI Solutions Engineer'}
              </div>
            ) : (
              <div className="text-[11px] text-[#74767e]">
                Complete Step 1 to ground your strategy in verified market data.
              </div>
            )}
          </div>

          {/* Action Navigation Options */}
          <div className="space-y-1 pt-1">
            <button
              onClick={() => {
                onNavigateTab('strategist');
                onClose();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-[#404145] hover:text-[#222325] hover:bg-[#f5f5f5] border border-transparent hover:border-[#dadbdd] transition-all text-left cursor-pointer"
            >
              <Compass className="w-4 h-4 text-[#1dbf73] shrink-0" />
              <span>Strategy & Diagnostics</span>
            </button>

            <button
              onClick={() => {
                onNavigateTab('gigs');
                onClose();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-[#404145] hover:text-[#222325] hover:bg-[#f5f5f5] border border-transparent hover:border-[#dadbdd] transition-all text-left cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-[#1dbf73] shrink-0" />
              <span>5-Tag SEO Gig Studio</span>
            </button>

            <button
              onClick={() => {
                onNavigateTab('briefs');
                onClose();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-[#404145] hover:text-[#222325] hover:bg-[#f5f5f5] border border-transparent hover:border-[#dadbdd] transition-all text-left cursor-pointer"
            >
              <Send className="w-4 h-4 text-[#1dbf73] shrink-0" />
              <span>Live Buyer Briefs Radar</span>
            </button>

            <button
              onClick={() => {
                onNavigateTab('saved');
                onClose();
              }}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold text-[#404145] hover:text-[#222325] hover:bg-[#f5f5f5] border border-transparent hover:border-[#dadbdd] transition-all text-left cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <Bookmark className="w-4 h-4 text-[#1dbf73] shrink-0" />
                <span>Saved Assets Library</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-[#f5f5f5] text-[#404145] text-[10px] font-bold border border-[#dadbdd]">
                {savedGigsCount}
              </span>
            </button>
          </div>

          {/* Sign Out Button */}
          <div className="pt-2 border-t border-[#efeff0]">
            <button
              onClick={() => {
                logout();
                onClose();
              }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 transition-all text-left cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out Account</span>
            </button>
          </div>
        </div>
      ) : (
        /* Guest State */
        <div className="space-y-3 py-1">
          <div className="text-center pb-2 border-b border-[#efeff0]">
            <div className="w-10 h-10 rounded-full bg-[#1dbf73]/10 border border-[#1dbf73]/20 flex items-center justify-center mx-auto mb-2 text-[#1dbf73]">
              <User className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-[#222325]">Freelancer Guest Mode</h4>
            <p className="text-xs text-[#74767e] mt-0.5">
              Sign in to save your strategy blueprint, persistent gigs, and client proposals.
            </p>
          </div>

          <button
            onClick={() => {
              onClose();
              onOpenAuth();
            }}
            className="fiverr-btn-green w-full py-2 px-3 rounded text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-xs"
          >
            <User className="w-3.5 h-3.5" />
            <span>Sign In / Create Account</span>
          </button>
        </div>
      )}
    </div>
  );
};
