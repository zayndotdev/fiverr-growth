import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth.middleware.js';
import { db, BuyerBrief } from '../db/store.js';
import { briefsProposalService } from '../services/briefsProposal.service.js';

export class BriefsController {
  /**
   * Retrieves active briefs for the current user.
   * If none exist in store, provides high-intent sample briefs matching the user's primary stack.
   */
  public async getBriefs(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      let briefs = db.getBriefs(userId);

      // If user has no briefs yet, seed starter briefs matching their profile
      if (!briefs || briefs.length === 0) {
        const userContext = userId ? db.getUserContext(userId) : null;
        const user = userId ? db.findUserById(userId) : null;
        const profile = userContext?.fiverrProfile || user?.fiverrProfile;
        const skills = userContext?.primarySkills || profile?.skills?.map((s: any) => (typeof s === 'string' ? s : s?.name)) || [
          'AI Chatbot',
          'Full Stack',
          'Next.js',
          'Python',
          'FastAPI',
        ];

        const starterBriefs: BuyerBrief[] = [
          {
            id: 'brief_sample_ai_agent',
            fiverrBriefId: 'fvr_brf_982104',
            userId: userId || 'anonymous',
            clientTitle: 'Need custom AI Agent & Chatbot connected to WhatsApp and CRM',
            description:
              'Looking for an experienced AI engineer to build an autonomous customer support bot. Needs to connect with OpenAI or Claude, query our internal product catalog, and schedule appointments directly into our CRM via webhooks. Must have clean error handling and documentation.',
            budget: '$250',
            currency: 'USD',
            urgencyDays: 2,
            urgencyText: '48 Hours',
            skills: ['AI Agent', 'OpenAI', 'Python', 'CRM Integration', 'FastAPI'],
            clientCountry: 'United States',
            source: 'live_feed',
            status: 'new',
            matchScore: 98,
            matchedGigTitle: 'Build custom AI agents, chatbots & voice automation',
            createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
          },
          {
            id: 'brief_sample_fullstack_saas',
            fiverrBriefId: 'fvr_brf_817290',
            userId: userId || 'anonymous',
            clientTitle: 'Full stack React / Next.js developer to build MVP client dashboard',
            description:
              'We have Figma designs ready for a 4-page SaaS portal with role-based auth (JWT), responsive tables, Stripe billing subscription integration, and PostgreSQL backend. Looking for a full stack specialist who delivers production code.',
            budget: '$450',
            currency: 'USD',
            urgencyDays: 4,
            urgencyText: '4 Days',
            skills: ['React', 'Next.js', 'Node.js', 'PostgreSQL', 'Stripe API'],
            clientCountry: 'United Kingdom',
            source: 'live_feed',
            status: 'new',
            matchScore: 94,
            matchedGigTitle: 'Build your custom full stack web app or website in any technology',
            createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
          },
          {
            id: 'brief_sample_api_automation',
            fiverrBriefId: 'fvr_brf_716254',
            userId: userId || 'anonymous',
            clientTitle: 'Fix REST API authentication bug and build web scraping pipeline',
            description:
              'Need a backend developer to resolve an existing FastAPI endpoint that fails during concurrent token refreshes, and create a daily automated scraper that extracts e-commerce product price changes into Google Sheets.',
            budget: '$150',
            currency: 'USD',
            urgencyDays: 1,
            urgencyText: '24 Hours',
            skills: ['Python', 'FastAPI', 'Web Scraping', 'Bug Fix'],
            clientCountry: 'Canada',
            source: 'live_feed',
            status: 'new',
            matchScore: 89,
            matchedGigTitle: 'Custom backend API & automated web data pipeline',
            createdAt: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
          },
          {
            id: 'brief_sample_mobile_flutter',
            fiverrBriefId: 'fvr_brf_605921',
            userId: userId || 'anonymous',
            clientTitle: 'Flutter developer needed for cross-platform booking application',
            description:
              'We need a clean Flutter mobile app (iOS & Android) with clean state management (Bloc or Riverpod) that allows users to browse service providers, book appointment slots, and receive push notifications.',
            budget: '$380',
            currency: 'USD',
            urgencyDays: 5,
            urgencyText: '5 Days',
            skills: ['Flutter', 'Mobile App', 'Firebase', 'State Management'],
            clientCountry: 'Australia',
            source: 'live_feed',
            status: 'new',
            matchScore: 86,
            matchedGigTitle: 'Cross-platform mobile application development in Flutter',
            createdAt: new Date(Date.now() - 1000 * 60 * 480).toISOString(),
          },
        ];

        briefs = db.syncBriefs(userId, starterBriefs);
      }

      const normalizedBriefs = briefs.map((b: any) => {
        const clientTitle = b.clientTitle || (b.brief_text ? b.brief_text.split('\n')[0].slice(0, 80) : 'Client Project Brief');
        const description = b.description || b.brief_text || '';
        const budget = b.budget || b.buyer_budget || 'Flexible';
        const urgencyText = b.urgencyText || b.urgency || '48 Hours';
        const skills = Array.isArray(b.skills) && b.skills.length > 0 ? b.skills : (b.user_skills || ['Software Development']);
        const status = b.status || (b.proposal_text ? 'applied' : 'new');
        const matchScore = b.matchScore || (b.confidence_score ? Math.round(b.confidence_score * 100) : 92);
        const matchedGigTitle = b.matchedGigTitle || 'Custom Full Stack & AI Development';

        return {
          ...b,
          clientTitle,
          description,
          budget,
          urgencyText,
          skills,
          status,
          matchScore,
          matchedGigTitle,
        };
      });

      return res.status(200).json({
        success: true,
        count: normalizedBriefs.length,
        data: normalizedBriefs,
      });
    } catch (err: any) {
      console.error('Error fetching briefs:', err);
      return res.status(500).json({ success: false, error: err.message || 'Failed to fetch briefs.' });
    }
  }

  /**
   * Syncs briefs collected by the Chrome Extension or web app into the store
   */
  public async syncBriefs(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.userId || req.body?.userId;
      const incomingBriefs = req.body?.briefs;

      if (!Array.isArray(incomingBriefs) || incomingBriefs.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Please provide an array of briefs to sync.',
        });
      }

      // Calculate initial match scores against user gigs if available
      let sellerGigs: any[] = [];
      if (userId) {
        const userContext = db.getUserContext(userId);
        const user = db.findUserById(userId);
        sellerGigs = userContext?.fiverrProfile?.gigs || user?.fiverrProfile?.gigs || [];
      }

      const enrichedBriefs = incomingBriefs.map((b: any) => {
        let bestScore = 80;
        let matchedTitle = sellerGigs[0]?.title || 'Custom Full Stack & AI Services';

        if (sellerGigs.length > 0) {
          const text = `${b.clientTitle || ''} ${b.description || ''} ${(b.skills || []).join(' ')}`.toLowerCase();
          for (const g of sellerGigs) {
            let score = 70;
            if (/ai|agent|chatbot/i.test(text) && /ai|agent|chatbot/i.test(g.title || '')) score = 96;
            if (/web|next|react/i.test(text) && /web|next|react/i.test(g.title || '')) score = 93;
            if (score > bestScore) {
              bestScore = score;
              matchedTitle = g.title;
            }
          }
        }

        return {
          ...b,
          matchScore: b.matchScore || bestScore,
          matchedGigTitle: b.matchedGigTitle || matchedTitle,
        };
      });

      const synced = db.syncBriefs(userId, enrichedBriefs);

      return res.status(200).json({
        success: true,
        message: `Successfully synced ${enrichedBriefs.length} briefs.`,
        count: synced.length,
        data: synced,
      });
    } catch (err: any) {
      console.error('Error in syncBriefs:', err);
      return res.status(500).json({ success: false, error: err.message || 'Failed to sync briefs.' });
    }
  }

  /**
   * Generates tailored proposals for 1..N selected briefs
   */
  public async generateBatchProposals(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.userId || req.body?.userId;
      const { briefIds, strategy = {} } = req.body;

      if (!Array.isArray(briefIds) || briefIds.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Please select at least one brief to generate proposals for.',
        });
      }

      // 1. Fetch user context & gigs
      let sellerProfile = null;
      let sellerGigs: any[] = [];
      let sellerSkills: string[] = ['React', 'Next.js', 'Node.js', 'Python', 'FastAPI', 'AI Agents'];
      let sellerIcps: any[] = [];

      if (userId) {
        const userContext = db.getUserContext(userId);
        const user = db.findUserById(userId);
        sellerProfile = userContext?.fiverrProfile || user?.fiverrProfile || null;
        sellerGigs = sellerProfile?.gigs || [];
        sellerSkills =
          userContext?.primarySkills ||
          sellerProfile?.skills?.map((s: any) => (typeof s === 'string' ? s : s?.name)) ||
          sellerSkills;
        sellerIcps = userContext?.icpProfiles || user?.icpProfiles || [];
      }

      // 2. Fetch selected briefs from store
      const allBriefs = db.getBriefs(userId);
      const selectedBriefs = allBriefs.filter((b) => briefIds.includes(b.id) || briefIds.includes(b.fiverrBriefId));

      if (selectedBriefs.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'None of the requested brief IDs were found.',
        });
      }

      // 3. Generate proposals via service
      const generatedProposals = await briefsProposalService.generateProposalsForBriefs(
        sellerProfile,
        sellerGigs,
        sellerSkills,
        sellerIcps,
        selectedBriefs,
        strategy
      );

      return res.status(200).json({
        success: true,
        count: generatedProposals.length,
        strategy,
        data: generatedProposals,
      });
    } catch (err: any) {
      console.error('Error generating batch proposals:', err);
      return res.status(500).json({
        success: false,
        error: err.message || 'Failed to generate proposals.',
      });
    }
  }

  /**
   * Records an application to a brief
   */
  public async recordApplication(req: AuthenticatedRequest, res: Response) {
    try {
      const {
        briefId,
        pitchText,
        targetGigId,
        targetGigTitle,
        offeredPrice,
        deliveryDays,
        safetyGapSeconds = 25,
      } = req.body;

      if (!briefId || !pitchText) {
        return res.status(400).json({
          success: false,
          error: 'briefId and pitchText are required to record an application.',
        });
      }

      const updated = db.updateBriefApplication(briefId, {
        pitchText,
        targetGigId,
        targetGigTitle,
        offeredPrice: Number(offeredPrice) || 100,
        deliveryDays: Number(deliveryDays) || 2,
        safetyGapSeconds: Number(safetyGapSeconds) || 25,
      });

      if (!updated) {
        return res.status(404).json({
          success: false,
          error: 'Brief not found in store.',
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Application recorded successfully.',
        data: updated,
      });
    } catch (err: any) {
      console.error('Error recording application:', err);
      return res.status(500).json({ success: false, error: err.message || 'Failed to record application.' });
    }
  }
}

export const briefsController = new BriefsController();
