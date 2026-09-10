import React, { useState, useEffect } from 'react';
import {
  RefreshCw,
  Star,
  DollarSign,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  Layers,
  Sparkles,
  Zap,
  Bookmark,
  Check,
  Tag,
  ArrowLeft,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export interface CompetitorGigCandidate {
  gigId: number | string;
  sellerName: string;
  sellerDisplayName: string;
  sellerImg: string;
  sellerCountry?: string;
  sellerLevel?: string;
  isPro: boolean;
  isFiverrChoice: boolean;
  title: string;
  slug: string;
  gigUrl: string;
  startingPrice: number;
  rating: number;
  reviewsCount: number;
  category?: string;
  earnerTier?: 'Market Leader' | 'High Velocity Earner' | 'Direct Rival';
  estimatedMonthlyRevenue?: string;
  isHighEarner?: boolean;
}

export interface ComparativeAnalysisData {
  competitorProfile: any;
  metricsComparison: {
    userPriceFloor: number;
    userPriceCeiling: number;
    competitorPriceFloor: number;
    competitorPriceCeiling: number;
    userRating: number;
    competitorRating: number;
    userReviewsCount: number;
    competitorReviewsCount: number;
    userOrdersInQueue: number;
    competitorOrdersInQueue: number;
    estimatedRevenueGapMultiplier: number;
    missingHighVolumeTags: string[];
    commonSkills: string[];
    uniqueCompetitorSkills: string[];
  };
  gapAnalysis: {
    executiveSummary: string;
    whyCompetitorMakesMore: {
      pricingStrategy: string;
      packagingLeverage: string;
      positioningAndHooks: string;
    };
    deliverablesComparison: {
      userStrengths: string[];
      competitorStrengths: string[];
      criticalMissingFeatures: string[];
    };
    seoAndSearchGap: {
      tagsAnalysis: string;
      rankingAngles: string[];
    };
    actionableWinPlan: {
      stepNumber: number;
      title: string;
      category: 'title' | 'pricing' | 'packages' | 'positioning';
      action: string;
      expectedImpact: string;
    }[];
    recommendedPricing: {
      basic: number;
      standard: number;
      premium: number;
      rationale: string;
    };
  };
}

export const CompetitorsView: React.FC = () => {
  const { user, userContext } = useAuth();

  // Search & input states
  const [inputHandle, setInputHandle] = useState('');
  const [activeQuery, setActiveQuery] = useState('');
  const [discoveryList, setDiscoveryList] = useState<CompetitorGigCandidate[]>([]);
  const [loadingDiscovery, setLoadingDiscovery] = useState(false);

  // Analysis states
  const [analysisData, setAnalysisData] = useState<ComparativeAnalysisData | null>(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [analysisPhase, setAnalysisPhase] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Saved report notification
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [savingReport, setSavingReport] = useState(false);

  // Quality benchmark & filter states
  const [selectedTierFilter, setSelectedTierFilter] = useState<'all' | 'market_leader' | 'high_velocity' | 'pro_choice'>('all');
  const [selectedSortBy, setSelectedSortBy] = useState<'revenue' | 'reviews' | 'rating'>('revenue');
  const [minReviewsFilter, setMinReviewsFilter] = useState<number>(5);

  // Quick niches based on intelligent user context analysis
  const userNiches = React.useMemo(() => {
    const list: string[] = [];
    const gigTitle = userContext?.fiverrProfile?.gigs?.[0]?.title || user?.fiverrProfile?.gigs?.[0]?.title;
    const skills = userContext?.primarySkills || userContext?.fiverrProfile?.skills || [];

    // Analyze skills and profile for domain clusters
    const hasAI = skills.some((s: any) => {
      const name = typeof s === 'string' ? s : s?.name || '';
      return /ai|agent|chatbot|gpt|langchain|llm|voice/i.test(name);
    }) || /ai|chatbot|agent|bot/i.test(gigTitle || '');

    const hasWeb = skills.some((s: any) => {
      const name = typeof s === 'string' ? s : s?.name || '';
      return /react|next|node|frontend|fullstack|web|developer/i.test(name);
    }) || /react|next|website|web|full stack/i.test(gigTitle || '');

    const hasPython = skills.some((s: any) => {
      const name = typeof s === 'string' ? s : s?.name || '';
      return /python|fastapi|django|flask|backend|api/i.test(name);
    }) || /python|fastapi|backend/i.test(gigTitle || '');

    const hasMobile = skills.some((s: any) => {
      const name = typeof s === 'string' ? s : s?.name || '';
      return /flutter|react native|ios|android|mobile/i.test(name);
    }) || /mobile|flutter|app/i.test(gigTitle || '');

    if (hasAI) list.push('AI Chatbot Automation');
    if (hasWeb) list.push('Full Stack Web Development');
    if (hasPython) list.push('Python FastAPI Backend');
    if (hasMobile) list.push('Mobile App Development');

    // Add highest priority skill if valid string
    if (skills.length > 0) {
      const firstSkill = typeof skills[0] === 'string' ? skills[0] : skills[0]?.name;
      if (firstSkill && firstSkill.length > 2) {
        list.push(firstSkill);
      }
    }

    list.push('AI Agent LangChain', 'React Next.js App');
    return Array.from(new Set(list)).slice(0, 5);
  }, [userContext, user]);

  // Competitor discovery fetch with benchmark & sorting parameters
  const fetchCompetitorDiscovery = async (
    queryToSearch?: string,
    tierOverride?: 'all' | 'market_leader' | 'high_velocity' | 'pro_choice',
    sortOverride?: 'revenue' | 'reviews' | 'rating',
    minReviewsOverride?: number
  ) => {
    const q = queryToSearch !== undefined ? queryToSearch : (activeQuery || userNiches[0] || 'AI Chatbot Automation');
    const tier = tierOverride !== undefined ? tierOverride : selectedTierFilter;
    const sort = sortOverride !== undefined ? sortOverride : selectedSortBy;
    const minRev = minReviewsOverride !== undefined ? minReviewsOverride : minReviewsFilter;

    setActiveQuery(q);
    setLoadingDiscovery(true);
    setError(null);

    try {
      const res = await fetch('/api/v1/competitors/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: q,
          filterTier: tier === 'all' ? undefined : tier,
          sortBy: sort,
          minReviews: minRev,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setDiscoveryList(json.data || []);
      } else {
        setError(json.error || 'Failed to discover competitors.');
      }
    } catch (err: any) {
      setError(err.message || 'Error connecting to competitor discovery engine.');
    } finally {
      setLoadingDiscovery(false);
    }
  };

  useEffect(() => {
    fetchCompetitorDiscovery();
  }, []);

  const handleFilterChange = (tier: 'all' | 'market_leader' | 'high_velocity' | 'pro_choice') => {
    setSelectedTierFilter(tier);
    fetchCompetitorDiscovery(activeQuery, tier, selectedSortBy, minReviewsFilter);
  };

  const handleSortChange = (sort: 'revenue' | 'reviews' | 'rating') => {
    setSelectedSortBy(sort);
    fetchCompetitorDiscovery(activeQuery, selectedTierFilter, sort, minReviewsFilter);
  };

  // Trigger deep analysis on target competitor
  const handleAnalyzeTarget = async (competitorUsernameOrUrl: string) => {
    const cleanTarget = competitorUsernameOrUrl.trim();
    if (!cleanTarget) {
      setError('Please enter a competitor Fiverr username or URL.');
      return;
    }

    setError(null);
    setLoadingAnalysis(true);
    setSavedSuccess(false);
    setAnalysisPhase('Connecting to live Fiverr profile...');

    const timer1 = setTimeout(() => {
      setAnalysisPhase('Extracting 3-tier packages, deliverables, and buyer reviews...');
    }, 900);

    const timer2 = setTimeout(() => {
      setAnalysisPhase('Running deep comparative gap analysis & revenue optimization formula...');
    }, 2000);

    try {
      const token = localStorage.getItem('fg_token');
      const res = await fetch('/api/v1/competitors/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ competitorUsernameOrUrl: cleanTarget }),
      });

      const json = await res.json();
      if (!json.success) {
        throw new Error(json.error || 'Failed to analyze competitor.');
      }

      setAnalysisData(json.data);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setError(err.message || 'Failed to complete competitor analysis. Please verify the username.');
    } finally {
      clearTimeout(timer1);
      clearTimeout(timer2);
      setLoadingAnalysis(false);
      setAnalysisPhase('');
    }
  };

  const handleSaveReport = async () => {
    if (!analysisData) return;
    setSavingReport(true);
    try {
      const token = localStorage.getItem('fg_token');
      const res = await fetch('/api/v1/competitors/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          competitorUsername: analysisData.competitorProfile.username,
          competitorProfile: analysisData.competitorProfile,
          metricsComparison: analysisData.metricsComparison,
          gapAnalysis: analysisData.gapAnalysis,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 4000);
      }
    } catch (err) {
      console.warn('Could not save competitor report:', err);
    } finally {
      setSavingReport(false);
    }
  };

  return (
    <div className="w-full space-y-6 font-sans">
      {/* ─── Top Header & Manual Inspection Bar ─── */}
      <div className="bg-white border border-[#dadbdd] rounded-xl p-5 md:p-6 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#1dbf73]">
                Marketplace Intelligence
              </span>
              <span className="w-2 h-2 rounded-full bg-[#1dbf73] animate-pulse" />
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-[#222325]">
              Real-Time Fiverr Competitor Intelligence
            </h1>
            <p className="text-xs text-[#74767e]">
              Benchmark your seller profile, 3-tier gig pricing, and search tags against top rivals who are capturing market share.
            </p>
          </div>

          {/* Form for manual competitor username entry */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAnalyzeTarget(inputHandle);
            }}
            className="w-full lg:w-auto flex items-center gap-2"
          >
            <div className="relative flex-1 sm:w-80 lg:w-96">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-xs font-semibold text-[#74767e]">
                fiverr.com/
              </span>
              <input
                type="text"
                value={inputHandle}
                onChange={(e) => setInputHandle(e.target.value)}
                placeholder="enter_competitor_username"
                disabled={loadingAnalysis}
                className="w-full pl-24 pr-4 py-2 border border-[#dadbdd] rounded text-xs md:text-sm text-[#222325] focus:border-[#1dbf73] focus:outline-none focus:ring-1 focus:ring-[#1dbf73] transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={loadingAnalysis || !inputHandle.trim()}
              className="fiverr-btn-green px-4 py-2 text-xs md:text-sm font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
            >
              {loadingAnalysis ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Analyzing...</span>
                </>
              ) : (
                <>
                  <span>Analyze</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Niche quick tags for discovery */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#efeff0]">
          <div className="flex items-center gap-2 text-xs text-[#74767e] flex-wrap">
            <span>Filter live competitors by niche:</span>
            {userNiches.map((niche, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => fetchCompetitorDiscovery(niche)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors border cursor-pointer ${
                  activeQuery.toLowerCase() === niche.toLowerCase()
                    ? 'bg-[#1dbf73] text-white border-[#1dbf73]'
                    : 'bg-[#f5f5f5] text-[#404145] border-[#dadbdd] hover:bg-[#e4e5e7]'
                }`}
              >
                {niche}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => fetchCompetitorDiscovery(activeQuery)}
            disabled={loadingDiscovery}
            className="text-xs font-bold text-[#1dbf73] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw className={`w-3 h-3 ${loadingDiscovery ? 'animate-spin' : ''}`} />
            <span>Refresh Live Market Search</span>
          </button>
        </div>

        {/* Loading / Error Feedback */}
        {loadingAnalysis && (
          <div className="bg-[#1dbf73]/5 border border-[#1dbf73]/20 rounded-lg p-3 flex items-center gap-3">
            <RefreshCw className="w-4 h-4 text-[#1dbf73] animate-spin shrink-0" />
            <span className="text-xs font-medium text-[#222325]">{analysisPhase}</span>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-700 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* ─── Mode A: Deep Comparative Gap Intelligence Report ─── */}
      {analysisData ? (
        <div className="space-y-6">
          {/* Top Bar with Return Action & Save */}
          <div className="flex items-center justify-between gap-4 bg-white border border-[#dadbdd] rounded-lg p-3 shadow-xs">
            <button
              type="button"
              onClick={() => setAnalysisData(null)}
              className="flex items-center gap-1.5 text-xs font-bold text-[#404145] hover:text-[#1dbf73] transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>&larr; Return to Market Discovery Grid</span>
            </button>

            <div className="flex items-center gap-2">
              {savedSuccess && (
                <span className="text-xs font-bold text-[#1dbf73] flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  <span>Report Saved!</span>
                </span>
              )}
              <button
                type="button"
                onClick={handleSaveReport}
                disabled={savingReport || savedSuccess}
                className="fiverr-btn-outline px-3 py-1.5 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Bookmark className="w-3.5 h-3.5" />
                <span>{savingReport ? 'Saving...' : 'Save Report'}</span>
              </button>
            </div>
          </div>

          {/* Competitor Header Comparison Card */}
          <div className="bg-white border border-[#dadbdd] rounded-xl p-5 md:p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#dadbdd] pb-4">
              <div className="flex items-center gap-3.5">
                {analysisData.competitorProfile.avatarUrl ? (
                  <img
                    src={analysisData.competitorProfile.avatarUrl}
                    alt={analysisData.competitorProfile.displayName}
                    className="w-14 h-14 rounded-full object-cover border border-[#dadbdd]"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-[#222325] text-white flex items-center justify-center font-bold text-lg">
                    {analysisData.competitorProfile.username.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-lg font-bold text-[#222325]">
                      {analysisData.competitorProfile.displayName || analysisData.competitorProfile.username}
                    </h2>
                    <span className="text-xs text-[#74767e]">@{analysisData.competitorProfile.username}</span>
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#f5f5f5] text-[#222325] border border-[#dadbdd]">
                      {analysisData.competitorProfile.sellerLevel || 'Level 2 Seller'}
                    </span>
                    {analysisData.competitorProfile.isPro && (
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#1dbf73] text-white">
                        PRO
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#404145] mt-0.5">
                    {analysisData.competitorProfile.tagline || 'Specialized Marketplace Seller'}
                  </p>
                </div>
              </div>

              <a
                href={analysisData.competitorProfile.profileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="fiverr-btn-outline px-3 py-1.5 text-xs flex items-center gap-1.5"
              >
                <span>View on Fiverr</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {/* Executive Summary */}
            <div className="bg-[#1dbf73]/10 border border-[#1dbf73]/20 rounded-lg p-4">
              <div className="flex items-center gap-2 text-xs font-bold text-[#1dbf73] mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Executive Competitive Gap Summary</span>
              </div>
              <p className="text-xs md:text-sm text-[#222325] font-medium leading-relaxed">
                {analysisData.gapAnalysis.executiveSummary}
              </p>
            </div>

            {/* Side-by-Side Comparison Matrix */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#f5f5f5] text-[#74767e] uppercase font-bold border-y border-[#dadbdd]">
                  <tr>
                    <th className="py-2.5 px-3">Metric Dimension</th>
                    <th className="py-2.5 px-3 text-[#1dbf73]">You ({user?.username || 'You'})</th>
                    <th className="py-2.5 px-3 text-[#222325]">Competitor ({analysisData.competitorProfile.username})</th>
                    <th className="py-2.5 px-3">Revenue &amp; Market Advantage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#efeff0]">
                  <tr>
                    <td className="py-2.5 px-3 font-semibold text-[#404145]">Price Floor (Basic Tier)</td>
                    <td className="py-2.5 px-3 font-bold text-[#1dbf73]">${analysisData.metricsComparison.userPriceFloor}</td>
                    <td className="py-2.5 px-3 font-bold text-[#222325]">${analysisData.metricsComparison.competitorPriceFloor}</td>
                    <td className="py-2.5 px-3 text-[#74767e]">
                      {analysisData.metricsComparison.competitorPriceFloor > analysisData.metricsComparison.userPriceFloor
                        ? `Competitor anchors Basic +$${analysisData.metricsComparison.competitorPriceFloor - analysisData.metricsComparison.userPriceFloor} higher`
                        : 'Identical entry floor'}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-semibold text-[#404145]">Price Ceiling (Premium Tier)</td>
                    <td className="py-2.5 px-3 font-bold text-[#1dbf73]">${analysisData.metricsComparison.userPriceCeiling}</td>
                    <td className="py-2.5 px-3 font-bold text-[#222325]">${analysisData.metricsComparison.competitorPriceCeiling}</td>
                    <td className="py-2.5 px-3 text-[#74767e]">
                      {analysisData.metricsComparison.competitorPriceCeiling > analysisData.metricsComparison.userPriceCeiling
                        ? `Competitor captures high-ticket budgets up to $${analysisData.metricsComparison.competitorPriceCeiling}`
                        : 'Your ceiling is competitive'}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-semibold text-[#404145]">Star Rating &amp; Review Count</td>
                    <td className="py-2.5 px-3 font-semibold text-[#222325]">
                      {analysisData.metricsComparison.userRating}★ ({analysisData.metricsComparison.userReviewsCount})
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-[#222325]">
                      {analysisData.metricsComparison.competitorRating}★ ({analysisData.metricsComparison.competitorReviewsCount})
                    </td>
                    <td className="py-2.5 px-3 text-[#74767e]">
                      Social proof ratio:{' '}
                      {(analysisData.metricsComparison.competitorReviewsCount / Math.max(analysisData.metricsComparison.userReviewsCount, 1)).toFixed(1)}x
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-semibold text-[#404145]">Orders in Queue</td>
                    <td className="py-2.5 px-3 font-semibold text-[#222325]">
                      {analysisData.metricsComparison.userOrdersInQueue} active
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-[#222325]">
                      {analysisData.metricsComparison.competitorOrdersInQueue} active
                    </td>
                    <td className="py-2.5 px-3 text-[#74767e]">
                      Estimated Revenue Gap Multiplier:{' '}
                      <span className="font-bold text-[#1dbf73]">
                        {analysisData.metricsComparison.estimatedRevenueGapMultiplier}x
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* ─── Why They Make More Money: 3 Key Dimensions ─── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white border border-[#dadbdd] rounded-xl p-5 shadow-xs space-y-2">
              <div className="flex items-center gap-2 text-[#1dbf73]">
                <DollarSign className="w-4 h-4" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#222325]">
                  Pricing Strategy &amp; Anchors
                </h3>
              </div>
              <p className="text-xs text-[#62646a] leading-relaxed">
                {analysisData.gapAnalysis.whyCompetitorMakesMore.pricingStrategy}
              </p>
            </div>

            <div className="bg-white border border-[#dadbdd] rounded-xl p-5 shadow-xs space-y-2">
              <div className="flex items-center gap-2 text-[#1dbf73]">
                <Layers className="w-4 h-4" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#222325]">
                  Packaging &amp; Deliverables Leverage
                </h3>
              </div>
              <p className="text-xs text-[#62646a] leading-relaxed">
                {analysisData.gapAnalysis.whyCompetitorMakesMore.packagingLeverage}
              </p>
            </div>

            <div className="bg-white border border-[#dadbdd] rounded-xl p-5 shadow-xs space-y-2">
              <div className="flex items-center gap-2 text-[#1dbf73]">
                <Sparkles className="w-4 h-4" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#222325]">
                  Positioning &amp; Conversion Hooks
                </h3>
              </div>
              <p className="text-xs text-[#62646a] leading-relaxed">
                {analysisData.gapAnalysis.whyCompetitorMakesMore.positioningAndHooks}
              </p>
            </div>
          </div>

          {/* ─── Deliverables Audit & Search Tag Divergence ─── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Deliverables Breakdown */}
            <div className="lg:col-span-6 bg-white border border-[#dadbdd] rounded-xl p-5 shadow-xs space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#222325] border-b border-[#dadbdd] pb-2">
                Deliverable Features Audit
              </h3>

              <div className="space-y-2 text-xs">
                <div>
                  <span className="font-bold text-[#1dbf73] flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Your Key Technical Strengths:</span>
                  </span>
                  <ul className="list-disc list-inside text-[#62646a] pl-2 mt-1 space-y-0.5">
                    {analysisData.gapAnalysis.deliverablesComparison.userStrengths.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>

                <div className="pt-2 border-t border-[#efeff0]">
                  <span className="font-bold text-amber-700 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    <span>Missing Features Competitor Bundles (Add These):</span>
                  </span>
                  <ul className="list-disc list-inside text-[#62646a] pl-2 mt-1 space-y-0.5">
                    {analysisData.gapAnalysis.deliverablesComparison.criticalMissingFeatures.map((f, i) => (
                      <li key={i} className="font-medium text-[#222325]">{f}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Right: SEO & Search Tag Gap */}
            <div className="lg:col-span-6 bg-white border border-[#dadbdd] rounded-xl p-5 shadow-xs space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#222325] border-b border-[#dadbdd] pb-2">
                Search SEO &amp; Missing High-Volume Tags
              </h3>

              <p className="text-xs text-[#62646a] leading-relaxed">
                {analysisData.gapAnalysis.seoAndSearchGap.tagsAnalysis}
              </p>

              <div>
                <span className="text-[11px] font-bold text-[#222325] block mb-1.5">
                  Tags Used by Competitor that You Are Missing:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {analysisData.metricsComparison.missingHighVolumeTags.map((tag, tIdx) => (
                    <span
                      key={tIdx}
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#1dbf73]/10 text-[#1dbf73] border border-[#1dbf73]/30"
                    >
                      <Tag className="w-2.5 h-2.5" />
                      <span>{tag}</span>
                    </span>
                  ))}
                </div>
              </div>

              {analysisData.gapAnalysis.seoAndSearchGap.rankingAngles && (
                <div className="pt-2 border-t border-[#efeff0] text-xs text-[#62646a]">
                  <span className="font-bold text-[#222325] block mb-1">Recommended Ranking Angles:</span>
                  <ul className="list-disc list-inside pl-2 space-y-0.5">
                    {analysisData.gapAnalysis.seoAndSearchGap.rankingAngles.map((a, i) => (
                      <li key={i}>{a}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* ─── Actionable Outcompete Roadmap (The Win Plan) ─── */}
          <div className="bg-white border border-[#dadbdd] rounded-xl p-5 md:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#dadbdd] pb-3">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-[#1dbf73]" />
                <h3 className="text-sm font-bold text-[#222325]">
                  Actionable Outcompete Roadmap (The Win Plan)
                </h3>
              </div>
              <span className="text-xs text-[#74767e]">
                Step-by-step instructions to bridge the revenue gap
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {analysisData.gapAnalysis.actionableWinPlan.map((step) => (
                <div
                  key={step.stepNumber}
                  className="p-4 rounded-lg border border-[#dadbdd] bg-[#fafafa] space-y-2 hover:border-[#1dbf73] transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-[#1dbf73] text-white flex items-center justify-center text-xs font-bold">
                        {step.stepNumber}
                      </span>
                      <h4 className="text-xs font-bold text-[#222325]">{step.title}</h4>
                    </div>
                    <span className="text-[10px] uppercase font-bold text-[#74767e] bg-white px-2 py-0.5 rounded border border-[#dadbdd]">
                      {step.category}
                    </span>
                  </div>

                  <p className="text-xs text-[#404145] leading-relaxed">{step.action}</p>

                  <div className="pt-2 border-t border-[#efeff0] flex items-center justify-between text-[11px]">
                    <span className="text-[#74767e]">Projected Impact:</span>
                    <span className="font-bold text-[#1dbf73]">{step.expectedImpact}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Recommended Pricing Matrix */}
            {analysisData.gapAnalysis.recommendedPricing && (
              <div className="mt-4 p-4 rounded-lg bg-[#f7f7f7] border border-[#dadbdd] space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-[#222325]">
                    Recommended 3-Tier Pricing Formula to Beat {analysisData.competitorProfile.username}
                  </h4>
                  <span className="text-xs text-[#74767e]">
                    {analysisData.gapAnalysis.recommendedPricing.rationale}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-2.5 bg-white rounded border border-[#dadbdd]">
                    <span className="text-[10px] uppercase font-bold text-[#74767e] block">Basic Tier</span>
                    <span className="text-base font-bold text-[#222325]">
                      ${analysisData.gapAnalysis.recommendedPricing.basic}
                    </span>
                  </div>
                  <div className="p-2.5 bg-white rounded border border-[#1dbf73] ring-1 ring-[#1dbf73]/20">
                    <span className="text-[10px] uppercase font-bold text-[#1dbf73] block">Standard Tier</span>
                    <span className="text-base font-bold text-[#1dbf73]">
                      ${analysisData.gapAnalysis.recommendedPricing.standard}
                    </span>
                  </div>
                  <div className="p-2.5 bg-white rounded border border-[#dadbdd]">
                    <span className="text-[10px] uppercase font-bold text-[#74767e] block">Premium Tier</span>
                    <span className="text-base font-bold text-[#222325]">
                      ${analysisData.gapAnalysis.recommendedPricing.premium}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ─── Mode B: Live Market Earners Grid (Auto-Discovery) ─── */
        <div className="space-y-4">
          {/* Header & Quality Benchmark Bar */}
          <div className="bg-white border border-[#dadbdd] rounded-xl p-4 md:p-5 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-[#222325]">
                    Active Market Competitors in "{activeQuery}"
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-[#f0fdf4] text-[#166534] border border-[#bbf7d0]">
                    {discoveryList.length} Qualified Earners
                  </span>
                </div>
                <p className="text-xs text-[#74767e] mt-0.5">
                  Live ranking sellers on Fiverr meeting commercial revenue thresholds (≥{minReviewsFilter} reviews, 4.4★+).
                </p>
              </div>

              {/* Quality Benchmark Guarantee */}
              <div className="flex items-center gap-2 bg-[#f8fafc] border border-[#e2e8f0] px-3 py-1.5 rounded-lg text-xs text-[#334155]">
                <ShieldCheck className="w-4 h-4 text-[#1dbf73] shrink-0" />
                <span className="font-medium">Market Benchmark Active: Zero-review accounts & $1 spam strictly filtered</span>
              </div>
            </div>

            {/* Filter & Sort Controls */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#efeff0]">
              {/* Earner Tier Filter Tabs */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-semibold text-[#74767e] mr-1">Benchmark Tier:</span>
                <button
                  type="button"
                  onClick={() => handleFilterChange('all')}
                  className={`px-3 py-1 rounded text-xs font-semibold transition-colors cursor-pointer ${
                    selectedTierFilter === 'all'
                      ? 'bg-[#222325] text-white'
                      : 'bg-[#f5f5f5] text-[#404145] hover:bg-[#e4e5e7]'
                  }`}
                >
                  All Active Earners
                </button>
                <button
                  type="button"
                  onClick={() => handleFilterChange('market_leader')}
                  className={`px-3 py-1 rounded text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1 ${
                    selectedTierFilter === 'market_leader'
                      ? 'bg-[#854d0e] text-white'
                      : 'bg-[#fef9c3] text-[#854d0e] hover:bg-[#fef08a] border border-[#fde047]'
                  }`}
                >
                  <span>👑</span>
                  <span>Market Leaders</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleFilterChange('high_velocity')}
                  className={`px-3 py-1 rounded text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1 ${
                    selectedTierFilter === 'high_velocity'
                      ? 'bg-[#1e40af] text-white'
                      : 'bg-[#dbeafe] text-[#1e40af] hover:bg-[#bfdbfe] border border-[#bfdbfe]'
                  }`}
                >
                  <span>🚀</span>
                  <span>High Velocity</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleFilterChange('pro_choice')}
                  className={`px-3 py-1 rounded text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1 ${
                    selectedTierFilter === 'pro_choice'
                      ? 'bg-[#0f766e] text-white'
                      : 'bg-[#ccfbf1] text-[#0f766e] hover:bg-[#99f6e4] border border-[#99f6e4]'
                  }`}
                >
                  <span>💎</span>
                  <span>Pro & Choice</span>
                </button>
              </div>

              {/* Sort & Threshold Selectors */}
              <div className="flex items-center gap-3 text-xs flex-wrap">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-[#74767e]">Min Reviews:</span>
                  <select
                    value={minReviewsFilter}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setMinReviewsFilter(val);
                      fetchCompetitorDiscovery(activeQuery, selectedTierFilter, selectedSortBy, val);
                    }}
                    className="bg-white border border-[#dadbdd] rounded px-2 py-1 text-xs text-[#222325] font-medium focus:outline-none focus:border-[#1dbf73]"
                  >
                    <option value={3}>3+ (Broad)</option>
                    <option value={5}>5+ (Standard Earners)</option>
                    <option value={10}>10+ (Established)</option>
                    <option value={20}>20+ (High Volume)</option>
                  </select>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-[#74767e]">Sort by:</span>
                  <select
                    value={selectedSortBy}
                    onChange={(e) => handleSortChange(e.target.value as any)}
                    className="bg-white border border-[#dadbdd] rounded px-2.5 py-1 text-xs text-[#222325] font-medium focus:outline-none focus:border-[#1dbf73]"
                  >
                    <option value="revenue">Est. Monthly Revenue (Highest)</option>
                    <option value="reviews">Review Volume (Most Active)</option>
                    <option value="rating">Rating (Highest)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {loadingDiscovery ? (
            <div className="bg-white border border-[#dadbdd] rounded-xl p-12 text-center space-y-3">
              <RefreshCw className="w-6 h-6 text-[#1dbf73] animate-spin mx-auto" />
              <p className="text-xs font-bold text-[#222325]">
                Scraping live marketplace results and benchmarking commercial earners...
              </p>
            </div>
          ) : discoveryList.length === 0 ? (
            <div className="bg-white border border-[#dadbdd] rounded-xl p-12 text-center space-y-3">
              <p className="text-xs text-[#74767e]">
                No competitors found meeting the benchmark in "{activeQuery}". Try selecting "All Active Earners" or a different niche above.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {discoveryList.map((comp) => {
                const tier = comp.earnerTier || 'Direct Rival';
                const isLeader = tier === 'Market Leader';
                const isVelocity = tier === 'High Velocity Earner';
                const levelLabel = comp.sellerLevel ? comp.sellerLevel.replace(/_/g, ' ') : '';

                return (
                  <div
                    key={comp.gigId}
                    className="bg-white border border-[#dadbdd] rounded-xl overflow-hidden shadow-xs hover:shadow-md hover:border-[#1dbf73] transition-all flex flex-col justify-between"
                  >
                    {/* Card Header & Media Preview */}
                    <div>
                      <div className="p-3.5 border-b border-[#efeff0] flex items-center justify-between">
                        <div className="flex items-center gap-2.5 min-w-0">
                          {comp.sellerImg ? (
                            <img
                              src={comp.sellerImg}
                              alt={comp.sellerDisplayName}
                              className="w-9 h-9 rounded-full object-cover border border-[#dadbdd] shrink-0"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-[#f5f5f5] text-[#222325] flex items-center justify-center text-xs font-bold shrink-0">
                              {comp.sellerName.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0">
                            <span className="text-xs font-bold text-[#222325] truncate block">
                              {comp.sellerDisplayName || comp.sellerName}
                            </span>
                            <span className="text-[11px] text-[#74767e] truncate block">
                              @{comp.sellerName}
                            </span>
                          </div>
                        </div>

                        {/* Badges */}
                        <div className="flex items-center gap-1 shrink-0">
                          {comp.isPro && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#1dbf73] text-white">
                              PRO
                            </span>
                          )}
                          {comp.isFiverrChoice && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#222325] text-white">
                              CHOICE
                            </span>
                          )}
                          {levelLabel && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-[#f0fdf4] text-[#166534] border border-[#bbf7d0] uppercase">
                              {levelLabel}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="p-3.5 space-y-3">
                        {/* Earner Tier & Est Revenue Pill */}
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold border inline-flex items-center gap-1 ${
                              isLeader
                                ? 'bg-[#fef9c3] text-[#854d0e] border-[#fde047]'
                                : isVelocity
                                ? 'bg-[#dbeafe] text-[#1e40af] border-[#bfdbfe]'
                                : 'bg-[#f3f4f6] text-[#374151] border-[#e5e7eb]'
                            }`}
                          >
                            {isLeader ? '👑 Market Leader' : isVelocity ? '🚀 High Velocity' : '⚡ Direct Rival'}
                          </span>

                          {comp.estimatedMonthlyRevenue && (
                            <span className="text-[11px] font-bold text-[#166534] bg-[#f0fdf4] px-2 py-0.5 rounded border border-[#bbf7d0]">
                              Est. {comp.estimatedMonthlyRevenue}
                            </span>
                          )}
                        </div>

                        {/* Title */}
                        <h3 className="text-xs font-semibold text-[#222325] line-clamp-2 leading-snug">
                          {comp.title}
                        </h3>

                        {/* Ratings & Real Starting Price */}
                        <div className="flex items-center justify-between text-xs pt-2 border-t border-[#f5f5f5]">
                          <div className="flex items-center gap-1 text-[#222325] font-bold">
                            <Star className="w-3.5 h-3.5 fill-[#ffb33e] text-[#ffb33e]" />
                            <span>{comp.rating ? comp.rating.toFixed(1) : '5.0'}</span>
                            <span className="text-[#74767e] font-normal">({comp.reviewsCount} reviews)</span>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] text-[#74767e] block uppercase font-semibold">Starting at</span>
                            <span className="text-sm font-bold text-[#222325]">
                              ${comp.startingPrice > 0 ? comp.startingPrice : 35}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Card Action Footer */}
                    <div className="p-3 bg-[#fafafa] border-t border-[#efeff0] flex items-center justify-between gap-2">
                      <a
                        href={comp.gigUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] font-medium text-[#74767e] hover:text-[#222325] flex items-center gap-1"
                      >
                        <span>View on Fiverr</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>

                      <button
                        type="button"
                        onClick={() => handleAnalyzeTarget(comp.sellerName)}
                        className="fiverr-btn-green px-3 py-1.5 text-xs font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <span>Deep Gap Analysis</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
