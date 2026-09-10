import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth.middleware.js';
import { db } from '../db/store.js';
import { fiverrScraperService, normalizeFiverrUsername } from '../services/fiverrScraper.service.js';
import { competitorAnalysisService } from '../services/competitorAnalysis.service.js';

export class CompetitorController {
  /**
   * Discovers real-time competitors currently ranking in the user's primary niches or by custom query
   */
  public async discoverCompetitors(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      const customQuery = (req.body?.query || req.query?.query) as string;
      const minReviews = req.body?.minReviews ? parseInt(req.body.minReviews, 10) : 5;
      const sortBy = (req.body?.sortBy || req.query?.sortBy || 'revenue') as string;
      const filterTier = (req.body?.filterTier || req.query?.filterTier) as string;

      let targetQuery = customQuery?.trim();

      if (!targetQuery && userId) {
        const userContext = db.getUserContext(userId);
        const user = db.findUserById(userId);

        // 1. Prioritize clean target niches or primary skills
        if (userContext?.targetNiches && userContext.targetNiches.length > 0) {
          targetQuery = userContext.targetNiches[0];
        } else if (userContext?.primarySkills && userContext.primarySkills.length > 0) {
          targetQuery = `${userContext.primarySkills.slice(0, 2).join(' ')} development`;
        } else {
          const gigTitle = userContext?.fiverrProfile?.gigs?.[0]?.title || user?.fiverrProfile?.gigs?.[0]?.title;
          if (gigTitle) {
            const clean = gigTitle
              .replace(/^(I\s+will|build|create|setup|develop|design|your|custom)\s+/gi, '')
              .replace(/[^a-zA-Z0-9\s]/g, ' ')
              .trim();
            targetQuery = clean.split(/\s+/).slice(0, 3).join(' ');
          }
        }
      }

      if (!targetQuery || targetQuery.length < 3) {
        targetQuery = 'ai chatbot automation';
      }

      let competitors = await fiverrScraperService.searchCompetitorGigs(targetQuery, { limit: 36, minReviews });

      // Filter by commercial earner tier if requested
      if (filterTier && filterTier !== 'all') {
        competitors = competitors.filter((c) => {
          if (filterTier === 'market_leader') return c.earnerTier === 'Market Leader';
          if (filterTier === 'high_velocity') return c.earnerTier === 'High Velocity Earner' || c.earnerTier === 'Market Leader';
          if (filterTier === 'pro_choice') return c.isPro || c.isFiverrChoice || c.isTopRated;
          return true;
        });
      }

      // Apply sorting
      if (sortBy === 'revenue') {
        competitors.sort((a, b) => b.startingPrice - a.startingPrice);
      } else if (sortBy === 'reviews') {
        competitors.sort((a, b) => b.reviewsCount - a.reviewsCount);
      } else if (sortBy === 'rating') {
        competitors.sort((a, b) => b.rating - a.rating || b.reviewsCount - a.reviewsCount);
      }

      return res.status(200).json({
        success: true,
        query: targetQuery,
        count: competitors.length,
        data: competitors,
      });
    } catch (err: any) {
      console.error('Error discovering competitors:', err);
      return res.status(500).json({
        success: false,
        error: err.message || 'Failed to discover competitors from Fiverr.',
      });
    }
  }

  /**
   * Performs deep comparative gap analysis between authenticated user and a target competitor
   */
  public async analyzeCompetitor(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      const targetInput = req.body?.competitorUsernameOrUrl;

      if (!targetInput) {
        return res.status(400).json({
          success: false,
          error: 'Please provide a competitor Fiverr username or profile URL.',
        });
      }

      const competitorUsername = normalizeFiverrUsername(targetInput);
      if (!competitorUsername) {
        return res.status(400).json({
          success: false,
          error: 'Invalid competitor username or link format.',
        });
      }

      // 1. Fetch live competitor profile and gig catalog
      const competitorProfile = await fiverrScraperService.scrapeProfile(competitorUsername);

      // 2. Retrieve current user context and profile
      let userProfile = null;
      let userIcps: any[] = [];

      if (userId) {
        const userContext = db.getUserContext(userId);
        const user = db.findUserById(userId);
        userProfile = userContext?.fiverrProfile || user?.fiverrProfile || null;
        userIcps = userContext?.icpProfiles || user?.icpProfiles || [];
      }

      // If user profile is not in database, create baseline user representation from user info
      if (!userProfile) {
        const user = userId ? db.findUserById(userId) : null;
        userProfile = {
          username: user?.username || 'user',
          displayName: user?.username || 'Freelancer',
          profileUrl: `https://www.fiverr.com/${user?.username || 'user'}`,
          avatarUrl: '',
          tagline: 'Full Stack & AI Developer',
          description: 'Specialist in custom software development and AI automation.',
          country: 'United States',
          countryCode: 'US',
          memberSince: '2024',
          responseTimeHours: 1,
          responseTimeText: '1 hour',
          lastDeliveryText: '1 day ago',
          sellerLevel: 'Level 1 Seller',
          isPro: false,
          isVerified: true,
          isHighlyResponsive: true,
          rating: 4.9,
          reviewCount: 15,
          languages: [{ language: 'English', level: 'Fluent' }],
          skills: [{ name: 'React', level: 'PRO', verified: true }, { name: 'Node.js', level: 'PRO', verified: true }],
          education: [],
          certifications: [],
          gigs: [
            {
              id: 'gig_default',
              title: 'Build custom web applications and full stack solutions',
              startingPrice: '$50',
              rating: 4.9,
              reviewCount: 15,
              tags: ['web development', 'full stack', 'react', 'api integration'],
              packages: [
                { title: 'Basic', description: 'Core feature setup', price: 50 },
                { title: 'Standard', description: 'Full feature implementation', price: 150 },
                { title: 'Premium', description: 'Production enterprise delivery', price: 350 },
              ],
            },
          ],
          recentReviews: [],
          scrapedAt: new Date().toISOString(),
        };
      }

      // 3. Conduct comparative analysis
      const analysisResult = await competitorAnalysisService.compareSellers(
        userProfile,
        competitorProfile,
        userIcps
      );

      return res.status(200).json({
        success: true,
        data: {
          competitorProfile,
          metricsComparison: analysisResult.metricsComparison,
          gapAnalysis: analysisResult.gapAnalysis,
        },
      });
    } catch (err: any) {
      console.error('Error in analyzeCompetitor:', err);
      return res.status(500).json({
        success: false,
        error: err.message || 'Failed to analyze competitor profile.',
      });
    }
  }

  /**
   * Retrieves saved competitor reports for this user
   */
  public async getSavedReports(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const reports = db.getCompetitorReports(userId);
      return res.status(200).json({
        success: true,
        count: reports.length,
        data: reports,
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * Persists a competitor gap analysis report
   */
  public async saveReport(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const { competitorUsername, competitorProfile, metricsComparison, gapAnalysis } = req.body;
      if (!competitorUsername || !competitorProfile || !metricsComparison || !gapAnalysis) {
        return res.status(400).json({
          success: false,
          error: 'Incomplete report payload.',
        });
      }

      const saved = db.saveCompetitorReport(userId, {
        userId,
        competitorUsername,
        competitorProfile,
        metricsComparison,
        gapAnalysis,
      });

      return res.status(201).json({
        success: true,
        data: saved,
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * Deletes a saved competitor report
   */
  public async deleteReport(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      const rawId = req.params?.id;
      const reportId = Array.isArray(rawId) ? rawId[0] : rawId;
      if (!userId || !reportId) {
        return res.status(400).json({ success: false, error: 'Missing reportId' });
      }

      const deleted = db.deleteCompetitorReport(userId, reportId);
      return res.status(200).json({
        success: true,
        deleted,
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }
}

export const competitorController = new CompetitorController();
