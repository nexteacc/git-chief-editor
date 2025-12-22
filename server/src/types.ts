export enum SummaryStyle {
  PROFESSIONAL = 'PROFESSIONAL',
  TECHNICAL = 'TECHNICAL',
  ACHIEVEMENT = 'ACHIEVEMENT',
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
  tags: string[];
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
  repoDurations?: RepoDuration[];
}

export interface UserProfile {
  login: string;
  avatar_url: string;
  name: string;
}

export interface ValidateTokenRequest {
  token: string;
}

export interface FetchActivityRequest {
  token: string;
  username: string;
}

export interface GenerateReportRequest {
  activities: RepoActivity[];
  style: SummaryStyle;
}
