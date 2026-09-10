import React, { useState, useEffect } from 'react';
import {
  Copy,
  Check,
  Clock,
  CheckCircle2,
  RefreshCw,
  Zap,
  ShieldCheck,
  CheckSquare,
  Square,
  SlidersHorizontal,
  ChevronRight,
  Play,
  CheckCheck,
  ArrowRight,
  Info,
  Download,
  X,
  Sparkles,
  Coins
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export interface BuyerBriefItem {
  id: string;
  fiverrBriefId?: string;
  clientTitle: string;
  description: string;
  budget: string;
  urgencyText?: string;
  urgencyDays?: number;
  skills: string[];
  clientCountry?: string;
  source?: string;
  status: 'new' | 'reviewed' | 'applied' | 'dismissed';
  matchScore?: number;
  matchedGigTitle?: string;
  appliedProposal?: {
    pitchText: string;
    offeredPrice: number;
    deliveryDays: number;
    appliedAt: string;
    safetyGapSeconds?: number;
  };
}

export interface GeneratedBatchProposal {
  briefId: string;
  matchedGigId?: string | number;
  matchedGigTitle: string;
  matchScore: number;
  offeredPrice: number;
  deliveryDays: number;
  proposalText: string;
  painPointsAddressed: string[];
  recommendedDeliverables: string[];
  safetyGapSeconds: number;
}

export const BuyerBriefView: React.FC = () => {
  const { user, userContext } = useAuth();

  // Briefs list state
  const [briefs, setBriefs] = useState<BuyerBriefItem[]>([]);
  const [loadingBriefs, setLoadingBriefs] = useState(false);
  const [selectedBriefIds, setSelectedBriefIds] = useState<string[]>([]);
  const [activeFilter, setActiveFilter] = useState<'all' | 'new' | 'applied'>('all');

  // Strategy & Safety Settings
  const [safetyGapSeconds, setSafetyGapSeconds] = useState<number>(30);
  const [selectedTone, setSelectedTone] = useState<'consultative' | 'closer' | 'rapid'>('consultative');
  const [priceStrategy, setPriceStrategy] = useState<'match_budget' | 'anchor_premium' | 'value_starter'>('match_budget');

  // Batch Proposal & Dispatch Modal states
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [generatingProposals, setGeneratingProposals] = useState(false);
  const [batchProposals, setBatchProposals] = useState<GeneratedBatchProposal[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Safe Dispatch Queue states
  const [isDispatching, setIsDispatching] = useState(false);
  const [dispatchIndex, setDispatchIndex] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const [dispatchCompleted, setDispatchCompleted] = useState(false);

  // Extension Guide Modal
  const [isExtModalOpen, setIsExtModalOpen] = useState(false);

  // Fetch active briefs from backend
  const fetchBriefs = async () => {
    setLoadingBriefs(true);
    try {
      const token = localStorage.getItem('fg_token');
      const res = await fetch('/api/v1/briefs', {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setBriefs(json.data);
      }
    } catch (err) {
      console.warn('Failed to load briefs:', err);
    } finally {
      setLoadingBriefs(false);
    }
  };

  useEffect(() => {
    fetchBriefs();
  }, []);

  // Filtered briefs
  const filteredBriefs = briefs.filter((b) => {
    if (activeFilter === 'new') return b.status === 'new';
    if (activeFilter === 'applied') return b.status === 'applied';
    return true;
  });

  // Toggle single brief selection
  const handleToggleSelect = (id: string) => {
    setSelectedBriefIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Toggle select all filtered
  const handleToggleSelectAll = () => {
    const unappliedIds = filteredBriefs.filter((b) => b.status !== 'applied').map((b) => b.id);
    if (selectedBriefIds.length >= unappliedIds.length && unappliedIds.length > 0) {
      setSelectedBriefIds([]);
    } else {
      setSelectedBriefIds(unappliedIds);
    }
  };

  // Trigger proposal generation for selected briefs
  const handleGenerateBatchProposals = async (targetIds = selectedBriefIds) => {
    if (targetIds.length === 0) return;

    setGeneratingProposals(true);
    setIsReviewModalOpen(true);
    setDispatchCompleted(false);
    setDispatchIndex(0);

    try {
      const token = localStorage.getItem('fg_token');
      const res = await fetch('/api/v1/briefs/generate-batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          briefIds: targetIds,
          strategy: {
            tone: selectedTone,
            priceStrategy,
            safetyGapSeconds,
          },
        }),
      });

      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setBatchProposals(json.data);
      }
    } catch (err) {
      console.error('Failed to generate batch proposals:', err);
    } finally {
      setGeneratingProposals(false);
    }
  };

  // Quick single brief pitch
  const handleQuickSinglePitch = (briefId: string) => {
    setSelectedBriefIds([briefId]);
    handleGenerateBatchProposals([briefId]);
  };

  // Edit proposal text inline in review modal
  const handleUpdateProposalText = (briefId: string, newText: string) => {
    setBatchProposals((prev) =>
      prev.map((p) => (p.briefId === briefId ? { ...p, proposalText: newText } : p))
    );
  };

  // Copy single proposal to clipboard
  const handleCopyProposal = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Safe Dispatch Sequence Execution
  const handleStartSafeDispatch = async () => {
    if (batchProposals.length === 0 || isDispatching) return;

    setIsDispatching(true);
    setDispatchIndex(0);

    for (let i = 0; i < batchProposals.length; i++) {
      setDispatchIndex(i);
      const prop = batchProposals[i];

      // 1. Submit proposal record to backend
      try {
        const token = localStorage.getItem('fg_token');
        await fetch('/api/v1/briefs/apply', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            briefId: prop.briefId,
            pitchText: prop.proposalText,
            targetGigTitle: prop.matchedGigTitle,
            offeredPrice: prop.offeredPrice,
            deliveryDays: prop.deliveryDays,
            safetyGapSeconds,
          }),
        });

        // Update local status
        setBriefs((prev) =>
          prev.map((b) =>
            b.id === prop.briefId
              ? {
                  ...b,
                  status: 'applied',
                  appliedProposal: {
                    pitchText: prop.proposalText,
                    offeredPrice: prop.offeredPrice,
                    deliveryDays: prop.deliveryDays,
                    appliedAt: new Date().toISOString(),
                    safetyGapSeconds,
                  },
                }
              : b
          )
        );
      } catch (err) {
        console.error('Error applying to brief:', err);
      }

      // 2. If there are more proposals remaining in this batch, execute the safety delay!
      if (i < batchProposals.length - 1) {
        // Randomized human jitter: safetyGapSeconds ± 3 seconds
        const jitteredGap = Math.max(
          10,
          safetyGapSeconds + Math.floor(Math.random() * 6 - 3)
        );

        for (let sec = jitteredGap; sec > 0; sec--) {
          setCountdown(sec);
          await new Promise((r) => setTimeout(r, 1000));
        }
        setCountdown(0);
      }
    }

    setIsDispatching(false);
    setDispatchCompleted(true);
  };

  return (
    <div className="space-y-6 text-[#222325] font-sans pb-12">
      {/* ─── 1. Safe Zone & Anti-Ban Architecture Banner ─── */}
      <div className="bg-gradient-to-r from-[#f0fdf4] to-white border border-[#bbf7d0] rounded-xl p-5 md:p-6 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[#1dbf73] text-white flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                Zero-Ban Safe Zone
              </span>
              <span className="text-xs text-[#166534] font-semibold">
                ● Natural Residential Session Protected
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-[#222325]">
              Buyer Briefs & Inbound Opportunity Dispatcher
            </h1>
            <p className="text-xs md:text-sm text-[#74767e]">
              Review matched Fiverr briefs, select exactly which clients to pitch, and dispatch AI-tailored offers with human safety gaps.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setIsExtModalOpen(true)}
              className="bg-white border border-[#dadbdd] hover:border-[#1dbf73] text-[#222325] px-3.5 py-2 rounded text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-[#1dbf73]" />
              <span>Companion Extension</span>
            </button>
            <button
              type="button"
              onClick={fetchBriefs}
              disabled={loadingBriefs}
              className="fiverr-btn-green px-4 py-2 text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingBriefs ? 'animate-spin' : ''}`} />
              <span>Refresh Briefs</span>
            </button>
          </div>
        </div>

        {/* Profile Context Grounding */}
        <div className="pt-3 border-t border-[#e2f7ea] flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-[#1dbf73]/20 text-[#166534] flex items-center justify-center font-bold text-xs">
              {userContext?.profile?.name?.charAt(0) || user?.username?.charAt(0) || 'F'}
            </div>
            <span className="font-semibold text-[#222325]">
              Pitching as: {userContext?.profile?.name || user?.username || 'Verified Seller'}
            </span>
            <span className="text-[#74767e]">
              ({userContext?.primarySkills?.slice(0, 3).join(', ') || 'Full Stack, AI Agents'})
            </span>
          </div>

          <div className="flex items-center gap-4 text-[#74767e]">
            <span>
              <strong>Matching Catalog:</strong>{' '}
              {userContext?.fiverrProfile?.gigs?.length || 1} Live Gig
            </span>
            <span>
              <strong>Total Matched:</strong> {briefs.length} Opportunities
            </span>
          </div>
        </div>
      </div>

      {/* ─── 2. Selective Batch Controls & Safety Interval Toolbar ─── */}
      <div className="bg-white border border-[#dadbdd] rounded-xl p-4 md:p-5 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Status Filters */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1.5 rounded text-xs font-bold transition-colors cursor-pointer ${
                activeFilter === 'all'
                  ? 'bg-[#222325] text-white'
                  : 'bg-[#f5f5f5] text-[#404145] hover:bg-[#e4e5e7]'
              }`}
            >
              All Briefs ({briefs.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('new')}
              className={`px-3 py-1.5 rounded text-xs font-bold transition-colors cursor-pointer ${
                activeFilter === 'new'
                  ? 'bg-[#1dbf73] text-white'
                  : 'bg-[#f0fdf4] text-[#166534] hover:bg-[#dcfce7]'
              }`}
            >
              New Unpitched ({briefs.filter((b) => b.status === 'new').length})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('applied')}
              className={`px-3 py-1.5 rounded text-xs font-bold transition-colors cursor-pointer ${
                activeFilter === 'applied'
                  ? 'bg-[#2563eb] text-white'
                  : 'bg-[#eff6ff] text-[#1e40af] hover:bg-[#dbeafe]'
              }`}
            >
              Applied History ({briefs.filter((b) => b.status === 'applied').length})
            </button>
          </div>

          {/* Selection counter & Quick toggle */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleToggleSelectAll}
              className="text-xs font-semibold text-[#1dbf73] hover:underline flex items-center gap-1.5 cursor-pointer"
            >
              {selectedBriefIds.length > 0 ? (
                <CheckSquare className="w-4 h-4" />
              ) : (
                <Square className="w-4 h-4" />
              )}
              <span>
                {selectedBriefIds.length > 0
                  ? `Deselect All (${selectedBriefIds.length})`
                  : 'Select All Unpitched'}
              </span>
            </button>
          </div>
        </div>

        {/* Safety Gap & Strategy Parameters */}
        <div className="pt-3 border-t border-[#efeff0] flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4 text-xs">
            {/* Safety Gap Setting */}
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-[#1dbf73]" />
              <span className="font-bold text-[#404145]">Anti-Bot Safety Gap:</span>
              <select
                value={safetyGapSeconds}
                onChange={(e) => setSafetyGapSeconds(Number(e.target.value))}
                className="bg-[#fafafa] border border-[#dadbdd] rounded px-2.5 py-1 text-xs text-[#222325] font-semibold focus:outline-none focus:border-[#1dbf73]"
              >
                <option value={40}>Cautious (35s - 45s human delay) [Safest]</option>
                <option value={25}>Standard (20s - 30s human delay)</option>
                <option value={15}>Brisk (15s minimum delay)</option>
              </select>
            </div>

            {/* Strategy Tone */}
            <div className="flex items-center gap-1.5">
              <SlidersHorizontal className="w-4 h-4 text-[#74767e]" />
              <span className="font-bold text-[#404145]">Pitch Tone:</span>
              <select
                value={selectedTone}
                onChange={(e) => setSelectedTone(e.target.value as any)}
                className="bg-[#fafafa] border border-[#dadbdd] rounded px-2.5 py-1 text-xs text-[#222325] font-semibold focus:outline-none focus:border-[#1dbf73]"
              >
                <option value="consultative">Consultative Tech Partner (High Trust)</option>
                <option value="closer">Direct ROI Closer (High Conversion)</option>
                <option value="rapid">Rapid Turnaround Specialist (Speed)</option>
              </select>
            </div>

            {/* Price Strategy */}
            <div className="flex items-center gap-1.5">
              <Coins className="w-4 h-4 text-[#74767e]" />
              <span className="font-bold text-[#404145]">Pricing:</span>
              <select
                value={priceStrategy}
                onChange={(e) => setPriceStrategy(e.target.value as any)}
                className="bg-[#fafafa] border border-[#dadbdd] rounded px-2.5 py-1 text-xs text-[#222325] font-semibold focus:outline-none focus:border-[#1dbf73]"
              >
                <option value="match_budget">Match Stated Budget</option>
                <option value="anchor_premium">Anchor Premium (+25%)</option>
                <option value="value_starter">Competitive Entry (-15%)</option>
              </select>
            </div>
          </div>

          {/* Action Trigger */}
          <button
            type="button"
            onClick={() => handleGenerateBatchProposals()}
            disabled={selectedBriefIds.length === 0 || generatingProposals}
            className="fiverr-btn-green px-5 py-2 text-xs md:text-sm font-bold flex items-center gap-2 cursor-pointer disabled:opacity-50 shadow-xs"
          >
            {generatingProposals ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Synthesizing Proposals...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>
                  Generate Pitch for Selected ({selectedBriefIds.length})
                </span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* ─── 3. Inbound Briefs Stream ─── */}
      {loadingBriefs ? (
        <div className="bg-white border border-[#dadbdd] rounded-xl p-12 text-center space-y-3">
          <RefreshCw className="w-6 h-6 text-[#1dbf73] animate-spin mx-auto" />
          <p className="text-xs font-bold text-[#222325]">
            Loading matched buyer briefs from database & live sync...
          </p>
        </div>
      ) : filteredBriefs.length === 0 ? (
        <div className="bg-white border border-[#dadbdd] rounded-xl p-12 text-center space-y-3">
          <Info className="w-8 h-8 text-[#74767e] mx-auto" />
          <h3 className="text-base font-bold text-[#222325]">No briefs in this view</h3>
          <p className="text-xs text-[#74767e] max-w-md mx-auto">
            Sync your briefs via the Chrome companion extension while browsing Fiverr, or switch to "All Briefs" above.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredBriefs.map((brief) => {
            const isSelected = selectedBriefIds.includes(brief.id);
            const isApplied = brief.status === 'applied';

            return (
              <div
                key={brief.id}
                className={`bg-white rounded-xl border transition-all flex flex-col justify-between overflow-hidden shadow-xs hover:shadow-sm ${
                  isSelected
                    ? 'border-[#1dbf73] ring-1 ring-[#1dbf73]/30'
                    : isApplied
                    ? 'border-[#bfdbfe] bg-[#fafcff]'
                    : 'border-[#dadbdd] hover:border-[#bbf7d0]'
                }`}
              >
                {/* Brief Header */}
                <div className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      {!isApplied ? (
                        <button
                          type="button"
                          onClick={() => handleToggleSelect(brief.id)}
                          className="mt-0.5 text-[#74767e] hover:text-[#1dbf73] cursor-pointer"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-5 h-5 text-[#1dbf73]" />
                          ) : (
                            <Square className="w-5 h-5" />
                          )}
                        </button>
                      ) : (
                        <CheckCheck className="w-5 h-5 text-[#2563eb] mt-0.5" />
                      )}

                      <div className="space-y-0.5">
                        <h3 className="text-sm font-bold text-[#222325] leading-snug line-clamp-2">
                          {brief.clientTitle}
                        </h3>
                        <div className="flex items-center gap-2 text-xs text-[#74767e]">
                          <span>{brief.clientCountry || 'International'}</span>
                          <span>•</span>
                          <span>Timeline: {brief.urgencyText || '48 Hours'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Status / Budget pill */}
                    <div className="text-right shrink-0">
                      <span className="text-[10px] uppercase font-bold text-[#74767e] block">
                        Budget
                      </span>
                      <span className="text-sm font-extrabold text-[#1dbf73]">
                        {brief.budget || 'Flexible'}
                      </span>
                    </div>
                  </div>

                  {/* AI Gig Match Pill */}
                  <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-[#f8fafc] border border-[#e2e8f0] text-xs">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Zap className="w-3.5 h-3.5 text-[#1dbf73] shrink-0" />
                      <span className="text-[#475569] font-medium truncate">
                        Matched: {brief.matchedGigTitle || 'Custom Full Stack Service'}
                      </span>
                    </div>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#e0f2fe] text-[#0369a1] shrink-0">
                      {brief.matchScore || 95}% Match
                    </span>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-[#404145] leading-relaxed line-clamp-3">
                    {brief.description}
                  </p>

                  {/* Skills tags */}
                  {brief.skills && brief.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {brief.skills.slice(0, 4).map((skill, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded text-[10px] font-medium bg-[#f5f5f5] text-[#404145] border border-[#e4e5e7]"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Card Action Footer */}
                <div className="p-3 bg-[#fafafa] border-t border-[#efeff0] flex items-center justify-between gap-2">
                  <div className="text-[11px] text-[#74767e]">
                    {isApplied ? (
                      <span className="text-[#2563eb] font-bold flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        Pitched (${brief.appliedProposal?.offeredPrice})
                      </span>
                    ) : (
                      <span>Unpitched Opportunity</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleQuickSinglePitch(brief.id)}
                      className="fiverr-btn-green px-3 py-1.5 text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <span>{isApplied ? 'Re-Pitch' : 'Pitch Brief'}</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── 4. Batch Proposal Review & Safe Dispatch Queue Modal ─── */}
      {isReviewModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#dadbdd] rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-[#efeff0] flex items-center justify-between bg-[#fafafa]">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-[#222325]">
                    Review & Safe Dispatch Queue ({batchProposals.length} Proposals)
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-[#f0fdf4] text-[#166534] border border-[#bbf7d0]">
                    {safetyGapSeconds}s Human Gap Delay Active
                  </span>
                </div>
                <p className="text-xs text-[#74767e]">
                  Inspect, customize, and safely dispatch proposals to client briefs without triggering spam flags.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsReviewModalOpen(false)}
                className="text-[#74767e] hover:text-[#222325] p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: Proposals List */}
            <div className="p-5 overflow-y-auto space-y-6 flex-1">
              {generatingProposals ? (
                <div className="py-16 text-center space-y-3">
                  <RefreshCw className="w-8 h-8 text-[#1dbf73] animate-spin mx-auto" />
                  <h3 className="text-sm font-bold text-[#222325]">
                    Synthesizing Custom Proposals with Gemini AI...
                  </h3>
                  <p className="text-xs text-[#74767e]">
                    Grounding each pitch in your gig packages and client requirements.
                  </p>
                </div>
              ) : batchProposals.length === 0 ? (
                <div className="py-12 text-center text-xs text-[#74767e]">
                  No proposals generated.
                </div>
              ) : (
                batchProposals.map((prop, index) => {
                  const brief = briefs.find((b) => b.id === prop.briefId);
                  const isCurrentDispatch = isDispatching && dispatchIndex === index;
                  const isAlreadyDispatched = dispatchCompleted || (isDispatching && dispatchIndex > index);

                  return (
                    <div
                      key={prop.briefId}
                      className={`border rounded-xl p-4 space-y-3 transition-all ${
                        isCurrentDispatch
                          ? 'border-[#1dbf73] bg-[#f0fdf4]/30 ring-2 ring-[#1dbf73]/20'
                          : isAlreadyDispatched
                          ? 'border-[#bbf7d0] bg-[#fafcff]'
                          : 'border-[#dadbdd]'
                      }`}
                    >
                      {/* Brief Title & Matched Details */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#efeff0]">
                        <div>
                          <span className="text-[10px] font-bold text-[#74767e] uppercase">
                            Target Brief #{index + 1}
                          </span>
                          <h4 className="text-xs font-bold text-[#222325]">
                            {brief?.clientTitle || 'Client Project'}
                          </h4>
                        </div>

                        <div className="flex items-center gap-3 text-xs">
                          <span className="text-[#166534] font-bold bg-[#f0fdf4] px-2 py-0.5 rounded border border-[#bbf7d0]">
                            Offer: ${prop.offeredPrice}
                          </span>
                          <span className="text-[#475569] font-medium">
                            {prop.deliveryDays} Days
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyProposal(prop.briefId, prop.proposalText)}
                            className="text-xs font-bold text-[#1dbf73] hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            {copiedId === prop.briefId ? (
                              <Check className="w-3.5 h-3.5 text-[#166534]" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                            <span>{copiedId === prop.briefId ? 'Copied' : 'Copy'}</span>
                          </button>
                        </div>
                      </div>

                      {/* Pitch Text Area */}
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-[#404145] block">
                          Tailored Pitch Message (Editable):
                        </label>
                        <textarea
                          rows={5}
                          value={prop.proposalText}
                          onChange={(e) => handleUpdateProposalText(prop.briefId, e.target.value)}
                          disabled={isDispatching}
                          className="w-full p-3 border border-[#dadbdd] rounded-lg text-xs font-sans text-[#222325] leading-relaxed focus:border-[#1dbf73] focus:outline-none focus:ring-1 focus:ring-[#1dbf73] transition-colors"
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer & Dispatch Controls */}
            <div className="p-4 border-t border-[#efeff0] bg-[#fafafa] flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs text-[#74767e]">
                {isDispatching ? (
                  <div className="flex items-center gap-2 text-[#166534] font-bold">
                    <RefreshCw className="w-4 h-4 animate-spin text-[#1dbf73]" />
                    <span>
                      Dispatching #{dispatchIndex + 1} of {batchProposals.length}...
                      {countdown > 0 && ` (Safety Gap Delay: ${countdown}s remaining)`}
                    </span>
                  </div>
                ) : dispatchCompleted ? (
                  <div className="flex items-center gap-1 text-[#166534] font-bold">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>All selected proposals dispatched safely!</span>
                  </div>
                ) : (
                  <span>
                    Queue will dispatch with randomized <strong>{safetyGapSeconds}s</strong> human delays.
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsReviewModalOpen(false)}
                  disabled={isDispatching}
                  className="px-4 py-2 text-xs font-semibold text-[#74767e] hover:text-[#222325] cursor-pointer"
                >
                  Close
                </button>

                {!dispatchCompleted && (
                  <button
                    type="button"
                    onClick={handleStartSafeDispatch}
                    disabled={isDispatching || batchProposals.length === 0}
                    className="fiverr-btn-green px-5 py-2 text-xs font-bold flex items-center gap-2 cursor-pointer disabled:opacity-50 shadow-xs"
                  >
                    <Play className="w-3.5 h-3.5 fill-white" />
                    <span>Start Safe Dispatch Queue</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── 5. Companion Extension Installation Modal ─── */}
      {isExtModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#dadbdd] rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#f0fdf4] text-[#1dbf73] border border-[#bbf7d0] flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#222325]">
                    FiverrGrowth Companion Extension
                  </h3>
                  <p className="text-xs text-[#74767e]">
                    Runs in your browser on your home residential IP
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsExtModalOpen(false)}
                className="text-[#74767e] hover:text-[#222325] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-[#f8fafc] p-4 rounded-xl border border-[#e2e8f0] space-y-2 text-xs text-[#334155]">
              <p className="font-bold text-[#0f172a]">
                Quick 30-Second Chrome Installation:
              </p>
              <ol className="list-decimal pl-4 space-y-1.5 leading-relaxed">
                <li>
                  Open Chrome and go to: <code>chrome://extensions</code>
                </li>
                <li>
                  Toggle ON <strong>"Developer mode"</strong> in the top-right corner.
                </li>
                <li>
                  Click the <strong>"Load unpacked"</strong> button in the top-left.
                </li>
                <li>
                  Select the extension directory on your machine:
                  <div className="mt-1 p-2 bg-white rounded border border-[#cbd5e1] font-mono text-[11px] select-all break-all">
                    C:\Users\hp-new\Desktop\fiverr-growth\extension
                  </div>
                </li>
                <li>
                  Visit your Fiverr dashboard to automatically sync incoming briefs!
                </li>
              </ol>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setIsExtModalOpen(false)}
                className="fiverr-btn-green px-4 py-2 text-xs font-bold cursor-pointer"
              >
                Got It, Ready to Work
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
