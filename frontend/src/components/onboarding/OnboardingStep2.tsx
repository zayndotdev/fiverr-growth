import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, Building2, Briefcase, DollarSign, MessageSquare, ShieldAlert,
  Target, RefreshCw, ChevronDown, ChevronUp, Sparkles,
  ArrowRight, Loader2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface IcpProfile {
  icpId: string;
  personaName: string;
  priority: string;
  confidenceScore: number;
  targetFirmographics: {
    industries: string[];
    companySizes: string[];
    targetGeographies: string[];
  };
  buyerPersona: {
    jobTitles: string[];
    seniorityLevel: string;
    technicalLiteracy: string;
  };
  projectFit: {
    typicalDeliverables: string[];
    budgetRange: { min: number; max: number; currency: string };
    preferredPricingModel: string;
  };
  painPointsAndTriggers: {
    acutePainPoints: string[];
    buyingTriggerEvents: string[];
    desiredOutcomes: string[];
  };
  collaborationPreferences: {
    communicationStyle: string;
    preferredChannels: string[];
    updateCadence: string;
  };
  antiIcpCriteria: {
    redFlagPhrases: string[];
    disqualifyingFactors: string[];
  };
  targetingSignals: {
    searchKeywords: string[];
    recommendedPitchHook: string;
  };
}

const PRIORITY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  primary: { bg: 'bg-[#1dbf73]/10', text: 'text-[#1dbf73]', border: 'border-[#1dbf73]/30' },
  secondary: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  tertiary: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  opportunistic: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
};

const SIZE_LABELS: Record<string, string> = {
  solo_1: 'Solo (1)',
  seed_2_10: 'Seed (2-10)',
  smb_11_50: 'SMB (11-50)',
  midmarket_51_200: 'Mid-Market (51-200)',
  enterprise_200_plus: 'Enterprise (200+)',
};

