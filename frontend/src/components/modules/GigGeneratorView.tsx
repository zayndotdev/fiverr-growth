import React, { useState, useEffect } from 'react';
import { Sparkles, Copy, Check, TrendingUp, Clock, RefreshCw, Award, Zap } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface GigGeneratorViewProps {
  onGigGenerated?: () => void;
  initialNiche?: string;
  initialSkills?: string;
}

export const GigGeneratorView: React.FC<GigGeneratorViewProps> = ({
  onGigGenerated,
  initialNiche,
  initialSkills,
}) => {
  const { user, userContext } = useAuth();

  const [niche, setNiche] = useState(
    initialNiche ||
      userContext?.strategy?.recommended_gigs?.[0]?.title ||
      'Production-Grade Next.js & React Web Application'
  );
  const [skill, setSkill] = useState(
    initialSkills ||
      userContext?.profile?.skills?.join(', ') ||
      'React, Next.js, Node.js, Tailwind CSS, TypeScript'
  );
  const [experience, setExperience] = useState('Expert');
  const [turnaround, setTurnaround] = useState('24 Hours');
  const [loading, setLoading] = useState(false);
  const [gig, setGig] = useState<any>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Sync props when user selects a recommended gig from Onboarding Blueprint
  useEffect(() => {
    if (initialNiche) setNiche(initialNiche);
    if (initialSkills) setSkill(initialSkills);
  }, [initialNiche, initialSkills]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/v1/gigs/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user?.id,
          service_niche: niche,
          primary_skill: skill,
          experience_level: experience,
          target_turnaround: turnaround,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setGig(json.data);
        if (onGigGenerated) onGigGenerated();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="space-y-6 text-[#222325]">
      {/* Context Grounding Banner */}
      {userContext?.strategy && (
        <div className="bg-white p-4 rounded-lg border border-[#1dbf73]/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#1dbf73]/10 flex items-center justify-center text-[#1dbf73] shrink-0">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#222325]">
                  Grounded with {userContext.profile.name || user?.username}'s Blueprint
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#1dbf73]/10 text-[#19a463] font-bold">
                  Context Active
                </span>
              </div>
              <p className="text-xs text-[#74767e]">
                Targeting: {userContext.strategy.profile_positioning?.recommended_title || 'Expert Freelancer'} &bull; User ID: {user?.id}
              </p>
            </div>
          </div>

          {/* Quick chip selector from recommended gigs */}
          {userContext.strategy.recommended_gigs && userContext.strategy.recommended_gigs.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 self-stretch md:self-auto">
              <span className="text-xs text-[#74767e] font-semibold mr-1">Recommended:</span>
              {userContext.strategy.recommended_gigs.slice(0, 2).map((rec, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setNiche(rec.title)}
                  className="text-xs px-2.5 py-1 rounded bg-[#f5f5f5] hover:bg-[#1dbf73]/10 hover:text-[#19a463] text-[#404145] border border-[#dadbdd] transition-all flex items-center gap-1 cursor-pointer"
                >
                  <Zap className="w-3 h-3 text-[#1dbf73]" />
                  {rec.niche || rec.title.substring(0, 24)}...
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Form Card */}
      <div className="bg-white p-6 rounded-lg border border-[#dadbdd] shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#efeff0]">
          <div>
            <h3 className="text-xl font-bold text-[#222325] flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#1dbf73]" />
              Algorithmic Fiverr Gig Synthesizer
            </h3>
            <p className="text-xs text-[#74767e] mt-0.5">
              Generates high-ranking titles, 5-tiered SEO tags, 3-tier pricing, and conversion-engineered descriptions.
            </p>
          </div>
        </div>

        <form onSubmit={handleGenerate} className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          <div>
            <label className="block text-xs font-semibold text-[#404145] mb-1.5">
              Service Niche
            </label>
            <input
              type="text"
              value={niche}
              onChange={(e) => setNiche(e.target.value)}
              className="w-full px-4 py-2 border border-[#dadbdd] rounded text-sm text-[#222325] focus:border-[#1dbf73] focus:outline-none"
              placeholder="e.g. Python Web Scraping"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#404145] mb-1.5">
              Primary Skills & Tools
            </label>
            <input
              type="text"
              value={skill}
              onChange={(e) => setSkill(e.target.value)}
              className="w-full px-4 py-2 border border-[#dadbdd] rounded text-sm text-[#222325] focus:border-[#1dbf73] focus:outline-none"
              placeholder="e.g. Playwright, Scrapy, BeautifulSoup"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#404145] mb-1.5">
              Experience Positioning
            </label>
            <select
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
              className="w-full px-4 py-2 border border-[#dadbdd] rounded text-sm text-[#222325] focus:border-[#1dbf73] focus:outline-none bg-white"
            >
              <option value="Intermediate">Intermediate (Faster delivery hook)</option>
              <option value="Expert">Expert / Top-Tier Specialist</option>
              <option value="Agency">Full Agency / Enterprise Quality</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#404145] mb-1.5">
              Target Turnaround Speed
            </label>
            <select
              value={turnaround}
              onChange={(e) => setTurnaround(e.target.value)}
              className="w-full px-4 py-2 border border-[#dadbdd] rounded text-sm text-[#222325] focus:border-[#1dbf73] focus:outline-none bg-white"
            >
              <option value="24 Hours">24 Hours (Maximum Conversion Hook)</option>
              <option value="48 Hours">48 Hours</option>
              <option value="3-5 Days">3-5 Days (Complex Projects)</option>
            </select>
          </div>

          <div className="md:col-span-2 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="fiverr-btn-green w-full py-3 px-6 rounded font-bold text-sm text-white flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Synthesizing High-Ranking Gig with AI...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate High-Converting Fiverr Gig
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Generated Gig Output Card */}
      {gig && (
        <div className="bg-white p-6 rounded-lg border border-[#1dbf73]/40 space-y-6 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-400">
          {/* Header & SEO Score */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-[#efeff0]">
            <div>
              <span className="text-xs font-bold text-[#1dbf73] uppercase tracking-wider">
                {gig.category} &gt; {gig.sub_category}
              </span>
              <h2 className="text-xl md:text-2xl font-bold text-[#222325] mt-1">
                {gig.title}
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <div className="px-4 py-2 rounded-lg bg-[#1dbf73]/10 border border-[#1dbf73]/20 text-right">
                <div className="text-[10px] uppercase font-bold text-[#74767e]">Fiverr SEO Score</div>
                <div className="text-xl font-bold text-[#19a463] flex items-center gap-1 justify-end">
                  <TrendingUp className="w-4 h-4" />
                  {gig.seo_score || 95}/100
                </div>
              </div>
              <button
                onClick={() => copyToClipboard(gig.title, 'title')}
                className="p-2.5 rounded-lg bg-[#f5f5f5] hover:bg-[#e4e5e7] text-[#404145] border border-[#dadbdd] transition-colors cursor-pointer"
                title="Copy Title"
              >
                {copiedKey === 'title' ? <Check className="w-4 h-4 text-[#1dbf73]" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Search Tags */}
          <div>
            <div className="text-xs font-semibold text-[#74767e] mb-2 flex items-center justify-between">
              <span>5 Search Tags (Click any tag to copy):</span>
              <button
                onClick={() => copyToClipboard(gig.search_tags.join(', '), 'tags')}
                className="text-[#1dbf73] hover:underline flex items-center gap-1 text-xs font-semibold cursor-pointer"
              >
                {copiedKey === 'tags' ? 'Copied all!' : 'Copy all 5 tags'}
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {gig.search_tags.map((tag: string, i: number) => (
                <button
                  key={i}
                  onClick={() => copyToClipboard(tag, `tag-${i}`)}
                  className="fiverr-pill px-3 py-1.5 rounded-full bg-[#f5f5f5] border border-[#dadbdd] text-[#404145] text-xs font-medium hover:border-[#1dbf73] hover:text-[#1dbf73] transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  #{tag}
                  {copiedKey === `tag-${i}` ? <Check className="w-3 h-3 text-[#1dbf73]" /> : <Copy className="w-3 h-3 opacity-60" />}
                </button>
              ))}
            </div>
          </div>

          {/* 3-Tier Pricing Packages */}
          <div>
            <h4 className="text-xs font-bold text-[#74767e] uppercase tracking-wider mb-3">3-Tier Pricing Packages:</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Basic */}
              <div className="bg-white p-4 rounded-lg border border-[#dadbdd] relative shadow-sm">
                <div className="text-xs font-bold text-[#74767e] uppercase tracking-wider">Basic</div>
                <div className="text-2xl font-bold text-[#222325] mt-1">${gig.packages?.basic?.price_usd}</div>
                <div className="text-xs font-bold text-[#1dbf73] mt-0.5">{gig.packages?.basic?.title}</div>
                <p className="text-xs text-[#62646a] mt-2 min-h-12 leading-relaxed">{gig.packages?.basic?.description}</p>
                <div className="mt-4 pt-3 border-t border-[#efeff0] flex items-center justify-between text-xs text-[#74767e]">
                  <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {gig.packages?.basic?.delivery_days} Day Delivery</span>
                  <span>{gig.packages?.basic?.revisions} Revision</span>
                </div>
              </div>

              {/* Standard */}
              <div className="bg-white p-4 rounded-lg border-2 border-[#1dbf73] relative shadow-sm">
                <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-[#1dbf73] text-white text-[10px] font-bold uppercase">
                  Best Seller
                </div>
                <div className="text-xs font-bold text-[#1dbf73] uppercase tracking-wider">Standard</div>
                <div className="text-2xl font-bold text-[#222325] mt-1">${gig.packages?.standard?.price_usd}</div>
                <div className="text-xs font-bold text-[#222325] mt-0.5">{gig.packages?.standard?.title}</div>
                <p className="text-xs text-[#62646a] mt-2 min-h-12 leading-relaxed">{gig.packages?.standard?.description}</p>
                <div className="mt-4 pt-3 border-t border-[#efeff0] flex items-center justify-between text-xs text-[#74767e]">
                  <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {gig.packages?.standard?.delivery_days} Days Delivery</span>
                  <span>{gig.packages?.standard?.revisions} Revisions</span>
                </div>
              </div>

              {/* Premium */}
              <div className="bg-white p-4 rounded-lg border border-[#dadbdd] relative shadow-sm">
                <div className="text-xs font-bold text-[#74767e] uppercase tracking-wider">Premium VIP</div>
                <div className="text-2xl font-bold text-[#222325] mt-1">${gig.packages?.premium?.price_usd}</div>
                <div className="text-xs font-bold text-[#222325] mt-0.5">{gig.packages?.premium?.title}</div>
                <p className="text-xs text-[#62646a] mt-2 min-h-12 leading-relaxed">{gig.packages?.premium?.description}</p>
                <div className="mt-4 pt-3 border-t border-[#efeff0] flex items-center justify-between text-xs text-[#74767e]">
                  <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {gig.packages?.premium?.delivery_days} Days Delivery</span>
                  <span>Unlimited Revisions</span>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-[#74767e] uppercase tracking-wider">Description (Markdown):</h4>
              <button
                onClick={() => copyToClipboard(gig.description, 'description')}
                className="text-[#1dbf73] hover:underline flex items-center gap-1 text-xs font-semibold cursor-pointer"
              >
                {copiedKey === 'description' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copiedKey === 'description' ? 'Copied Description!' : 'Copy Description'}
              </button>
            </div>
            <pre className="bg-[#fafafa] p-4 rounded-lg text-xs text-[#404145] whitespace-pre-wrap font-sans max-h-60 overflow-y-auto border border-[#dadbdd] leading-relaxed">
              {gig.description}
            </pre>
          </div>

          {/* FAQs */}
          {gig.faqs && gig.faqs.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-[#74767e] uppercase tracking-wider mb-2">Frequently Asked Questions ({gig.faqs.length}):</h4>
              <div className="space-y-2">
                {gig.faqs.map((faq: any, i: number) => (
                  <div key={i} className="bg-[#fafafa] p-3.5 rounded-lg text-xs border border-[#dadbdd]">
                    <div className="font-bold text-[#222325] mb-1">Q: {faq.question}</div>
                    <div className="text-[#62646a] leading-relaxed">A: {faq.answer}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
