import { Request, Response } from 'express';
import { gigImageAgentService } from '../services/gigImageAgent.service.js';

export class GigImageAgentController {
  public async generateImage(req: Request, res: Response) {
    try {
      const { title, serviceDomain, techStack, experienceLevel, targetIcp, stylePreset, customPrompt } = req.body;

      const result = await gigImageAgentService.generateGigImage({
        title,
        serviceDomain,
        techStack,
        experienceLevel,
        targetIcp,
        stylePreset,
        customPrompt,
      });

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err: any) {
      console.error('Gig Image Agent generation error:', err);
      return res.status(500).json({
        success: false,
        error: err.message || 'Failed to generate gig image with autonomous agent.',
      });
    }
  }

  public getVariations(req: Request, res: Response) {
    try {
      const { title, serviceDomain, techStack, experienceLevel, targetIcp } = req.body;

      const variations = gigImageAgentService.getVariations({
        title,
        serviceDomain,
        techStack,
        experienceLevel,
        targetIcp,
      });

      return res.status(200).json({
        success: true,
        data: variations,
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        error: err.message,
      });
    }
  }

  public getStatus(req: Request, res: Response) {
    try {
      const status = gigImageAgentService.getAgentStatus();
      return res.status(200).json({
        success: true,
        data: status,
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        error: err.message,
      });
    }
  }

  public getKnowledge(req: Request, res: Response) {
    try {
      const knowledge = gigImageAgentService.getAgentKnowledge();
      return res.status(200).json({
        success: true,
        data: knowledge,
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        error: err.message,
      });
    }
  }
}

export const gigImageAgentController = new GigImageAgentController();
