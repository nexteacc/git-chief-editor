import { apiGet, apiPost } from './apiClient';

export interface User {
  id: number;
  githubId: number;
  login: string;
  name: string | null;
  avatarUrl: string | null;
  email: string | null;
}

export interface UserPreferences {
  reportStyle: 'PROFESSIONAL' | 'TECHNICAL' | 'ACHIEVEMENT';
  outputLanguage: 'CHINESE' | 'ENGLISH';
  selectedRepos: string[] | null;
  includePrivateRepos: boolean;
  pushFrequency: 'DAILY' | 'WEEKLY' | null;
  pushTime: string;
  pushWeekday: number;
  timezone: string;
  skipIfNoActivity: boolean;
  emailEnabled: boolean;
  slackWebhook: string | null;
  discordWebhook: string | null;
}

export interface AuthResponse {
  user: User;
  preferences: UserPreferences | null;
}

// Check if user is logged in
export async function getCurrentUser(): Promise<AuthResponse | null> {
  try {
    return await apiGet<AuthResponse>('/auth/me');
  } catch (error) {
    // 401 means not logged in, which is expected
    return null;
  }
}

// Redirect to GitHub OAuth login (only requests user info, no repo access)
export function redirectToLogin(): void {
  window.location.href = '/api/auth/login';
}

// Redirect to GitHub OAuth to authorize repo access (for private repos)
export function authorizeRepoAccess(): void {
  window.location.href = '/api/auth/authorize-repos';
}

// Logout - 只清除服务端 session，UI 状态由调用方负责
export async function logout(): Promise<void> {
  await apiPost('/auth/logout', {});
}
