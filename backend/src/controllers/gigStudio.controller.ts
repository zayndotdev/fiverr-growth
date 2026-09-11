import { Response } from "express";
import { AuthenticatedRequest } from "../middlewares/auth.middleware.js";
import { db } from "../db/store.js";
import { gigStudioService } from "../services/gigStudio.service.js";

export class GigStudioController {
  /**
   * Generates the first dynamic interrogation question based on seller's context
   */
  public async startInterrogation(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.userId || req.body?.userId;
      let sellerProfile: any = null;
      let sellerSkills: string[] = [];

      if (userId) {
        const user = db.findUserById(userId);
        if (user) {
          sellerProfile = user.fiverrProfile;
          if (sellerProfile?.skills && Array.isArray(sellerProfile.skills)) {
            sellerSkills = sellerProfile.skills.map((s: any) => (typeof s === 'string' ? s : s.name || ''));
          }
        }
      }

      const question = gigStudioService.getInitialQuestion(sellerProfile, sellerSkills);

      return res.status(200).json({
        success: true,
        data: question
      });
    } catch (err: any) {
      console.error('Error starting gig interrogation:', err);
      return res.status(500).json({ success: false, error: err.message || 'Internal server error' });
    }
  }

  /**
   * Returns the next interrogation question based on current answers
   */
  public async nextInterrogationTurn(req: AuthenticatedRequest, res: Response) {
    try {
      const { currentStep, answers } = req.body;
      if (!currentStep || !answers) {
        return res.status(400).json({ success: false, error: 'currentStep and answers are required.' });
      }

      const nextQuestion = gigStudioService.getNextQuestion(Number(currentStep), answers);

      return res.status(200).json({
        success: true,
        data: nextQuestion
      });
    } catch (err: any) {
      console.error('Error handling next interrogation turn:', err);
      return res.status(500).json({ success: false, error: err.message || 'Internal server error' });
    }
  }

  /**
   * Synthesizes the full 6-step Fiverr Gig Blueprint + 1280x769 Thumbnail specs
   */
  public async synthesizeGigStudio(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.userId || req.body?.userId;
      const { answers } = req.body;

      if (!answers || typeof answers !== 'object') {
        return res.status(400).json({ success: false, error: 'answers payload is required.' });
      }

      let sellerProfile: any = null;
      let sellerSkills: string[] = [];

      if (userId) {
        const user = db.findUserById(userId);
        if (user) {
          sellerProfile = user.fiverrProfile;
          if (sellerProfile?.skills && Array.isArray(sellerProfile.skills)) {
            sellerSkills = sellerProfile.skills.map((s: any) => (typeof s === 'string' ? s : s.name || ''));
          }
        }
      }

      const blueprint = await gigStudioService.synthesizeGigStudio(answers, sellerProfile, sellerSkills);

      return res.status(200).json({
        success: true,
        data: blueprint
      });
    } catch (err: any) {
      console.error('Error synthesizing gig studio blueprint:', err);
      return res.status(500).json({ success: false, error: err.message || 'Failed to synthesize gig blueprint.' });
    }
  }

  /**
   * Generates photorealistic 3D AI artwork for the gig thumbnail
   */
  public async generateArtwork(req: AuthenticatedRequest, res: Response) {
    try {
      const { prompt, style } = req.body;
      const artwork = await gigStudioService.generateGigArtwork(prompt || '', style || '3d_robot');

      return res.status(200).json({
        success: true,
        data: artwork
      });
    } catch (err: any) {
      console.error('Error generating gig artwork:', err);
      return res.status(500).json({ success: false, error: err.message || 'Failed to generate artwork.' });
    }
  }

  /**
   * Regenerates high-converting description copy using 5-part agency framework and selected tone
   */
  public async regenerateDescription(req: AuthenticatedRequest, res: Response) {
    try {
      const { title, serviceDomain, techStack, tone } = req.body;
      if (!title) {
        return res.status(400).json({ success: false, error: 'title is required.' });
      }

      const description = await gigStudioService.regenerateDescription(
        title,
        serviceDomain || 'Software Development',
        techStack || 'React, TypeScript, Next.js',
        tone || 'roi_closer'
      );

      return res.status(200).json({
        success: true,
        data: description
      });
    } catch (err: any) {
      console.error('Error regenerating gig description:', err);
      return res.status(500).json({ success: false, error: err.message || 'Failed to regenerate description.' });
    }
  }
}

export const gigStudioController = new GigStudioController();
