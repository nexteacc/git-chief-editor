export enum AppStep {
  AUTH = 'AUTH',
  FILTER = 'FILTER',
  PROCESSING = 'PROCESSING',
  DASHBOARD = 'DASHBOARD',
}

export enum SummaryStyle {
  PROFESSIONAL = 'PROFESSIONAL', // Minimalist, result-oriented
  TECHNICAL = 'TECHNICAL', // Deep dive, terminology heavy
  ACHIEVEMENT = 'ACHIEVEMENT', // Highlight oriented, enthusiastic
}

export interface GitHubEvent {
  id: string;
  type: string;
  actor: {
    login: string;
  };
  repo: {
    id: number;
    name: string;
    url: string;
  };
  payload: any;
  created_at: string;
  public: boolean;
}

export interface RawCommitData {
  message: string;
  sha: string;
  url: string;
  timestamp: string;
}

export interface RepoActivity {
  repoId: number;
  repoName: string;
  isPrivate: boolean;
  commits: RawCommitData[];
  prs: { title: string; body: string; url: string; number: number }[];
  eventCount: number;
}

export interface GeneratedRepoSummary {
  repoName: string;
  summary: string;
  tags: string[]; // e.g., "Refactor", "Feature", "Bugfix"
}

export interface RepoDuration {
  repoName: string;
  durationMinutes: number;
  commitCount: number;
}

export interface DailyReport {
  headline: string;
  date: string;
  totalCommits: number;
  totalPRs: number;
  keyAchievements: string[];
  repoSummaries: GeneratedRepoSummary[];
  style: SummaryStyle;
  // 每个仓库在时间窗口内的活跃时长（单位：分钟）
  repoDurations?: RepoDuration[];
}

export interface UserProfile {
  login: string;
  avatar_url: string;
  name: string;
}
