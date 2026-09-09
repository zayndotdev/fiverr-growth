import { Response } from "express";
import { AuthenticatedRequest } from "../middlewares/auth.middleware.js";
import { db } from "../db/store.js";
import { icpGeneratorService } from "../services/icpGenerator.service.js";

export class OnboardingController {
  public async generateIcps(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.userId || req.body?.user_id;
      if (!userId) {
        return res.status(401).json({ success: false, error: "Authentication required." });
      }

      const user = db.findUserById(userId);
      if (!user) {
        return res.status(404).json({ success: false, error: "User not found." });
      }

      const profile = user.fiverrProfile;
      if (!profile) {
        return res.status(400).json({ success: false, error: "No Fiverr profile found for this user." });
      }

      const icps = await icpGeneratorService.generateIcpsFromProfile(profile);

      return res.status(200).json({
        success: true,
        data: icps
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  public async confirmIcps(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.userId || req.body?.user_id;
      if (!userId) {
        return res.status(401).json({ success: false, error: "Authentication required." });
      }

      const { icpProfiles } = req.body;
      if (!icpProfiles || !Array.isArray(icpProfiles)) {
        return res.status(400).json({ success: false, error: "Valid icpProfiles array is required." });
      }

      db.saveIcpProfiles(userId, icpProfiles);
      db.updateOnboardingStatus(userId, 3, false, false);

      return res.status(200).json({
        success: true,
        message: "ICPs confirmed successfully."
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  public async updateOnboardingStatus(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.userId || req.body?.user_id;
      if (!userId) {
        return res.status(401).json({ success: false, error: "Authentication required." });
      }

      const { completed, skipped, step } = req.body;
      const updated = db.updateOnboardingStatus(
        userId,
        typeof step === 'number' ? step : 1,
        !!completed,
        !!skipped
      );

      return res.status(200).json({
        success: true,
        data: updated
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  public async getOnboardingStatus(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.userId || req.body?.user_id;
      if (!userId) {
        return res.status(401).json({ success: false, error: "Authentication required." });
      }

      const user = db.findUserById(userId);
      if (!user) {
        return res.status(404).json({ success: false, error: "User not found." });
      }

      return res.status(200).json({
        success: true,
        data: {
          onboardingCompleted: user.onboardingCompleted,
          onboardingSkipped: user.onboardingSkipped,
          onboardingStep: user.onboardingStep,
          hasProfile: !!user.fiverrProfile,
          hasIcps: !!(user.icpProfiles && user.icpProfiles.length > 0),
          icpProfiles: user.icpProfiles
        }
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }
}

export const onboardingController = new OnboardingController();
