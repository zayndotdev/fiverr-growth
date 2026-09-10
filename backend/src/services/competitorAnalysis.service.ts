import { config } from '../config/index.js';
import { ScrapedFiverrProfile } from './fiverrScraper.service.js';

const GEMINI_API_KEY = config.GEMINI_API_KEY || process.env.GEMINI_API_KEY || '';

export interface ComparativeAnalysisResult {
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

export class CompetitorAnalysisService {
  /**
   * Conducts an end-to-end comparative gap analysis between the authenticated user and a scraped competitor.
   */
  public async compareSellers(
    userProfile: ScrapedFiverrProfile,
    competitorProfile: ScrapedFiverrProfile,
    userIcps: any[] = []
  ): Promise<ComparativeAnalysisResult> {
    // 1. Calculate price floors, ceilings, and queues
    const userPrices = this.extractPrices(userProfile);
    const compPrices = this.extractPrices(competitorProfile);

    const userQueue = (userProfile.gigs || []).reduce((acc, g) => acc + (g.ordersInQueue || 0), 0);
    const compQueue = (competitorProfile.gigs || []).reduce((acc, g) => acc + (g.ordersInQueue || 0), 0);

    // 2. Keyword & Skills Tag Overlap
    const userTags = new Set(
      (userProfile.gigs || []).flatMap((g) => (g.tags || []).map((t) => t.toLowerCase().trim()))
    );
    const compTags = (competitorProfile.gigs || []).flatMap((g) => (g.tags || []).map((t) => t.trim()));

    const missingTags = Array.from(
      new Set(compTags.filter((t) => !userTags.has(t.toLowerCase())))
    ).slice(0, 10);

    const userSkillNames = new Set((userProfile.skills || []).map((s) => s.name.toLowerCase().trim()));
    const commonSkills: string[] = [];
    const uniqueCompetitorSkills: string[] = [];

    for (const s of competitorProfile.skills || []) {
      if (userSkillNames.has(s.name.toLowerCase().trim())) {
        commonSkills.push(s.name);
      } else {
        uniqueCompetitorSkills.push(s.name);
      }
    }

    // Estimate Revenue Gap Multiplier
    const userMedian = userPrices.median || 50;
    const compMedian = compPrices.median || 80;
    const userReviews = Math.max(userProfile.reviewCount || 1, 1);
    const compReviews = Math.max(competitorProfile.reviewCount || 1, 1);
    const priceRatio = compMedian / Math.max(userMedian, 1);
    const volumeRatio = compReviews / userReviews;
    const estimatedMultiplier = parseFloat(Math.max(priceRatio * (volumeRatio > 1 ? 1.4 : 1.0), 1.1).toFixed(1));

    const metricsComparison = {
      userPriceFloor: userPrices.floor,
      userPriceCeiling: userPrices.ceiling,
      competitorPriceFloor: compPrices.floor,
      competitorPriceCeiling: compPrices.ceiling,
      userRating: userProfile.rating || 5.0,
      competitorRating: competitorProfile.rating || 5.0,
      userReviewsCount: userProfile.reviewCount || 0,
      competitorReviewsCount: competitorProfile.reviewCount || 0,
      userOrdersInQueue: userQueue,
      competitorOrdersInQueue: compQueue,
      estimatedRevenueGapMultiplier: estimatedMultiplier,
      missingHighVolumeTags: missingTags.length > 0 ? missingTags : ['Full Stack Development', 'AI Integration', 'Fast Turnaround', 'Bug Fix'],
      commonSkills: commonSkills.slice(0, 8),
      uniqueCompetitorSkills: uniqueCompetitorSkills.slice(0, 8),
    };

    // 3. Try Gemini AI synthesis if API Key available
    if (GEMINI_API_KEY) {
      try {
        const aiGap = await this.synthesizeWithGemini(
          userProfile,
          competitorProfile,
          userPrices,
          compPrices,
          metricsComparison,
          userIcps
        );
        if (aiGap) {
          return {
            metricsComparison,
            gapAnalysis: aiGap,
          };
        }
      } catch (err) {
        console.warn('Gemini competitor analysis failed, using heuristic engine:', err);
      }
    }

    // 4. Heuristic Fallback Engine
    const fallbackGap = this.generateFallbackAnalysis(userProfile, competitorProfile, userPrices, compPrices);
    return {
      metricsComparison,
      gapAnalysis: fallbackGap,
    };
  }

  private extractPrices(profile: ScrapedFiverrProfile): { floor: number; ceiling: number; median: number } {
    const allPrices: number[] = [];

    for (const gig of profile.gigs || []) {
      if (gig.packages && gig.packages.length > 0) {
        for (const p of gig.packages) {
          const num = typeof p.price === 'number' ? p.price : parseFloat(String(p.price).replace(/[^0-9.]/g, ''));
          if (num && !isNaN(num)) allPrices.push(num);
        }
      } else if (gig.startingPrice) {
        const num = typeof gig.startingPrice === 'number' ? gig.startingPrice : parseFloat(String(gig.startingPrice).replace(/[^0-9.]/g, ''));
        if (num && !isNaN(num)) allPrices.push(num);
      }
    }

    if (allPrices.length === 0) {
      return { floor: 35, ceiling: 150, median: 75 };
    }

    allPrices.sort((a, b) => a - b);
    return {
      floor: allPrices[0],
      ceiling: allPrices[allPrices.length - 1],
      median: allPrices[Math.floor(allPrices.length / 2)],
    };
  }

