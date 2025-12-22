import { Router, Request, Response } from 'express';
import { validateToken, fetchRecentActivity } from '../services/githubService.js';
import { ValidateTokenRequest, FetchActivityRequest } from '../types.js';

export const githubRouter = Router();

// POST /api/github/validate
githubRouter.post('/validate', async (req: Request, res: Response) => {
  try {
    const { token } = req.body as ValidateTokenRequest;

    if (!token) {
      return res.status(400).json({ error: 'Token is required' });
    }

    const userProfile = await validateToken(token);
    res.json(userProfile);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to validate token';
    res.status(401).json({ error: message });
  }
});

// POST /api/github/activity
githubRouter.post('/activity', async (req: Request, res: Response) => {
  try {
    const { token, username } = req.body as FetchActivityRequest;

    if (!token || !username) {
      return res.status(400).json({ error: 'Token and username are required' });
    }

    const activities = await fetchRecentActivity(token, username);
    res.json(activities);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch activity';
    res.status(500).json({ error: message });
  }
});
