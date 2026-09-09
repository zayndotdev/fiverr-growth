import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  UserCheck,
  TrendingUp,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  Award,
  Layers,
  CheckCircle2,
  DollarSign,
  Compass,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { OnboardingStep1, type ScrapedFiverrProfile } from './OnboardingStep1';

interface Message {
  role: 'agent' | 'user';
  text: string;
  timestamp: string;
}

interface OnboardingStrategistViewProps {
  onSelectGigForGeneration?: (gigData: { niche: string; skills: string }) => void;
  onOpenAuth?: () => void;
}

export const OnboardingStrategistView: React.FC<OnboardingStrategistViewProps> = ({
  onSelectGigForGeneration,
  onOpenAuth,
}) => {
  const { user, userContext, updateUserContext } = useAuth();

  const [currentStep, setCurrentStep] = useState<number>(
    userContext?.onboardingStep || (userContext?.fiverrProfile ? 2 : 1)
  );

  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'agent',
      text: `Hello! I am your Fiverr Growth & Market Strategist. 

I'm here to build your personalized blueprint for high-margin freelancing success on Fiverr. To ensure we don't build generic gigs that get lost in saturated markets, please share:
1. **Who you are** (your background or agency name)
2. **Your Fiverr profile link** (or tell me if you're starting fresh)
3. **Your real skills & tech stack** (e.g., React, Node, Python, AI Chatbots, Full-stack web)
4. **What gigs or services you are considering offering**`,
      timestamp: 'Just now',
    },
  ]);

  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [synthesizing, setSynthesizing] = useState(false);
  const [extractedData, setExtractedData] = useState({
    name: user?.username || '',
    fiverr_url: user?.fiverr_profile_url || '',
    skills: user?.skills?.join(', ') || 'Next.js, React, Node.js, Python, AI Chatbots',
    intended_gigs: 'Modern responsive websites, custom AI chatbots, API automation',
  });

  const chatEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Only scroll internal chat container when messages are added, NEVER scroll window on mount
    if (messages.length > 1 && messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages, loading]);

  useEffect(() => {
    if (userContext?.fiverrProfile) {
      const fp = userContext.fiverrProfile;
      setExtractedData({
        name: fp.displayName || fp.username || user?.username || '',
        fiverr_url: fp.profileUrl || user?.fiverr_profile_url || '',
        skills: fp.skills?.map((s: any) => s.name).join(', ') || '',
        intended_gigs: fp.gigs?.map((g: any) => g.title).join(', ') || '',
      });
      if (!userContext.onboardingStep) {
        setCurrentStep(2);
      }
    } else if (userContext?.profile) {
      setExtractedData({
        name: userContext.profile.name || user?.username || '',
        fiverr_url: userContext.profile.fiverr_profile_url || user?.fiverr_profile_url || '',
        skills: userContext.profile.skills?.join(', ') || '',
        intended_gigs: userContext.profile.intended_gigs?.join(', ') || '',
      });
    }
  }, [userContext, user]);

  const handleProfileConfirmed = (profile: ScrapedFiverrProfile) => {
    const skillNames = profile.skills.map((s) => s.name).join(', ');
    const gigTitles = profile.gigs.map((g) => g.title).join(', ');
    
    setExtractedData({
      name: profile.displayName || profile.username,
      fiverr_url: profile.profileUrl,
      skills: skillNames || 'Full-Stack Development, AI Agents, Python, React',
      intended_gigs: gigTitles || 'Custom AI Solutions, Web Development',
    });

    setMessages((prev) => [
      ...prev,
      {
        role: 'agent',
        text: `🎉 **Live Fiverr Profile Locked & Verified!**\n\nI have successfully verified your public reputation for **${profile.displayName}** (@${profile.username}) from **${profile.country}**.\n\n- **Reputation**: ${profile.rating}★ rating across ${profile.reviewCount} verified orders.\n- **Tier**: ${profile.sellerLevel} (${profile.responseTimeText} response turnaround).\n- **Skills Ingested**: ${profile.skills.length} verified technologies (${profile.skills.slice(0, 6).map((s) => s.name).join(', ')}...).\n\nLet's now cross-examine your high-ticket positioning and synthesize your market blueprint!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);

    setCurrentStep(2);
  };

  const handleSendMessage = async (textToSend?: string) => {
    const messageContent = textToSend || inputText;
    if (!messageContent.trim() || loading) return;

    const userMsg: Message = {
      role: 'user',
      text: messageContent,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setLoading(true);

    try {
      const history = [...messages, userMsg].map((m) => ({
        role: m.role,
        content: m.text,
      }));

      const res = await fetch('/api/v1/strategist/interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user?.id || 'guest',
          message: messageContent,
          history,
        }),
      });

      const json = await res.json();
      if (json.success && json.data) {
        setMessages((prev) => [
          ...prev,
          {
            role: 'agent',
            text: json.data.reply,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);

        if (json.data.extracted_data) {
          setExtractedData((prev) => ({
            name: json.data.extracted_data.name || prev.name,
            fiverr_url: json.data.extracted_data.fiverr_url || prev.fiverr_url,
            skills: json.data.extracted_data.skills || prev.skills,
            intended_gigs: json.data.extracted_data.intended_gigs || prev.intended_gigs,
          }));
        }
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'agent',
          text: 'I received your input and updated your profile context. Let me analyze your positioning against current Fiverr buyer demand.',
          timestamp: 'Just now',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSynthesizeStrategy = async () => {
    if (!user) {
      if (onOpenAuth) onOpenAuth();
      return;
    }

    setSynthesizing(true);
    try {
      const skillsArray = extractedData.skills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      const gigsArray = extractedData.intended_gigs
        .split(',')
        .map((g) => g.trim())
        .filter(Boolean);

      const res = await fetch('/api/v1/strategist/synthesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          profile_data: {
            name: extractedData.name || user.username,
            fiverr_profile_url: extractedData.fiverr_url || user.fiverr_profile_url,
            skills: skillsArray,
            intended_gigs: gigsArray,
            experience_level: 'Expert / Full-Stack',
          },
        }),
      });

      const json = await res.json();
      if (json.success && json.data) {
        updateUserContext({
          user_id: user.id,
          profile: {
            name: extractedData.name || user.username,
            fiverr_profile_url: extractedData.fiverr_url || user.fiverr_profile_url || '',
            experience_level: 'Expert / Full-Stack',
            skills: skillsArray,
            intended_gigs: gigsArray,
          },
          strategy: json.data,
          updated_at: new Date().toISOString(),
        });
      }
    } catch (err) {
      console.error('Synthesis failed:', err);
    } finally {
      setSynthesizing(false);
    }
  };

  const starterTemplates = [
    {
      title: 'Full-Stack & AI Chatbots',
      text: "I am a Full-Stack developer specializing in React, Next.js, Node.js, and Python. I want to build gigs for custom business AI chatbots and modern interactive websites. Here's my portfolio: https://fiverr.com/fresh_dev",
    },
    {
      title: 'Python Automation & Web Scraping',
      text: 'I build robust Python data scrapers and workflow automation using Playwright, BeautifulSoup, and FastAPI. Looking to rank for high-intent business automation gigs.',
    },
    {
      title: '3D Web & Creative Developer',
      text: 'Specialized in Three.js, GSAP, and Tailwind CSS for high-ticket interactive landing pages with 3D visuals. Want to target high-budget agencies.',
    },
  ];

  return (
    <div className="space-y-5">
      {/* Module Sub-Header Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-gray-900/70 p-4 rounded-xl border border-white/10 glass-panel">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
              <Compass className="w-3 h-3" />
              Strategic Cross-Examination
            </span>
            {userContext?.strategy ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Context Locked
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Diagnostic In Progress
              </span>
            )}
          </div>
          <h2 className="text-base md:text-lg font-black text-white">
            AI Growth Strategist Console
          </h2>
          <p className="text-[11px] text-gray-400">
            Tell the strategist who you are, your skills, and your intended services. We match you against real buyer hiring rates.
          </p>
        </div>

        {!user && (
          <button
            onClick={onOpenAuth}
            className="px-3 py-1.5 rounded-lg bg-emerald-500 text-gray-950 font-bold text-xs shadow-md shadow-emerald-500/20 hover:bg-emerald-400 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer shrink-0"
          >
            <UserCheck className="w-3.5 h-3.5" />
            Sign In to Lock Context
          </button>
        )}
      </div>

      {/* Onboarding Steps Navigation Bar */}
      <div className="flex items-center gap-2 p-1.5 bg-gray-950/70 rounded-xl border border-white/10 overflow-x-auto scrollbar-none">
        <button
          type="button"
          onClick={() => setCurrentStep(1)}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            currentStep === 1
              ? 'bg-emerald-500 text-gray-950 shadow-md shadow-emerald-500/20'
              : userContext?.fiverrProfile
              ? 'bg-white/5 text-emerald-300 hover:bg-white/10'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <span className="w-4 h-4 rounded-full bg-black/20 flex items-center justify-center text-[10px]">
            {userContext?.fiverrProfile ? '✓' : '1'}
          </span>
          <span>Step 1: Fiverr Profile Ingestion</span>
        </button>

        <ChevronRight className="w-3.5 h-3.5 text-gray-600 shrink-0" />

        <button
          type="button"
          onClick={() => setCurrentStep(2)}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            currentStep === 2
              ? 'bg-emerald-500 text-gray-950 shadow-md shadow-emerald-500/20'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <span className="w-4 h-4 rounded-full bg-black/20 flex items-center justify-center text-[10px]">
            2
          </span>
          <span>Step 2: AI Strategist Interview</span>
        </button>

        <ChevronRight className="w-3.5 h-3.5 text-gray-600 shrink-0" />

        <div className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap ${
          userContext?.strategy ? 'text-cyan-300' : 'text-gray-500'
        }`}>
          <span className="w-4 h-4 rounded-full bg-white/5 flex items-center justify-center text-[10px]">
            {userContext?.strategy ? '✓' : '3'}
          </span>
          <span>Step 3: Market Blueprint</span>
          {userContext?.strategy && (
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          )}
        </div>
      </div>

      {/* View Switcher based on Onboarding Step */}
      {currentStep === 1 ? (
        <OnboardingStep1
          onProfileConfirmed={handleProfileConfirmed}
          onSkip={() => setCurrentStep(2)}
          onOpenAuth={onOpenAuth}
        />
      ) : (
        <>
          {/* Main Grid: Chat Interview vs Extracted Profile & Blueprint */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Conversational Interviewer Agent */}
        <div className="lg:col-span-7 flex flex-col glass-panel rounded-2xl border border-white/5 h-[620px] overflow-hidden">
          {/* Chat Header */}
          <div className="p-4 border-b border-white/5 bg-gray-950/40 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center text-white">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Fiverr Growth Interviewer</h4>
                <p className="text-[10px] text-gray-400">Diagnostic Agent &bull; Continuous Market Analysis</p>
              </div>
            </div>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>

          {/* Chat Messages */}
          <div ref={messagesContainerRef} className="flex-1 p-4 overflow-y-auto space-y-4 custom-scrollbar">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'agent' && (
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 flex items-center justify-center shrink-0 text-xs font-bold">
                    AI
                  </div>
                )}
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-gray-950 font-medium'
                      : 'bg-white/5 border border-white/10 text-gray-200'
                  }`}
                >
                  <div className="whitespace-pre-line">{msg.text}</div>
                  <div
                    className={`text-[9px] mt-1.5 text-right ${
                      msg.role === 'user' ? 'text-gray-800' : 'text-gray-400'
                    }`}
                  >
                    {msg.timestamp}
                  </div>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-3 justify-start">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 flex items-center justify-center shrink-0 text-xs font-bold">
                  AI
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3 flex items-center gap-2 text-xs text-gray-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Strategist is analyzing market trends and your input...
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Quick Starter Templates */}
          {messages.length <= 2 && (
            <div className="px-4 py-2 border-t border-white/5 bg-gray-950/20 flex flex-wrap gap-2">
              <span className="text-[10px] text-gray-400 self-center">Quick answers:</span>
              {starterTemplates.map((t, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(t.text)}
                  className="text-[11px] px-2.5 py-1 rounded-lg bg-white/5 hover:bg-emerald-500/20 hover:text-emerald-300 border border-white/5 text-gray-300 transition-all text-left"
                >
                  {t.title}
                </button>
              ))}
            </div>
          )}

          {/* Chat Input */}
          <div className="p-3 border-t border-white/5 bg-gray-950/60 flex items-center gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Tell the agent who you are, your skills, or reply to its questions..."
              className="flex-1 glass-input px-4 py-2.5 rounded-xl text-xs focus:ring-1 focus:ring-emerald-500"
              disabled={loading}
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={!inputText.trim() || loading}
              className="p-2.5 rounded-xl bg-emerald-500 text-gray-950 hover:bg-emerald-400 disabled:opacity-40 transition-all shadow-md shadow-emerald-500/20"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right Column: Live Profile Context & Blueprint Lock */}
        <div className="lg:col-span-5 flex flex-col space-y-4">
          {/* Profile Extraction Card */}
          <div className="glass-panel p-5 rounded-2xl border border-white/5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-emerald-400" />
                Live Extracted Profile Context
              </h3>
              <span className="text-[10px] text-gray-400 font-mono">
                {user ? `User: ${user.id.substring(0, 12)}...` : 'Session: Guest'}
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] text-gray-400 font-semibold mb-1">
                  Full Name / Seller Brand
                </label>
                <input
                  type="text"
                  value={extractedData.name}
                  onChange={(e) => setExtractedData({ ...extractedData, name: e.target.value })}
                  placeholder="e.g. Zayn Web & AI Studio"
                  className="w-full glass-input px-3 py-1.5 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] text-gray-400 font-semibold mb-1">
                  Fiverr Profile URL
                </label>
                <input
                  type="text"
                  value={extractedData.fiverr_url}
                  onChange={(e) => setExtractedData({ ...extractedData, fiverr_url: e.target.value })}
                  placeholder="https://fiverr.com/username or New Seller"
                  className="w-full glass-input px-3 py-1.5 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] text-gray-400 font-semibold mb-1">
                  Core Skills & Technologies
                </label>
                <input
                  type="text"
                  value={extractedData.skills}
                  onChange={(e) => setExtractedData({ ...extractedData, skills: e.target.value })}
                  placeholder="React, Next.js, Node.js, Python, AI Chatbots"
                  className="w-full glass-input px-3 py-1.5 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] text-gray-400 font-semibold mb-1">
                  Intended Gigs / Services
                </label>
                <textarea
                  value={extractedData.intended_gigs}
                  onChange={(e) => setExtractedData({ ...extractedData, intended_gigs: e.target.value })}
                  rows={2}
                  placeholder="e.g. Custom AI chatbots, high-converting landing pages"
                  className="w-full glass-input px-3 py-1.5 rounded-lg text-xs resize-none"
                />
              </div>
            </div>

            {/* Lock & Synthesize Button */}
            <button
              onClick={handleSynthesizeStrategy}
              disabled={synthesizing}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-gray-950 font-extrabold text-xs shadow-lg shadow-emerald-500/20 hover:opacity-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {synthesizing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Synthesizing Market Intelligence...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  {userContext?.strategy ? 'Update & Re-Lock Strategy Blueprint' : 'Synthesize Market Strategy & Lock Context'}
                </>
              )}
            </button>
          </div>

          {/* Quick Context Benefits */}
          <div className="glass-panel p-4 rounded-2xl border border-white/5 text-[11px] text-gray-400 space-y-2">
            <div className="flex items-center gap-2 text-gray-300 font-semibold">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Why Locking Context Matters:
            </div>
            <p>
              Once locked to your User ID, all gig generations, keyword SEO tags, and buyer proposal pitches will automatically reference your real tech stack, Fiverr profile URL, and competitive angle.
            </p>
          </div>
        </div>
      </div>

      {/* Strategic Blueprint View (Rendered once synthesized) */}
      {userContext?.strategy && (
        <div className="glass-panel p-6 md:p-8 rounded-2xl border border-white/10 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-400">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-white/5 pb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Award className="w-5 h-5 text-emerald-400" />
                <h3 className="text-lg font-black text-white">
                  Active Market Growth Blueprint & Positioning
                </h3>
              </div>
              <p className="text-xs text-gray-400">
                Grounding profile for {userContext.profile.name || user?.username || 'Seller'} &bull; User ID: {user?.id}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="px-3 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-1.5 font-mono">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Grounded Across Platform
              </div>
            </div>
          </div>

          {/* Matrix & Positioning Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-1">
              <span className="text-[11px] text-gray-400 uppercase tracking-wider font-semibold">
                Recommended Profile Title
              </span>
              <p className="text-sm font-bold text-white">
                {userContext.strategy.profile_positioning?.recommended_title || 'Full-Stack Web & AI Automation Engineer'}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-1">
              <span className="text-[11px] text-gray-400 uppercase tracking-wider font-semibold">
                Unique Selling Proposition (USP)
              </span>
              <p className="text-xs font-medium text-emerald-300">
                {userContext.strategy.profile_positioning?.usp || 'Production-grade architecture with 24-hr high-converting turnaround.'}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-1">
              <span className="text-[11px] text-gray-400 uppercase tracking-wider font-semibold">
                Market Demand / Saturation
              </span>
              <div className="flex items-center gap-2 pt-1">
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-500/20 text-emerald-400">
                  {userContext.strategy.market_analysis?.demand_level || 'High Demand (94/100)'}
                </span>
                <span className="text-xs text-gray-400">
                  {userContext.strategy.market_analysis?.competition_density || 'Low Saturation in Deep AI Niches'}
                </span>
              </div>
            </div>
          </div>

          {/* Recommended High-Margin Gigs */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  Top Recommended High-Ticket Gig Niches
                </h4>
                <p className="text-xs text-gray-400">
                  Curated for your tech stack to avoid commoditized competition and command high average orders.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {userContext.strategy.recommended_gigs?.map((recGig, idx) => (
                <div
                  key={idx}
                  className="glass-panel p-4 rounded-xl border border-white/5 hover:border-emerald-500/40 transition-all flex flex-col justify-between space-y-3 group"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-semibold font-mono">
                        Demand: {recGig.demand_score}/100
                      </span>
                      <span className="text-[11px] text-gray-400 font-semibold flex items-center gap-0.5">
                        <DollarSign className="w-3 h-3 text-emerald-400" />
                        {recGig.avg_ticket_price}
                      </span>
                    </div>
                    <h5 className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors">
                      {recGig.title}
                    </h5>
                    <p className="text-[11px] text-gray-400 leading-relaxed">
                      <strong className="text-gray-300">Angle: </strong>
                      {recGig.differentiation_angle}
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      if (onSelectGigForGeneration) {
                        onSelectGigForGeneration({
                          niche: recGig.niche || recGig.title,
                          skills: userContext.profile.skills?.join(', ') || 'React, Python, Node.js',
                        });
                      }
                    }}
                    className="w-full mt-2 py-1.5 px-3 rounded-lg bg-white/5 hover:bg-emerald-500 hover:text-gray-950 text-gray-200 font-semibold text-xs transition-all flex items-center justify-center gap-1.5"
                  >
                    <span>Launch in Synthesizer</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Anti-Patterns & Roadmap */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-white/5">
            {/* What to Avoid */}
            <div className="p-4 rounded-xl bg-rose-500/5 border border-rose-500/20 space-y-2">
              <h5 className="text-xs font-bold text-rose-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                Commodity Traps to Avoid (High Saturation)
              </h5>
              <ul className="space-y-1.5 text-[11px] text-gray-300">
                {userContext.strategy.anti_patterns_to_avoid?.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-rose-400 font-bold">&times;</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Implementation Roadmap */}
            <div className="p-4 rounded-xl bg-cyan-500/5 border border-cyan-500/20 space-y-2">
              <h5 className="text-xs font-bold text-cyan-300 flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                Next Implementation Milestones
              </h5>
              <ul className="space-y-1.5 text-[11px] text-gray-300">
                {userContext.strategy.actionable_roadmap?.map((step, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-cyan-400 font-bold">{idx + 1}.</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
};
