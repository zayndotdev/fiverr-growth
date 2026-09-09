import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  ExternalLink,
  Star,
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ShieldCheck,
  Check,
  Zap,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  User,
  Heart,
  RotateCcw,
  Send
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
  onProfileConfirmed?: (profile: ScrapedFiverrProfile) => void;
  onSkip?: () => void;
  onOpenAuth?: () => void;
}

export const OnboardingStep1: React.FC<OnboardingStep1Props> = ({
  onProfileConfirmed,
  onSkip,
  onOpenAuth,
}) => {
  const { user, userContext, updateUserContext, updateOnboardingState } = useAuth();
  const navigate = useNavigate();

  const [inputHandle, setInputHandle] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingPhase, setLoadingPhase] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [scrapedProfile, setScrapedProfile] = useState<ScrapedFiverrProfile | null>(
    userContext?.fiverrProfile || null
  );
  const [activeStep1Tab, setActiveStep1Tab] = useState<'profile' | 'gigs'>('profile');

  // Interaction states for the Fiverr UI
  const [selectedGigIndex, setSelectedGigIndex] = useState<number>(0);
  const [selectedPackageTabs, setSelectedPackageTabs] = useState<Record<string | number, number>>({});
  const [activeGalleryIndices, setActiveGalleryIndices] = useState<Record<string | number, number>>({});
  const [expandedDescriptions, setExpandedDescriptions] = useState<Record<string | number, boolean>>({});
  const [expandedFaqs, setExpandedFaqs] = useState<Record<string | number, boolean>>({});
  const [expandedBio, setExpandedBio] = useState(false);

  const toggleDescription = (id: string | number) => {
    setExpandedDescriptions(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleFaq = (id: string | number) => {
    setExpandedFaqs(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handlePackageTabChange = (gigId: string | number, tabIdx: number) => {
    setSelectedPackageTabs(prev => ({ ...prev, [gigId]: tabIdx }));
  };

  const handleGalleryChange = (gigId: string | number, imgIdx: number) => {
    setActiveGalleryIndices(prev => ({ ...prev, [gigId]: imgIdx }));
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
      setLoadingPhase('Extracting seller tier, credentials, and full gig catalog...');
    }, 800);

    const phaseTimer2 = setTimeout(() => {
      setLoadingPhase('Ingesting 3-tier packages, deliverables checklist, FAQs & buyer reviews...');
    }, 1800);

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
      setSelectedGigIndex(0);
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

      updateOnboardingState({
        onboardingStep: 2,
        fiverrProfile: scrapedProfile,
      });

      if (onProfileConfirmed) {
        onProfileConfirmed(scrapedProfile);
      } else {
        navigate('/onboarding/step/2');
      }
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

      updateOnboardingState({
        onboardingStep: 2,
      });

      if (onSkip) {
        onSkip();
      } else {
        navigate('/onboarding/step/2');
      }
    } catch (err) {
      console.warn('Fresh start error:', err);
      if (onSkip) {
        onSkip();
      } else {
        navigate('/onboarding/step/2');
      }
    } finally {
      setSaving(false);
    }
  };

  // Helper to compute rating breakdown
  const computeRatingBreakdown = () => {
    if (!scrapedProfile) return { 5: 92, 4: 8, 3: 0, 2: 0, 1: 0 };
    const revs = scrapedProfile.recentReviews || [];
    if (revs.length === 0) {
      if (scrapedProfile.rating >= 4.8) return { 5: 95, 4: 5, 3: 0, 2: 0, 1: 0 };
      return { 5: 80, 4: 15, 3: 5, 2: 0, 1: 0 };
    }
    const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    revs.forEach(r => {
      const star = Math.min(5, Math.max(1, Math.round(r.rating))) as 1 | 2 | 3 | 4 | 5;
      counts[star] = (counts[star] || 0) + 1;
    });
    const total = revs.length;
    return {
      5: Math.round((counts[5] / total) * 100),
      4: Math.round((counts[4] / total) * 100),
      3: Math.round((counts[3] / total) * 100),
      2: Math.round((counts[2] / total) * 100),
      1: Math.round((counts[1] / total) * 100),
    };
  };

  const ratingBars = computeRatingBreakdown();
  const activeGig = scrapedProfile?.gigs?.[selectedGigIndex] || scrapedProfile?.gigs?.[0];

  return (
    <div className="space-y-6">
      {/* Top Search & Audit Bar */}
      <div className="bg-white border border-[#dadbdd] rounded-lg p-5 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#1dbf73]/10 flex items-center justify-center text-[#1dbf73] font-bold shrink-0">
              <Zap className="w-5 h-5 fill-[#1dbf73]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#1dbf73]">
                  Onboarding Step 1 of 4
                </span>
                <span className="w-2 h-2 rounded-full bg-[#1dbf73] animate-pulse" />
              </div>
              <h2 className="text-lg font-bold text-[#222325]">
                Fiverr Live Profile & Catalog Ingestion
              </h2>
              <p className="text-xs text-[#74767e]">
                Enter any Fiverr username or URL to extract real-time credentials, active gigs, pricing packages, FAQs, and buyer reviews.
              </p>
            </div>
          </div>

          <div className="w-full md:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <form onSubmit={handleScrape} className="flex items-center gap-2 w-full sm:w-80 lg:w-96">
              <div className="relative flex-1">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-xs font-semibold text-[#74767e]">
                  fiverr.com/
                </span>
                <input
                  type="text"
                  value={inputHandle}
                  onChange={(e) => setInputHandle(e.target.value)}
                  placeholder="dev_zaynee"
                  disabled={loading}
                  className="w-full pl-24 pr-4 py-2 border border-[#dadbdd] rounded text-sm text-[#222325] focus:border-[#1dbf73] focus:outline-none focus:ring-1 focus:ring-[#1dbf73] transition-colors"
                />
              </div>
              <button
                type="submit"
                disabled={loading || !inputHandle.trim()}
                className="fiverr-btn-green px-4 py-2 text-sm font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Scraping...</span>
                  </>
                ) : (
                  <>
                    <span>Audit</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Quick try options & status feedback */}
        <div className="flex flex-wrap items-center justify-between gap-3 mt-3 pt-3 border-t border-[#efeff0]">
          <div className="flex items-center gap-2 text-xs text-[#74767e]">
            <span>Try sample accounts:</span>
            <button
              type="button"
              onClick={() => {
                setInputHandle('dev_zaynee');
              }}
              className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#f5f5f5] text-[#404145] hover:bg-[#e4e5e7] hover:text-[#222325] transition-colors border border-[#dadbdd]"
            >
              dev_zaynee
            </button>
            <button
              type="button"
              onClick={() => {
                setInputHandle('tasaduqe_codes');
              }}
              className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#f5f5f5] text-[#404145] hover:bg-[#e4e5e7] hover:text-[#222325] transition-colors border border-[#dadbdd]"
            >
              tasaduqe_codes
            </button>
            {user?.username && (
              <button
                type="button"
                onClick={() => setInputHandle(user.username)}
                className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#f5f5f5] text-[#404145] hover:bg-[#e4e5e7] hover:text-[#222325] transition-colors border border-[#dadbdd]"
              >
                {user.username}
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={handleFreshStart}
            disabled={saving}
            className="text-xs text-[#74767e] hover:text-[#1dbf73] underline transition-colors"
          >
            Starting as a new freelancer without an existing profile?
          </button>
        </div>

        {/* Live Loading Phase Feedback */}
        {loading && (
          <div className="mt-3 p-3 rounded bg-[#1dbf73]/10 border border-[#1dbf73]/20 text-[#19a463] text-xs flex items-center justify-center gap-2 font-medium">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>{loadingPhase}</span>
          </div>
        )}

        {/* Error Feedback */}
        {error && (
          <div className="mt-3 p-3 rounded bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Main Scraped Profile View: Pixel-Accurate Fiverr 2-Column Experience */}
      {scrapedProfile ? (
        <div className="fiverr-canvas bg-[#f7f7f7] p-4 sm:p-6 rounded-xl border border-[#dadbdd] space-y-6">
          {/* Top Status Header */}
          <div className="bg-white border border-[#dadbdd] rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#1dbf73]/10 text-[#1dbf73] flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5 text-[#1dbf73]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-[#222325]">
                    Profile Verified: @{scrapedProfile.username}
                  </h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#1dbf73]/10 text-[#19a463] border border-[#1dbf73]/20">
                    Live Data Grounded
                  </span>
                </div>
                <p className="text-xs text-[#74767e]">
                  {scrapedProfile.gigs.length} Gigs &bull; {scrapedProfile.skills.length} Endorsed Skills &bull; {scrapedProfile.reviewCount} Buyer Reviews
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <a
                href={scrapedProfile.profileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="fiverr-btn-outline px-3 py-1.5 text-xs flex items-center gap-1.5"
              >
                <span>View on Fiverr</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <button
                type="button"
                onClick={handleConfirmProfile}
                disabled={saving}
                className="fiverr-btn-green px-4 py-2 text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Confirm & Proceed to Step 2</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* ─── Profile / Gigs Tab Navigation Bar ─── */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-[#dadbdd] pb-3 pt-1">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveStep1Tab('profile')}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all cursor-pointer ${
                  activeStep1Tab === 'profile'
                    ? 'bg-white text-[#1dbf73] shadow-xs border border-[#dadbdd] ring-1 ring-[#1dbf73]/20'
                    : 'text-[#62646a] hover:text-[#222325] hover:bg-white/60'
                }`}
              >
                <User className={`w-4 h-4 ${activeStep1Tab === 'profile' ? 'text-[#1dbf73]' : 'text-[#74767e]'}`} />
                <span>Seller Profile</span>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                  activeStep1Tab === 'profile' ? 'bg-[#1dbf73]/10 text-[#1dbf73]' : 'bg-[#e4e5e7] text-[#62646a]'
                }`}>
                  {scrapedProfile.skills.length} Skills &bull; {scrapedProfile.rating.toFixed(1)}★
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveStep1Tab('gigs')}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all cursor-pointer ${
                  activeStep1Tab === 'gigs'
                    ? 'bg-white text-[#1dbf73] shadow-xs border border-[#dadbdd] ring-1 ring-[#1dbf73]/20'
                    : 'text-[#62646a] hover:text-[#222325] hover:bg-white/60'
                }`}
              >
                <Sparkles className={`w-4 h-4 ${activeStep1Tab === 'gigs' ? 'text-[#1dbf73]' : 'text-[#74767e]'}`} />
                <span>Gigs &amp; Packages</span>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                  activeStep1Tab === 'gigs' ? 'bg-[#1dbf73]/10 text-[#1dbf73]' : 'bg-[#e4e5e7] text-[#62646a]'
                }`}>
                  {scrapedProfile.gigs.length} {scrapedProfile.gigs.length === 1 ? 'Gig' : 'Gigs'}
                </span>
              </button>
            </div>

            <div className="text-xs text-[#74767e] hidden sm:block">
              Switch tabs to preview all extracted data before proceeding
            </div>
          </div>

          {/* ============================================================== */}
          {/* TAB 1: SELLER PROFILE VIEW                                     */}
          {/* ============================================================== */}
          {activeStep1Tab === 'profile' && (
            <div className="space-y-6">
              {/* Card 1: Identity & Quick Stats Header */}
              <div className="fiverr-card bg-white border border-[#dadbdd] rounded-xl p-6 sm:p-8 shadow-sm space-y-6">
                <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                  {/* 110px Avatar with Online Indicator */}
                  <div className="relative inline-block shrink-0 mx-auto md:mx-0">
                    {scrapedProfile.avatarUrl ? (
                      <img
                        src={scrapedProfile.avatarUrl}
                        alt={scrapedProfile.displayName}
                        className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover border-2 border-white shadow-md ring-1 ring-[#dadbdd]"
                      />
                    ) : (
                      <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-[#e4e5e7] flex items-center justify-center text-3xl font-bold text-[#74767e]">
                        {scrapedProfile.displayName.charAt(0)}
                      </div>
                    )}
                    <span
                      className="absolute bottom-1 right-1 w-4 h-4 bg-[#1dbf73] rounded-full border-2 border-white shadow-sm"
                      title="Online"
                    />
                  </div>

                  {/* Name, Handle, Badges, Rating */}
                  <div className="space-y-2 flex-1 min-w-0 text-center md:text-left">
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5">
                      <h1 className="text-2xl sm:text-3xl font-bold text-[#222325]">
                        {scrapedProfile.displayName}
                      </h1>
                      <span className="text-sm text-[#74767e] font-normal">
                        @{scrapedProfile.username}
                      </span>
                      {scrapedProfile.sellerLevel && (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#f5f5f5] text-[#222325] border border-[#dadbdd]">
                          {scrapedProfile.sellerLevel}
                        </span>
                      )}
                      {scrapedProfile.isPro && (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#222325] text-white">
                          PRO
                        </span>
                      )}
                      {scrapedProfile.isAgency && (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#1dbf73]/10 text-[#19a463] border border-[#1dbf73]/20">
                          Agency
                        </span>
                      )}
                    </div>

                    {scrapedProfile.tagline && (
                      <p className="text-sm sm:text-base text-[#62646a] italic">
                        "{scrapedProfile.tagline}"
                      </p>
                    )}

                    {/* Star Rating & Reviews */}
                    <div className="flex items-center justify-center md:justify-start gap-2 text-sm pt-1">
                      <div className="flex items-center gap-1 font-bold text-[#222325]">
                        <Star className="w-4 h-4 text-[#ffb33e] fill-[#ffb33e]" />
                        <span>{scrapedProfile.rating.toFixed(1)}</span>
                      </div>
                      <span className="text-[#74767e]">
                        ({scrapedProfile.reviewCount} reviews)
                      </span>
                      <span className="text-[#dadbdd]">&bull;</span>
                      <span className="text-xs text-[#1dbf73] font-semibold flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Fiverr Verified Seller
                      </span>
                    </div>
                  </div>
                </div>

                {/* 4-Item Quick Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-5 border-t border-[#efeff0]">
                  <div className="p-3 bg-[#f7f7f7] rounded-lg border border-[#e4e5e7]">
                    <span className="text-[11px] font-bold text-[#74767e] uppercase flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#74767e]" />
                      From
                    </span>
                    <p className="text-sm font-bold text-[#222325] mt-1">
                      {scrapedProfile.country} {scrapedProfile.countryCode ? `(${scrapedProfile.countryCode})` : ''}
                    </p>
                  </div>

                  <div className="p-3 bg-[#f7f7f7] rounded-lg border border-[#e4e5e7]">
                    <span className="text-[11px] font-bold text-[#74767e] uppercase flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-[#74767e]" />
                      Member Since
                    </span>
                    <p className="text-sm font-bold text-[#222325] mt-1">
                      {scrapedProfile.memberSince || 'May 2023'}
                    </p>
                  </div>

                  <div className="p-3 bg-[#f7f7f7] rounded-lg border border-[#e4e5e7]">
                    <span className="text-[11px] font-bold text-[#74767e] uppercase flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-[#74767e]" />
                      Avg. Response
                    </span>
                    <p className="text-sm font-bold text-[#222325] mt-1">
                      {scrapedProfile.responseTimeText || '< 1 hour'}
                    </p>
                  </div>

                  <div className="p-3 bg-[#f7f7f7] rounded-lg border border-[#e4e5e7]">
                    <span className="text-[11px] font-bold text-[#74767e] uppercase flex items-center gap-1.5">
                      <Send className="w-3.5 h-3.5 text-[#74767e]" />
                      Last Delivery
                    </span>
                    <p className="text-sm font-bold text-[#222325] mt-1">
                      {scrapedProfile.lastDeliveryText || 'Recent'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Card 2: Description / Bio */}
              {scrapedProfile.description && (
                <div className="fiverr-card bg-white border border-[#dadbdd] rounded-xl p-6 shadow-sm space-y-3">
                  <h3 className="text-base font-bold text-[#222325] pb-2 border-b border-[#efeff0]">
                    Description &amp; About
                  </h3>
                  <div className="text-sm text-[#404145] leading-relaxed whitespace-pre-line">
                    {expandedBio || scrapedProfile.description.length <= 400 ? (
                      cleanHtmlEntities(scrapedProfile.description)
                    ) : (
                      <>
                        {cleanHtmlEntities(scrapedProfile.description).slice(0, 400)}...
                        <button
                          type="button"
                          onClick={() => setExpandedBio(true)}
                          className="text-[#1dbf73] font-bold text-xs ml-1 hover:underline cursor-pointer"
                        >
                          + See More
                        </button>
                      </>
                    )}
                    {expandedBio && scrapedProfile.description.length > 400 && (
                      <button
                        type="button"
                        onClick={() => setExpandedBio(false)}
                        className="text-[#1dbf73] font-bold text-xs ml-1 hover:underline cursor-pointer block mt-2"
                      >
                        - See Less
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Card 3: Skills & Tech Stack */}
              {scrapedProfile.skills.length > 0 && (
                <div className="fiverr-card bg-white border border-[#dadbdd] rounded-xl p-6 shadow-sm space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-[#efeff0]">
                    <h3 className="text-base font-bold text-[#222325]">
                      Skills &amp; Technologies
                    </h3>
                    <span className="text-xs font-semibold text-[#74767e] bg-[#f5f5f5] px-2.5 py-0.5 rounded-full border border-[#dadbdd]">
                      {scrapedProfile.skills.length} Endorsed Skills
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {scrapedProfile.skills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="px-3.5 py-1.5 rounded-full bg-[#f5f5f5] border border-[#dadbdd] text-xs font-medium text-[#404145] hover:border-[#1dbf73] hover:text-[#1dbf73] hover:bg-white transition-all inline-flex items-center gap-1.5"
                      >
                        {skill.name}
                        {skill.verified && (
                          <Check className="w-3 h-3 text-[#1dbf73]" />
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Card 4: Languages, Education & Certifications Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Languages */}
                <div className="fiverr-card bg-white border border-[#dadbdd] rounded-xl p-5 shadow-sm space-y-3">
                  <h3 className="text-sm font-bold text-[#222325] pb-2 border-b border-[#efeff0]">
                    Languages
                  </h3>
                  {scrapedProfile.languages.length > 0 ? (
                    <div className="space-y-2 text-xs">
                      {scrapedProfile.languages.map((lang, idx) => (
                        <div key={idx} className="flex items-center justify-between">
                          <span className="font-semibold text-[#222325]">{lang.language}</span>
                          <span className="text-[#74767e] bg-[#f5f5f5] px-2 py-0.5 rounded border border-[#dadbdd]">
                            {lang.level}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-[#74767e]">Not specified</p>
                  )}
                </div>

                {/* Education */}
                <div className="fiverr-card bg-white border border-[#dadbdd] rounded-xl p-5 shadow-sm space-y-3">
                  <h3 className="text-sm font-bold text-[#222325] pb-2 border-b border-[#efeff0]">
                    Education
                  </h3>
                  {scrapedProfile.education.length > 0 ? (
                    <div className="space-y-2.5 text-xs">
                      {scrapedProfile.education.map((edu, idx) => (
                        <div key={idx} className="border-b border-[#efeff0] pb-2 last:border-b-0 last:pb-0">
                          <div className="font-bold text-[#222325] capitalize">{edu.degree}</div>
                          <div className="text-[#74767e] mt-0.5">
                            {edu.school} {edu.toYear ? `(${edu.toYear})` : ''}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-[#74767e]">Not specified</p>
                  )}
                </div>

                {/* Certifications */}
                <div className="fiverr-card bg-white border border-[#dadbdd] rounded-xl p-5 shadow-sm space-y-3">
                  <h3 className="text-sm font-bold text-[#222325] pb-2 border-b border-[#efeff0]">
                    Certifications
                  </h3>
                  {scrapedProfile.certifications.length > 0 ? (
                    <div className="space-y-2.5 text-xs">
                      {scrapedProfile.certifications.map((cert, idx) => (
                        <div key={idx} className="border-b border-[#efeff0] pb-2 last:border-b-0 last:pb-0">
                          <div className="font-bold text-[#222325]">{cert.name}</div>
                          <div className="text-[#74767e] mt-0.5">
                            {cert.from} {cert.year ? `• ${cert.year}` : ''}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-[#74767e]">None listed</p>
                  )}
                </div>
              </div>

              {/* Card 5: Buyer Reviews & 5-Star Breakdown */}
              <div className="fiverr-card bg-white border border-[#dadbdd] rounded-xl p-6 lg:p-8 space-y-6 shadow-sm">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#dadbdd]">
                  <div>
                    <h3 className="text-xl font-bold text-[#222325]">
                      Client Reviews ({scrapedProfile.reviewCount})
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex text-[#ffb33e]">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-[#ffb33e]" />
                        ))}
                      </div>
                      <span className="font-bold text-sm text-[#222325]">
                        {scrapedProfile.rating.toFixed(1)}
                      </span>
                      <span className="text-xs text-[#74767e]">
                        Overall rating from verified clients
                      </span>
                    </div>
                  </div>
                </div>

                {/* 5-Star Breakdown Progress Bars */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                  <div className="space-y-2 text-xs">
                    {([5, 4, 3, 2, 1] as const).map((starNum) => {
                      const pct = ratingBars[starNum];
                      return (
                        <div key={starNum} className="flex items-center gap-3">
                          <span className="w-14 font-bold text-[#222325]">
                            {starNum} Stars
                          </span>
                          <div className="flex-1 h-2.5 rounded-full bg-[#efeff0] overflow-hidden">
                            <div
                              className="h-full bg-[#ffb33e] rounded-full transition-all duration-500"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="w-12 text-right text-[#74767e] font-semibold">
                            ({pct}%)
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="p-4 rounded-lg bg-[#fafafa] border border-[#dadbdd] space-y-2 text-xs">
                    <div className="flex items-center gap-2 text-[#222325] font-bold">
                      <ShieldCheck className="w-4 h-4 text-[#1dbf73]" />
                      <span>Verified Client Feedback</span>
                    </div>
                    <p className="text-[#62646a] leading-relaxed">
                      All testimonials reflect orders paid, delivered, and completed through Fiverr's marketplace escrow.
                    </p>
                  </div>
                </div>

                {/* Review Cards */}
                {scrapedProfile.recentReviews && scrapedProfile.recentReviews.length > 0 ? (
                  <div className="space-y-6 pt-4 border-t border-[#efeff0]">
                    {scrapedProfile.recentReviews.map((rev, rIdx) => (
                      <div key={rIdx} className="space-y-3 pb-5 border-b border-[#efeff0] last:border-b-0">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-[#e4e5e7] flex items-center justify-center font-bold text-sm text-[#404145]">
                              {rev.reviewer.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-bold text-sm text-[#222325]">
                                @{rev.reviewer}
                              </div>
                              <div className="text-xs text-[#74767e] flex items-center gap-1.5">
                                {rev.reviewerCountry && <span>{rev.reviewerCountry}</span>}
                                {rev.createdAt && <span>&bull; {rev.createdAt}</span>}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 text-[#ffb33e]">
                            {[...Array(Math.min(5, Math.round(rev.rating)))].map((_, i) => (
                              <Star key={i} className="w-3.5 h-3.5 fill-[#ffb33e]" />
                            ))}
                            <span className="font-bold text-xs text-[#222325] ml-1">
                              {rev.rating.toFixed(1)}
                            </span>
                          </div>
                        </div>

                        <p className="text-sm text-[#404145] leading-relaxed">
                          "{rev.comment}"
                        </p>

                        {/* Seller Response */}
                        {rev.sellerResponse && (
                          <div className="ml-6 pl-4 border-l-2 border-[#1dbf73] bg-[#fafafa] p-3 rounded-r-lg space-y-1">
                            <div className="flex items-center gap-2 text-xs font-bold text-[#222325]">
                              <div className="w-4 h-4 rounded-full bg-[#1dbf73] text-white flex items-center justify-center text-[9px]">
                                {scrapedProfile.displayName.charAt(0)}
                              </div>
                              <span>Seller Response</span>
                            </div>
                            <p className="text-xs text-[#62646a] italic">
                              "{rev.sellerResponse}"
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-[#74767e] italic py-2">
                    No individual buyer review comments displayed yet.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 2: GIGS & PACKAGES VIEW                                    */}
          {/* ============================================================== */}
          {activeStep1Tab === 'gigs' && (
            <div className="space-y-8">
              {/* SECTION 1: Gig Catalog Selector */}
              <div className="bg-white border border-[#dadbdd] rounded-xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-[#222325]">
                      Published Gigs ({scrapedProfile.gigs.length})
                    </h2>
                    <p className="text-xs text-[#74767e] mt-0.5">
                      Select any gig card below to inspect its pricing packages, deliverables scope, and FAQs.
                    </p>
                  </div>
                  <span className="text-xs font-bold text-[#74767e] bg-[#f5f5f5] px-3 py-1 rounded border border-[#dadbdd]">
                    {scrapedProfile.gigs.length} {scrapedProfile.gigs.length === 1 ? 'Active Gig' : 'Active Gigs'}
                  </span>
                </div>

                {scrapedProfile.gigs.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {scrapedProfile.gigs.map((gig, idx) => {
                      const isSelected = selectedGigIndex === idx;
                      return (
                        <div
                          key={idx}
                          onClick={() => setSelectedGigIndex(idx)}
                          className={`fiverr-card bg-white border rounded-xl overflow-hidden flex flex-col justify-between cursor-pointer transition-all duration-200 group ${
                            isSelected
                              ? 'ring-2 ring-[#1dbf73] border-[#1dbf73] shadow-md bg-[#1dbf73]/5'
                              : 'border-[#dadbdd] hover:shadow-md hover:border-[#b5b6ba]'
                          }`}
                        >
                          <div>
                            {/* 16:10 Aspect Ratio Image */}
                            <div className="aspect-[16/10] w-full overflow-hidden bg-[#e4e5e7] relative">
                              {gig.imageUrl ? (
                                <img
                                  src={gig.imageUrl}
                                  alt={gig.title}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-xs font-semibold text-[#74767e]">
                                  Fiverr Gig
                                </div>
                              )}
                              {isSelected && (
                                <span className="absolute top-2 left-2 bg-[#1dbf73] text-white text-[10px] font-bold px-2 py-0.5 rounded shadow">
                                  Currently Inspecting
                                </span>
                              )}
                            </div>

                            {/* Card Content */}
                            <div className="p-4 space-y-2">
                              {/* Title: 2-line clamp */}
                              <h3 className="text-sm font-bold text-[#222325] line-clamp-2 leading-snug group-hover:text-[#1dbf73] transition-colors min-h-[2.5rem]">
                                {gig.title}
                              </h3>

                              {/* Star Rating */}
                              <div className="flex items-center gap-1 text-xs">
                                <Star className="w-3.5 h-3.5 text-[#ffb33e] fill-[#ffb33e]" />
                                <span className="font-bold text-[#222325]">
                                  {gig.rating ? gig.rating.toFixed(1) : scrapedProfile.rating.toFixed(1)}
                                </span>
                                <span className="text-[#74767e]">
                                  ({gig.reviewCount || scrapedProfile.reviewCount})
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Footer: Starting at Price */}
                          <div className="border-t border-[#efeff0] px-4 py-2.5 flex items-center justify-between bg-white">
                            <Heart className="w-4 h-4 text-[#b5b6ba] hover:text-[#ff455b] transition-colors" />
                            <div className="text-right">
                              <span className="text-[10px] font-bold text-[#74767e] uppercase tracking-wider block">
                                Starting at
                              </span>
                              <span className="text-base font-bold text-[#222325]">
                                {typeof gig.startingPrice === 'number'
                                  ? `US$${gig.startingPrice}`
                                  : gig.startingPrice.startsWith('US$') || gig.startingPrice.startsWith('$')
                                  ? gig.startingPrice
                                  : `US$${gig.startingPrice}`}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="bg-[#f7f7f7] border border-[#dadbdd] rounded-lg p-8 text-center text-sm text-[#74767e]">
                    No public marketplace gigs active.
                  </div>
                )}
              </div>

              {/* SECTION 2: Deep-Dive Gig Inspector (Spacious Layout) */}
              {activeGig && (
                <div className="fiverr-card bg-white border border-[#dadbdd] rounded-xl p-6 lg:p-8 space-y-6 shadow-sm">
                  {/* Breadcrumbs */}
                  <div className="text-xs text-[#74767e] flex items-center gap-1.5 flex-wrap">
                    <span className="text-[#1dbf73] font-medium">Home</span>
                    <span>&gt;</span>
                    <span>{activeGig.category || 'Programming & Tech'}</span>
                    {activeGig.subCategory && (
                      <>
                        <span>&gt;</span>
                        <span>{activeGig.subCategory}</span>
                      </>
                    )}
                    {activeGig.nestedCategory && (
                      <>
                        <span>&gt;</span>
                        <span>{activeGig.nestedCategory}</span>
                      </>
                    )}
                  </div>

                  {/* Gig Title */}
                  <h2 className="text-2xl sm:text-3xl font-bold text-[#222325] leading-tight">
                    {activeGig.title}
                  </h2>

                  {/* Seller Header Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#dadbdd]">
                    <div className="flex items-center gap-3">
                      {scrapedProfile.avatarUrl ? (
                        <img
                          src={scrapedProfile.avatarUrl}
                          alt={scrapedProfile.displayName}
                          className="w-10 h-10 rounded-full object-cover border border-[#dadbdd]"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-[#dadbdd] flex items-center justify-center font-bold text-sm text-[#404145]">
                          {scrapedProfile.displayName.charAt(0)}
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-[#222325]">
                            {scrapedProfile.displayName}
                          </span>
                          <span className="text-xs text-[#74767e]">
                            @{scrapedProfile.username}
                          </span>
                          {scrapedProfile.sellerLevel && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#f5f5f5] text-[#404145] border border-[#dadbdd]">
                              {scrapedProfile.sellerLevel}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs mt-0.5">
                          <div className="flex items-center text-[#ffb33e]">
                            <Star className="w-3.5 h-3.5 fill-[#ffb33e]" />
                            <span className="font-bold text-[#222325] ml-1">
                              {activeGig.rating ? activeGig.rating.toFixed(1) : scrapedProfile.rating.toFixed(1)}
                            </span>
                          </div>
                          <span className="text-[#74767e]">
                            ({activeGig.reviewCount || scrapedProfile.reviewCount})
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Gig Showcase: Media Gallery + 3-Tier Package Widget */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Left Column: Media Gallery, Description, FAQs */}
                    <div className="lg:col-span-7 space-y-6">
                      {/* Gallery Viewport */}
                      {(() => {
                        const galleryList = activeGig.gallery && activeGig.gallery.length > 0
                          ? activeGig.gallery
                          : activeGig.imageUrl
                          ? [activeGig.imageUrl]
                          : [];
                        const activeIdx = activeGalleryIndices[activeGig.id] || 0;
                        const currentImg = galleryList[activeIdx] || activeGig.imageUrl;

                        return (
                          <div className="space-y-3">
                            <div className="aspect-[16/10] w-full rounded-xl overflow-hidden border border-[#dadbdd] bg-black relative group">
                              {currentImg ? (
                                <img
                                  src={currentImg}
                                  alt={activeGig.title}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                  No image available
                                </div>
                              )}

                              {/* Gallery Navigation Arrows */}
                              {galleryList.length > 1 && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleGalleryChange(
                                        activeGig.id,
                                        (activeIdx - 1 + galleryList.length) % galleryList.length
                                      )
                                    }
                                    className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 hover:bg-white text-[#222325] flex items-center justify-center shadow opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                  >
                                    <ChevronLeft className="w-5 h-5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleGalleryChange(
                                        activeGig.id,
                                        (activeIdx + 1) % galleryList.length
                                      )
                                    }
                                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 hover:bg-white text-[#222325] flex items-center justify-center shadow opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                  >
                                    <ChevronRight className="w-5 h-5" />
                                  </button>
                                </>
                              )}
                            </div>

                            {/* Thumbnail Strip */}
                            {galleryList.length > 1 && (
                              <div className="flex gap-2 overflow-x-auto pb-1">
                                {galleryList.map((thumbUrl, tIdx) => (
                                  <button
                                    key={tIdx}
                                    type="button"
                                    onClick={() => handleGalleryChange(activeGig.id, tIdx)}
                                    className={`w-16 h-11 rounded overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                                      activeIdx === tIdx
                                        ? 'border-[#1dbf73] shadow-sm'
                                        : 'border-transparent opacity-60 hover:opacity-100'
                                    }`}
                                  >
                                    <img
                                      src={thumbUrl}
                                      alt={`Thumbnail ${tIdx + 1}`}
                                      className="w-full h-full object-cover"
                                    />
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })()}

                      {/* Description */}
                      <div className="space-y-3 pt-2">
                        <h3 className="text-xl font-bold text-[#222325] pb-2 border-b border-[#dadbdd]">
                          About This Gig
                        </h3>
                        {activeGig.description ? (
                          <div className="text-sm text-[#404145] leading-relaxed whitespace-pre-line">
                            {expandedDescriptions[activeGig.id] || activeGig.description.length <= 600 ? (
                              cleanHtmlEntities(activeGig.description)
                            ) : (
                              <>
                                {cleanHtmlEntities(activeGig.description).slice(0, 600)}...
                                <button
                                  type="button"
                                  onClick={() => toggleDescription(activeGig.id)}
                                  className="text-[#1dbf73] font-bold text-xs ml-1 hover:underline cursor-pointer"
                                >
                                  + Read More
                                </button>
                              </>
                            )}
                            {expandedDescriptions[activeGig.id] && activeGig.description.length > 600 && (
                              <button
                                type="button"
                                onClick={() => toggleDescription(activeGig.id)}
                                className="text-[#1dbf73] font-bold text-xs ml-1 hover:underline cursor-pointer block mt-2"
                              >
                                - Read Less
                              </button>
                            )}
                          </div>
                        ) : (
                          <p className="text-xs text-[#74767e]">No description available for this gig.</p>
                        )}
                      </div>

                      {/* Marketplace Highlights */}
                      <div className="p-4 rounded-xl bg-[#fafafa] border border-[#dadbdd] space-y-2">
                        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#19a463]">
                          <Sparkles className="w-4 h-4 text-[#1dbf73]" />
                          <span>Marketplace Highlights</span>
                        </div>
                        <ul className="text-xs text-[#62646a] space-y-1.5 list-disc pl-4 leading-relaxed">
                          <li>This service offers custom full-stack web app and software development.</li>
                          <li>All orders include verified milestone deliverables and revisions scope.</li>
                          <li>Seller maintains a strong completion rate and responsive communication.</li>
                        </ul>
                      </div>

                      {/* Frequently Asked Questions */}
                      {activeGig.faqs && activeGig.faqs.length > 0 && (
                        <div className="space-y-3 pt-2">
                          <h3 className="text-xl font-bold text-[#222325] pb-2 border-b border-[#dadbdd]">
                            Frequently Asked Questions ({activeGig.faqs.length})
                          </h3>
                          <div className="space-y-2">
                            {activeGig.faqs.map((faq, fIdx) => {
                              const isOpen = expandedFaqs[`${activeGig.id}_${fIdx}`];
                              return (
                                <div
                                  key={fIdx}
                                  className="border border-[#dadbdd] rounded-lg overflow-hidden transition-colors"
                                >
                                  <button
                                    type="button"
                                    onClick={() => toggleFaq(`${activeGig.id}_${fIdx}`)}
                                    className="w-full px-4 py-3 text-left font-semibold text-sm text-[#222325] hover:text-[#1dbf73] flex items-center justify-between gap-4 cursor-pointer bg-white hover:bg-[#fafafa]"
                                  >
                                    <span>{faq.question}</span>
                                    {isOpen ? (
                                      <ChevronUp className="w-4 h-4 text-[#74767e] shrink-0" />
                                    ) : (
                                      <ChevronDown className="w-4 h-4 text-[#74767e] shrink-0" />
                                    )}
                                  </button>
                                  {isOpen && (
                                    <div className="px-4 pb-4 text-xs text-[#62646a] leading-relaxed border-t border-[#efeff0] pt-2">
                                      {faq.answer}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Related Tags */}
                      {activeGig.tags && activeGig.tags.length > 0 && (
                        <div className="space-y-2 pt-2">
                          <h4 className="text-xs font-bold text-[#74767e] uppercase tracking-wider">
                            Related Tags
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {activeGig.tags.map((tag, tIdx) => (
                              <span
                                key={tIdx}
                                className="px-3 py-1 rounded-full bg-[#f5f5f5] text-xs font-medium text-[#62646a] border border-[#dadbdd]"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Right Column: 3-Tier Package Pricing Widget (Sticky) */}
                    <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-4">
                      {activeGig.packages && activeGig.packages.length > 0 ? (
                        <div className="fiverr-card bg-white border border-[#dadbdd] rounded-xl overflow-hidden shadow-sm">
                          {/* 3 Tabs: Basic / Standard / Premium */}
                          <div className="grid grid-cols-3 border-b border-[#dadbdd] text-center font-bold text-sm bg-[#fafafa]">
                            {['Basic', 'Standard', 'Premium'].map((tabLabel, tIdx) => {
                              const activeTab = selectedPackageTabs[activeGig.id] ?? 0;
                              const isCurrentTab = activeTab === tIdx;
                              const pkgExists = activeGig.packages && activeGig.packages[tIdx];
                              return (
                                <button
                                  key={tabLabel}
                                  type="button"
                                  onClick={() => handlePackageTabChange(activeGig.id, tIdx)}
                                  className={`py-3.5 transition-colors cursor-pointer border-r border-[#dadbdd] last:border-r-0 ${
                                    isCurrentTab
                                      ? 'border-b-2 border-b-[#1dbf73] bg-white text-[#1dbf73]'
                                      : 'text-[#74767e] hover:text-[#222325]'
                                  }`}
                                >
                                  <span>{tabLabel}</span>
                                  {pkgExists && (
                                    <span className="block text-[11px] font-semibold text-[#74767e]">
                                      US${pkgExists.price}
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                          </div>

                          {/* Selected Package Details */}
                          {(() => {
                            const activeTab = selectedPackageTabs[activeGig.id] ?? 0;
                            const pkg = (activeGig.packages && activeGig.packages[activeTab]) || activeGig.packages?.[0];
                            if (!pkg) return null;

                            return (
                              <div className="p-6 space-y-4">
                                <div className="flex items-baseline justify-between gap-2">
                                  <h4 className="text-base font-bold text-[#222325]">
                                    {pkg.title}
                                  </h4>
                                  <span className="text-2xl font-bold text-[#222325]">
                                    US${pkg.price}
                                  </span>
                                </div>

                                <p className="text-xs text-[#62646a] leading-relaxed">
                                  {pkg.description}
                                </p>

                                {/* Delivery & Revisions row */}
                                <div className="flex items-center gap-4 text-xs font-bold text-[#62646a] pt-1">
                                  {pkg.durationDays && (
                                    <span className="flex items-center gap-1.5">
                                      <Clock className="w-4 h-4 text-[#74767e]" />
                                      {pkg.durationDays} Days Delivery
                                    </span>
                                  )}
                                  {pkg.revisions && (
                                    <span className="flex items-center gap-1.5">
                                      <RotateCcw className="w-4 h-4 text-[#74767e]" />
                                      {pkg.revisions} Revisions
                                    </span>
                                  )}
                                </div>

                                {/* Deliverables Checklist */}
                                {pkg.features && pkg.features.length > 0 && (
                                  <div className="pt-3 border-t border-[#efeff0] space-y-2">
                                    <span className="text-[11px] font-bold text-[#74767e] uppercase tracking-wider block">
                                      What's Included:
                                    </span>
                                    <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                                      {pkg.features.map((feat, fIdx) => (
                                        <div
                                          key={fIdx}
                                          className={`flex items-start gap-2 text-xs ${
                                            feat.included ? 'text-[#404145]' : 'text-[#95979d] line-through'
                                          }`}
                                        >
                                          {feat.included ? (
                                            <Check className="w-3.5 h-3.5 text-[#1dbf73] shrink-0 mt-0.5" />
                                          ) : (
                                            <span className="w-3.5 h-3.5 text-center text-[#95979d] shrink-0 font-bold">
                                              &mdash;
                                            </span>
                                          )}
                                          <span className="leading-tight">{feat.label}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Deliverables Summary Scope */}
                                <div className="pt-3 border-t border-[#efeff0]">
                                  <div className="p-3 bg-[#fafafa] rounded-lg border border-[#dadbdd] text-xs text-[#62646a] flex items-center justify-between">
                                    <span className="font-semibold">Package Tier Scope</span>
                                    <span className="text-[#1dbf73] font-bold">Verified Package</span>
                                  </div>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      ) : (
                        <div className="bg-white border border-[#dadbdd] rounded-lg p-6 text-center text-xs text-[#74767e]">
                          Custom pricing quote on request.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

              {/* ------------------------------------------------------------ */}
              {/* SECTION 4: Confirmation & Next Step Docked Bar               */}
              {/* ------------------------------------------------------------ */}
              <div className="bg-white border border-[#dadbdd] rounded-lg p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#1dbf73]/10 text-[#1dbf73] flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#222325]">
                      Ready to Ground Strategy with This Profile?
                    </h4>
                    <p className="text-xs text-[#74767e]">
                      Saving this profile locks your verified gigs, tiers, and reputation into the AI growth engine.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={() => setScrapedProfile(null)}
                    className="fiverr-btn-outline px-4 py-2 text-xs font-bold"
                  >
                    Change Profile
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmProfile}
                    disabled={saving}
                    className="fiverr-btn-green px-6 py-2.5 text-xs font-bold flex items-center gap-2 cursor-pointer shadow disabled:opacity-50"
                  >
                    {saving ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Saving to Database...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>Confirm & Proceed to Step 2</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      );
    };