export const OnboardingStep2: React.FC = () => {
  const { user, token, updateOnboardingState } = useAuth();
  const navigate = useNavigate();

  const [icps, setIcps] = useState<IcpProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedIcp, setExpandedIcp] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  // Auto-generate ICPs on mount
  useEffect(() => {
    if (user && !icps.length) {
      generateIcps();
    }
  }, [user]);

  const generateIcps = async () => {
    setLoading(true);
    setError(null);

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/v1/onboarding/generate-icps', {
        method: 'POST',
        headers,
        body: JSON.stringify({ userId: user?.id }),
      });

      const json = await res.json();

      if (!json.success) {
        throw new Error(json.error || 'Failed to generate ICPs');
      }

      const profiles = json.data?.icpProfiles || json.data || [];
      setIcps(profiles);

      // Auto-expand the first one
      if (profiles.length > 0) {
        setExpandedIcp(profiles[0].icpId);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to generate ICPs. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    setConfirming(true);

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/v1/onboarding/confirm-icps', {
        method: 'POST',
        headers,
        body: JSON.stringify({ userId: user?.id, icpProfiles: icps }),
      });

      const json = await res.json();

      if (!json.success) {
        throw new Error(json.error || 'Failed to save ICPs');
      }

      updateOnboardingState({ onboardingStep: 3, icpProfiles: icps });
      navigate('/onboarding/step/3');
    } catch (err: any) {
      setError(err.message || 'Failed to save. Please try again.');
    } finally {
      setConfirming(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="p-8 md:p-12 flex flex-col items-center justify-center min-h-[400px]">
        <div className="relative mb-6">
          <div className="w-16 h-16 border-4 border-[#e4e5e7] border-t-[#1dbf73] rounded-full animate-spin" />
          <Sparkles className="w-5 h-5 text-[#1dbf73] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </div>
        <h3 className="text-lg font-bold text-[#222325] mb-2">Analyzing Your Profile</h3>
        <p className="text-sm text-[#74767e] text-center max-w-md">
          Our AI is examining your gigs, skills, pricing tiers, and client reviews
          to identify your ideal customer profiles...
        </p>
      </div>
    );
  }

  // Error state
  if (error && !icps.length) {
    return (
      <div className="p-8 md:p-12 flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mb-4">
          <ShieldAlert className="w-7 h-7 text-red-500" />
        </div>
        <h3 className="text-lg font-bold text-[#222325] mb-2">Generation Failed</h3>
        <p className="text-sm text-red-600 mb-4 text-center">{error}</p>
        <button
          onClick={generateIcps}
          className="fiverr-btn-green px-6 py-2 rounded-md text-sm font-bold flex items-center gap-2 cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-[#222325] flex items-center gap-2">
            <Users className="w-5 h-5 text-[#1dbf73]" />
            Your Ideal Customer Profiles
          </h2>
          <p className="text-sm text-[#74767e] mt-0.5">
            {icps.length} personas identified from your Fiverr profile data
          </p>
        </div>
        <button
          onClick={generateIcps}
          disabled={loading}
          className="flex items-center gap-1.5 text-xs font-bold text-[#74767e] hover:text-[#222325] px-3 py-1.5 rounded-md border border-[#dadbdd] hover:bg-[#f5f5f5] transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Regenerate All
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
          {error}
        </div>
      )}

      {/* ICP Cards */}
      <div className="space-y-4">
        {icps.map((icp) => {
          const isExpanded = expandedIcp === icp.icpId;
          const colors = PRIORITY_COLORS[icp.priority] || PRIORITY_COLORS.primary;

          return (
            <div
              key={icp.icpId}
              className={`border rounded-xl overflow-hidden transition-all ${
                isExpanded ? 'border-[#1dbf73] shadow-md' : 'border-[#dadbdd] hover:border-[#b5b6ba]'
              }`}
            >
              {/* Card Header (always visible) */}
              <button
                onClick={() => setExpandedIcp(isExpanded ? null : icp.icpId)}
                className="w-full p-4 flex items-center justify-between text-left cursor-pointer hover:bg-[#fafafa] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#1dbf73]/10 flex items-center justify-center text-[#1dbf73]">
                    <Target className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-[#222325]">{icp.personaName}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${colors.bg} ${colors.text} border ${colors.border}`}>
                        {icp.priority.charAt(0).toUpperCase() + icp.priority.slice(1)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs text-[#74767e]">
                        {icp.targetFirmographics.industries.slice(0, 3).join(', ')}
                      </span>
                      <span className="text-xs text-[#74767e]">•</span>
                      <span className="text-xs text-[#1dbf73] font-semibold">
                        {Math.round(icp.confidenceScore * 100)}% confidence
                      </span>
                    </div>
                  </div>
                </div>
                {isExpanded ? (
                  <ChevronUp className="w-5 h-5 text-[#74767e]" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-[#74767e]" />
                )}
              </button>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="px-4 pb-5 space-y-5 border-t border-[#efeff0]">
                  {/* Company Profile */}
                  <div className="pt-4">
                    <h4 className="text-xs font-bold text-[#222325] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-[#1dbf73]" />
                      Target Company Profile
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="bg-[#f7f7f7] p-3 rounded-lg border border-[#e4e5e7]">
                        <span className="text-[10px] font-bold text-[#74767e] uppercase">Industries</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {icp.targetFirmographics.industries.map((ind) => (
                            <span key={ind} className="px-2 py-0.5 rounded-full bg-white border border-[#dadbdd] text-[11px] text-[#404145]">
                              {ind}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="bg-[#f7f7f7] p-3 rounded-lg border border-[#e4e5e7]">
                        <span className="text-[10px] font-bold text-[#74767e] uppercase">Company Size</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {icp.targetFirmographics.companySizes.map((sz) => (
                            <span key={sz} className="px-2 py-0.5 rounded-full bg-white border border-[#dadbdd] text-[11px] text-[#404145]">
                              {SIZE_LABELS[sz] || sz}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="bg-[#f7f7f7] p-3 rounded-lg border border-[#e4e5e7]">
                        <span className="text-[10px] font-bold text-[#74767e] uppercase">Geographies</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {icp.targetFirmographics.targetGeographies.map((geo) => (
                            <span key={geo} className="px-2 py-0.5 rounded-full bg-white border border-[#dadbdd] text-[11px] text-[#404145]">
                              {geo}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Buyer Persona */}
                  <div>
                    <h4 className="text-xs font-bold text-[#222325] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5 text-[#1dbf73]" />
                      Buyer Persona
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="bg-[#f7f7f7] p-3 rounded-lg border border-[#e4e5e7]">
                        <span className="text-[10px] font-bold text-[#74767e] uppercase">Job Titles</span>
                        <p className="text-xs text-[#222325] mt-1">{icp.buyerPersona.jobTitles.join(', ')}</p>
                      </div>
                      <div className="bg-[#f7f7f7] p-3 rounded-lg border border-[#e4e5e7]">
                        <span className="text-[10px] font-bold text-[#74767e] uppercase">Seniority</span>
                        <p className="text-xs text-[#222325] mt-1">{icp.buyerPersona.seniorityLevel.replace(/_/g, ' ')}</p>
                      </div>
                      <div className="bg-[#f7f7f7] p-3 rounded-lg border border-[#e4e5e7]">
                        <span className="text-[10px] font-bold text-[#74767e] uppercase">Technical Level</span>
                        <p className="text-xs text-[#222325] mt-1">{icp.buyerPersona.technicalLiteracy.replace(/_/g, ' ')}</p>
                      </div>
                    </div>
                  </div>

                  {/* Budget & Deliverables */}
                  <div>
                    <h4 className="text-xs font-bold text-[#222325] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <DollarSign className="w-3.5 h-3.5 text-[#1dbf73]" />
                      Project Fit & Budget
                    </h4>
                    <div className="bg-[#f7f7f7] p-4 rounded-lg border border-[#e4e5e7]">
                      <div className="flex items-center gap-4 mb-3">
                        <div>
                          <span className="text-[10px] font-bold text-[#74767e] uppercase">Budget Range</span>
                          <p className="text-lg font-bold text-[#1dbf73]">
                            ${icp.projectFit.budgetRange.min.toLocaleString()} — ${icp.projectFit.budgetRange.max.toLocaleString()}
                            <span className="text-xs text-[#74767e] font-normal ml-1">{icp.projectFit.budgetRange.currency}</span>
                          </p>
                        </div>
                        <div className="ml-auto">
                          <span className="text-[10px] font-bold text-[#74767e] uppercase">Pricing Model</span>
                          <p className="text-xs text-[#222325]">{icp.projectFit.preferredPricingModel?.replace(/_/g, ' ')}</p>
                        </div>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-[#74767e] uppercase">Typical Deliverables</span>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {icp.projectFit.typicalDeliverables.map((d, i) => (
                            <span key={i} className="px-2 py-0.5 rounded-full bg-white border border-[#dadbdd] text-[11px] text-[#404145]">
                              {d}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Pain Points */}
                  <div>
                    <h4 className="text-xs font-bold text-[#222325] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <ShieldAlert className="w-3.5 h-3.5 text-[#1dbf73]" />
                      Pain Points & Triggers
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="bg-[#f7f7f7] p-3 rounded-lg border border-[#e4e5e7]">
                        <span className="text-[10px] font-bold text-[#74767e] uppercase">Acute Pain Points</span>
                        <ul className="mt-1 space-y-1">
                          {icp.painPointsAndTriggers.acutePainPoints.map((p, i) => (
                            <li key={i} className="text-xs text-[#404145] flex items-start gap-1.5">
                              <span className="w-1 h-1 rounded-full bg-red-400 mt-1.5 shrink-0" />
                              {p}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="bg-[#f7f7f7] p-3 rounded-lg border border-[#e4e5e7]">
                        <span className="text-[10px] font-bold text-[#74767e] uppercase">Buying Triggers</span>
                        <ul className="mt-1 space-y-1">
                          {icp.painPointsAndTriggers.buyingTriggerEvents.map((t, i) => (
                            <li key={i} className="text-xs text-[#404145] flex items-start gap-1.5">
                              <span className="w-1 h-1 rounded-full bg-[#1dbf73] mt-1.5 shrink-0" />
                              {t}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Pitch Hook */}
                  <div className="bg-[#1dbf73]/5 border border-[#1dbf73]/20 rounded-lg p-4">
                    <h4 className="text-xs font-bold text-[#1dbf73] uppercase tracking-wider mb-1 flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5" />
                      Recommended Pitch Hook
                    </h4>
                    <p className="text-sm text-[#222325] italic">
                      "{icp.targetingSignals.recommendedPitchHook}"
                    </p>
                  </div>

                  {/* Anti-ICP */}
                  <div className="bg-red-50/50 border border-red-100 rounded-lg p-3">
                    <h4 className="text-xs font-bold text-red-700 uppercase tracking-wider mb-1">
                      🚩 Red Flags (Avoid These Clients)
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {icp.antiIcpCriteria.redFlagPhrases.map((rf, i) => (
                        <span key={i} className="px-2 py-0.5 rounded-full bg-red-100 border border-red-200 text-[11px] text-red-700">
                          "{rf}"
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Confirm Button */}
      {icps.length > 0 && (
        <div className="flex justify-end pt-2">
          <button
            onClick={handleConfirm}
            disabled={confirming}
            className="fiverr-btn-green px-6 py-2.5 rounded-md text-sm font-bold flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
          >
            {confirming ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                Confirm ICPs & Continue
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
