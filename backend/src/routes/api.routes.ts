import { Router } from "express";
import { authController } from "../controllers/auth.controller.js";
import { strategistController } from "../controllers/strategist.controller.js";
import { apiController } from "../controllers/api.controller.js";
import { scraperController } from "../controllers/scraper.controller.js";
import { requireAuth, optionalAuth } from "../middlewares/auth.middleware.js";

const router = Router();

// --- Auth Routes ---
router.post("/auth/register", (req, res) => authController.register(req, res));
router.post("/auth/login", (req, res) => authController.login(req, res));
router.get("/auth/me", requireAuth, (req, res) => authController.me(req, res));

// --- Fiverr Scraping & Onboarding Step 1 Routes ---
router.post("/scraper/fiverr-profile", optionalAuth, (req, res) => scraperController.scrapeProfile(req, res));
router.post("/onboarding/fiverr-profile", optionalAuth, (req, res) => scraperController.saveProfile(req, res));
router.post("/onboarding/fresh-start", optionalAuth, (req, res) => scraperController.freshStart(req, res));

// --- Onboarding & Growth Strategist Routes ---
router.post("/onboarding/message", optionalAuth, (req, res) => strategistController.handleInterviewTurn(req, res));
router.post("/onboarding/synthesize-strategy", optionalAuth, (req, res) => strategistController.synthesizeStrategy(req, res));
router.post("/strategist/interview", optionalAuth, (req, res) => strategistController.handleInterviewTurn(req, res));
router.post("/strategist/synthesize", optionalAuth, (req, res) => strategistController.synthesizeStrategy(req, res));
router.get("/user/context", requireAuth, (req, res) => strategistController.getContext(req, res));
router.get("/strategist/context/:userId", optionalAuth, (req, res) => strategistController.getContext(req, res));
router.put("/user/context", requireAuth, (req, res) => strategistController.updateContext(req, res));

// --- Gig Generator Routes ---
router.post("/gigs/generate", optionalAuth, (req, res) => apiController.generateGig(req, res));
router.get("/gigs", optionalAuth, (req, res) => apiController.getGigs(req, res));

// --- Buyer Briefs Routes ---
router.get("/briefs/live", optionalAuth, (req, res) => apiController.getLiveBriefs(req, res));
router.post("/briefs/propose", optionalAuth, (req, res) => apiController.proposeBrief(req, res));
router.get("/briefs", optionalAuth, (req, res) => apiController.getBriefs(req, res));

// --- Market Research & Intelligence Routes ---
router.get("/market/intelligence", optionalAuth, (req, res) => apiController.getMarketIntelligence(req, res));
router.post("/research/niche", optionalAuth, (req, res) => apiController.researchNiche(req, res));
router.get("/research/history", optionalAuth, (req, res) => apiController.getResearchHistory(req, res));

export default router;
