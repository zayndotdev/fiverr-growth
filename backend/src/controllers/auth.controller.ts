import { Request, Response } from "express";
import { authService } from "../services/auth.service.js";
import { db } from "../db/store.js";
import { AuthenticatedRequest } from "../middlewares/auth.middleware.js";
import { z } from "zod";

const RegisterSchema = z.object({
  email: z.string().email("Please provide a valid email address."),
  username: z.string().min(3, "Username must be at least 3 characters."),
  password: z.string().min(6, "Password must be at least 6 characters."),
  fiverr_profile_url: z.string().optional()
});

const LoginSchema = z.object({
  emailOrUsername: z.string().optional(),
  email: z.string().optional(),
  username: z.string().optional(),
  password: z.string().min(1, "Please provide your password.")
}).refine(data => data.emailOrUsername || data.email || data.username, {
  message: "Please provide your email or username."
});

export class AuthController {
  public async register(req: Request, res: Response) {
    try {
      const validated = RegisterSchema.parse(req.body);
      const result = await authService.register(
        validated.email,
        validated.username,
        validated.password,
        validated.fiverr_profile_url
      );

      const userResponse = {
        ...result.user,
        onboardingCompleted: result.user.onboardingCompleted,
        onboardingSkipped: result.user.onboardingSkipped,
        onboardingStep: result.user.onboardingStep
      };

      // Return both flat and nested data for 100% frontend and test compatibility
      return res.status(201).json({
        success: true,
        token: result.token,
        user: userResponse,
        data: {
          token: result.token,
          user: userResponse
        }
      });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  }

  public async login(req: Request, res: Response) {
    try {
      const validated = LoginSchema.parse(req.body);
      const identifier = validated.emailOrUsername || validated.email || validated.username || "";
      const result = await authService.login(identifier, validated.password);

      const userResponse = {
        ...result.user,
        onboardingCompleted: result.user.onboardingCompleted,
        onboardingSkipped: result.user.onboardingSkipped,
        onboardingStep: result.user.onboardingStep
      };

      // Return both flat and nested data
      return res.status(200).json({
        success: true,
        token: result.token,
        user: userResponse,
        data: {
          token: result.token,
          user: userResponse
        }
      });
    } catch (err: any) {
      return res.status(401).json({ success: false, error: err.message });
    }
  }

  public async me(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, error: "Not authenticated." });
      }
      const user = db.findUserById(req.user.userId);
      if (!user) {
        return res.status(404).json({ success: false, error: "User not found." });
      }
      const context = db.getUserContext(req.user.userId);
      const { passwordHash: _, ...safeUser } = user;
      
      const userResponse = {
        ...safeUser,
        onboardingCompleted: safeUser.onboardingCompleted,
        onboardingSkipped: safeUser.onboardingSkipped,
        onboardingStep: safeUser.onboardingStep,
        icpProfiles: safeUser.icpProfiles
      };

      return res.status(200).json({
        success: true,
        user: userResponse,
        context: context || null,
        data: {
          user: userResponse,
          context: context || null
        }
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }
}

export const authController = new AuthController();
