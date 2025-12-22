import React, { useState, useEffect } from 'react';
import { RepoActivity, SummaryStyle } from '../types';

interface RepoFilterProps {
  repos: RepoActivity[];
  userLogin: string;
  onGenerate: (selectedIds: number[], style: SummaryStyle) => void;
}

export const RepoFilter: React.FC<RepoFilterProps> = ({ repos, userLogin, onGenerate }) => {
  const [selectedIds, setSelectedIds] = useState<number[]>(repos.map(r => r.repoId));
  const [selectedStyle, setSelectedStyle] = useState<SummaryStyle>(SummaryStyle.PROFESSIONAL);
  const [scanTime, setScanTime] = useState<string>('');

  useEffect(() => {
    // Calculate the display time for "24 hours ago"
    const d = new Date();
    d.setHours(d.getHours() - 24);
    setScanTime(d.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }));
  }, []);

  const toggleRepo = (id: number) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleGenerate = () => {
    if (selectedIds.length > 0) {
      onGenerate(selectedIds, selectedStyle);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 min-h-screen flex flex-col bg-white">
      <header className="mb-8 border-b border-gray-200 pb-6">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome back, {userLogin}</h2>
        <div className="flex items-center text-sm text-gray-500">
          <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Scanning activity since: <span className="font-mono text-gray-700 ml-1">{scanTime}</span>
        </div>
      </header>

      <div className="flex-grow space-y-8">
        {/* Repo List */}
        <div className="bg-white rounded-md border border-gray-200 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
            <h3 className="text-base font-semibold text-gray-900">Active Repositories</h3>
            <span className="text-xs px-2 py-1 rounded-full bg-gray-200 text-gray-700 border border-gray-300">{repos.length} found</span>
          </div>
          <ul className="divide-y divide-gray-200 max-h-[400px] overflow-y-auto">
            {repos.length === 0 ? (
              <li className="p-8 text-center text-gray-500">
                No activity found since {scanTime}.
                <br/>
                <span className="text-xs text-gray-400 mt-2 block">
                  Check your commits or PRs in the last 24h.
                </span>
              </li>
            ) : (
              repos.map(repo => (
                <li 
                  key={repo.repoId} 
                  className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer flex items-center justify-between group ${selectedIds.includes(repo.repoId) ? 'bg-gray-50' : ''}`}
                  onClick={() => toggleRepo(repo.repoId)}
                >
                  <div className="flex items-center space-x-4">
                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${selectedIds.includes(repo.repoId) ? 'bg-gray-900 border-gray-900' : 'border-gray-300 bg-white group-hover:border-gray-400'}`}>
                      {selectedIds.includes(repo.repoId) && (
                        <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className={`font-medium ${selectedIds.includes(repo.repoId) ? 'text-gray-900' : 'text-gray-600'}`}>{repo.repoName}</span>
                        {repo.isPrivate && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-600 border border-gray-200">PRIVATE</span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 mt-1 font-mono">
                        {repo.commits.length > 0 || repo.prs.length > 0 ? (
                          `${repo.commits.length} commits, ${repo.prs.length} PRs`
                        ) : (
                          <span className="italic text-gray-400">Activity detected</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 text-right">
                     {repo.commits.length > 0 
                        ? (
                            <>
                              <div className="text-xs text-gray-400">Last commit</div>
                              <span className="text-gray-600">{new Date(Math.max(...repo.commits.map(c => new Date(c.timestamp).getTime()))).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                            </>
                          )
                        : ''
                     }
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>

        {/* Style Selection */}
        <div>
          <h3 className="text-base font-semibold text-gray-900 mb-4">Select Report Style</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { id: SummaryStyle.PROFESSIONAL, label: 'Professional', desc: 'Concise, result-oriented.' },
              { id: SummaryStyle.TECHNICAL, label: 'Technical', desc: 'Detailed, architectural.' },
              { id: SummaryStyle.ACHIEVEMENT, label: 'Achievement', desc: 'Enthusiastic highlights.' },
            ].map((style) => (
              <button
                key={style.id}
                onClick={() => setSelectedStyle(style.id)}
                className={`p-4 rounded-md border text-left transition-all ${
                  selectedStyle === style.id 
                    ? 'border-gray-900 bg-gray-50 ring-1 ring-gray-900' 
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className={`font-bold mb-1 ${selectedStyle === style.id ? 'text-gray-900' : 'text-gray-600'}`}>
                  {style.label}
                </div>
                <div className="text-xs text-gray-500">
                  {style.desc}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8 flex justify-end">
        <button
          onClick={handleGenerate}
          disabled={selectedIds.length === 0}
          className={`px-8 py-2.5 rounded-md font-bold text-sm transition-all border ${
            selectedIds.length === 0 
              ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' 
              : 'bg-gray-900 text-white border-gray-900 hover:bg-gray-800'
          }`}
        >
          Generate Report
        </button>
      </div>
    </div>
  );
};