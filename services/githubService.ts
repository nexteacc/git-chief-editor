import { apiPost } from './apiClient';
import { RepoActivity, UserProfile } from '../types';

export interface RepoAccessOptions {
  publicRepos: boolean;
  privateRepos: boolean;
}

/**
 * 验证 Token 并返回用户信息
 * 通过后端代理调用 GitHub API
 */
export const validateToken = async (token: string, accessOptions: RepoAccessOptions): Promise<UserProfile> => {
  return apiPost<UserProfile>('/github/validate', { token, accessOptions });
};

/**
 * 获取用户最近的活动
 * 通过后端代理调用 GitHub API
 */
export const fetchRecentActivity = async (token: string, username: string, accessOptions: RepoAccessOptions): Promise<RepoActivity[]> => {
  return apiPost<RepoActivity[]>('/github/activity', { token, username, accessOptions });
};
