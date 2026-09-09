import { config } from '../config/index.js';

const GEMINI_API_KEY = config.GEMINI_API_KEY || process.env.GEMINI_API_KEY || '';

export class IcpGeneratorService {
  async generateIcpsFromProfile(fiverrProfile: any): Promise<any[]> {
    // a. Preprocess the scraped profile data
    const substantiveReviews = fiverrProfile.recentReviews
      ? fiverrProfile.recentReviews.filter((r: any) => r.comment && r.comment.split(' ').length > 15).slice(0, 20)
      : [];

    let minPrice = Infinity;
    let maxPrice = 0;
    let standardPrices: number[] = [];

    if (fiverrProfile.gigs && fiverrProfile.gigs.length > 0) {
      for (const gig of fiverrProfile.gigs) {
        if (gig.packages && gig.packages.length > 0) {
          const p1 = parseFloat(gig.packages[0]?.price) || parseFloat(gig.startingPrice) || 0;
          if (p1 && p1 < minPrice) minPrice = p1;
          const p2 = parseFloat(gig.packages[1]?.price) || p1;
          if (p2) standardPrices.push(p2);
          const p3 = gig.packages[2] ? parseFloat(gig.packages[2].price) : p1;
          if (p3 && p3 > maxPrice) maxPrice = p3;
        } else {
          const sp = parseFloat(gig.startingPrice);
          if (sp) {
             if (sp < minPrice) minPrice = sp;
             if (sp > maxPrice) maxPrice = sp;
             standardPrices.push(sp);
          }
        }
      }
    }
    
    if (minPrice === Infinity) minPrice = 10;
    if (maxPrice === 0) maxPrice = minPrice * 3;
    standardPrices.sort((a, b) => a - b);
    const medianPrice = standardPrices.length > 0 ? standardPrices[Math.floor(standardPrices.length / 2)] : minPrice;

    const skills = fiverrProfile.skills ? fiverrProfile.skills.map((s: any) => s.name).join(', ') : '';
    const gigsText = fiverrProfile.gigs ? fiverrProfile.gigs.map((g: any) => `- ${g.title} (Starts at $${g.startingPrice})`).join('\n') : '';
    const reviewsText = substantiveReviews.map((r: any) => `- "${r.comment}" (Rating: ${r.rating})`).join('\n');

    const prompt = `You are a Principal B2B Market Strategist specializing in freelance marketplace business models (Fiverr, Upwork).

Analyze the provided Fiverr seller profile data and generate 2 to 4 distinct, actionable Ideal Customer Profiles (ICPs).

RULES:
1. GROUNDING: Every ICP must be derived from verifiable signals in the seller's skills, pricing tiers, gig descriptions, and client reviews. Do NOT hallucinate enterprise budgets if the seller only offers $25 bug fixes.
2. DIVERSITY: Generate distinct personas (e.g., Primary: Core Volume Buyer; Secondary: High-Margin Retainer Buyer; Tertiary: White-Label Agency).
3. ANTI-ICP: Define who this seller should REJECT.
4. BUDGET VALIDATION: ICP budget min must be >= seller's lowest tier price.

SELLER DATA:
- Username: ${fiverrProfile.username}
- Tagline: "${fiverrProfile.tagline}"
- Bio: "${fiverrProfile.description}"
- Skills: ${skills}
- Seller Level: ${fiverrProfile.sellerLevel} | Pro: ${fiverrProfile.isPro} | Agency: ${fiverrProfile.isAgency}
- Rating: ${fiverrProfile.rating} (${fiverrProfile.reviewCount} reviews)
- Country: ${fiverrProfile.country}
- Lowest Price: $${minPrice}, Median Price: $${medianPrice}, Highest Price: $${maxPrice}

GIGS:
${gigsText}

CLIENT REVIEWS (Sample):
${reviewsText}

Return a JSON object with this exact structure:
{
  "icpProfiles": [
    {
      "icpId": "icp_1",
      "personaName": "The [Descriptive Title]",
      "priority": "primary",
      "confidenceScore": 0.95,
      "targetFirmographics": {
        "industries": ["..."],
        "companySizes": ["seed_2_10", "smb_11_50"],
        "targetGeographies": ["US", "UK"]
      },
      "buyerPersona": {
        "jobTitles": ["Founder", "CTO"],
        "seniorityLevel": "C-Level",
        "technicalLiteracy": "semi_technical"
      },
      "projectFit": {
        "typicalDeliverables": ["..."],
        "budgetRange": { "min": 500, "max": 2500, "currency": "USD" },
        "preferredPricingModel": "milestone_based"
      },
      "painPointsAndTriggers": {
        "acutePainPoints": ["..."],
        "buyingTriggerEvents": ["..."],
        "desiredOutcomes": ["..."]
      },
      "collaborationPreferences": {
        "communicationStyle": "asynchronous_autonomous",
        "preferredChannels": ["Fiverr Chat", "Loom"],
        "updateCadence": "bi_weekly"
      },
      "antiIcpCriteria": {
        "redFlagPhrases": ["..."],
        "disqualifyingFactors": ["..."]
      },
      "targetingSignals": {
        "searchKeywords": ["..."],
        "recommendedPitchHook": "..."
      }
    }
  ]
}`;

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: "application/json",
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Gemini API Error: ${response.statusText}`);
      }

      const data = await response.json() as any;
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error('No content from Gemini');

      const result = JSON.parse(text);
      let icps = result.icpProfiles || [];
      
      // Validation
      if (!Array.isArray(icps) || icps.length < 2) {
        throw new Error('Not enough ICPs returned');
      }
      
      icps = icps.map((icp: any) => {
        if (icp.projectFit?.budgetRange?.min < minPrice) {
          icp.projectFit.budgetRange.min = minPrice;
        }
        if (!icp.targetFirmographics?.industries?.length) {
            icp.targetFirmographics = icp.targetFirmographics || {};
            icp.targetFirmographics.industries = ["Technology"];
        }
        return icp;
      });

      return icps.slice(0, 4);

    } catch (e) {
      console.error("Gemini ICP generation failed, using fallback:", e);
      return this.generateFallbackIcps(fiverrProfile, minPrice);
    }
  }

  generateFallbackIcps(fiverrProfile: any, minPrice: number = 50): any[] {
    return [
      {
        icpId: "icp_fallback_1",
        personaName: "The Core Volume Buyer",
        priority: "primary",
        confidenceScore: 0.8,
        targetFirmographics: {
          industries: ["General Business", "E-commerce"],
          companySizes: ["smb_11_50"],
          targetGeographies: ["US", "UK", "Canada"]
        },
        buyerPersona: {
          jobTitles: ["Manager", "Owner"],
          seniorityLevel: "Director",
          technicalLiteracy: "semi_technical"
        },
        projectFit: {
          typicalDeliverables: ["Standard Gig Deliverable"],
          budgetRange: { min: minPrice, max: minPrice * 3, currency: "USD" },
          preferredPricingModel: "fixed_price"
        },
        painPointsAndTriggers: {
          acutePainPoints: ["Lack of time", "Need quick execution"],
          buyingTriggerEvents: ["New project launch"],
          desiredOutcomes: ["Fast delivery", "High quality"]
        },
        collaborationPreferences: {
          communicationStyle: "asynchronous_autonomous",
          preferredChannels: ["Fiverr Chat"],
          updateCadence: "upon_completion"
        },
        antiIcpCriteria: {
          redFlagPhrases: ["Can we do a call?", "Unlimited revisions"],
          disqualifyingFactors: ["Unclear requirements"]
        },
        targetingSignals: {
          searchKeywords: ["expert", "fast delivery"],
          recommendedPitchHook: "I can deliver this quickly and accurately."
        }
      },
      {
        icpId: "icp_fallback_2",
        personaName: "The Premium Agency Partner",
        priority: "secondary",
        confidenceScore: 0.7,
        targetFirmographics: {
          industries: ["Marketing Agency", "Development Agency"],
          companySizes: ["smb_11_50"],
          targetGeographies: ["US", "UK"]
        },
        buyerPersona: {
          jobTitles: ["Project Manager", "Agency Owner"],
          seniorityLevel: "C-Level",
          technicalLiteracy: "technical"
        },
        projectFit: {
          typicalDeliverables: ["Complex Projects", "White-label services"],
          budgetRange: { min: minPrice * 3, max: minPrice * 10, currency: "USD" },
          preferredPricingModel: "milestone_based"
        },
        painPointsAndTriggers: {
          acutePainPoints: ["Overflow work", "Need reliable partners"],
          buyingTriggerEvents: ["Winning a large client"],
          desiredOutcomes: ["Seamless integration", "Client satisfaction"]
        },
        collaborationPreferences: {
          communicationStyle: "structured",
          preferredChannels: ["Fiverr Chat", "Zoom"],
          updateCadence: "weekly"
        },
        antiIcpCriteria: {
          redFlagPhrases: ["Cheap price", "Micro-management"],
          disqualifyingFactors: ["Low budget"]
        },
        targetingSignals: {
          searchKeywords: ["white label", "reliable partner"],
          recommendedPitchHook: "I can be your reliable backend partner."
        }
      }
    ];
  }
}

export const icpGeneratorService = new IcpGeneratorService();