  private async synthesizeWithGemini(
    userProfile: ScrapedFiverrProfile,
    competitorProfile: ScrapedFiverrProfile,
    userPrices: { floor: number; ceiling: number; median: number },
    compPrices: { floor: number; ceiling: number; median: number },
    metrics: any,
    userIcps: any[]
  ): Promise<any | null> {
    const userGigsSummary = (userProfile.gigs || [])
      .map((g) => `- "${g.title}" | Starting: $${g.startingPrice} | Tags: ${(g.tags || []).slice(0, 5).join(', ')}`)
      .join('\n');

    const compGigsSummary = (competitorProfile.gigs || [])
      .map((g) => `- "${g.title}" | Starting: $${g.startingPrice} | Rating: ${g.rating}★ | Tags: ${(g.tags || []).slice(0, 5).join(', ')}`)
      .join('\n');

    const prompt = `You are an elite Fiverr Marketplace Commercial Strategist & Revenue Optimization Director.

Conduct a definitive, high-accuracy Competitive Gap Analysis between our User (Seller A) and their Direct Competitor (Seller B).
GROUNDING: Derive all insights strictly from their real pricing tiers, reviews, tags, and packaging. Explain exactly why Seller B is making more money, and deliver a step-by-step outcompete roadmap for Seller A.

=== USER (SELLER A) ===
- Username: ${userProfile.username} (${userProfile.displayName})
- Level: ${userProfile.sellerLevel} | Pro: ${userProfile.isPro} | Rating: ${userProfile.rating} (${userProfile.reviewCount} reviews)
- Pricing Spectrum: Floor $${userPrices.floor} | Median $${userPrices.median} | Ceiling $${userPrices.ceiling}
- Orders in Queue: ${metrics.userOrdersInQueue}
- Published Gigs:
${userGigsSummary || 'None active yet'}
- Target ICPs: ${userIcps.map((i) => i.personaName || i.name).join(', ') || 'Tech Startups & Business Owners'}

=== COMPETITOR (SELLER B) ===
- Username: ${competitorProfile.username} (${competitorProfile.displayName})
- Level: ${competitorProfile.sellerLevel} | Pro: ${competitorProfile.isPro} | Rating: ${competitorProfile.rating} (${competitorProfile.reviewCount} reviews)
- Pricing Spectrum: Floor $${compPrices.floor} | Median $${compPrices.median} | Ceiling $${compPrices.ceiling}
- Orders in Queue: ${metrics.competitorOrdersInQueue}
- Published Gigs:
${compGigsSummary}
- Missing High-Volume Tags Competitor Uses: ${metrics.missingHighVolumeTags.join(', ')}

Return a strict JSON object with this exact schema:
{
  "executiveSummary": "Concise 2-sentence breakdown of the core commercial advantage Seller B holds over Seller A and how Seller A can bridge it.",
  "whyCompetitorMakesMore": {
    "pricingStrategy": "Detailed explanation of how Seller B anchors their prices higher (e.g. higher floor, enterprise premium packages).",
    "packagingLeverage": "Specific deliverables and assurances Seller B bundles into their packages that justify higher fees.",
    "positioningAndHooks": "How Seller B's titles and descriptions target high-budget buyers rather than low-budget bargain hunters."
  },
  "deliverablesComparison": {
    "userStrengths": ["Feature 1", "Feature 2"],
    "competitorStrengths": ["Feature 1", "Feature 2"],
    "criticalMissingFeatures": ["Feature A that competitor offers which user lacks", "Feature B"]
  },
  "seoAndSearchGap": {
    "tagsAnalysis": "Analysis of search terms and algorithm positioning advantages of the competitor.",
    "rankingAngles": ["Angle 1", "Angle 2"]
  },
  "actionableWinPlan": [
    {
      "stepNumber": 1,
      "title": "Title of action",
      "category": "pricing",
      "action": "Concrete, non-generic instruction on what to edit or add",
      "expectedImpact": "Projected outcome e.g. +35% average order value"
    },
    {
      "stepNumber": 2,
      "title": "Title of action",
      "category": "packages",
      "action": "...",
      "expectedImpact": "..."
    },
    {
      "stepNumber": 3,
      "title": "Title of action",
      "category": "title",
      "action": "...",
      "expectedImpact": "..."
    },
    {
      "stepNumber": 4,
      "title": "Title of action",
      "category": "positioning",
      "action": "...",
      "expectedImpact": "..."
    }
  ],
  "recommendedPricing": {
    "basic": ${Math.max(compPrices.floor, userPrices.floor)},
    "standard": ${Math.max(compPrices.median, Math.round(userPrices.median * 1.25))},
    "premium": ${Math.max(compPrices.ceiling, Math.round(userPrices.ceiling * 1.3))},
    "rationale": "Why these specific price points capture buyers while remaining competitive."
  }
}`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.3,
          },
        }),
      }
    );

    if (!res.ok) {
      throw new Error(`Gemini HTTP ${res.status}`);
    }

    const data = await res.json() as any;
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) return null;

    const parsed = JSON.parse(rawText);
    return parsed;
  }

  private generateFallbackAnalysis(
    userProfile: ScrapedFiverrProfile,
    competitorProfile: ScrapedFiverrProfile,
    userPrices: { floor: number; ceiling: number; median: number },
    compPrices: { floor: number; ceiling: number; median: number }
  ): any {
    const higherPrice = compPrices.median > userPrices.median;
    const moreReviews = (competitorProfile.reviewCount || 0) > (userProfile.reviewCount || 0);

    const recBasic = Math.max(Math.round(compPrices.floor * 0.9), userPrices.floor);
    const recStandard = Math.max(Math.round(compPrices.median * 0.95), Math.round(userPrices.median * 1.2));
    const recPremium = Math.max(compPrices.ceiling, Math.round(userPrices.ceiling * 1.3));

    return {
      executiveSummary: `${competitorProfile.displayName || competitorProfile.username} commands superior market share through ${
        higherPrice ? 'higher tier anchoring' : 'high-velocity gig positioning'
      } and focused SEO tags. By adopting their high-margin deliverables structure, ${
        userProfile.displayName || userProfile.username
      } can capture substantial lost revenue.`,
      whyCompetitorMakesMore: {
        pricingStrategy: higherPrice
          ? `Competitor prices Standard tier at $${compPrices.median} vs your $${userPrices.median}, capturing higher-ticket buyers who equate price with senior competence.`
          : `Competitor utilizes a high-conversion entry point ($${compPrices.floor}) combined with steep upsells on milestone delivery and cloud deployment.`,
        packagingLeverage:
          'Competitor explicitly bundles end-to-end integration, source code handover, and post-delivery maintenance, removing buyer risk before purchase.',
        positioningAndHooks:
          'Competitor titles emphasize business outcomes (e.g. automated sales, 24/7 client retention) rather than generic programming jargon.',
      },
      deliverablesComparison: {
        userStrengths: [
          'Agile implementation capability',
          'Modern tech stack coverage',
          'Direct client communication focus',
        ],
        competitorStrengths: [
          `Established social proof (${competitorProfile.reviewCount || 0} reviews, ${competitorProfile.rating || 5.0}★)`,
          'Clear 3-tier milestone definitions with duration guarantees',
          'Comprehensive FAQ section answering buyer objections before inquiry',
        ],
        criticalMissingFeatures: [
          'Full containerized / cloud deployment walk-through',
          'Detailed video documentation / Loom demo delivery',
          'Tiered post-launch warranty support',
        ],
      },
      seoAndSearchGap: {
        tagsAnalysis:
          'Competitor captures top organic search results by ranking for high-intent search tags that reflect buyer pain rather than raw technology names.',
        rankingAngles: [
          'Target niche-specific automation rather than generalist development',
          'Include exact framework versions and deployment targets in gig metadata',
        ],
      },
      actionableWinPlan: [
        {
          stepNumber: 1,
          title: 'Raise Basic Tier Price Anchor',
          category: 'pricing',
          action: `Increase entry price from $${userPrices.floor} to $${recBasic} to avoid being perceived as a commodity low-cost freelancer.`,
          expectedImpact: '+30% immediate lift in perceived authority and buyer seriousness.',
        },
        {
          stepNumber: 2,
          title: 'Incorporate Missing High-Intent Search Tags',
          category: 'title',
          action: `Integrate competitor search keywords into your primary gig tags and subtitle.`,
          expectedImpact: 'Estimated +45% increase in Fiverr organic search impression share.',
        },
        {
          stepNumber: 3,
          title: 'Restructure Deliverable Checklist',
          category: 'packages',
          action: 'Add video walkthroughs, setup documentation, and API configuration to your Standard & Premium packages.',
          expectedImpact: 'Removes buyer hesitation, driving higher Standard package conversion.',
        },
        {
          stepNumber: 4,
          title: 'Deploy Result-Oriented Gig Title Hook',
          category: 'positioning',
          action: 'Rewrite gig title to lead with the business metric (e.g. "I will build high-converting AI automation") rather than purely technical verbs.',
          expectedImpact: 'Higher click-through rate from marketplace search impressions.',
        },
      ],
      recommendedPricing: {
        basic: recBasic,
        standard: recStandard,
        premium: recPremium,
        rationale: `Positions your offering right below ${competitorProfile.username}'s premium price while offering identical or superior technical deliverables.`,
      },
    };
  }
}

export const competitorAnalysisService = new CompetitorAnalysisService();
