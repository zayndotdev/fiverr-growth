import { Response } from "express";
import { AuthenticatedRequest } from "../middlewares/auth.middleware.js";
import { strategistService } from "../services/strategist.service.js";
import { db } from "../db/store.js";

export class StrategistController {
  public async handleInterviewTurn(req: AuthenticatedRequest, res: Response) {
    try {
      const body = req.body || {};
      
      // Support both { messages: [...] } and { message: "...", history: [...] }
      let messages: Array<{ role: "user" | "assistant" | "system"; content: string }> = [];
      if (Array.isArray(body.messages)) {
        messages = body.messages;
      } else if (body.message) {
        if (Array.isArray(body.history)) {
          messages = body.history.map((h: any) => ({
            role: h.role === "agent" ? "assistant" : h.role,
            content: h.content || h.text || ""
          }));
        }
        messages.push({ role: "user", content: body.message });
      } else {
        messages = [{ role: "user", content: "Hello, I am ready to start my Fiverr journey." }];
      }

      const collectedData = body.collectedData || body.extracted_data || {};
      const result = await strategistService.interviewTurn(messages, collectedData);

      return res.status(200).json({
        success: true,
        reply: result.reply,
        collectedData: result.collectedData,
        data: {
          reply: result.reply,
          extracted_data: {
            name: result.collectedData?.fullName || "",
            fiverr_url: result.collectedData?.fiverrUrl || "",
            skills: result.collectedData?.primarySkills?.join(", ") || "",
            intended_gigs: result.collectedData?.targetNiches?.join(", ") || ""
          }
        }
      });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  }

  public async synthesizeStrategy(req: AuthenticatedRequest, res: Response) {
    try {
      const body = req.body || {};
      const userId = req.user?.userId || body.user_id || "anonymous_user";

      // Support both flat schema and nested profile_data
      const profile = body.profile_data || body;
      const payload = {
        fullName: profile.fullName || profile.name || "Freelancer",
        fiverrUrl: profile.fiverrUrl || profile.fiverr_profile_url || "",
        experienceYears: profile.experienceYears || profile.experience_level || "3+ years",
        primarySkills: Array.isArray(profile.primarySkills)
          ? profile.primarySkills
          : Array.isArray(profile.skills)
          ? profile.skills
          : ["Full-Stack Development", "Python", "React"],
        secondarySkills: Array.isArray(profile.secondarySkills) ? profile.secondarySkills : [],
        targetNiches: Array.isArray(profile.targetNiches)
          ? profile.targetNiches
          : Array.isArray(profile.intended_gigs)
          ? profile.intended_gigs
          : ["Web Development", "AI Automation"]
      };

      const result = await strategistService.synthesizeMarketStrategy(userId, payload) as any;

      // Merge backend result with normalized frontend blueprint keys
      const responseData = {
        ...result,
        onboardingCompleted: true,
        marketStrategy: result.marketStrategy,
        target_niches: result.marketStrategy?.recommendedNiches?.map((n: any) => n.niche) || payload.targetNiches,
        recommended_gigs: result.marketStrategy?.recommendedNiches?.map((n: any) => ({
          title: `I will build ${n.niche} solution with top-tier quality`,
          niche: n.niche,
          demand_score: Math.round(n.opportunityScore * 10),
          avg_ticket_price: `$${n.avgTicketPriceUSD}`,
          differentiation_angle: n.rationale
        })) || [],
        profile_positioning: {
          recommended_title: result.profilePositioning?.headline || `${payload.fullName} | Expert Engineer`,
          usp: result.profilePositioning?.uniqueValueProp || "Enterprise-grade architecture with 24-hr turnaround.",
          target_audience: "SMBs, founders, and tech teams looking for senior expertise"
        },
        market_analysis: {
          demand_level: "High Velocity Demand (Top 10%)",
          competition_density: result.marketStrategy?.saturationRisk || "Low Saturation in Deep Niches",
          pricing_strategy: `Minimum ticket target: $${result.pricingStrategy?.recommendedMinimumHourlyRate || 50}/hr`
        },
        actionable_roadmap: result.marketStrategy?.growthPlaybook || [
          "Launch primary high-demand gig with verified keywords",
          "Apply to live active client briefs daily",
          "Deliver 24-hr fast-turnaround initial orders"
        ],
        anti_patterns_to_avoid: result.marketStrategy?.avoidCommodities || [
          "Do not offer generic underpriced websites",
          "Avoid saturated low-ticket tasks"
        ]
      };

      return res.status(200).json({
        success: true,
        data: responseData
      });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  }

  public async getContext(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = (req.params?.userId || req.user?.userId || req.query?.userId) as string;
      if (!userId) {
        return res.status(401).json({ success: false, error: "Authentication or userId required." });
      }
      const context = db.getUserContext(userId);
      return res.status(200).json({ success: true, data: context });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  public async updateContext(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.userId || req.body?.user_id;
      if (!userId) {
        return res.status(401).json({ success: false, error: "Authentication required." });
      }
      const updated = db.saveUserContext(userId, req.body);
      return res.status(200).json({ success: true, data: updated });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  }
}

export const strategistController = new StrategistController();
