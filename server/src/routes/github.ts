import { Router, Request, Response } from 'express';
import { fetchRecentActivity } from '../services/githubService.js';
import { getUserById } from '../services/dbService.js';

// Extend session type
declare module 'express-session' {
  interface SessionData {
    userId?: number;
  }
}

export const githubRouter = Router();

// GET /api/github/public-repos/:username - Get user's public repos (no auth needed)
githubRouter.get('/public-repos/:username', async (req: Request, res: Response) => {
  try {
    const { username } = req.params;

    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }

    // Fetch public repos from GitHub API (no auth required)
    const response = await fetch(
      `https://api.github.com/users/${username}/repos?type=public&sort=updated&per_page=100`,
      {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'Git-Chief-Editor',
        },
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        return res.status(404).json({ error: 'User not found' });
      }
      throw new Error(`GitHub API error: ${response.status}`);
    }

    const repos = await response.json() as any[];

    // Return simplified repo list
    const simplifiedRepos = repos.map((repo: any) => ({
      id: repo.id,
      name: repo.name,
      fullName: repo.full_name,
      description: repo.description,
      private: repo.private,
      updatedAt: repo.updated_at,
      pushedAt: repo.pushed_at,
      language: repo.language,
      stargazersCount: repo.stargazers_count,
    }));

    res.json(simplifiedRepos);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch repos';
    res.status(500).json({ error: message });
  }
});

// GET /api/github/private-repos - Get user's private repos (requires auth with repo scope)
githubRouter.get('/private-repos', async (req: Request, res: Response) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const user = getUserById(req.session.userId);
    if (!user || !user.token_valid) {
      return res.status(401).json({ error: 'Session expired, please login again' });
    }

    // Fetch all repos (including private) using user's token
    const response = await fetch(
      `https://api.github.com/user/repos?type=all&sort=updated&per_page=100`,
      {
        headers: {
          'Authorization': `Bearer ${user.access_token}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'Git-Chief-Editor',
        },
      }
    );

    // Check if the token has the necessary 'repo' scope
    const scopes = response.headers.get('X-OAuth-Scopes') || '';
    console.log('[Debug] X-OAuth-Scopes:', scopes); // Add debug log

    if (!scopes.includes('repo')) {
      return res.status(403).json({
        error: 'Missing "repo" scope',
        details: 'The current authorization does not allow access to private repositories.'
      });
    }

    if (!response.ok) {
      if (response.status === 401) {
        return res.status(401).json({ error: 'Token expired or insufficient permissions.' });
      }
      throw new Error(`GitHub API error: ${response.status}`);
    }

    const repos = await response.json() as any[];

    // Filter to only private repos
    const privateRepos = repos
      .filter((repo: any) => repo.private)
      .map((repo: any) => ({
        id: repo.id,
        name: repo.name,
        fullName: repo.full_name,
        description: repo.description,
        private: repo.private,
        updatedAt: repo.updated_at,
        pushedAt: repo.pushed_at,
        language: repo.language,
        stargazersCount: repo.stargazers_count,
      }));

    res.json(privateRepos);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch private repos';
    res.status(500).json({ error: message });
  }
});

// POST /api/github/activity - Get user's recent activity
githubRouter.post('/activity', async (req: Request, res: Response) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { username, accessOptions, days } = req.body;

    if (!username || !accessOptions) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const user = getUserById(req.session.userId);
    if (!user || !user.token_valid) {
      return res.status(401).json({ error: 'Session expired, please login again' });
    }

    const activities = await fetchRecentActivity(user.access_token, username, accessOptions, days || 1);
    res.json(activities);
  } catch (error) {
    console.error('Error fetching activity:', error);
    res.status(500).json({ error: 'Failed to fetch GitHub activity' });
  }
});
