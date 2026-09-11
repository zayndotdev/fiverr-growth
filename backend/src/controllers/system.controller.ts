import { Request, Response } from "express";
import { logger } from "../utils/logger.js";

export class SystemController {
  public getLogs(req: Request, res: Response) {
    try {
      const category = (req.query.category as string) || undefined;
      const level = (req.query.level as string) || undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 200;
      const since = (req.query.since as string) || undefined;

      const logs = logger.getLogs({ category, level, limit, since });

      return res.status(200).json({
        success: true,
        count: logs.length,
        data: logs,
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  public getAgentHealth(req: Request, res: Response) {
    try {
      const health = logger.getAgentHealth();
      return res.status(200).json({
        success: true,
        data: health,
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  public clearLogs(req: Request, res: Response) {
    try {
      logger.clearLogs();
      return res.status(200).json({
        success: true,
        message: "Agent memory logs successfully cleared.",
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }
}

export const systemController = new SystemController();
