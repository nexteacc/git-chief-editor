import React from 'react';
import { DailyReport, SummaryStyle } from '../types';
import { HighlightListCard } from './ui/card-5';
import { Sparkles } from 'lucide-react';
import { User } from '../services/authService';
import { Header } from './Header';

interface DashboardProps {
  data: DailyReport;
  onReset: () => void;
  onLogout: () => void;
  user: User;
}

export const Dashboard: React.FC<DashboardProps> = ({ data, onReset, onLogout, user }) => {

  const getStyleLabel = (s: SummaryStyle) => {
    switch (s) {
      case SummaryStyle.PROFESSIONAL: return "Professional";
      case SummaryStyle.TECHNICAL: return "Technical";
      case SummaryStyle.ACHIEVEMENT: return "Achievement";
    }
  };

  const formatDuration = (minutes: number) => {
    if (!minutes || minutes <= 0) return '—';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours && mins) return `${hours}h ${mins}m`;
    if (hours) return `${hours}h`;
    return `${mins}m`;
  };

  const totalActiveMinutes =
    data.repoDurations?.reduce((acc, r) => acc + (r.durationMinutes || 0), 0) ?? 0;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <Header user={user} onLogout={onLogout} />

      <div className="pt-20 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        {/* Sub-header with date and actions */}
        <div className="flex justify-between items-center mb-8 border-b border-gray-200 pb-6">
          <div>
            <h1 className="font-bold text-xl text-gray-900">Daily Report</h1>
            <p className="text-sm text-gray-500 font-mono mt-1">{data.date}</p>
          </div>
          <div>
            <button
              onClick={onReset}
              className="px-4 py-2 text-sm text-gray-700 bg-white hover:bg-gray-50 transition-colors border border-gray-300 rounded-lg font-medium shadow-sm"
            >
              Start Over
            </button>
          </div>
        </div>

        {/* Bento Grid */}
        <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 auto-rows-min">

          {/* Hero Card - Headline */}
          <div className="sm:col-span-2 lg:col-span-3 bg-white rounded-xl p-8 border border-gray-200 shadow-sm flex flex-col justify-start relative overflow-hidden group">
            {/* Subtle gradient effect in white/gray */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-gray-100 rounded-full filter blur-3xl transform translate-x-1/2 -translate-y-1/2 opacity-50"></div>

            <span className="inline-block px-3 py-1 rounded-full bg-gray-100 text-gray-800 text-xs font-mono border border-gray-200 mb-4 w-max">
              {getStyleLabel(data.style)}
            </span>
            <h2 className="text-2xl md:text-4xl font-bold text-gray-900 leading-tight tracking-tight relative z-10 font-sans">
              {data.headline}
            </h2>
          </div>

          {/* Stats Card */}
          <div className="sm:col-span-2 lg:col-span-1 bg-white rounded-xl p-6 border border-gray-200 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="text-gray-500 text-xs font-mono uppercase tracking-wider mb-2">Activity</h3>
              <div className="text-4xl font-bold text-gray-900">{data.totalCommits + data.totalPRs}</div>
              <div className="text-xs text-gray-400">Items Processed</div>
              <div className="mt-4 inline-flex items-center px-2.5 py-1 rounded-full bg-highlight-50 border border-highlight-200 text-[11px] font-mono text-highlight-800 whitespace-nowrap">
                <span className="w-1.5 h-1.5 rounded-full bg-highlight-500 mr-2"></span>
                <span>Active: <span className="font-semibold">{formatDuration(totalActiveMinutes)}</span></span>
              </div>
            </div>
            <div className="mt-8 space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Commits</span>
                <span className="font-mono text-gray-900">{data.totalCommits}</span>
              </div>
              <div className="w-full bg-gray-100 h-1 rounded-full overflow-hidden">
                <div style={{ width: `${(data.totalCommits / (data.totalCommits + data.totalPRs || 1)) * 100}%` }} className="h-full bg-gray-900 rounded-full"></div>
              </div>
              <div className="flex justify-between items-center text-sm pt-1">
                <span className="text-gray-600">Pull Requests</span>
                <span className="font-mono text-gray-900">{data.totalPRs}</span>
              </div>
              <div className="w-full bg-gray-100 h-1 rounded-full overflow-hidden">
                <div style={{ width: `${(data.totalPRs / (data.totalCommits + data.totalPRs || 1)) * 100}%` }} className="h-full bg-gray-400 rounded-full"></div>
              </div>
            </div>
          </div>

          {/* Key Achievements - using HighlightListCard */}
          <div className="sm:col-span-2 lg:col-span-2">
            <HighlightListCard
              title="Highlights"
              items={data.keyAchievements}
              icon={<Sparkles className="w-5 h-5" />}
              color="default"
            />
          </div>

          {/* Repo Summaries */}
          {data.repoSummaries.map((repo, idx) => {
            const repoDuration = data.repoDurations?.find(
              (d) => d.repoName === repo.repoName
            );
            return (
              <div key={idx} className="sm:col-span-2 lg:col-span-3">
                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="font-bold text-gray-900 text-lg hover:underline cursor-pointer decoration-gray-400">
                      {repo.repoName}
                    </h4>
                    <div className="flex gap-2 flex-wrap justify-end">
                      {repo.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] uppercase font-bold rounded border border-gray-200"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 mb-2 inline-flex items-center px-2 py-0.5 rounded-full bg-highlight-50 border border-highlight-200 font-mono text-highlight-800">
                    <span className="w-1 h-1 rounded-full bg-highlight-500 mr-2"></span>
                    Active time (24h):
                    <span className="ml-1 font-semibold">
                      {repoDuration?.commitCount === 1
                        ? '过去只有 1 条提交'
                        : formatDuration(repoDuration?.durationMinutes ?? 0)}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed border-l-2 border-gray-200 pl-4">
                    {repo.summary}
                  </p>
                </div>
              </div>
            );
          })}

        </div>

        <footer className="max-w-5xl mx-auto mt-12 text-center text-gray-400 text-xs pb-8 font-mono border-t border-gray-200 pt-8">
          Generated by Today Git Chief Editor • Powered by Google Gemini
        </footer>
      </div>
    </div>
  );
};