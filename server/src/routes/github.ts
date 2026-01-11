import { Router, Request, Response } from 'express';
import { validateToken, fetchRecentActivity } from '../services/githubService.js';
import { ValidateTokenRequest, FetchActivityRequest } from '../types.js';

export const githubRouter = Router();

// POST /api/github/validate
githubRouter.post('/validate', async (req: Request, res: Response) => {
  try {
    const { token, accessOptions } = req.body as ValidateTokenRequest;

    if (!token) {
      return res.status(400).json({ error: 'Token is required' });
    }

    // 兜底默认值：只读取公开仓库
    const safeAccessOptions = accessOptions || { publicRepos: true, privateRepos: false };
    
    // 至少选择一种仓库类型
    if (!safeAccessOptions.publicRepos && !safeAccessOptions.privateRepos) {
      return res.status(400).json({ error: 'Please select at least one repository type' });
    }

    const userProfile = await validateToken(token, safeAccessOptions);
    res.json(userProfile);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to validate token';
    res.status(401).json({ error: message });
  }
});

// POST /api/github/activity
githubRouter.post('/activity', async (req: Request, res: Response) => {
  try {
    const { token, username, accessOptions } = req.body as FetchActivityRequest;

    if (!token || !username) {
      return res.status(400).json({ error: 'Token and username are required' });
    }

    // 兜底默认值：只读取公开仓库
    const safeAccessOptions = accessOptions || { publicRepos: true, privateRepos: false };

    const activities = await fetchRecentActivity(token, username, safeAccessOptions);
    res.json(activities);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch activity';
    res.status(500).json({ error: message });
  }
});
