import React, { useState, useEffect } from 'react';
import { Search, TrendingUp, DollarSign, Activity, Target, CheckCircle2, RefreshCw, GitBranch, Star, ExternalLink, Lightbulb } from 'lucide-react';

export const MarketResearchView: React.FC = () => {
  const [keywords, setKeywords] = useState('Full Stack AI Chatbots');
  const [loading, setLoading] = useState(false);
  const [research, setResearch] = useState<any>(null);
  const [liveIntelligence, setLiveIntelligence] = useState<any>(null);

  const fetchLiveSignals = async (query: string) => {
    try {
      const res = await fetch(`/api/v1/research/live?niche=${encodeURIComponent(query)}`);
      const json = await res.json();
      if (json.success && json.data) {
        setLiveIntelligence(json.data);
      }
    } catch (err) {
      console.warn('Live signals error:', err);
    }
  };

  useEffect(() => {
    fetchLiveSignals(keywords);
  }, []);

  const handleResearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      fetchLiveSignals(keywords);

      const res = await fetch('/api/v1/research/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ niche: keywords }),
      });
      const json = await res.json();
      if (json.success) {
        setResearch(json.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 text-[#222325]">
      {/* Search Header Card */}
      <div className="bg-white p-6 rounded-lg border border-[#dadbdd] space-y-4 shadow-sm">
        <div className="pb-3 border-b border-[#efeff0]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-[#1dbf73]/10 text-[#19a463] border border-[#1dbf73]/20 flex items-center gap-1">
                <Activity className="w-3 h-3 text-[#1dbf73]" />
                Real-Time Market Spy Engine
              </span>
              <span className="text-xs text-[#74767e]">
                Live Data &bull; Google Suggest &bull; Remote Feeds &bull; GitHub
              </span>
            </div>
            <h3 className="text-xl font-bold text-[#222325]">
              Autonomous Market Research & Trend Intelligence
            </h3>
            <p className="text-xs text-[#74767e]">
              Scans live search queries, real client remote jobs, and GitHub open-source repositories to uncover high-margin service niches.
            </p>
          </div>
        </div>

        <form onSubmit={handleResearch} className="space-y-3 pt-1">
          <div>
            <label className="block text-xs font-semibold text-[#404145] mb-1.5">
              Service Niche or Tech Stack to Investigate
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-[#74767e]" />
              <input
                type="text"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-[#dadbdd] rounded text-sm text-[#222325] focus:border-[#1dbf73] focus:outline-none"
                placeholder="e.g. AI Chatbot, Next.js, Python Web Scraping"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="fiverr-btn-green w-full py-3 px-6 rounded font-bold text-sm text-white flex items-center justify-center gap-2 shadow-xs transition-all disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Harvesting Real-Time Market Intelligence...
              </>
            ) : (
              <>
                <Target className="w-4 h-4" />
                Run Real-Time Live Niche Research
              </>
            )}
          </button>
        </form>
      </div>

      {/* LIVE MARKET SIGNALS BANNER (Google Suggest & Remote Feeds) */}
      {liveIntelligence && (
        <div className="bg-white p-6 rounded-lg border border-[#dadbdd] space-y-6 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-[#efeff0]">
            <div>
              <h4 className="text-base font-bold text-[#222325] flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#1dbf73]" />
                Live Real-World Signals for "{liveIntelligence.niche}"
              </h4>
              <p className="text-xs text-[#74767e]">
                Ground truth gathered from Google search suggestions, remote job boards, and developer activity.
              </p>
            </div>
            <span className="text-xs text-[#74767e]">
              Updated: {new Date(liveIntelligence.last_updated).toLocaleTimeString()}
            </span>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[#fafafa] p-4 rounded-lg border border-[#dadbdd]">
              <span className="text-[10px] font-bold text-[#74767e] uppercase tracking-wider">
                Live Buyer Demand Score
              </span>
              <div className="text-2xl font-bold text-[#19a463] mt-1 flex items-center gap-1.5">
                <TrendingUp className="w-5 h-5" />
                {liveIntelligence.opportunity_score}/100
              </div>
              <p className="text-xs text-[#74767e] mt-0.5">{liveIntelligence.market_demand_level}</p>
            </div>

            <div className="bg-[#fafafa] p-4 rounded-lg border border-[#dadbdd]">
              <span className="text-[10px] font-bold text-[#74767e] uppercase tracking-wider">
                Real Market Rates
              </span>
              <div className="text-2xl font-bold text-[#222325] mt-1 flex items-center gap-1.5">
                <DollarSign className="w-5 h-5 text-[#1dbf73]" />
                {liveIntelligence.salary_range?.avg}
              </div>
              <p className="text-xs text-[#74767e] mt-0.5">
                Range: {liveIntelligence.salary_range?.min} - {liveIntelligence.salary_range?.max}
              </p>
            </div>

            <div className="bg-[#fafafa] p-4 rounded-lg border border-[#dadbdd]">
              <span className="text-[10px] font-bold text-[#74767e] uppercase tracking-wider">
                Active Client Job Listings
              </span>
              <div className="text-2xl font-bold text-[#222325] mt-1 flex items-center gap-1.5">
                <Activity className="w-5 h-5 text-[#1dbf73]" />
                {liveIntelligence.active_jobs_count}+
              </div>
              <p className="text-xs text-[#74767e] mt-0.5">Verified open buyer/client briefs</p>
            </div>
          </div>

          {/* Real Buyer Intent Search Queries Cloud */}
          {liveIntelligence.buyer_search_keywords && liveIntelligence.buyer_search_keywords.length > 0 && (
            <div>
              <h5 className="text-xs font-bold text-[#222325] mb-2 flex items-center gap-1.5">
                <Search className="w-3.5 h-3.5 text-[#1dbf73]" />
                Real Live Buyer Search Queries (Google Suggest Live):
              </h5>
              <div className="flex flex-wrap gap-2">
                {liveIntelligence.buyer_search_keywords.map((kw: string, i: number) => (
                  <span
                    key={i}
                    className="fiverr-pill px-3 py-1.5 rounded-full bg-[#f5f5f5] border border-[#dadbdd] text-[#404145] text-xs font-medium flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3 h-3 text-[#1dbf73]" />
                    "{kw}"
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* GitHub Ecosystem Tools */}
          {liveIntelligence.github_ecosystem_tools && liveIntelligence.github_ecosystem_tools.length > 0 && (
            <div>
              <h5 className="text-xs font-bold text-[#222325] mb-3 flex items-center gap-1.5">
                <GitBranch className="w-3.5 h-3.5 text-[#1dbf73]" />
                Top GitHub Ecosystem Tools & Frameworks for this Niche:
              </h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {liveIntelligence.github_ecosystem_tools.slice(0, 4).map((tool: any, idx: number) => (
                  <a
                    key={idx}
                    href={tool.url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-3.5 rounded-lg bg-[#fafafa] border border-[#dadbdd] hover:border-[#1dbf73] transition-all flex items-start justify-between gap-3 group"
                  >
                    <div className="space-y-1">
                      <div className="text-xs font-bold text-[#222325] group-hover:text-[#1dbf73] transition-colors flex items-center gap-1.5">
                        <span>{tool.name}</span>
                        <ExternalLink className="w-3 h-3 text-[#74767e]" />
                      </div>
                      <p className="text-xs text-[#62646a] line-clamp-2">{tool.description}</p>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-white text-[#404145] border border-[#dadbdd] font-semibold flex items-center gap-1 shrink-0">
                      <Star className="w-3 h-3 fill-[#ffb33e] text-[#ffb33e]" />
                      {tool.stars.toLocaleString()}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* AI STRATEGIC DEEP DIVE (Grounded in Real Signals) */}
      {research && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-400">
          <div className="bg-white p-6 rounded-lg border border-[#dadbdd] space-y-6 shadow-sm">
            <h4 className="text-base font-bold text-[#222325] flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-[#1dbf73]" />
              Strategic Niche Deep Dive & Actionable Differentiation
            </h4>

            {/* Market Gaps & Unserved Angles */}
            {research.unserved_market_gaps && (
              <div className="space-y-2">
                <span className="text-xs font-semibold text-[#74767e]">
                  High-Margin Market Gaps to Exploit:
                </span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {research.unserved_market_gaps.map((gap: string, i: number) => (
                    <div
                      key={i}
                      className="p-3.5 rounded-lg bg-[#1dbf73]/5 border border-[#1dbf73]/20 text-xs text-[#404145] flex items-start gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4 text-[#1dbf73] shrink-0 mt-0.5" />
                      <span>{gap}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommended High-Ticket Angles */}
            {research.recommended_gig_angles && (
              <div className="space-y-2">
                <span className="text-xs font-semibold text-[#74767e]">
                  Recommended High-Converting Gig Hooks:
                </span>
                <div className="space-y-2">
                  {research.recommended_gig_angles.map((angle: string, i: number) => (
                    <div
                      key={i}
                      className="p-3.5 rounded-lg bg-[#fafafa] border border-[#dadbdd] text-xs text-[#404145] flex items-start gap-2"
                    >
                      <span className="text-[#1dbf73] font-bold">{i + 1}.</span>
                      <span>{angle}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
