import React, { useState, useEffect, useRef } from 'react';
import { Send, Copy, Check, Clock, DollarSign, Award, UserCheck, CheckCircle2, Radio, ExternalLink, Briefcase, RefreshCw, Zap } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const BuyerBriefView: React.FC = () => {
  const { user, userContext } = useAuth();

  const [briefText, setBriefText] = useState('');
  const [budget, setBudget] = useState('');
  const [urgency, setUrgency] = useState('24 Hours');
  const [skills, setSkills] = useState(
    userContext?.profile?.skills?.join(', ') || 'Next.js, React, Node.js, Python'
  );
  const [loading, setLoading] = useState(false);
  const [proposal, setProposal] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  // Live client briefs
  const [liveBriefs, setLiveBriefs] = useState<any[]>([]);
  const [loadingLive, setLoadingLive] = useState(false);
  const [selectedTag, setSelectedTag] = useState('developer');

  const formRef = useRef<HTMLDivElement>(null);

  const fetchLiveBriefs = async (tag: string) => {
    setLoadingLive(true);
    try {
      const res = await fetch(`/api/v1/briefs/live?tag=${tag}&limit=6`);
      const json = await res.json();
      if (json.success && json.data) {
        setLiveBriefs(json.data);
      }
    } catch (err) {
      console.warn('Failed to load remote live briefs:', err);
    } finally {
      setLoadingLive(false);
    }
  };

  useEffect(() => {
    fetchLiveBriefs(selectedTag);
  }, [selectedTag]);

  const handleSelectLiveBrief = (item: any) => {
    setBriefText(`${item.client_title}\n\n${item.description}`);
    if (item.budget && item.budget !== 'Flexible / Hourly') {
      setBudget(item.budget);
    }
    if (item.skills && item.skills.length > 0) {
      setSkills(item.skills.join(', '));
    }
    if (formRef.current) {
      formRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handlePropose = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/v1/briefs/propose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user?.id,
          brief_text: briefText,
          buyer_budget: budget,
          timeline_urgency: urgency,
          freelancer_skills: skills,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setProposal(json.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const copyProposal = () => {
    if (proposal?.proposal_text) {
      navigator.clipboard.writeText(proposal.proposal_text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const filterTags = ['developer', 'python', 'react', 'fullstack', 'ai'];

  return (
    <div className="space-y-6 text-[#222325]">
      {/* Context Grounding Indicator */}
      {userContext?.profile && (
        <div className="bg-white p-4 rounded-lg border border-[#1dbf73]/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#1dbf73]/10 text-[#1dbf73] flex items-center justify-center shrink-0">
              <UserCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#222325]">
                  Pitching as: {userContext.profile.name || user?.username}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#1dbf73]/10 text-[#19a463] font-bold">
                  Profile Grounded
                </span>
              </div>
              <p className="text-xs text-[#74767e]">
                {userContext.profile.fiverr_profile_url
                  ? `Portfolio Linked: ${userContext.profile.fiverr_profile_url}`
                  : 'Tailored using verified skills & positioning'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-[#19a463] font-bold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Zero Generic Fluff &bull; Real Stats
          </div>
        </div>
      )}

      {/* REAL LIVE CLIENT BRIEFS / JOBS FEED */}
      <div className="bg-white p-6 rounded-lg border border-[#dadbdd] space-y-4 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 pb-3 border-b border-[#efeff0]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-[#1dbf73]/10 text-[#19a463] border border-[#1dbf73]/20">
                <Radio className="w-3 h-3 text-[#1dbf73] animate-pulse" />
                Live Client Feed (Real-Time External Feeds)
              </span>
              <span className="text-xs text-[#74767e]">
                {liveBriefs.length} Active Opportunities Found
              </span>
            </div>
            <h3 className="text-xl font-bold text-[#222325]">
              Verified Real-World Client Projects & Buyer Briefs
            </h3>
            <p className="text-xs text-[#74767e]">
              Real projects posted by hiring companies worldwide. Click any card to instantly import and generate a winning customized pitch.
            </p>
          </div>

          {/* Filter pills & refresh */}
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-[#f5f5f5] p-1 rounded-lg border border-[#dadbdd] gap-1">
              {filterTags.map((t) => (
                <button
                  key={t}
                  onClick={() => setSelectedTag(t)}
                  className={`text-[11px] px-2.5 py-1 rounded font-bold uppercase transition-all cursor-pointer ${
                    selectedTag === t
                      ? 'bg-white text-[#1dbf73] shadow-xs'
                      : 'text-[#74767e] hover:text-[#222325]'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            <button
              onClick={() => fetchLiveBriefs(selectedTag)}
              disabled={loadingLive}
              title="Refresh Live Feed"
              className="p-2 rounded-lg bg-[#f5f5f5] hover:bg-[#e4e5e7] text-[#404145] border border-[#dadbdd] transition-all cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingLive ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Live Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
          {liveBriefs.map((item) => (
            <div
              key={item.id}
              className="bg-white p-4 rounded-lg border border-[#dadbdd] hover:border-[#1dbf73] transition-all flex flex-col justify-between space-y-3 group shadow-xs"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[#1dbf73] flex items-center gap-1">
                    <Briefcase className="w-3 h-3" />
                    {item.company}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-[#f5f5f5] text-[#404145] font-semibold text-[11px] border border-[#dadbdd]">
                    {item.budget}
                  </span>
                </div>

                <h4 className="text-xs font-bold text-[#222325] group-hover:text-[#1dbf73] transition-colors line-clamp-2">
                  {item.client_title}
                </h4>

                <p className="text-xs text-[#62646a] line-clamp-3 leading-relaxed">
                  {item.description}
                </p>

                {item.skills && item.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {item.skills.slice(0, 3).map((s: string, i: number) => (
                      <span
                        key={i}
                        className="text-[10px] px-2 py-0.5 rounded-full bg-[#f5f5f5] text-[#404145] border border-[#dadbdd]"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-[#efeff0] flex items-center justify-between gap-2">
                <a
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-[#74767e] hover:text-[#1dbf73] flex items-center gap-1"
                >
                  <span>Client Link</span>
                  <ExternalLink className="w-3 h-3" />
                </a>

                <button
                  onClick={() => handleSelectLiveBrief(item)}
                  className="fiverr-btn-green px-3 py-1 rounded text-xs font-bold flex items-center gap-1 shadow-xs cursor-pointer"
                >
                  <Zap className="w-3 h-3" />
                  Pitch This Brief
                </button>
              </div>
            </div>
          ))}

          {liveBriefs.length === 0 && !loadingLive && (
            <div className="col-span-full py-8 text-center text-xs text-[#74767e]">
              No live briefs currently loaded. Click Refresh to query remote APIs.
            </div>
          )}
        </div>
      </div>

      {/* Input Card */}
      <div ref={formRef} className="bg-white p-6 rounded-lg border border-[#dadbdd] shadow-sm space-y-4">
        <div className="pb-3 border-b border-[#efeff0]">
          <h3 className="text-xl font-bold text-[#222325] flex items-center gap-2">
            <Send className="w-5 h-5 text-[#1dbf73]" />
            AI Proposal & Pitch Synthesizer
          </h3>
          <p className="text-xs text-[#74767e] mt-0.5">
            Selected live project or pasted Fiverr buyer brief. The AI extracts the buyer's unspoken fears and crafts a high-converting pitch in seconds.
          </p>
        </div>

        <form onSubmit={handlePropose} className="space-y-4 pt-1">
          <div>
            <label className="block text-xs font-semibold text-[#404145] mb-1.5 flex items-center justify-between">
              <span>Client Buyer Brief / Project Scope</span>
              <span className="text-xs text-[#19a463] font-bold">Auto-Filled from Live Feed or Custom</span>
            </label>
            <textarea
              rows={4}
              value={briefText}
              onChange={(e) => setBriefText(e.target.value)}
              className="w-full p-3.5 border border-[#dadbdd] rounded text-xs text-[#222325] focus:border-[#1dbf73] focus:outline-none resize-none"
              placeholder="Paste the buyer's post or pick a live brief from above..."
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#404145] mb-1.5">
                Stated Buyer Budget
              </label>
              <input
                type="text"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                className="w-full px-3 py-2 border border-[#dadbdd] rounded text-xs text-[#222325] focus:border-[#1dbf73] focus:outline-none"
                placeholder="e.g. $150 or Not specified"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#404145] mb-1.5">
                Urgency / Timeline
              </label>
              <input
                type="text"
                value={urgency}
                onChange={(e) => setUrgency(e.target.value)}
                className="w-full px-3 py-2 border border-[#dadbdd] rounded text-xs text-[#222325] focus:border-[#1dbf73] focus:outline-none"
                placeholder="e.g. 24 Hours / 2 Days"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#404145] mb-1.5">
                Your Core Relevant Skills
              </label>
              <input
                type="text"
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
                className="w-full px-3 py-2 border border-[#dadbdd] rounded text-xs text-[#222325] focus:border-[#1dbf73] focus:outline-none"
                placeholder="e.g. Python, Playwright, Scrapy"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="fiverr-btn-green w-full py-3 px-6 rounded font-bold text-sm text-white flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Synthesizing Custom Proposal from Real Data...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Synthesize Winning Proposal
              </>
            )}
          </button>
        </form>
      </div>

      {/* Proposal Output */}
      {proposal && (
        <div className="bg-white p-6 rounded-lg border border-[#1dbf73]/40 space-y-5 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-400">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-[#efeff0]">
            <div>
              <span className="text-xs font-bold text-[#1dbf73] uppercase tracking-wider">
                Tailored Winning Pitch
              </span>
              <h3 className="text-xl font-bold text-[#222325] mt-0.5">
                Ready to Submit to Buyer Brief
              </h3>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1dbf73]/10 border border-[#1dbf73]/20 text-xs text-[#19a463] font-bold">
                <DollarSign className="w-4 h-4" /> Bid: ${proposal.suggested_bid_usd}
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#f5f5f5] border border-[#dadbdd] text-xs text-[#404145] font-semibold">
                <Clock className="w-4 h-4 text-[#74767e]" /> {proposal.recommended_delivery_days} Days
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#f5f5f5] border border-[#dadbdd] text-xs text-[#404145] font-semibold">
                <Award className="w-4 h-4 text-[#ffb33e]" /> Match: {Math.round(proposal.confidence_score * 100)}%
              </div>
            </div>
          </div>

          <div className="relative">
            <pre className="bg-[#fafafa] p-5 rounded-lg text-sm text-[#222325] whitespace-pre-wrap font-sans border border-[#dadbdd] leading-relaxed">
              {proposal.proposal_text}
            </pre>
            <button
              onClick={copyProposal}
              className="fiverr-btn-green absolute top-3 right-3 px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied to Clipboard!' : 'Copy Proposal'}
            </button>
          </div>

          <div className="p-3 rounded-lg bg-[#f5f5f5] border border-[#dadbdd] text-xs text-[#74767e] flex items-center justify-between">
            <span>
              <strong className="text-[#222325]">Psychological Hook Used:</strong> {proposal.key_selling_hook}
            </span>
            <span className="text-[11px] text-[#74767e]">Paste directly into Fiverr Buyer Request modal</span>
          </div>
        </div>
      )}
    </div>
  );
};
