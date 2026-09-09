import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2, User, Star, MapPin, Briefcase, Target, Users,
  DollarSign, ArrowRight, Loader2, PartyPopper,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const OnboardingStep3: React.FC = () => {
  const { user, token, updateOnboardingState, refreshContext } = useAuth();
  const navigate = useNavigate();
  const [completing, setCompleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fiverrProfile = user?.fiverrProfile;
  const icpProfiles = user?.icpProfiles || [];

  const handleComplete = async () => {
    setCompleting(true);
    setError(null);

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/v1/user/onboarding', {
        method: 'PUT',
        headers,
        body: JSON.stringify({ completed: true, step: 3 }),
      });

      const json = await res.json();
      if (!json.success) {
        throw new Error(json.error || 'Failed to complete onboarding');
      }

      updateOnboardingState({ onboardingCompleted: true, onboardingStep: 3 });
      await refreshContext();
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setCompleting(false);
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Header */}
      <div className="text-center pb-4 border-b border-[#efeff0]">
        <div className="w-14 h-14 rounded-full bg-[#1dbf73]/10 flex items-center justify-center mx-auto mb-3">
          <PartyPopper className="w-7 h-7 text-[#1dbf73]" />
        </div>
        <h2 className="text-xl font-bold text-[#222325]">
          Review & Confirm Your Setup
        </h2>
        <p className="text-sm text-[#74767e] mt-1">
          Everything looks good! Review your profile and ICPs below, then confirm to complete onboarding.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Profile Summary */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-[#222325] uppercase tracking-wider flex items-center gap-1.5">
            <User className="w-4 h-4 text-[#1dbf73]" />
            Fiverr Profile Summary
          </h3>

          {fiverrProfile ? (
            <div className="bg-[#f7f7f7] border border-[#e4e5e7] rounded-lg p-4 space-y-3">
              {/* Avatar + Name */}
              <div className="flex items-center gap-3">
                {fiverrProfile.avatarUrl ? (
                  <img
                    src={fiverrProfile.avatarUrl}
                    alt={fiverrProfile.displayName}
                    className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-xs"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-[#1dbf73] flex items-center justify-center text-white font-bold text-lg">
                    {(fiverrProfile.displayName || 'U').charAt(0)}
                  </div>
                )}
                <div>
                  <h4 className="text-sm font-bold text-[#222325]">{fiverrProfile.displayName}</h4>
                  <p className="text-xs text-[#74767e]">@{fiverrProfile.username}</p>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-1.5 text-xs text-[#404145]">
                  <Star className="w-3.5 h-3.5 text-[#ffb33e]" />
                  <span className="font-semibold">{fiverrProfile.rating}</span>
                  <span className="text-[#74767e]">({fiverrProfile.reviewCount} reviews)</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-[#404145]">
                  <MapPin className="w-3.5 h-3.5 text-[#74767e]" />
                  {fiverrProfile.country}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-[#404145]">
                  <Briefcase className="w-3.5 h-3.5 text-[#74767e]" />
                  {fiverrProfile.sellerLevel || 'New Seller'}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-[#404145]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#1dbf73]" />
                  {fiverrProfile.gigs?.length || 0} Active Gigs
                </div>
              </div>

              {/* Skills */}
              {fiverrProfile.skills?.length > 0 && (
                <div>
                  <span className="text-[10px] font-bold text-[#74767e] uppercase">Skills</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {fiverrProfile.skills.slice(0, 10).map((skill: any) => (
                      <span
                        key={typeof skill === 'string' ? skill : skill.name}
                        className="px-2 py-0.5 rounded-full bg-white border border-[#dadbdd] text-[11px] text-[#404145]"
                      >
                        {typeof skill === 'string' ? skill : skill.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Tagline */}
              {fiverrProfile.tagline && (
                <p className="text-xs text-[#62646a] italic">"{fiverrProfile.tagline}"</p>
              )}
            </div>
          ) : (
            <div className="bg-[#f7f7f7] border border-[#e4e5e7] rounded-lg p-4 text-center">
              <p className="text-sm text-[#74767e]">No Fiverr profile linked</p>
            </div>
          )}
        </div>

        {/* Right: ICP Summary */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-[#222325] uppercase tracking-wider flex items-center gap-1.5">
            <Target className="w-4 h-4 text-[#1dbf73]" />
            Ideal Customer Profiles ({icpProfiles.length})
          </h3>

          {icpProfiles.length > 0 ? (
            <div className="space-y-3">
              {icpProfiles.map((icp: any) => (
                <div key={icp.icpId} className="bg-[#f7f7f7] border border-[#e4e5e7] rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-bold text-[#222325]">{icp.personaName}</h4>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      icp.priority === 'primary'
                        ? 'bg-[#1dbf73]/10 text-[#1dbf73] border border-[#1dbf73]/30'
                        : icp.priority === 'secondary'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'bg-purple-50 text-purple-700 border border-purple-200'
                    }`}>
                      {icp.priority.charAt(0).toUpperCase() + icp.priority.slice(1)}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs text-[#404145]">
                    <div className="flex items-center gap-1.5">
                      <Users className="w-3 h-3 text-[#74767e]" />
                      {icp.buyerPersona?.jobTitles?.join(', ')}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <DollarSign className="w-3 h-3 text-[#74767e]" />
                      ${icp.projectFit?.budgetRange?.min?.toLocaleString()} — ${icp.projectFit?.budgetRange?.max?.toLocaleString()} {icp.projectFit?.budgetRange?.currency || 'USD'}
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {icp.targetFirmographics?.industries?.slice(0, 4).map((ind: string) => (
                        <span key={ind} className="px-1.5 py-0.5 rounded bg-white border border-[#dadbdd] text-[10px] text-[#62646a]">
                          {ind}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-[#f7f7f7] border border-[#e4e5e7] rounded-lg p-4 text-center">
              <p className="text-sm text-[#74767e]">No ICPs generated yet</p>
              <button
                onClick={() => navigate('/onboarding/step/2')}
                className="mt-2 text-xs text-[#1dbf73] font-bold hover:underline cursor-pointer"
              >
                Go back to Step 2
              </button>
            </div>
          )}
        </div>
      </div>

      {/* What happens next */}
      <div className="bg-[#1dbf73]/5 border border-[#1dbf73]/20 rounded-lg p-4">
        <h4 className="text-sm font-bold text-[#222325] mb-2">What happens next?</h4>
        <ul className="space-y-1.5 text-xs text-[#404145]">
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#1dbf73] mt-0.5 shrink-0" />
            Your <strong>Gig Studio</strong> will use your ICPs to generate gigs targeted at your ideal clients
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#1dbf73] mt-0.5 shrink-0" />
            <strong>Buyer Briefs</strong> will be filtered to match your skills and ICP industries
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#1dbf73] mt-0.5 shrink-0" />
            <strong>Market Research</strong> will be targeted to your niches and ICP verticals
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#1dbf73] mt-0.5 shrink-0" />
            You can always update your profile and ICPs from <strong>Settings</strong>
          </li>
        </ul>
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
          {error}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={() => navigate('/onboarding/step/2')}
          className="text-xs font-semibold text-[#74767e] hover:text-[#222325] px-4 py-2 rounded-md border border-[#dadbdd] hover:bg-[#f5f5f5] transition-colors cursor-pointer"
        >
          ← Back to Edit ICPs
        </button>

        <button
          onClick={handleComplete}
          disabled={completing}
          className="fiverr-btn-green px-8 py-2.5 rounded-md text-sm font-bold flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
        >
          {completing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Completing...
            </>
          ) : (
            <>
              Confirm & Complete Onboarding
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};
