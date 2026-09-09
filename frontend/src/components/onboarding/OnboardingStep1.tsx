import React, { useState } from 'react';
import {
  Search,
  ArrowRight,
  ExternalLink,
  Star,
  Clock,
  MapPin,
  Calendar,
  Award,
  GraduationCap,
  Languages,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Layers,
  ShieldCheck,
  Check,
  Zap,
  Briefcase,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  FileText,
  HelpCircle,
  ListChecks,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export interface FiverrLanguage {
  language: string;
  code?: string;
  level: string;
}

export interface FiverrSkill {
  name: string;
  level: string;
  verified: boolean;
}

export interface FiverrEducation {
  degree: string;
  school: string;
  degreeTitle?: string;
  toYear?: number;
  countryCode?: string;
}

export interface FiverrCertification {
  name: string;
  from: string;
  year?: number;
}

export interface FiverrGigPackageFeature {
  label: string;
  included: boolean;
  value?: any;
}

export interface FiverrGigPackage {
  id?: number | string;
  title: string;
  description: string;
  price: number | string;
  durationDays?: number;
  revisions?: number | string;
  features?: FiverrGigPackageFeature[];
}

export interface FiverrGigFAQ {
  question: string;
  answer: string;
}

export interface FiverrGig {
  id: string | number;
  title: string;
  slug?: string;
  url?: string;
  imageUrl?: string;
  gallery?: string[];
  startingPrice: string | number;
  rating?: number;
  reviewCount?: number;
  ordersInQueue?: number;
  category?: string;
  subCategory?: string;
  nestedCategory?: string;
  description?: string;
  descriptionHtml?: string;
  faqs?: FiverrGigFAQ[];
  tags?: string[];
  packages?: FiverrGigPackage[];
  metadata?: Array<{ type: string; value: string[] }>;
  aiSummary?: string[];
}

export interface FiverrReview {
  id?: string;
  reviewer: string;
  reviewerCountry?: string;
  reviewerCountryCode?: string;
  rating: number;
  comment: string;
  createdAt: string;
  workSample?: string;
  orderDuration?: string;
  priceRange?: string;
  sellerResponse?: string;
}

export interface ScrapedFiverrProfile {
  username: string;
  displayName: string;
  profileUrl: string;
  avatarUrl: string;
  profileCoverUrl?: string;
  isAgency?: boolean;
  tagline: string;
  description: string;
  country: string;
  countryCode: string;
  memberSince: string;
  responseTimeHours: number;
  responseTimeText: string;
  lastDeliveryText: string;
  sellerLevel: string;
  isPro: boolean;
  isVerified: boolean;
  isHighlyResponsive: boolean;
  rating: number;
  reviewCount: number;
  languages: FiverrLanguage[];
  skills: FiverrSkill[];
  education: FiverrEducation[];
  certifications: FiverrCertification[];
  gigs: FiverrGig[];
  recentReviews: FiverrReview[];
  scrapedAt: string;
}

export function cleanHtmlEntities(text?: string): string {
  if (!text) return '';
  return text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

interface OnboardingStep1Props {
  onProfileConfirmed: (profile: ScrapedFiverrProfile) => void;
  onSkip?: () => void;
  onOpenAuth?: () => void;
}

export const OnboardingStep1: React.FC<OnboardingStep1Props> = ({
  onProfileConfirmed,
  onSkip,
  onOpenAuth,
}) => {
  const { user, userContext, updateUserContext } = useAuth();

  const [inputHandle, setInputHandle] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingPhase, setLoadingPhase] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [scrapedProfile, setScrapedProfile] = useState<ScrapedFiverrProfile | null>(
    userContext?.fiverrProfile || null
  );

  const [expandedDescriptions, setExpandedDescriptions] = useState<Record<string | number, boolean>>({});
  const [expandedFaqs, setExpandedFaqs] = useState<Record<string | number, boolean>>({});

  const toggleDescription = (id: string | number) => {
    setExpandedDescriptions(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleFaq = (id: string | number) => {
    setExpandedFaqs(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleScrape = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const target = inputHandle.trim();
    if (!target) {
      setError('Please enter your Fiverr profile URL or username.');
      return;
    }

    setError(null);
    setLoading(true);
    setLoadingPhase('Connecting to Fiverr in real-time...');

    const phaseTimer1 = setTimeout(() => {
      setLoadingPhase('Extracting seller tier, skills, and certifications...');
    }, 800);

    const phaseTimer2 = setTimeout(() => {
      setLoadingPhase('Harvesting buyer ratings and delivered orders...');
    }, 1600);

    try {
      const res = await fetch('/api/v1/scraper/fiverr-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usernameOrUrl: target }),
      });

      const json = await res.json();
      if (!json.success) {
        throw new Error(json.error || 'Failed to scrape profile.');
      }

      setScrapedProfile(json.data || json.profile);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch Fiverr profile. Please check the username or link.');
    } finally {
      clearTimeout(phaseTimer1);
      clearTimeout(phaseTimer2);
      setLoading(false);
      setLoadingPhase('');
    }
  };

  const handleConfirmProfile = async () => {
    if (!scrapedProfile) return;

    if (!user) {
      if (onOpenAuth) onOpenAuth();
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const token = localStorage.getItem('fg_token');
      const res = await fetch('/api/v1/onboarding/fiverr-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          user_id: user.id,
          profile: scrapedProfile,
        }),
      });

      const json = await res.json();
      if (!json.success) {
        throw new Error(json.error || 'Failed to save profile to database.');
      }

      // Update global context
      if (json.data?.context) {
        updateUserContext(json.data.context);
      }

      onProfileConfirmed(scrapedProfile);
    } catch (err: any) {
      setError(err.message || 'Error saving profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleFreshStart = async () => {
    if (!user) {
      if (onOpenAuth) onOpenAuth();
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem('fg_token');
      const res = await fetch('/api/v1/onboarding/fresh-start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ user_id: user.id }),
      });
      const json = await res.json();
      if (json.success && json.data?.context) {
        updateUserContext(json.data.context);
      }
      if (onSkip) onSkip();
    } catch (err) {
      console.warn('Fresh start error:', err);
      if (onSkip) onSkip();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Step Banner & Stepper */}
      <div className="glass-panel p-5 rounded-2xl border border-white/10 bg-gradient-to-r from-emerald-950/40 via-gray-900/60 to-cyan-950/30">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center text-gray-950 font-black shadow-lg shadow-emerald-500/20 shrink-0">
              1
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                  Onboarding Step 1 of 4
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              </div>
              <h3 className="text-base sm:text-lg font-black text-white">
                Live Fiverr Identity & Reputation Ingestion
              </h3>
              <p className="text-xs text-gray-400">
                Enter your Fiverr handle or profile link. We perform real-time scraping of your verified skills, tier, ratings, and past deliveries.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5" />
              Real-Time Scraper Active
            </span>
          </div>
        </div>
      </div>

      {/* Input Form (shown if not yet scraped, or user is editing) */}
      {!scrapedProfile ? (
        <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-white/10 space-y-6">
          <form onSubmit={handleScrape} className="space-y-4 max-w-2xl mx-auto text-center">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
              <Search className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-lg font-black text-white">What is your Fiverr Profile?</h3>
              <p className="text-xs text-gray-400 mt-1 max-w-md mx-auto">
                Paste your Fiverr profile URL or simply type your username to initiate real-time ingestion.
              </p>
            </div>

            <div className="relative mt-4">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-emerald-400 font-bold text-sm">
                fiverr.com/
              </div>
              <input
                type="text"
                value={inputHandle}
                onChange={(e) => setInputHandle(e.target.value)}
                placeholder="dev_zaynee (or full URL)"
                disabled={loading}
                className="w-full glass-input pl-28 pr-32 py-3 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 text-white placeholder-gray-500"
              />
              <button
                type="submit"
                disabled={loading || !inputHandle.trim()}
                className="absolute right-1.5 top-1.5 bottom-1.5 px-4 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 text-gray-950 font-bold text-xs shadow-md shadow-emerald-500/20 hover:from-emerald-400 hover:to-teal-500 transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Scraping...</span>
                  </>
                ) : (
                  <>
                    <span>Audit Profile</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>

            {/* Quick Handles Suggestion */}
            <div className="flex items-center justify-center gap-2 pt-1 flex-wrap">
              <span className="text-[11px] text-gray-500">Quick try:</span>
              <button
                type="button"
                onClick={() => setInputHandle('dev_zaynee')}
                className="px-2.5 py-0.5 rounded-full text-[11px] bg-white/5 border border-white/10 text-gray-300 hover:text-emerald-400 hover:border-emerald-500/30 transition-colors"
              >
                dev_zaynee
              </button>
              {user?.username && (
                <button
                  type="button"
                  onClick={() => setInputHandle(user.username)}
                  className="px-2.5 py-0.5 rounded-full text-[11px] bg-white/5 border border-white/10 text-gray-300 hover:text-emerald-400 hover:border-emerald-500/30 transition-colors"
                >
                  {user.username}
                </button>
              )}
            </div>

            {/* Live Loading Phase Feedback */}
            {loading && (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center justify-center gap-3 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>{loadingPhase}</span>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-center gap-2 text-left">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            {/* Fresh Freelancer Option */}
            <div className="pt-4 border-t border-white/5 text-center">
              <button
                type="button"
                onClick={handleFreshStart}
                disabled={saving}
                className="text-xs text-gray-400 hover:text-emerald-400 transition-colors underline underline-offset-4 cursor-pointer"
              >
                Starting fresh without an existing Fiverr profile? Click here to begin as a new seller.
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* Scraped Profile Verification Screen */
        <div className="space-y-6">
          {/* Main Profile Card */}
          <div className="glass-panel p-6 rounded-2xl border border-white/10 relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Top Row: Identity, Badges, Links */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5 pb-6 border-b border-white/10">
              <div className="flex items-center gap-4">
                <div className="relative shrink-0">
                  {scrapedProfile.avatarUrl ? (
                    <img
                      src={scrapedProfile.avatarUrl}
                      alt={scrapedProfile.displayName}
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-emerald-500/40 shadow-xl shadow-emerald-500/10"
                    />
                  ) : (
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center font-black text-2xl text-gray-950">
                      {scrapedProfile.displayName.charAt(0)}
                    </div>
                  )}
                  <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-[#07090e] shadow-sm" />
                </div>

                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h2 className="text-xl sm:text-2xl font-black text-white">
                      {scrapedProfile.displayName}
                    </h2>
                    <span className="text-xs text-gray-400 font-mono">
                      @{scrapedProfile.username}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-300 border border-emerald-500/30">
                      {scrapedProfile.sellerLevel}
                    </span>
                    {scrapedProfile.isPro && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        PRO
                      </span>
                    )}
                  </div>

                  {scrapedProfile.tagline && (
                    <p className="text-xs text-emerald-400 font-medium mt-1">
                      {scrapedProfile.tagline}
                    </p>
                  )}

                  <div className="flex items-center gap-4 text-[11px] text-gray-400 mt-2 flex-wrap">
                    {scrapedProfile.country && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-emerald-400" />
                        {scrapedProfile.country} {scrapedProfile.countryCode && `(${scrapedProfile.countryCode})`}
                      </span>
                    )}
                    {scrapedProfile.memberSince && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-cyan-400" />
                        Member since {scrapedProfile.memberSince}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-amber-400" />
                      Avg. Response: {scrapedProfile.responseTimeText}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 self-stretch md:self-auto justify-end">
                <a
                  href={scrapedProfile.profileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-semibold text-gray-300 hover:text-white transition-all flex items-center gap-1.5"
                >
                  <span>View on Fiverr</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <button
                  type="button"
                  onClick={() => setScrapedProfile(null)}
                  className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-semibold text-gray-300 hover:text-white transition-all flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Change</span>
                </button>
              </div>
            </div>

            {/* Middle Row: 4 Metric Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-5 border-b border-white/10">
              <div className="p-3.5 rounded-xl bg-white/5 border border-white/5">
                <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider flex items-center gap-1">
                  <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                  Rating Score
                </span>
                <div className="text-lg font-black text-white mt-1">
                  {scrapedProfile.rating.toFixed(1)}{' '}
                  <span className="text-xs text-gray-400 font-normal">/ 5.0</span>
                </div>
                <div className="text-[10px] text-amber-400 mt-0.5">
                  Based on verified orders
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-white/5 border border-white/5">
                <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider flex items-center gap-1">
                  <MessageSquare className="w-3 h-3 text-emerald-400" />
                  Total Reviews
                </span>
                <div className="text-lg font-black text-white mt-1">
                  {scrapedProfile.reviewCount}
                </div>
                <div className="text-[10px] text-emerald-400 mt-0.5">
                  Public buyer feedback
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-white/5 border border-white/5">
                <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider flex items-center gap-1">
                  <Clock className="w-3 h-3 text-cyan-400" />
                  Response Speed
                </span>
                <div className="text-lg font-black text-white mt-1">
                  {scrapedProfile.responseTimeText}
                </div>
                <div className="text-[10px] text-cyan-400 mt-0.5">
                  Standard inquiry turnaround
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-white/5 border border-white/5">
                <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider flex items-center gap-1">
                  <Briefcase className="w-3 h-3 text-purple-400" />
                  Recent Delivery
                </span>
                <div className="text-lg font-black text-white mt-1 truncate">
                  {scrapedProfile.lastDeliveryText}
                </div>
                <div className="text-[10px] text-purple-400 mt-0.5">
                  Latest completed milestone
                </div>
              </div>
            </div>

            {/* Description / Bio */}
            {scrapedProfile.description && (
              <div className="py-4 border-b border-white/10">
                <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">
                  Seller Biography & Agency Description
                </h4>
                <p className="text-xs text-gray-300 leading-relaxed whitespace-pre-line bg-gray-950/40 p-4 rounded-xl border border-white/5">
                  {scrapedProfile.description}
                </p>
              </div>
            )}

            {/* Skills & Languages Row */}
            <div className="py-5 border-b border-white/10 space-y-5">
              {/* Comprehensive Extracted Skills & Tech Stack */}
              <div>
                <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                  <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-emerald-400" />
                    Ingested Skills & Technology Stack ({scrapedProfile.skills.length})
                  </h4>
                  <span className="text-[11px] text-gray-400">
                    Harvested from profile endorsements, gig specifications, and metadata tags
                  </span>
                </div>

                {scrapedProfile.skills.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {scrapedProfile.skills.map((s, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 flex items-center gap-1.5 hover:bg-emerald-500/15 transition-colors"
                      >
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span>{s.name}</span>
                        {s.level && (
                          <span className="text-[9px] uppercase tracking-wider font-bold text-emerald-400/70 ml-0.5">
                            {s.level}
                          </span>
                        )}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500">No public skills listed on profile.</p>
                )}
              </div>

              {/* Languages */}
              <div className="pt-2 border-t border-white/5">
                <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <Languages className="w-3.5 h-3.5 text-cyan-400" />
                  Languages & Fluency ({scrapedProfile.languages.length})
                </h4>
                {scrapedProfile.languages.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {scrapedProfile.languages.map((l, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 rounded-lg text-xs font-medium bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 flex items-center gap-1.5"
                      >
                        <span>{l.language}</span>
                        <span className="text-[10px] text-cyan-400/80 font-normal">
                          &bull; {l.level}
                        </span>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500">No languages specified.</p>
                )}
              </div>
            </div>

            {/* Education & Certifications Row */}
            {(scrapedProfile.education.length > 0 || scrapedProfile.certifications.length > 0) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-5 border-b border-white/10">
                {scrapedProfile.education.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <GraduationCap className="w-3.5 h-3.5 text-purple-400" />
                      Education ({scrapedProfile.education.length})
                    </h4>
                    <div className="space-y-2">
                      {scrapedProfile.education.map((edu, idx) => (
                        <div
                          key={idx}
                          className="p-3.5 rounded-xl bg-white/5 border border-white/5 text-xs space-y-1"
                        >
                          <div className="font-bold text-white capitalize">{edu.degree}</div>
                          <div className="text-gray-400">
                            {edu.school} {edu.toYear && `(${edu.toYear})`}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {scrapedProfile.certifications.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-amber-400" />
                      Certifications ({scrapedProfile.certifications.length})
                    </h4>
                    <div className="space-y-2">
                      {scrapedProfile.certifications.map((cert, idx) => (
                        <div
                          key={idx}
                          className="p-3.5 rounded-xl bg-white/5 border border-white/5 text-xs space-y-1"
                        >
                          <div className="font-bold text-white">{cert.name}</div>
                          <div className="text-gray-400 capitalize">
                            Issued by {cert.from} {cert.year && `• ${cert.year}`}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Published Gigs Showcase with Packages */}
            {scrapedProfile.gigs.length > 0 && (
              <div className="py-6 border-b border-white/10 space-y-5">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-emerald-400" />
                      Published Live Gigs & Pricing Packages ({scrapedProfile.gigs.length})
                    </h4>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Real-time extraction of your active gig catalog, starting tiers, search keywords, and package offerings.
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                    {scrapedProfile.gigs.length} Active Gigs Online
                  </span>
                </div>

                <div className="space-y-6">
                  {scrapedProfile.gigs.map((g, idx) => (
                    <div
                      key={idx}
                      className="glass-panel rounded-2xl border border-white/10 p-5 space-y-4 hover:border-emerald-500/30 transition-all bg-gray-950/50"
                    >
                      {/* Gig Header */}
                      <div className="flex flex-col lg:flex-row gap-5">
                        {g.imageUrl && (
                          <div className="w-full lg:w-60 shrink-0 space-y-2">
                            <div className="h-40 rounded-xl overflow-hidden bg-gray-900 border border-white/10 relative group">
                              <img
                                src={g.imageUrl}
                                alt={g.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                              {g.subCategory && (
                                <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-bold bg-black/80 backdrop-blur-md text-emerald-300 border border-white/10">
                                  {g.subCategory}
                                </span>
                              )}
                            </div>
                            {/* Gallery Thumbnails */}
                            {g.gallery && g.gallery.length > 1 && (
                              <div className="flex gap-1.5 overflow-x-auto pb-1">
                                {g.gallery.map((imgUrl, gIdx) => (
                                  <img
                                    key={gIdx}
                                    src={imgUrl}
                                    alt={`Gallery slide ${gIdx + 1}`}
                                    className="w-12 h-9 rounded-md object-cover border border-white/10 shrink-0 opacity-80 hover:opacity-100 transition-opacity"
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        <div className="flex-1 flex flex-col justify-between space-y-3">
                          <div>
                            <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                              <span className="text-[11px] font-semibold text-gray-400">
                                {g.category} {g.subCategory && `> ${g.subCategory}`} {g.nestedCategory && `> ${g.nestedCategory}`}
                              </span>
                              <div className="flex items-center gap-2">
                                {typeof g.ordersInQueue === 'number' && (
                                  <span className="text-[11px] font-bold text-amber-300 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {g.ordersInQueue} Orders in Queue
                                  </span>
                                )}
                                <span className="text-xs font-black text-emerald-400 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                                  Starting at {typeof g.startingPrice === 'number' ? `$${g.startingPrice}` : g.startingPrice}
                                </span>
                              </div>
                            </div>

                            <h5 className="text-base font-bold text-white capitalize leading-snug">
                              {g.title}
                            </h5>
                          </div>

                          {/* Search Tags */}
                          {g.tags && g.tags.length > 0 && (
                            <div className="space-y-1">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                                Search Keywords / Tags:
                              </span>
                              <div className="flex flex-wrap gap-1.5">
                                {g.tags.map((tag, tagIdx) => (
                                  <span
                                    key={tagIdx}
                                    className="px-2 py-0.5 rounded-md text-[11px] font-mono bg-white/5 border border-white/10 text-gray-300"
                                  >
                                    #{tag}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Link Out */}
                          {g.url && (
                            <div className="pt-1">
                              <a
                                href={g.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors"
                              >
                                <span>Inspect Gig on Fiverr</span>
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Gig Description Section */}
                      {g.description && (
                        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 space-y-3">
                          <div className="flex items-center justify-between">
                            <h6 className="text-xs font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
                              <FileText className="w-3.5 h-3.5 text-cyan-400" />
                              About This Gig (Description)
                            </h6>
                            <button
                              type="button"
                              onClick={() => toggleDescription(g.id)}
                              className="text-[11px] font-bold text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1 cursor-pointer bg-cyan-500/10 hover:bg-cyan-500/20 px-2.5 py-1 rounded-lg border border-cyan-500/20"
                            >
                              {expandedDescriptions[g.id] ? (
                                <>Show Less <ChevronUp className="w-3 h-3" /></>
                              ) : (
                                <>Read Full Copy <ChevronDown className="w-3 h-3" /></>
                              )}
                            </button>
                          </div>

                          <div className="text-xs text-gray-300 leading-relaxed">
                            {expandedDescriptions[g.id] ? (
                              <div className="space-y-2 whitespace-pre-line text-gray-200">
                                {cleanHtmlEntities(g.description)}
                              </div>
                            ) : (
                              <p className="line-clamp-3 text-gray-300">
                                {cleanHtmlEntities(g.description)}
                              </p>
                            )}
                          </div>

                          {/* Fiverr Market AI Summary Bullets */}
                          {g.aiSummary && g.aiSummary.length > 0 && (
                            <div className="pt-2 border-t border-white/5 space-y-1.5">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1">
                                <Sparkles className="w-3 h-3" />
                                Marketplace Highlights:
                              </span>
                              <div className="flex flex-wrap gap-1.5">
                                {g.aiSummary.map((bullet, bIdx) => (
                                  <span
                                    key={bIdx}
                                    className="px-2.5 py-1 rounded-md text-[11px] bg-cyan-500/10 border border-cyan-500/20 text-cyan-200"
                                  >
                                    &bull; {bullet}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Package Breakdown (3 Packages) */}
                      {g.packages && g.packages.length > 0 && (
                        <div className="pt-3 border-t border-white/5 space-y-3">
                          <h6 className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                            Extracted Pricing Packages ({g.packages.length} Tiers)
                          </h6>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            {g.packages.map((pkg, pIdx) => (
                              <div
                                key={pIdx}
                                className="p-3.5 rounded-xl bg-white/5 border border-white/5 flex flex-col justify-between space-y-3 hover:border-emerald-500/20 transition-colors"
                              >
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="text-xs font-bold text-white">{pkg.title}</span>
                                    <span className="text-sm font-black text-emerald-400">
                                      ${pkg.price}
                                    </span>
                                  </div>
                                  <div className="text-[10px] text-cyan-300 font-mono">
                                    {pkg.durationDays} Days Delivery &bull; {pkg.revisions} Revisions
                                  </div>
                                  <p className="text-[11px] text-gray-300 leading-relaxed">
                                    {pkg.description}
                                  </p>

                                  {/* Deliverables Checklist */}
                                  {pkg.features && pkg.features.length > 0 && (
                                    <div className="pt-2.5 border-t border-white/10 space-y-1.5">
                                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1">
                                        <ListChecks className="w-3 h-3 text-emerald-400" />
                                        Deliverables & Scope:
                                      </span>
                                      <div className="space-y-1">
                                        {pkg.features.map((feat, fIdx) => (
                                          <div
                                            key={fIdx}
                                            className={`flex items-start gap-1.5 text-[11px] ${
                                              feat.included ? 'text-gray-200' : 'text-gray-500 line-through opacity-60'
                                            }`}
                                          >
                                            {feat.included ? (
                                              <Check className="w-3 h-3 text-emerald-400 shrink-0 mt-0.5" />
                                            ) : (
                                              <span className="w-3 h-3 text-gray-600 shrink-0 text-center font-bold">&times;</span>
                                            )}
                                            <span className="leading-tight">{feat.label}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Frequently Asked Questions (FAQs) */}
                      {g.faqs && g.faqs.length > 0 && (
                        <div className="p-4 rounded-xl bg-purple-500/5 border border-purple-500/20 space-y-3">
                          <div className="flex items-center justify-between">
                            <h6 className="text-xs font-bold uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
                              <HelpCircle className="w-3.5 h-3.5 text-purple-400" />
                              Gig Frequently Asked Questions ({g.faqs.length} FAQs)
                            </h6>
                            <button
                              type="button"
                              onClick={() => toggleFaq(g.id)}
                              className="text-[11px] font-bold text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1 cursor-pointer bg-purple-500/10 hover:bg-purple-500/20 px-2.5 py-1 rounded-lg border border-purple-500/20"
                            >
                              {expandedFaqs[g.id] ? (
                                <>Collapse FAQs <ChevronUp className="w-3 h-3" /></>
                              ) : (
                                <>View All FAQs <ChevronDown className="w-3 h-3" /></>
                              )}
                            </button>
                          </div>

                          {expandedFaqs[g.id] && (
                            <div className="space-y-2 pt-1">
                              {g.faqs.map((faq, fIdx) => (
                                <div key={fIdx} className="p-3 rounded-lg bg-black/40 border border-white/5 space-y-1.5">
                                  <div className="text-xs font-bold text-white flex items-start gap-2">
                                    <span className="w-4 h-4 rounded-md bg-purple-500/20 text-purple-300 text-[10px] flex items-center justify-center font-mono shrink-0 mt-0.5">
                                      Q
                                    </span>
                                    <span>{faq.question}</span>
                                  </div>
                                  <p className="text-xs text-gray-300 pl-6 leading-relaxed">
                                    {faq.answer}
                                  </p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Buyer Reviews OR New Seller Status */}
            {scrapedProfile.recentReviews.length > 0 ? (
              <div className="py-5">
                <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  Recent Buyer Testimonials ({scrapedProfile.recentReviews.length})
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {scrapedProfile.recentReviews.slice(0, 4).map((rev, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-white/5 border border-white/5 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-white">@{rev.reviewer}</span>
                          {rev.reviewerCountry && (
                            <span className="text-[10px] text-gray-400">
                              ({rev.reviewerCountry})
                            </span>
                          )}
                        </div>
                        <div className="flex items-center text-amber-400 text-xs">
                          {'★'.repeat(Math.round(rev.rating))}
                        </div>
                      </div>
                      <p className="text-xs text-gray-300 italic line-clamp-3">
                        "{rev.comment}"
                      </p>
                      {rev.workSample && (
                        <div className="pt-2">
                          <img
                            src={rev.workSample}
                            alt="Delivered work"
                            className="h-20 rounded-lg object-cover border border-white/10"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="py-5 p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white">
                      Level Status: {scrapedProfile.sellerLevel} &bull; Ready for High-Ticket Orders
                    </span>
                    <p className="text-[11px] text-gray-400">
                      Your {scrapedProfile.gigs.length} live gigs and tech stack are verified. In Step 2, our strategist will craft your unfair differentiation strategy to win clients rapidly.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Bottom Action Footer */}
            <div className="mt-6 pt-5 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 bg-emerald-500/5 p-4 rounded-xl border border-emerald-500/20">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <span className="text-xs font-bold text-white">
                    Live Fiverr Data Verified & Ready
                  </span>
                  <p className="text-[11px] text-gray-400">
                    Lock this profile into your database to ground all strategies, gig generators, and pitches in your true market standing.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => setScrapedProfile(null)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-gray-300 hover:text-white transition-all"
                >
                  Change Handle
                </button>
                <button
                  type="button"
                  onClick={handleConfirmProfile}
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-gray-950 font-black text-xs shadow-lg shadow-emerald-500/20 hover:from-emerald-400 hover:to-teal-500 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 whitespace-nowrap"
                >
                  {saving ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Saving Profile to Database...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Confirm & Lock Context (Proceed to Step 2)</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
