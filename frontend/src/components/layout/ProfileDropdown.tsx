import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  LogOut,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  Send,
  Copy,
  Check,
  Zap,
  Settings,
  LayoutDashboard,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface ProfileDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAuth: () => void;
}

export const ProfileDropdown: React.FC<ProfileDropdownProps> = ({
  isOpen,
  onClose,
  onOpenAuth,
}) => {
  const { user, logout } = useAuth();
  const [copiedId, setCopiedId] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

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

  const handleNavigate = (path: string) => {
    navigate(path);
    onClose();
  };

  const onboardingDone = user?.onboardingCompleted;

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
                {onboardingDone && (
                  <span title="Onboarding Complete">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#1dbf73] shrink-0" />
                  </span>
                )}
              </div>
              <div className="text-xs text-[#74767e] truncate">{user.email}</div>
            </div>
          </div>

          {/* User ID Pill */}
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

          {/* Onboarding Status */}
          <div className="bg-[#f5f5f5] p-2.5 rounded-lg border border-[#dadbdd] space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#62646a] font-medium">Onboarding</span>
              {onboardingDone ? (
                <span className="text-[#19a463] font-bold flex items-center gap-1 text-[11px]">
                  <ShieldCheck className="w-3 h-3 text-[#1dbf73]" />
                  Complete
                </span>
              ) : user.onboardingSkipped ? (
                <span className="text-amber-600 font-bold flex items-center gap-1 text-[11px]">
                  <Zap className="w-3 h-3 text-amber-500" />
                  Skipped
                </span>
              ) : (
                <span className="text-amber-600 font-bold flex items-center gap-1 text-[11px]">
                  <Zap className="w-3 h-3 text-amber-500" />
                  Step {user.onboardingStep} of 3
                </span>
              )}
            </div>
            {!onboardingDone && (
              <button
                onClick={() => handleNavigate('/onboarding')}
                className="w-full mt-1 py-1.5 rounded text-[11px] font-bold text-[#1dbf73] bg-[#1dbf73]/10 hover:bg-[#1dbf73]/20 border border-[#1dbf73]/20 transition-colors cursor-pointer"
              >
                {user.onboardingSkipped ? 'Resume Onboarding' : 'Continue Onboarding'}
              </button>
            )}
          </div>

          {/* Quick Navigation */}
          <div className="space-y-1 pt-1">
            <button
              onClick={() => handleNavigate('/dashboard')}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-[#404145] hover:text-[#222325] hover:bg-[#f5f5f5] border border-transparent hover:border-[#dadbdd] transition-all text-left cursor-pointer"
            >
              <LayoutDashboard className="w-4 h-4 text-[#1dbf73] shrink-0" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => handleNavigate('/gigs')}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-[#404145] hover:text-[#222325] hover:bg-[#f5f5f5] border border-transparent hover:border-[#dadbdd] transition-all text-left cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-[#1dbf73] shrink-0" />
              <span>Gig Studio</span>
            </button>

            <button
              onClick={() => handleNavigate('/briefs')}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-[#404145] hover:text-[#222325] hover:bg-[#f5f5f5] border border-transparent hover:border-[#dadbdd] transition-all text-left cursor-pointer"
            >
              <Send className="w-4 h-4 text-[#1dbf73] shrink-0" />
              <span>Buyer Briefs</span>
            </button>

            {/* Settings */}
            <button
              onClick={() => handleNavigate('/settings')}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-[#404145] hover:text-[#222325] hover:bg-[#f5f5f5] border border-transparent hover:border-[#dadbdd] transition-all text-left cursor-pointer"
            >
              <Settings className="w-4 h-4 text-[#1dbf73] shrink-0" />
              <span>Settings</span>
            </button>
          </div>

          {/* Sign Out */}
          <div className="pt-2 border-t border-[#efeff0]">
            <button
              onClick={() => {
                logout();
                navigate('/');
                onClose();
              }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 transition-all text-left cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
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
              Sign in to save your strategy, gigs, and client proposals.
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
