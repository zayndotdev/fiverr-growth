import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Star,
  Clock,
  MapPin,
  ExternalLink,
  Users2,
  Sparkles,
  Send,
  BarChart3,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Package,
  Target
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const SellerDashboardView: React.FC = () => {
  const { user, userContext } = useAuth();
  const navigate = useNavigate();
  const [bioExpanded, setBioExpanded] = useState(false);

  const profile = userContext?.fiverrProfile || user?.fiverrProfile;
  const icps = userContext?.icpProfiles || user?.icpProfiles || [];
  const gigs = profile?.gigs || [];

  // Calculate price spectrum
  const prices: number[] = [];
  gigs.forEach((g: any) => {
    if (g.packages && g.packages.length > 0) {
      g.packages.forEach((p: any) => {
        const num = typeof p.price === 'number' ? p.price : parseFloat(String(p.price).replace(/[^0-9.]/g, ''));
        if (num && !isNaN(num)) prices.push(num);
      });
    } else if (g.startingPrice) {
      const num = typeof g.startingPrice === 'number' ? g.startingPrice : parseFloat(String(g.startingPrice).replace(/[^0-9.]/g, ''));
      if (num && !isNaN(num)) prices.push(num);
    }
  });

  const priceFloor = prices.length > 0 ? Math.min(...prices) : 35;
  const priceCeiling = prices.length > 0 ? Math.max(...prices) : 250;
  const totalOrdersInQueue = gigs.reduce((acc: number, g: any) => acc + (g.ordersInQueue || 0), 0);

  return (
    <div className="w-full space-y-6 font-sans">
      {/* ─── 1. Seller Identity & Operational Vitals Card ─── */}
      <div className="bg-white border border-[#dadbdd] rounded-xl p-5 md:p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          {/* Left: Avatar & Identity */}
          <div className="flex items-start gap-4">
            <div className="relative shrink-0">
              {profile?.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt={profile.displayName || user?.username}
                  className="w-16 h-16 md:w-20 md:h-20 rounded-full object-cover border-2 border-white shadow-xs"
                />
              ) : (
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-[#1dbf73] flex items-center justify-center text-white text-2xl font-bold">
                  {(user?.username || 'U').charAt(0).toUpperCase()}
                </div>
              )}
              <span className="absolute bottom-1 right-1 w-3.5 h-3.5 bg-[#1dbf73] border-2 border-white rounded-full shadow-xs" />
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl md:text-2xl font-bold text-[#222325]">
                  {profile?.displayName || user?.username || 'Freelancer'}
                </h1>
                <span className="text-xs text-[#74767e]">@{profile?.username || user?.username}</span>

                {profile?.sellerLevel && (
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#f5f5f5] text-[#222325] border border-[#dadbdd]">
                    {profile.sellerLevel}
                  </span>
                )}
                {profile?.isPro && (
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#1dbf73] text-white">
                    PRO
                  </span>
                )}
                {profile?.isAgency && (
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-600 text-white">
                    AGENCY
                  </span>
                )}
              </div>

              <p className="text-xs md:text-sm font-medium text-[#404145]">
                {profile?.tagline || 'Full Stack & AI Solutions Engineer'}
              </p>

              <div className="flex items-center gap-3 text-xs text-[#74767e] pt-1 flex-wrap">
                {profile?.country && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-[#74767e]" />
                    <span>{profile.country}</span>
                  </div>
                )}
                {profile?.memberSince && (
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-[#74767e]" />
                    <span>Member since {profile.memberSince}</span>
                  </div>
                )}
                {profile?.profileUrl && (
                  <a
                    href={profile.profileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[#1dbf73] hover:underline font-medium"
                  >
                    <span>Fiverr Profile</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Right: 4 Operational Vitals Badges */}
          <div className="w-full lg:w-auto grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-[#f7f7f7] border border-[#dadbdd] rounded-lg p-3 text-center">
              <div className="flex items-center justify-center gap-1 text-[#222325] font-bold text-base">
                <Star className="w-4 h-4 fill-[#ffb33e] text-[#ffb33e]" />
                <span>{profile?.rating ? profile.rating.toFixed(1) : '5.0'}</span>
              </div>
              <p className="text-[11px] text-[#74767e] mt-0.5">
                {profile?.reviewCount ? `${profile.reviewCount} Reviews` : 'Top Rated'}
              </p>
            </div>

            <div className="bg-[#f7f7f7] border border-[#dadbdd] rounded-lg p-3 text-center">
              <div className="text-base font-bold text-[#222325]">
                {profile?.responseTimeText || '1 hour'}
              </div>
              <p className="text-[11px] text-[#74767e] mt-0.5">Avg Response</p>
            </div>

            <div className="bg-[#f7f7f7] border border-[#dadbdd] rounded-lg p-3 text-center">
              <div className="text-base font-bold text-[#222325]">
                {profile?.lastDeliveryText || '1 day ago'}
              </div>
              <p className="text-[11px] text-[#74767e] mt-0.5">Last Delivery</p>
            </div>

            <div className="bg-[#f7f7f7] border border-[#dadbdd] rounded-lg p-3 text-center">
              <div className="text-base font-bold text-[#1dbf73]">
                {totalOrdersInQueue} Active
              </div>
              <p className="text-[11px] text-[#74767e] mt-0.5">Orders in Queue</p>
            </div>
          </div>
        </div>

        {/* Bio excerpt */}
        {profile?.description && (
          <div className="mt-4 pt-3 border-t border-[#efeff0]">
            <p
              className={`text-xs text-[#62646a] leading-relaxed whitespace-pre-line ${
                bioExpanded ? '' : 'line-clamp-2'
              }`}
            >
              {profile.description}
            </p>
            {profile.description.length > 140 && (
              <button
                type="button"
                onClick={() => setBioExpanded(!bioExpanded)}
                className="mt-1 text-[11px] font-bold text-[#1dbf73] hover:underline flex items-center gap-0.5 cursor-pointer"
              >
                <span>{bioExpanded ? 'Show less' : 'Read more'}</span>
                {bioExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            )}
          </div>
        )}
      </div>

      {/* ─── 2. Dedicated Competitor Intelligence Gateway ─── */}
      <div className="bg-gradient-to-r from-[#222325] to-[#303338] text-white rounded-xl p-5 md:p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div className="space-y-1.5 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#1dbf73] text-white">
              <Users2 className="w-3 h-3" />
              Live Competitor Intelligence
            </span>
            <span className="text-xs text-gray-300">&bull; Real-time Fiverr Market Comparison</span>
          </div>
          <h2 className="text-lg md:text-xl font-bold text-white tracking-tight">
            Identify Why Top Rivals Make More Money &amp; Capture Lost Revenue
          </h2>
          <p className="text-xs md:text-sm text-gray-300 leading-relaxed">
            Discover real Fiverr competitors in your niche, dissect their 3-tier pricing anchors and missing SEO tags, and generate an actionable win plan.
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate('/competitors')}
          className="fiverr-btn-green px-5 py-3 rounded-md text-xs font-bold flex items-center gap-2 cursor-pointer shadow-md hover:scale-[1.02] transition-transform shrink-0"
        >
          <Users2 className="w-4 h-4" />
          <span>Launch Competitor Analysis</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* ─── 3. Two-Column Core Overview: Gigs & ICPs ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 Cols): Gigs Catalog Overview */}
        <div className="lg:col-span-7 bg-white border border-[#dadbdd] rounded-xl p-5 md:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#dadbdd] pb-3">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-[#1dbf73]" />
              <h3 className="text-sm font-bold text-[#222325]">
                Published Gigs Portfolio ({gigs.length})
              </h3>
            </div>
            <div className="text-xs font-semibold text-[#74767e]">
              Pricing: <span className="text-[#222325] font-bold">${priceFloor} &ndash; ${priceCeiling}</span>
            </div>
          </div>

          {gigs.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#74767e]">
              No gigs scraped yet.{' '}
              <button
                onClick={() => navigate('/gigs')}
                className="text-[#1dbf73] font-bold hover:underline"
              >
                Generate your first gig &rarr;
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {gigs.slice(0, 4).map((gig: any, idx: number) => (
                <div
                  key={gig.id || idx}
                  className="flex items-start gap-3.5 p-3 rounded-lg border border-[#dadbdd] hover:border-[#1dbf73] transition-colors bg-[#fdfdfd]"
                >
                  {gig.imageUrl ? (
                    <img
                      src={gig.imageUrl}
                      alt={gig.title}
                      className="w-16 h-12 rounded object-cover border border-[#dadbdd] shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-12 rounded bg-[#f5f5f5] border border-[#dadbdd] flex items-center justify-center text-xs text-[#74767e] shrink-0">
                      Gig
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-[#222325] line-clamp-1 hover:text-[#1dbf73] transition-colors">
                      {gig.title}
                    </h4>

                    <div className="flex items-center gap-3 text-[11px] text-[#74767e] mt-1 flex-wrap">
                      <span className="flex items-center gap-0.5 text-[#222325] font-semibold">
                        <Star className="w-3 h-3 fill-[#ffb33e] text-[#ffb33e]" />
                        {gig.rating ? gig.rating.toFixed(1) : '5.0'}
                      </span>
                      <span>&bull;</span>
                      <span>{gig.ordersInQueue || 0} in queue</span>
                      {gig.tags && gig.tags.length > 0 && (
                        <>
                          <span>&bull;</span>
                          <span className="truncate max-w-[150px]">{gig.tags.slice(0, 2).join(', ')}</span>
                        </>
                      )}
                    </div>

                    {/* Packages pricing mini-strip */}
                    {gig.packages && gig.packages.length > 0 && (
                      <div className="flex items-center gap-2 mt-2 pt-2 border-t border-[#efeff0]">
                        {gig.packages.map((pkg: any, pIdx: number) => (
                          <span
                            key={pIdx}
                            className="px-2 py-0.5 bg-[#f5f5f5] rounded text-[10px] font-bold text-[#404145] border border-[#dadbdd]"
                          >
                            {pkg.title || ['Basic', 'Standard', 'Premium'][pIdx]}: ${pkg.price}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="pt-2 flex justify-end">
            <button
              onClick={() => navigate('/gigs')}
              className="text-xs font-bold text-[#1dbf73] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Manage in Gig Studio</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Right Column (5 Cols): Ideal Customer Profiles (ICPs) Snapshot */}
        <div className="lg:col-span-5 bg-white border border-[#dadbdd] rounded-xl p-5 md:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#dadbdd] pb-3">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-[#1dbf73]" />
              <h3 className="text-sm font-bold text-[#222325]">
                Target ICPs ({icps.length})
              </h3>
            </div>
            <span className="text-[11px] font-semibold text-[#1dbf73] bg-[#1dbf73]/10 px-2 py-0.5 rounded">
              Locked Strategy
            </span>
          </div>

          {icps.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#74767e]">
              No ICP personas saved yet.
            </div>
          ) : (
            <div className="space-y-3">
              {icps.slice(0, 2).map((icp: any, idx: number) => (
                <div
                  key={icp.icpId || idx}
                  className="p-3 rounded-lg border border-[#dadbdd] bg-[#fafafa] space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#222325]">
                      {icp.personaName}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#1dbf73] bg-[#1dbf73]/10 px-1.5 py-0.5 rounded">
                      {icp.priority || 'Primary'}
                    </span>
                  </div>

                  <div className="text-[11px] text-[#74767e] space-y-1">
                    <div>
                      <strong className="text-[#404145]">Buyer Roles:</strong>{' '}
                      {icp.buyerPersona?.jobTitles?.join(', ') || 'Founder / CTO'}
                    </div>
                    <div>
                      <strong className="text-[#404145]">Target Budget:</strong>{' '}
                      ${icp.projectFit?.budgetRange?.min || 500} &ndash; ${icp.projectFit?.budgetRange?.max || 2500}
                    </div>
                    {icp.painPointsAndTriggers?.acutePainPoints && (
                      <div className="line-clamp-2">
                        <strong className="text-[#404145]">Pain Points:</strong>{' '}
                        {icp.painPointsAndTriggers.acutePainPoints.slice(0, 2).join('; ')}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Core skills tag cloud */}
          {profile?.skills && profile.skills.length > 0 && (
            <div className="pt-3 border-t border-[#dadbdd] space-y-2">
              <h4 className="text-xs font-bold text-[#222325]">Top Skills Arsenal</h4>
              <div className="flex flex-wrap gap-1.5">
                {profile.skills.slice(0, 10).map((skill: any, sIdx: number) => (
                  <span
                    key={sIdx}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#f5f5f5] text-[#404145] border border-[#dadbdd]"
                  >
                    {skill.verified && <CheckCircle2 className="w-2.5 h-2.5 text-[#1dbf73]" />}
                    <span>{skill.name}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─── 4. Quick Execution Tools Navigation Grid ─── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          {
            label: 'Competitor Intelligence',
            desc: 'Scrape rivals & benchmark pricing',
            href: '/competitors',
            icon: Users2,
            badge: 'Essential',
          },
          {
            label: 'Gig Studio',
            desc: 'Generate high-ticket SEO gig packages',
            href: '/gigs',
            icon: Sparkles,
          },
          {
            label: 'Buyer Briefs Radar',
            desc: 'Match with real client opportunities',
            href: '/briefs',
            icon: Send,
          },
          {
            label: 'Market Research',
            desc: 'Analyze search volume & market gaps',
            href: '/research',
            icon: BarChart3,
          },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.href}
              onClick={() => navigate(item.href)}
              className="bg-white border border-[#dadbdd] rounded-lg p-4 hover:border-[#1dbf73] hover:shadow-xs transition-all group cursor-pointer"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-lg bg-[#f5f5f5] group-hover:bg-[#1dbf73]/10 flex items-center justify-center text-[#74767e] group-hover:text-[#1dbf73] transition-colors">
                  <Icon className="w-4 h-4" />
                </div>
                {item.badge && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#1dbf73]/10 text-[#1dbf73]">
                    {item.badge}
                  </span>
                )}
              </div>
              <h3 className="text-xs font-bold text-[#222325] group-hover:text-[#1dbf73] transition-colors">
                {item.label}
              </h3>
              <p className="text-[11px] text-[#74767e] mt-0.5 leading-snug">{item.desc}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
