import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  User, ShieldCheck, Settings, RefreshCw, CheckCircle2, AlertTriangle,
  Loader2, Mail, ExternalLink, Target, Star
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

type SettingsTab = 'account' | 'profile' | 'onboarding';

export const SettingsPage: React.FC = () => {
  const { tab: urlTab } = useParams<{ tab?: string }>();
  const [activeTab, setActiveTab] = useState<SettingsTab>((urlTab as SettingsTab) || 'account');
  const navigate = useNavigate();

  const tabs: { id: SettingsTab; label: string; icon: LucideIcon }[] = [
    { id: 'account', label: 'Account', icon: User },
    { id: 'profile', label: 'Fiverr Profile', icon: Star },
    { id: 'onboarding', label: 'Onboarding', icon: Target },
  ];

  const handleTabChange = (tab: SettingsTab) => {
    setActiveTab(tab);
    navigate(`/settings/${tab}`, { replace: true });
  };

  return (
    <div className="max-w-4xl mx-auto w-full">
      <div className="flex items-center gap-2 mb-6">
        <Settings className="w-5 h-5 text-[#1dbf73]" />
        <h1 className="text-xl font-bold text-[#222325]">Settings</h1>
      </div>

      <div className="flex flex-col sm:flex-row gap-6">
        {/* Sidebar */}
        <div className="sm:w-48 shrink-0">
          <nav className="bg-white border border-[#dadbdd] rounded-xl p-2 space-y-1 shadow-xs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer text-left ${
                    isActive
                      ? 'bg-[#1dbf73]/10 text-[#1dbf73] border border-[#1dbf73]/20'
                      : 'text-[#404145] hover:bg-[#f5f5f5] border border-transparent'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#1dbf73]' : 'text-[#74767e]'}`} />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1">
          <div className="bg-white border border-[#dadbdd] rounded-xl shadow-xs overflow-hidden">
            {activeTab === 'account' && <AccountTabContent />}
            {activeTab === 'profile' && <FiverrProfileTabContent />}
            {activeTab === 'onboarding' && <OnboardingTabContent />}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Account Tab ─────────────────────────────────────────────────────────────

const AccountTabContent: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-lg font-bold text-[#222325] mb-1">Account Details</h2>
        <p className="text-xs text-[#74767e]">Manage your account information</p>
      </div>

      <div className="space-y-4">
        {/* Username */}
        <div className="bg-[#f7f7f7] p-4 rounded-lg border border-[#e4e5e7]">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-xs font-semibold text-[#74767e] uppercase">Username</label>
              <p className="text-sm font-bold text-[#222325] mt-0.5">{user?.username}</p>
            </div>
            <User className="w-5 h-5 text-[#74767e]" />
          </div>
        </div>

        {/* Email */}
        <div className="bg-[#f7f7f7] p-4 rounded-lg border border-[#e4e5e7]">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-xs font-semibold text-[#74767e] uppercase">Email Address</label>
              <p className="text-sm font-bold text-[#222325] mt-0.5">{user?.email}</p>
            </div>
            <Mail className="w-5 h-5 text-[#74767e]" />
          </div>
        </div>

        {/* Member Since */}
        <div className="bg-[#f7f7f7] p-4 rounded-lg border border-[#e4e5e7]">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-xs font-semibold text-[#74767e] uppercase">Member Since</label>
              <p className="text-sm font-bold text-[#222325] mt-0.5">
                {user?.created_at
                  ? new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                  : 'Unknown'}
              </p>
            </div>
            <ShieldCheck className="w-5 h-5 text-[#1dbf73]" />
          </div>
        </div>
      </div>

      {/* Sign Out */}
      <div className="pt-4 border-t border-[#efeff0]">
        <button
          onClick={() => {
            logout();
            navigate('/');
          }}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 transition-all cursor-pointer"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
};

// ─── Fiverr Profile Tab ─────────────────────────────────────────────────────

const FiverrProfileTabContent: React.FC = () => {
  const { user } = useAuth();
  const fiverrProfile = user?.fiverrProfile;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-lg font-bold text-[#222325] mb-1">Fiverr Profile</h2>
        <p className="text-xs text-[#74767e]">Your linked Fiverr seller account</p>
      </div>

      {fiverrProfile ? (
        <div className="space-y-4">
          {/* Profile Card */}
          <div className="bg-[#f7f7f7] p-4 rounded-lg border border-[#e4e5e7]">
            <div className="flex items-center gap-3 mb-3">
              {fiverrProfile.avatarUrl ? (
                <img
                  src={fiverrProfile.avatarUrl}
                  alt={fiverrProfile.displayName}
                  className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-xs"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-[#1dbf73] flex items-center justify-center text-white font-bold">
                  {(fiverrProfile.displayName || 'U').charAt(0)}
                </div>
              )}
              <div>
                <h3 className="text-sm font-bold text-[#222325]">{fiverrProfile.displayName}</h3>
                <p className="text-xs text-[#74767e]">@{fiverrProfile.username}</p>
              </div>
              <a
                href={fiverrProfile.profileUrl || `https://www.fiverr.com/${fiverrProfile.username}`}
                target="_blank"
                rel="noreferrer"
                className="ml-auto text-xs text-[#1dbf73] hover:underline flex items-center gap-1"
              >
                View on Fiverr <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="text-center p-2 bg-white rounded-lg border border-[#dadbdd]">
                <p className="text-lg font-bold text-[#222325]">{fiverrProfile.rating || '—'}</p>
                <p className="text-[10px] text-[#74767e] uppercase font-semibold">Rating</p>
              </div>
              <div className="text-center p-2 bg-white rounded-lg border border-[#dadbdd]">
                <p className="text-lg font-bold text-[#222325]">{fiverrProfile.reviewCount || 0}</p>
                <p className="text-[10px] text-[#74767e] uppercase font-semibold">Reviews</p>
              </div>
              <div className="text-center p-2 bg-white rounded-lg border border-[#dadbdd]">
                <p className="text-lg font-bold text-[#222325]">{fiverrProfile.gigs?.length || 0}</p>
                <p className="text-[10px] text-[#74767e] uppercase font-semibold">Active Gigs</p>
              </div>
              <div className="text-center p-2 bg-white rounded-lg border border-[#dadbdd]">
                <p className="text-lg font-bold text-[#222325]">{fiverrProfile.sellerLevel || 'New'}</p>
                <p className="text-[10px] text-[#74767e] uppercase font-semibold">Level</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-[#f7f7f7] border border-[#e4e5e7] rounded-lg p-6 text-center">
          <p className="text-sm text-[#74767e] mb-3">No Fiverr profile linked yet</p>
          <a
            href="/onboarding/step/1"
            className="text-xs text-[#1dbf73] font-bold hover:underline cursor-pointer"
          >
            Link your Fiverr profile →
          </a>
        </div>
      )}
    </div>
  );
};

// ─── Onboarding Tab ─────────────────────────────────────────────────────────

const OnboardingTabContent: React.FC = () => {
  const { user, token, updateOnboardingState } = useAuth();
  const navigate = useNavigate();
  const [redoing, setRedoing] = useState(false);

  const steps = [
    { number: 1, label: 'Fiverr Profile Ingestion', done: !!user?.fiverrProfile },
    { number: 2, label: 'ICP Identification', done: (user?.icpProfiles?.length || 0) > 0 },
    { number: 3, label: 'Confirmation', done: !!user?.onboardingCompleted },
  ];

  const handleRedo = async () => {
    setRedoing(true);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      await fetch('/api/v1/user/onboarding', {
        method: 'PUT',
        headers,
        body: JSON.stringify({ completed: false, skipped: false, step: 1 }),
      });

      updateOnboardingState({
        onboardingCompleted: false,
        onboardingSkipped: false,
        onboardingStep: 1,
      });

      navigate('/onboarding');
    } catch (err) {
      console.error('Failed to reset onboarding:', err);
    } finally {
      setRedoing(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-lg font-bold text-[#222325] mb-1">Onboarding Status</h2>
        <p className="text-xs text-[#74767e]">Track and manage your onboarding progress</p>
      </div>

      {/* Status Badge */}
      <div className={`p-3 rounded-lg flex items-center gap-2 text-sm font-semibold ${
        user?.onboardingCompleted
          ? 'bg-[#1dbf73]/10 text-[#1dbf73] border border-[#1dbf73]/20'
          : user?.onboardingSkipped
          ? 'bg-amber-50 text-amber-700 border border-amber-200'
          : 'bg-blue-50 text-blue-700 border border-blue-200'
      }`}>
        {user?.onboardingCompleted ? (
          <><CheckCircle2 className="w-4 h-4" /> Onboarding Complete</>
        ) : user?.onboardingSkipped ? (
          <><AlertTriangle className="w-4 h-4" /> Onboarding Skipped</>
        ) : (
          <><Loader2 className="w-4 h-4" /> Onboarding In Progress (Step {user?.onboardingStep || 1} of 3)</>
        )}
      </div>

      {/* Steps Checklist */}
      <div className="space-y-3">
        {steps.map((step) => (
          <div
            key={step.number}
            className={`flex items-center gap-3 p-3 rounded-lg border ${
              step.done ? 'border-[#1dbf73]/20 bg-[#1dbf73]/5' : 'border-[#e4e5e7] bg-[#f7f7f7]'
            }`}
          >
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
              step.done ? 'bg-[#1dbf73] text-white' : 'bg-[#e4e5e7] text-[#74767e]'
            }`}>
              {step.done ? <CheckCircle2 className="w-3.5 h-3.5" /> : step.number}
            </div>
            <span className={`text-sm font-medium ${step.done ? 'text-[#222325]' : 'text-[#74767e]'}`}>
              {step.label}
            </span>
            {step.done && (
              <span className="ml-auto text-[10px] font-bold text-[#1dbf73] uppercase">Complete</span>
            )}
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3 pt-2">
        <button
          onClick={handleRedo}
          disabled={redoing}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold text-[#404145] bg-[#f5f5f5] hover:bg-[#e4e5e7] border border-[#dadbdd] transition-colors cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${redoing ? 'animate-spin' : ''}`} />
          Redo Onboarding
        </button>

        {!user?.onboardingCompleted && (
          <button
            onClick={() => navigate(`/onboarding/step/${user?.onboardingStep || 1}`)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold text-white bg-[#1dbf73] hover:bg-[#19a463] transition-colors cursor-pointer"
          >
            Continue Onboarding →
          </button>
        )}
      </div>

      {/* ICP Summary (if available) */}
      {(user?.icpProfiles?.length || 0) > 0 && (
        <div className="pt-4 border-t border-[#efeff0]">
          <h3 className="text-sm font-bold text-[#222325] mb-3 flex items-center gap-1.5">
            <Target className="w-4 h-4 text-[#1dbf73]" />
            Current ICPs ({user!.icpProfiles!.length})
          </h3>
          <div className="space-y-2">
            {user!.icpProfiles!.map((icp: any) => (
              <div key={icp.icpId} className="flex items-center justify-between bg-[#f7f7f7] p-3 rounded-lg border border-[#e4e5e7]">
                <div>
                  <span className="text-xs font-bold text-[#222325]">{icp.personaName}</span>
                  <span className="text-[10px] text-[#74767e] ml-2">
                    {icp.targetFirmographics?.industries?.slice(0, 2).join(', ')}
                  </span>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  icp.priority === 'primary' ? 'bg-[#1dbf73]/10 text-[#1dbf73]' : 'bg-blue-50 text-blue-700'
                }`}>
                  {icp.priority}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
