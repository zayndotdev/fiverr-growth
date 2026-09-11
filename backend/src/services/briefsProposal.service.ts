import { config } from '../config/index.js';
import { BuyerBrief } from '../db/store.js';
import { logger } from '../utils/logger.js';

const GEMINI_API_KEY = config.GEMINI_API_KEY || process.env.GEMINI_API_KEY || '';

export interface ProposalStrategy {
  tone?: 'consultative' | 'closer' | 'rapid';
  priceStrategy?: 'match_budget' | 'anchor_premium' | 'value_starter';
  safetyGapSeconds?: number;
}

export interface GeneratedProposalItem {
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

export class BriefsProposalService {
  /**
   * Generates tailored, high-converting proposals for a batch of selected briefs
   */
  public async generateProposalsForBriefs(
    sellerProfile: any,
    sellerGigs: any[],
    sellerSkills: string[],
    sellerIcps: any[],
    selectedBriefs: BuyerBrief[],
    strategy: ProposalStrategy = {}
  ): Promise<GeneratedProposalItem[]> {
    const tone = strategy.tone || 'consultative';
    const safetyGap = strategy.safetyGapSeconds || 25;

    logger.agentLog(
      'AGENT_BRIEFS',
      'Buyer Briefs Closer',
      'INFO',
      `Evaluating ${selectedBriefs.length} briefs with tone: "${tone}", safety gap: ${safetyGap}s`
    );

    const results: GeneratedProposalItem[] = [];

    for (const brief of selectedBriefs) {
      // 1. Identify best matching gig
      const bestGig = this.findBestMatchingGig(brief, sellerGigs);

      // 2. Try Gemini AI generation
      let proposalItem: GeneratedProposalItem | null = null;
      if (GEMINI_API_KEY) {
        try {
          proposalItem = await this.generateWithGemini(
            brief,
            sellerProfile,
            bestGig,
            sellerSkills,
            sellerIcps,
            tone,
            strategy.priceStrategy,
            safetyGap
          );
        } catch (err) {
          console.warn(`Gemini brief proposal failed for brief ${brief.id}, using heuristic fallback:`, err);
        }
      }

      // 3. Heuristic fallback if Gemini fails or is unconfigured
      if (!proposalItem) {
        proposalItem = this.generateFallbackProposal(
          brief,
          sellerProfile,
          bestGig,
          sellerSkills,
          tone,
          strategy.priceStrategy,
          safetyGap
        );
      }

      results.push(proposalItem);
    }

    logger.agentLog(
      'AGENT_BRIEFS',
      'Buyer Briefs Closer',
      'SUCCESS',
      `Synthesized ${results.length} conversion-engineered proposals (Matched gigs: ${results.filter(r => r.matchedGigTitle).length})`,
      { count: results.length }
    );

    return results;
  }

  /**
   * Matches the seller's most relevant gig based on title and tags overlap
   */
  private findBestMatchingGig(brief: BuyerBrief, sellerGigs: any[]): any {
    if (!sellerGigs || sellerGigs.length === 0) {
      return null;
    }

    const briefText = `${brief.clientTitle} ${brief.description} ${brief.skills.join(' ')}`.toLowerCase();

    let bestScore = -1;
    let bestGig = sellerGigs[0];

    for (const gig of sellerGigs) {
      let score = 0;
      const gigKeywords = [
        ...(gig.tags || []),
        ...(gig.title || '').split(/\s+/),
        gig.category,
        gig.subCategory,
      ].filter(Boolean);

      for (const kw of gigKeywords) {
        const cleanKw = String(kw).toLowerCase().trim();
        if (cleanKw.length > 2 && briefText.includes(cleanKw)) {
          score += 15;
        }
      }

      // Boost if direct AI / Automation / Web match
      if (/ai|agent|chatbot|bot/i.test(briefText) && /ai|agent|chatbot|bot/i.test(gig.title || '')) {
        score += 35;
      }
      if (/web|app|react|next/i.test(briefText) && /web|app|react|next/i.test(gig.title || '')) {
        score += 30;
      }

      if (score > bestScore) {
        bestScore = score;
        bestGig = gig;
      }
    }

    return bestGig;
  }

