import React from 'react';
import { DailyReport, SummaryStyle } from '../types';

interface DashboardProps {
  data: DailyReport;
  onReset: () => void;
  user: { name: string; avatar_url: string };
}

export const Dashboard: React.FC<DashboardProps> = ({ data, onReset, user }) => {
  
  const getStyleLabel = (s: SummaryStyle) => {
    switch(s) {
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
    <div className="min-h-screen bg-gray-50 text-gray-900 p-4 md:p-8">
      {/* Navbar / Header */}
        <div className="max-w-5xl mx-auto flex justify-between items-center mb-8 border-b border-gray-200 pb-6">
        <div className="flex items-center space-x-4">
          <img src={user.avatar_url} alt="User" className="w-10 h-10 rounded-full border border-gray-200 shadow-sm" />
          <div>
            <h1 className="font-bold text-lg leading-tight text-gray-900">{user.name || 'Developer'}</h1>
            <p className="text-xs text-gray-500 font-mono">{data.date}</p>
          </div>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={onReset}
            className="px-4 py-2 text-sm text-gray-500 hover:text-gray-900 transition-colors border border-transparent hover:border-gray-300 rounded-md"
          >
            Start Over
          </button>
          <button 
             onClick={() => window.print()}
             className="px-4 py-2 bg-white hover:bg-gray-50 border border-gray-300 rounded-md text-sm font-bold text-gray-900 transition-colors print:hidden shadow-sm"
          >
            Export PDF
          </button>
        </div>
      </div>

      {/* Bento Grid */}
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-6 auto-rows-min">
        
        {/* Hero Card - Headline */}
        <div className="md:col-span-3 bg-white rounded-xl p-8 border border-gray-200 shadow-sm flex flex-col justify-start relative overflow-hidden group">
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
        <div className="md:col-span-1 bg-white rounded-xl p-6 border border-gray-200 shadow-sm flex flex-col justify-between">
           <div>
               <h3 className="text-gray-500 text-xs font-mono uppercase tracking-wider mb-2">Activity</h3>
               <div className="text-4xl font-bold text-gray-900">{data.totalCommits + data.totalPRs}</div>
               <div className="text-xs text-gray-400">Items Processed</div>
               <div className="mt-4 inline-flex items-center px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] font-mono text-emerald-800 whitespace-nowrap">
                 <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2"></span>
                 <span>Active: <span className="font-semibold">{formatDuration(totalActiveMinutes)}</span></span>
               </div>
           </div>
           <div className="mt-8 space-y-3">
               <div className="flex justify-between items-center text-sm">
                   <span className="text-gray-600">Commits</span>
                   <span className="font-mono text-gray-900">{data.totalCommits}</span>
               </div>
               <div className="w-full bg-gray-100 h-1 rounded-full overflow-hidden">
                   <div style={{ width: `${(data.totalCommits / (data.totalCommits + data.totalPRs || 1)) * 100}%`}} className="h-full bg-gray-900 rounded-full"></div>
               </div>
               <div className="flex justify-between items-center text-sm pt-1">
                   <span className="text-gray-600">Pull Requests</span>
                   <span className="font-mono text-gray-900">{data.totalPRs}</span>
               </div>
               <div className="w-full bg-gray-100 h-1 rounded-full overflow-hidden">
                   <div style={{ width: `${(data.totalPRs / (data.totalCommits + data.totalPRs || 1)) * 100}%`}} className="h-full bg-gray-400 rounded-full"></div>
               </div>
           </div>
        </div>

        {/* Key Achievements */}
        <div className="md:col-span-2 bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
           <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center border-b border-gray-100 pb-2">
             <svg className="w-5 h-5 mr-2 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
             </svg>
             Highlights
           </h3>
           <ul className="space-y-4">
             {data.keyAchievements.map((item, idx) => (
               <li key={idx} className="flex items-start group">
                 <span className="inline-block w-1.5 h-1.5 rounded-sm bg-gray-900 mt-2 mr-3 flex-shrink-0 group-hover:bg-gray-600 transition-colors"></span>
                 <p className="text-gray-700 leading-relaxed font-medium">{item}</p>
               </li>
             ))}
           </ul>
        </div>

        {/* Repo Summaries */}
        {data.repoSummaries.map((repo, idx) => {
          const repoDuration = data.repoDurations?.find(
            (d) => d.repoName === repo.repoName
          );
          return (
            <div key={idx} className="md:col-span-4 w-full">
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm max-w-3xl mr-auto w-full">
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
              <div className="text-xs text-gray-500 mb-2 inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 font-mono text-emerald-800">
                <span className="w-1 h-1 rounded-full bg-emerald-500 mr-2"></span>
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
  );
};