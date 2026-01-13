import { Router, Request, Response } from 'express';
import { upsertUser, getUserById, getPreferences, upsertPreferences } from '../services/dbService.js';

const authRouter = Router();

// Get env vars lazily (after dotenv.config() has been called)
const getGitHubConfig = () => ({
  clientId: process.env.GITHUB_CLIENT_ID,
  clientSecret: process.env.GITHUB_CLIENT_SECRET,
  callbackUrl: process.env.GITHUB_CALLBACK_URL || 'http://localhost:3001/api/auth/callback',
});

// Frontend URL for redirects
const getFrontendUrl = () => {
  if (process.env.NODE_ENV === 'production') {
    return '';  // Same origin in production
  }
  return process.env.FRONTEND_URL || 'http://localhost:3000';
};

// Extend session type
declare module 'express-session' {
  interface SessionData {
    userId?: number;
  }
}

// GET /api/auth/login - Redirect to GitHub OAuth
// Only requests user info, no repo access (secure approach)
authRouter.get('/login', (req: Request, res: Response) => {
  const config = getGitHubConfig();

  if (!config.clientId) {
    return res.status(500).json({ error: 'GitHub OAuth not configured' });
  }

  // Only request user info - no repo access
  const scope = 'read:user user:email';

  const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${config.clientId}&redirect_uri=${encodeURIComponent(config.callbackUrl)}&scope=${encodeURIComponent(scope)}`;

  res.redirect(githubAuthUrl);
});

// GET /api/auth/callback - Handle OAuth callback
authRouter.get('/callback', async (req: Request, res: Response) => {
  const { code, error } = req.query;
  const config = getGitHubConfig();
  const frontendUrl = getFrontendUrl();

  // Handle user cancellation or error
  if (error || !code) {
    console.log('[Auth] OAuth cancelled or error:', error);
    return res.redirect(`${frontendUrl}/?error=auth_cancelled`);
  }

  try {
    // Exchange code for access token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        code,
      }),
    });

    const tokenData = await tokenResponse.json() as { access_token?: string; error?: string };

    if (tokenData.error || !tokenData.access_token) {
      console.error('[Auth] Token exchange failed:', tokenData.error);
      return res.redirect(`${frontendUrl}/?error=token_exchange_failed`);
    }

    const accessToken = tokenData.access_token;

    // Fetch user info from GitHub
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Today-Vibe-Editor',
      },
    });

    if (!userResponse.ok) {
      console.error('[Auth] Failed to fetch user info');
      return res.redirect(`${frontendUrl}/?error=user_fetch_failed`);
    }

    const githubUser = await userResponse.json() as {
      id: number;
      login: string;
      name: string | null;
      avatar_url: string;
      email: string | null;
    };

    // Upsert user in database
    const user = upsertUser(githubUser, accessToken);
    console.log('[Auth] User logged in:', user.github_login);

    // Ensure preferences exist
    if (!getPreferences(user.id)) {
      upsertPreferences(user.id, {});
    }

    // Set session
    req.session.userId = user.id;

    // Redirect to app (need to save session first)
    req.session.save((err) => {
      if (err) {
        console.error('[Auth] Session save error:', err);
      }
      res.redirect(`${frontendUrl}/`);
    });
  } catch (err) {
    console.error('[Auth] Callback error:', err);
    res.redirect(`${frontendUrl}/?error=auth_failed`);
  }
});

// GET /api/auth/me - Get current user
authRouter.get('/me', (req: Request, res: Response) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const user = getUserById(req.session.userId);
  if (!user) {
    req.session.destroy(() => {});
    return res.status(401).json({ error: 'User not found' });
  }

  const preferences = getPreferences(user.id);

  res.json({
    user: {
      id: user.id,
      githubId: user.github_id,
      login: user.github_login,
      name: user.github_name,
      avatarUrl: user.avatar_url,
      email: user.email,
    },
    preferences: preferences ? {
      reportStyle: preferences.report_style,
      outputLanguage: preferences.output_language,
      selectedRepos: preferences.selected_repos ? JSON.parse(preferences.selected_repos) : null,
      includePrivateRepos: Boolean(preferences.include_private_repos),
      pushFrequency: preferences.push_frequency,
      pushTime: preferences.push_time,
      pushWeekday: preferences.push_weekday,
      timezone: preferences.timezone,
      skipIfNoActivity: Boolean(preferences.skip_if_no_activity),
      emailEnabled: Boolean(preferences.email_enabled),
      slackWebhook: preferences.slack_webhook,
      discordWebhook: preferences.discord_webhook,
    } : null,
  });
});

// POST /api/auth/logout - Logout
authRouter.post('/logout', (req: Request, res: Response) => {
  const userId = req.session.userId;

  req.session.destroy((err) => {
    if (err) {
      console.error('[Auth] Logout error:', err);
      return res.status(500).json({ error: 'Logout failed' });
    }

    res.clearCookie('connect.sid');
    console.log('[Auth] User logged out:', userId);
    res.json({ success: true });
  });
});

// GET /api/auth/authorize-repos - Request repo access (for private repos)
// User can request this separately after login
authRouter.get('/authorize-repos', (req: Request, res: Response) => {
  const config = getGitHubConfig();

  if (!config.clientId) {
    return res.status(500).json({ error: 'GitHub OAuth not configured' });
  }

  if (!req.session.userId) {
    return res.status(401).json({ error: 'Must be logged in first' });
  }

  // Request full repo access
  const scope = 'read:user user:email repo';

  const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${config.clientId}&redirect_uri=${encodeURIComponent(config.callbackUrl)}&scope=${encodeURIComponent(scope)}`;

  res.redirect(githubAuthUrl);
});

export { authRouter };
