import { apiGet, apiPost } from './apiClient';
import { RepoActivity } from '../types';

export interface RepoAccessOptions {
  publicRepos: boolean;
  privateRepos: boolean;
}

export interface RepoInfo {
  id: number;
  name: string;
  fullName: string;
  description: string | null;
  private: boolean;
  updatedAt: string;
  pushedAt: string;
  language: string | null;
  stargazersCount: number;
}

/**
 * Get user's public repos (no auth required)
 */
export const fetchPublicRepos = async (username: string): Promise<RepoInfo[]> => {
  return apiGet<RepoInfo[]>(`/github/public-repos/${username}`);
};

/**
 * Get user's private repos (requires repo scope authorization)
 */
export const fetchPrivateRepos = async (): Promise<RepoInfo[]> => {
  return apiGet<RepoInfo[]>('/github/private-repos');
};

/**
 * Get user's recent activity
 * Token is retrieved from session on the backend
 */
export const fetchRecentActivity = async (username: string, accessOptions: RepoAccessOptions, days: number = 1): Promise<RepoActivity[]> => {
  return apiPost<RepoActivity[]>('/github/activity', { username, accessOptions, days });
};
