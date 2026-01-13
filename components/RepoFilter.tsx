import React, { useState, useEffect } from 'react';
import * as Collapsible from '@radix-ui/react-collapsible';
import { motion, AnimatePresence } from 'framer-motion';
import { SummaryStyle, OutputLanguage } from '../types';
import { RepoInfo } from '../services/githubService';
import { User, authorizeRepoAccess } from '../services/authService';
import { Header } from './Header';
import DropdownComponent from './ui/dropdown-01';

interface RepoFilterProps {
  publicRepos: RepoInfo[];
  privateRepos: RepoInfo[];
  user: User;
  onLogout: () => void;
  onGenerate: (selectedRepos: string[], style: SummaryStyle, language: OutputLanguage, days: number) => void;
  hasRepoScope: boolean;
}

const getLanguageIcon = (lang: string | null) => {
  if (!lang) return null;

  const map: Record<string, string> = {
    'TypeScript': 'typescript',
    'JavaScript': 'javascript',
    'Python': 'python',
    'Java': 'java',
    'C#': 'csharp',
    'C++': 'cplusplus',
    'C': 'c',
    'Go': 'go',
    'Rust': 'rust',
    'PHP': 'php',
    'Ruby': 'ruby',
    'Swift': 'swift',
    'Kotlin': 'kotlin',
    'HTML': 'html5',
    'CSS': 'css3',
    'Vue': 'vuejs',
    'React': 'react',
    'Dart': 'dart',
    'Shell': 'bash',
    'PowerShell': 'powershell',
    'Markdown': 'markdown',
    'JSON': 'json',
  };

  const slug = map[lang] || lang.toLowerCase();
  // Using DevIcon CDN for VS Code style colorful icons
  return `https://cdn.jsdelivr.net/gh/devicons/devicon/icons/${slug}/${slug}-original.svg`;
};

