import { apiPost } from './apiClient';
import { DailyReport, RepoActivity, SummaryStyle, OutputLanguage } from '../types';

/**
 * 生成日报
 * 通过后端代理调用 Gemini API
 */
export const generateDailyReport = async (
  activities: RepoActivity[],
  style: SummaryStyle,
  language: OutputLanguage
): Promise<DailyReport> => {
  return apiPost<DailyReport>('/gemini/report', { activities, style, language });
};
