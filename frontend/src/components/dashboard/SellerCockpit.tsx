import React from 'react';
import {
  Sparkles,
  TrendingUp,
  Send,
  Compass,
  CheckCircle2,
  DollarSign,
  ArrowRight,
  ShieldCheck,
  Zap,
  BarChart3,
  Flame,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SellerCockpitProps {
  activeTab: string;
  onNavigateTab: (tab: string) => void;
  savedGigsCount: number;
}

export const SellerCockpit: React.FC<SellerCockpitProps> = ({
  activeTab,
  onNavigateTab,
  savedGigsCount,
}) => {
  const { user, userContext } = useAuth();
  const hasStrategy = !!userContext?.strategy;

  // 4-Step Guided Freelancer Pipeline
  const pipelineSteps = [
    {
      id: 'strategist',
      number: '01',
      title: 'Strategy & Identity',
      desc: hasStrategy ? 'Blueprint Locked' : 'Audit Profile & Niche',
      status: hasStrategy ? 'completed' : 'pending',
      icon: Compass,
    },
    {
      id: 'research',
      number: '02',
      title: 'Market Intelligence',
      desc: 'Live Buyer Search Terms',
      status: 'ready',
      icon: BarChart3,
    },
    {
      id: 'gigs',
      number: '03',
      title: '5-Tag Gig Studio',
      desc: savedGigsCount > 0 ? `${savedGigsCount} Gigs Built` : 'Craft High-Ticket Gigs',
      status: savedGigsCount > 0 ? 'completed' : 'ready',
      icon: Sparkles,
    },
    {
      id: 'briefs',
      number: '04',
      title: 'Live Brief Radar',
      desc: 'Pitch Real Client Deals',
      status: 'live',
      icon: Send,
    },
  ];

  const readinessScore = hasStrategy ? (savedGigsCount > 0 ? 96 : 78) : 35;

  return (
    <div className="w-full space-y-4 font-sans">
      {/* Top Cockpit Header Banner */}
      <div className="relative overflow-hidden rounded-xl border border-[#dadbdd] bg-white p-5 md:p-6 shadow-xs">
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          {/* Main Status & Welcome */}
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#1dbf73]/10 text-[#1dbf73] border border-[#1dbf73]/30">
                <span className="w-1.5 h-1.5 rounded-full bg-[#1dbf73]" />
                Autonomous Engine Active
              </span>
              {hasStrategy ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
                  <ShieldCheck className="w-3 h-3 text-blue-600" />
                  Strategy Context Locked
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-800 border border-amber-200">
                  <Zap className="w-3 h-3 text-amber-600" />
                  Action Required: Complete Onboarding Audit
                </span>
              )}
            </div>

            <h2 className="text-xl md:text-2xl font-bold text-[#222325] tracking-tight">
              {user ? `Welcome, ${user.username}` : 'Fiverr Growth Freelance Command Center'}
            </h2>
            <p className="text-xs md:text-sm text-[#74767e] mt-1 leading-relaxed">
              {hasStrategy
                ? `Positioned as: ${userContext.strategy.profile_positioning?.recommended_title || 'AI & Full-Stack Solutions Engineer'}. Your unfair advantage is locked into all gig and proposal generators.`
                : 'Turn your skills into high-ticket freelance income. We examine your profile, find underserved market gaps, build 5-tag SEO gigs, and match you to active buyer briefs.'}
            </p>
          </div>

          {/* Quick Readiness Score Widget */}
          <div className="flex items-center gap-4 bg-[#f7f7f7] p-3.5 rounded-xl border border-[#dadbdd] shrink-0 w-full lg:w-auto justify-between sm:justify-start">
            <div>
              <div className="text-[11px] font-medium text-[#74767e]">Seller Readiness</div>
              <div className="text-2xl font-bold text-[#222325] flex items-center gap-1.5">
                <span>{readinessScore}%</span>
                <span className="text-xs font-bold text-[#1dbf73]">
                  {readinessScore > 80 ? 'Market Ready' : 'Setup In Progress'}
                </span>
              </div>
              <div className="w-36 h-1.5 bg-[#e4e5e7] rounded-full mt-1.5 overflow-hidden">
                <div
                  className="h-full bg-[#1dbf73] transition-all duration-500 rounded-full"
                  style={{ width: `${readinessScore}%` }}
                />
              </div>
            </div>

            {!hasStrategy && (
              <button
                onClick={() => onNavigateTab('strategist')}
                className="px-3.5 py-2 rounded-md bg-[#1dbf73] text-white font-bold text-xs shadow-xs hover:bg-[#19a463] transition-colors flex items-center gap-1 cursor-pointer shrink-0"
              >
                <span>Audit Now</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* 4 Executive KPI Metrics Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5 pt-4 border-t border-[#e4e5e7]">
          <div className="bg-[#f7f7f7] p-3 rounded-lg border border-[#dadbdd]">
            <div className="flex items-center justify-between text-[#74767e] mb-1">
              <span className="text-[11px] font-medium">Market Velocity</span>
              <Flame className="w-3.5 h-3.5 text-amber-500" />
            </div>
            <div className="text-base md:text-lg font-bold text-[#222325]">98 / 100</div>
            <div className="text-[10px] text-[#1dbf73] flex items-center gap-1 mt-0.5">
              <TrendingUp className="w-2.5 h-2.5" />
              High Buyer Intent in AI & Web
            </div>
          </div>

          <div className="bg-[#f7f7f7] p-3 rounded-lg border border-[#dadbdd]">
            <div className="flex items-center justify-between text-[#74767e] mb-1">
              <span className="text-[11px] font-medium">Live Client Briefs</span>
              <Send className="w-3.5 h-3.5 text-blue-600" />
            </div>
            <div className="text-base md:text-lg font-bold text-[#222325]">18 Opportunities</div>
            <div className="text-[10px] text-blue-600 flex items-center gap-1 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              Jobicy & Remotive Stream
            </div>
          </div>

          <div className="bg-[#f7f7f7] p-3 rounded-lg border border-[#dadbdd]">
            <div className="flex items-center justify-between text-[#74767e] mb-1">
              <span className="text-[11px] font-medium">Target Order Value</span>
              <DollarSign className="w-3.5 h-3.5 text-[#1dbf73]" />
            </div>
            <div className="text-base md:text-lg font-bold text-[#222325]">$250 - $600</div>
            <div className="text-[10px] text-[#74767e] mt-0.5">Value-based high ticket tier</div>
          </div>

          <div className="bg-[#f7f7f7] p-3 rounded-lg border border-[#dadbdd]">
            <div className="flex items-center justify-between text-[#74767e] mb-1">
              <span className="text-[11px] font-medium">Saved Studio Assets</span>
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            </div>
            <div className="text-base md:text-lg font-bold text-[#222325]">{savedGigsCount} Gigs</div>
            <div className="text-[10px] text-purple-600 mt-0.5">Persistent local library</div>
          </div>
        </div>
      </div>

      {/* 4-Step Interactive Guided Pipeline Bar */}
      <div className="bg-white p-3 rounded-xl border border-[#dadbdd] shadow-xs">
        <div className="flex items-center justify-between px-2 mb-2">
          <div className="text-[11px] font-bold text-[#74767e] uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-[#1dbf73]" />
            Seller Growth Pipeline
          </div>
          <div className="text-[10px] text-[#74767e]">Step-by-step to first order</div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {pipelineSteps.map((step) => {
            const Icon = step.icon;
            const isCurrent = activeTab === step.id;

            return (
              <button
                key={step.id}
                onClick={() => onNavigateTab(step.id)}
                className={`flex items-center gap-3 p-2.5 rounded-lg border text-left transition-all duration-200 cursor-pointer ${
                  isCurrent
                    ? 'bg-[#1dbf73]/10 border-[#1dbf73]'
                    : 'bg-[#f7f7f7] border-[#dadbdd] hover:border-[#b5b6ba] hover:bg-white'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-md flex items-center justify-center shrink-0 ${
                    isCurrent
                      ? 'bg-[#1dbf73] text-white'
                      : step.status === 'completed'
                      ? 'bg-[#1dbf73]/15 text-[#1dbf73]'
                      : 'bg-white text-[#74767e] border border-[#dadbdd]'
                  }`}
                >
                  {step.status === 'completed' ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-[#222325] flex items-center gap-1.5 truncate">
                    <span className="text-[10px] font-mono text-[#74767e]">{step.number}</span>
                    <span>{step.title}</span>
                    {step.status === 'live' && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#1dbf73]" />
                    )}
                  </div>
                  <div className="text-[10px] text-[#74767e] truncate">{step.desc}</div>
                </div>

                <ArrowRight
                  className={`w-3.5 h-3.5 shrink-0 transition-transform ${
                    isCurrent ? 'text-[#1dbf73] translate-x-0.5' : 'text-[#b5b6ba]'
                  }`}
                />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
