import { Router, Request, Response } from 'express';
import { generateDailyReport } from '../services/geminiService.js';
import { GenerateReportRequest } from '../types.js';

export const geminiRouter = Router();

// POST /api/gemini/report
geminiRouter.post('/report', async (req: Request, res: Response) => {
  try {
    const { activities, style, language } = req.body as GenerateReportRequest;

    if (!activities || !Array.isArray(activities)) {
      return res.status(400).json({ error: 'Activities array is required' });
    }

    if (!style) {
      return res.status(400).json({ error: 'Style is required' });
    }

    if (!language) {
      return res.status(400).json({ error: 'Language is required' });
    }

    const report = await generateDailyReport(activities, style, language);
    res.json(report);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to generate report';
    res.status(500).json({ error: message });
  }
});