  /**
   * Calls Gemini 2.0 Flash to synthesize a tailored proposal
   */
  private async generateWithGemini(
    brief: BuyerBrief,
    sellerProfile: any,
    bestGig: any,
    sellerSkills: string[],
    sellerIcps: any[],
    tone: string,
    priceStrategy?: string,
    safetyGap: number = 25
  ): Promise<GeneratedProposalItem | null> {
    const parsedBudget = parseFloat(String(brief.budget).replace(/[^0-9.]/g, '')) || 100;
    const gigTitle = bestGig?.title || 'Custom Full Stack & AI Development';
    const gigPackages = bestGig?.packages || [];
    const basicPrice = gigPackages[0]?.price || 75;
    const standardPrice = gigPackages[1]?.price || 150;

    let targetPrice = parsedBudget;
    if (priceStrategy === 'anchor_premium') {
      targetPrice = Math.max(parsedBudget * 1.25, standardPrice);
    } else if (priceStrategy === 'value_starter') {
      targetPrice = Math.max(parsedBudget * 0.85, basicPrice);
    }

    const prompt = `You are an elite Fiverr freelance growth copywriter crafting a custom proposal for a private Buyer Brief.

CLIENT BUYER BRIEF:
- Project Title: "${brief.clientTitle}"
- Details: "${brief.description}"
- Buyer Budget: "${brief.budget}" (Estimated USD: $${parsedBudget})
- Timeline Urgency: "${brief.urgencyText || '48 Hours'}"
- Required Skills: ${brief.skills?.join(', ') || 'Software Development'}
- Client Location: ${brief.clientCountry || 'International'}

SELLER CREDENTIALS:
- Display Name: ${sellerProfile?.displayName || 'Senior Full Stack Specialist'}
- Bio/Tagline: "${sellerProfile?.tagline || ''}"
- Verified Skills: ${sellerSkills.slice(0, 8).join(', ')}
- Matched Fiverr Gig: "${gigTitle}"
- Target Offer Price: $${Math.round(targetPrice)}
- Desired Proposal Tone: ${tone} (Options: consultative, closer, rapid)

INSTRUCTIONS:
1. Ground every claim in the client's explicit requirements. No generic buzzwords ("Hope you are doing well", "I am an expert with 10 years experience").
2. Start directly with an insightful observation of their specific problem.
3. Outline a concrete 3-point technical delivery plan showing immediate clarity.
4. Specify an exact deliverable schedule and a clean, risk-free call to action.
5. Keep length concise: between 100 and 150 words (Fiverr buyers have short attention spans).

Return a valid JSON object matching this schema:
{
  "matchedGigTitle": "${gigTitle.replace(/"/g, '')}",
  "matchScore": 95,
  "offeredPrice": ${Math.round(targetPrice)},
  "deliveryDays": ${Math.max(brief.urgencyDays || 2, 1)},
  "proposalText": "...",
  "painPointsAddressed": ["pain 1", "pain 2"],
  "recommendedDeliverables": ["deliverable 1", "deliverable 2", "deliverable 3"]
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
            temperature: 0.35,
          },
        }),
      }
    );

    if (!res.ok) {
      throw new Error(`Gemini HTTP ${res.status}`);
    }

    const data = (await res.json()) as any;
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) return null;

    const parsed = JSON.parse(rawText);

    return {
      briefId: brief.id,
      matchedGigId: bestGig?.id || 'gig_matched',
      matchedGigTitle: parsed.matchedGigTitle || gigTitle,
      matchScore: parsed.matchScore || 92,
      offeredPrice: parsed.offeredPrice || Math.round(targetPrice),
      deliveryDays: parsed.deliveryDays || (brief.urgencyDays || 2),
      proposalText: parsed.proposalText,
      painPointsAddressed: parsed.painPointsAddressed || ['Specific architectural requirement', 'Timeline milestone'],
      recommendedDeliverables: parsed.recommendedDeliverables || ['Source code repository', 'Setup walkthrough video', 'Revisions support'],
      safetyGapSeconds: safetyGap,
    };
  }

  /**
   * Generates a high-quality heuristic proposal when Gemini is unavailable
   */
  private generateFallbackProposal(
    brief: BuyerBrief,
    sellerProfile: any,
    bestGig: any,
    sellerSkills: string[],
    tone: string,
    priceStrategy?: string,
    safetyGap: number = 25
  ): GeneratedProposalItem {
    const parsedBudget = parseFloat(String(brief.budget).replace(/[^0-9.]/g, '')) || 120;
    const gigTitle = bestGig?.title || 'Custom Full Stack & AI Software Solution';
    const targetPrice = Math.max(parsedBudget, 50);
    const sellerName = sellerProfile?.displayName || 'Lead Engineer';
    const title = brief.clientTitle || (brief as any).title || (brief.description ? brief.description.slice(0, 60) : 'your project requirements');

    let greeting = `Hi there,\n\nI reviewed your brief regarding "${title}".`;
    let hook = `Rather than a cookie-cutter setup, this requires clean architecture and rock-solid execution without technical debt.`;
    if (tone === 'closer') {
      hook = `I have delivered 24+ similar production-grade deployments with 100% on-time delivery. We can solve this immediately.`;
    } else if (tone === 'rapid') {
      hook = `I can dedicate immediate focus to this and deliver a functional build within ${brief.urgencyText || '48 hours'}.`;
    }

    const skillsMention = sellerSkills.slice(0, 3).join(', ');

    const proposalText = `${greeting}

${hook}

Here is how I will execute this for you:
1. Requirements & Spec Audit: Review your exact inputs and establish the baseline environment using ${skillsMention}.
2. Core Implementation: Build and test the full deliverable with zero bottlenecks and clean, documented code.
3. Verification & Handover: Conduct end-to-end testing, record a quick walkthrough demo, and ensure you are 100% satisfied.

I can have this completed within ${brief.urgencyDays || 2} days for $${targetPrice}.

Feel free to send a message so we can confirm any technical details before starting.

Best regards,
${sellerName}`;

    return {
      briefId: brief.id,
      matchedGigId: bestGig?.id || 'gig_default',
      matchedGigTitle: gigTitle,
      matchScore: 94,
      offeredPrice: targetPrice,
      deliveryDays: brief.urgencyDays || 2,
      proposalText: proposalText.trim(),
      painPointsAddressed: ['Rapid turnaround requirement', 'Clean source code ownership'],
      recommendedDeliverables: ['Complete source code handover', 'Tested solution', 'Post-delivery revisions'],
      safetyGapSeconds: safetyGap,
    };
  }
}

export const briefsProposalService = new BriefsProposalService();
