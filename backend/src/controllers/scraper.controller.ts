import { Response } from "express";
import { AuthenticatedRequest } from "../middlewares/auth.middleware.js";
import { fiverrScraperService, normalizeFiverrUsername } from "../services/fiverrScraper.service.js";
import { db } from "../db/store.js";
import { z } from "zod";

const ScrapeSchema = z.object({
  usernameOrUrl: z.string().min(2, "Please enter a valid Fiverr username or profile URL."),
});

export class ScraperController {
  /**
   * Real-time scrape of public Fiverr profile
   * POST /api/v1/scraper/fiverr-profile
   */
  public async scrapeProfile(req: AuthenticatedRequest, res: Response) {
    try {
      const validated = ScrapeSchema.parse(req.body);
      const profile = await fiverrScraperService.scrapeProfile(validated.usernameOrUrl);

      // If user is authenticated, we can optionally save or return it
      return res.status(200).json({
        success: true,
        data: profile,
        profile,
      });
    } catch (err: any) {
      return res.status(400).json({
        success: false,
        error: err.message || "Failed to scrape Fiverr profile.",
      });
    }
  }

  /**
   * Confirms and persists the scraped profile to the database for the user
   * POST /api/v1/onboarding/fiverr-profile
   */
  public async saveProfile(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.userId || req.body?.user_id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: "You must be signed in to save your profile context.",
        });
      }

      let profile = req.body?.profile;

      // If profile is not passed directly, scrape it from usernameOrUrl
      if (!profile && req.body?.usernameOrUrl) {
        profile = await fiverrScraperService.scrapeProfile(req.body.usernameOrUrl);
      }

      if (!profile) {
        return res.status(400).json({
          success: false,
          error: "Profile data or usernameOrUrl is required.",
        });
      }

      // Save profile to database
      const context = db.saveFiverrProfile(userId, profile);

      return res.status(200).json({
        success: true,
        message: "Fiverr profile successfully verified and saved.",
        data: {
          profile,
          context,
        },
      });
    } catch (err: any) {
      return res.status(400).json({
        success: false,
        error: err.message || "Failed to save profile to database.",
      });
    }
  }

  /**
   * For fresh freelancers starting without an existing Fiverr account
   * POST /api/v1/onboarding/fresh-start
   */
  public async freshStart(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.userId || req.body?.user_id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: "Authentication required.",
        });
      }

      const user = db.findUserById(userId);
      const context = db.saveUserContext(userId, {
        fullName: user?.username || "Fresh Freelancer",
        fiverrUrl: "",
        onboardingStep: 2,
        primarySkills: ["Web Development", "Frontend", "Full-Stack"],
        targetNiches: ["Modern Web Development", "AI Automation"],
      });

      return res.status(200).json({
        success: true,
        message: "Fresh seller profile initialized.",
        data: { context },
      });
    } catch (err: any) {
      return res.status(400).json({
        success: false,
        error: err.message || "Failed to initialize fresh seller context.",
      });
    }
  }
}

export const scraperController = new ScraperController();