export const RepoFilter: React.FC<RepoFilterProps> = ({
  publicRepos,
  privateRepos,
  user,
  onLogout,
  onGenerate,
  hasRepoScope
}) => {
  const [selectedRepos, setSelectedRepos] = useState<Set<string>>(new Set());
  const [selectedStyle, setSelectedStyle] = useState<SummaryStyle>(SummaryStyle.PROFESSIONAL);
  const [selectedLanguage, setSelectedLanguage] = useState<OutputLanguage>(OutputLanguage.CHINESE);
  const [activeRepos, setActiveRepos] = useState<RepoInfo[]>([]);
  const [period, setPeriod] = useState<'daily' | 'weekly'>('daily');

  // All repos combined
  const allRepos = [...publicRepos, ...privateRepos];

  useEffect(() => {
    const days = period === 'daily' ? 1 : 7;
    const timeWindow = new Date();
    timeWindow.setDate(timeWindow.getDate() - days);

    const active = allRepos.filter(repo => {
      if (!repo.pushedAt) return false;
      return new Date(repo.pushedAt) > timeWindow;
    });

    setActiveRepos(active);
    
    // Auto-select all active repos
    const activeNames = new Set(active.map(r => r.fullName));
    setSelectedRepos(activeNames);
  }, [publicRepos, privateRepos, period]);

  const toggleRepo = (fullName: string) => {
    setSelectedRepos(prev => {
      const next = new Set(prev);
      if (next.has(fullName)) {
        next.delete(fullName);
      } else {
        next.add(fullName);
      }
      return next;
    });
  };

  const selectAll = () => {
    const activeNames = activeRepos.map(r => r.fullName);
    setSelectedRepos(new Set(activeNames));
  };

  const selectNone = () => {
    setSelectedRepos(new Set());
  };

  const handleAuthorizePrivate = () => {
    authorizeRepoAccess();
  };

  return (
    <div className="min-h-screen bg-white">
      <Header user={user} onLogout={onLogout} />

      <main className="max-w-4xl mx-auto px-4 pt-24 pb-12">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">Vibe Editor</h1>
            <div className="flex bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setPeriod('daily')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  period === 'daily'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Daily (24h)
              </button>
              <button
                onClick={() => setPeriod('weekly')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  period === 'weekly'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Weekly (7d)
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left Column: Repo Selection */}
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <Collapsible.Root defaultOpen>
                <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Collapsible.Trigger asChild>
                      <button className="flex items-center gap-2 hover:text-gray-700 transition-colors">
                        <svg className="w-5 h-5 text-gray-500 transform transition-transform ui-open:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                        <h3 className="font-semibold text-gray-900">
                          Active Repositories
                        </h3>
                      </button>
                    </Collapsible.Trigger>
                    <span className="bg-gray-200 text-gray-600 text-xs px-2 py-0.5 rounded-full">
                      {activeRepos.length}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={selectAll}
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                      disabled={activeRepos.length === 0}
                    >
                      Select All
                    </button>
                    <span className="text-gray-300">|</span>
                    <button
                      onClick={selectNone}
                      className="text-xs text-gray-500 hover:text-gray-700 font-medium"
                      disabled={activeRepos.length === 0}
                    >
                      None
                    </button>
                  </div>
                </div>

                <Collapsible.Content>
                  <div className="max-h-[500px] overflow-y-auto p-2">
                    {activeRepos.length === 0 ? (
                      <div className="p-8 text-center text-gray-500">
                        <p className="mb-2">No active repositories found in this period.</p>
                        <p className="text-sm">Try switching to {period === 'daily' ? 'Weekly' : 'Daily'} view or push some code!</p>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {activeRepos.map((repo) => (
                          <div
                            key={repo.id}
                            onClick={() => toggleRepo(repo.fullName)}
                            className={`
                              flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors border
                              ${selectedRepos.has(repo.fullName)
                                ? 'bg-blue-50 border-blue-200'
                                : 'hover:bg-gray-50 border-transparent'}
                            `}
                          >
                            <div className={`
                              w-5 h-5 mt-0.5 rounded border flex items-center justify-center transition-colors shrink-0
                              ${selectedRepos.has(repo.fullName)
                                ? 'bg-blue-600 border-blue-600 text-white'
                                : 'border-gray-300 bg-white'}
                            `}>
                              {selectedRepos.has(repo.fullName) && (
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-900 truncate">{repo.name}</span>
                                {repo.private && (
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600 border border-gray-200">
                                    Private
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-gray-500 truncate mt-0.5">
                                {repo.fullName}
                              </div>
                              {repo.description && (
                                <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                                  {repo.description}
                                </p>
                              )}
                            </div>

                            {repo.language && (
                              <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-white border border-gray-100 shadow-sm shrink-0">
                                 {getLanguageIcon(repo.language) && (
                                    <img 
                                      src={getLanguageIcon(repo.language)!} 
                                      alt={repo.language}
                                      className="w-4 h-4" 
                                    />
                                 )}
                                 <span className="text-xs text-gray-600 font-medium">{repo.language}</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </Collapsible.Content>
              </Collapsible.Root>
              
              {!hasRepoScope && (
                <div className="p-4 bg-gray-50 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Need to include private repositories?</span>
                      <p className="text-xs text-gray-400 mt-0.5">This requires additional GitHub authorization.</p>
                    </div>
                    <button
                      onClick={handleAuthorizePrivate}
                      className="px-4 py-2 text-sm font-medium bg-[#FFD700] text-black rounded-lg hover:bg-[#E6BE00] transition-colors flex items-center space-x-2 shadow-sm"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      <span>Authorize Private Access</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Style & Generate */}
          <div className="space-y-8">
            {/* Style Selection */}
            <div>
              <h3 className="text-base font-semibold text-gray-900 mb-4">Select Report Style</h3>
              <div className="grid grid-cols-1 gap-4">
                {[
                  { id: SummaryStyle.PROFESSIONAL, label: 'Professional', desc: 'Concise, result-oriented.', bg: '/prof.png' },
                  { id: SummaryStyle.TECHNICAL, label: 'Technical', desc: 'Detailed, architectural.', bg: '/tech.png' },
                  { id: SummaryStyle.ACHIEVEMENT, label: 'Achievement', desc: 'Enthusiastic highlights.', bg: '/achievement.png' },
                ].map((style) => (
                  <button
                    key={style.id}
                    onClick={() => setSelectedStyle(style.id)}
                    className={`relative flex flex-col p-6 rounded-xl border text-left transition-all overflow-hidden group min-h-[120px] ${selectedStyle === style.id
                        ? 'border-gray-900 ring-2 ring-gray-900 bg-gray-50'
                        : 'border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50'
                      }`}
                  >
                    <div className="relative z-10 pr-2">
                      <div className={`font-bold mb-2 text-lg ${selectedStyle === style.id ? 'text-gray-900' : 'text-gray-700'}`}>
                        {style.label}
                      </div>
                      <div className="text-sm text-gray-500 leading-relaxed">
                        {style.desc}
                      </div>
                    </div>
                    {style.bg && (
                      <img 
                        src={style.bg} 
                        alt="" 
                        className={`absolute object-contain ${
                          style.id === SummaryStyle.ACHIEVEMENT 
                            ? 'w-28 h-28 -right-2 -bottom-2' 
                            : 'w-24 h-24 right-0 bottom-0 translate-x-4 translate-y-4'
                        }`} 
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Language Selection */}
            <div>
              <h3 className="text-base font-semibold text-gray-900 mb-4">Output Language</h3>
              <div className="w-full">
                <DropdownComponent
                  options={[
                    { id: OutputLanguage.CHINESE, label: '简体中文' },
                    { id: OutputLanguage.ENGLISH, label: 'English' },
                    { id: OutputLanguage.FRENCH, label: 'Français' },
                    { id: OutputLanguage.GERMAN, label: 'Deutsch' },
                    { id: OutputLanguage.JAPANESE, label: '日本語' },
                    { id: OutputLanguage.KOREAN, label: '한국어' },
                    { id: OutputLanguage.SPANISH, label: 'Español' },
                  ]}
                  value={selectedLanguage}
                  onChange={setSelectedLanguage}
                />
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100">
              <button
                onClick={() => onGenerate(Array.from(selectedRepos), selectedStyle, selectedLanguage, period === 'daily' ? 1 : 7)}
                disabled={selectedRepos.size === 0}
                className="w-full py-3 px-4 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              >
                <span>Generate {period === 'daily' ? 'Daily' : 'Weekly'} Report</span>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
