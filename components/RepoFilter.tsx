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
  onGenerate: (selectedRepos: string[], style: SummaryStyle, language: OutputLanguage) => void;
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
  const [scanTime, setScanTime] = useState<string>('');
  const [showPublic, setShowPublic] = useState(true);
  const [showPrivate, setShowPrivate] = useState(false);

  // All repos combined
  const allRepos = [...publicRepos, ...privateRepos];

  useEffect(() => {
    // Calculate the display time for "24 hours ago"
    const d = new Date();
    d.setHours(d.getHours() - 24);
    setScanTime(d.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }));
  }, []);

  // Select all public repos by default
  useEffect(() => {
    const defaultSelected = new Set(publicRepos.map(r => r.fullName));
    setSelectedRepos(defaultSelected);
  }, [publicRepos]);

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
    const allNames = allRepos.map(r => r.fullName);
    setSelectedRepos(new Set(allNames));
  };

  const selectNone = () => {
    setSelectedRepos(new Set());
  };

  const handleGenerate = () => {
    if (selectedRepos.size > 0) {
      onGenerate(Array.from(selectedRepos), selectedStyle, selectedLanguage);
    }
  };

  const handleAuthorizePrivate = () => {
    authorizeRepoAccess();
  };

  return (
    <div className="min-h-screen bg-white">
      <Header user={user} onLogout={onLogout} />

      <div className="pt-20 px-6 pb-40 max-w-5xl mx-auto flex flex-col">
        <header className="mb-8 border-b border-gray-200 pb-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Select Repositories</h2>
          <div className="flex items-center text-sm text-gray-500">
            <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Will scan activity since: <span className="font-mono text-gray-700 ml-1">{scanTime}</span>
          </div>
        </header>

        <div className="flex-grow space-y-8">
          {/* Repo List */}
          <div className="bg-white rounded-md border border-gray-200 overflow-hidden shadow-sm">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <div className="flex items-center space-x-4">
                <h3 className="text-base font-semibold text-gray-900">Your Repositories</h3>
                <span className="text-xs px-2 py-1 rounded-full bg-gray-200 text-gray-700 border border-gray-300">
                  {selectedRepos.size} / {allRepos.length} selected
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={selectAll}
                  className="text-xs font-medium text-gray-700 px-3 py-1.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors"
                >
                  Select all
                </button>
                <button
                  onClick={selectNone}
                  className="text-xs font-medium text-gray-700 px-3 py-1.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors"
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Public Repos */}
            <div className="border-b border-gray-100">
              <Collapsible.Root open={showPublic} onOpenChange={setShowPublic}>
                <Collapsible.Trigger asChild>
                  <div
                    className="px-4 py-2 bg-gray-50/50 flex items-center justify-between cursor-pointer hover:bg-gray-100 transition-colors"
                  >
                    <span className="flex items-center">
                      <svg className={`w-4 h-4 mr-2 text-gray-500 transition-transform ${showPublic ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                      <span className="text-sm font-medium text-white bg-gray-900 px-3 py-1 rounded-md">Public Repositories</span>
                      <span className="ml-2 text-sm font-semibold text-gray-900 bg-gray-200 px-2 py-0.5 rounded">{publicRepos.length}</span>
                    </span>
                  </div>
                </Collapsible.Trigger>
                <Collapsible.Content forceMount>
                  <AnimatePresence initial={false}>
                    {showPublic && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                        style={{ overflow: 'hidden' }}
                      >
                        <ul className="divide-y divide-gray-100 max-h-[min(250px,40vh)] overflow-y-auto">
                          {publicRepos.length === 0 ? (
                            <li className="p-6 text-center text-gray-500 text-sm">
                              No public repositories found.
                            </li>
                          ) : (
                            publicRepos.map(repo => (
                              <li
                                key={repo.id}
                                className={`p-3 hover:bg-gray-50 transition-colors cursor-pointer flex items-center justify-between group ${selectedRepos.has(repo.fullName) ? 'bg-gray-50' : ''}`}
                                onClick={() => toggleRepo(repo.fullName)}
                              >
                                <div className="flex items-center space-x-3">
                                  <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${selectedRepos.has(repo.fullName) ? 'bg-gray-900 border-gray-900' : 'border-gray-300 bg-white group-hover:border-gray-400'}`}>
                                    {selectedRepos.has(repo.fullName) && (
                                      <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                    )}
                                  </div>
                                  <div>
                                    <span className={`font-medium text-sm ${selectedRepos.has(repo.fullName) ? 'text-gray-900' : 'text-gray-600'}`}>
                                      {repo.name}
                                    </span>
                                    {repo.description && (
                                      <p className="text-xs text-gray-400 truncate max-w-md">{repo.description}</p>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2 text-xs text-gray-400">
                                  {repo.language && (
                                    <div className="flex items-center space-x-1.5 px-2 py-0.5 rounded bg-gray-50 border border-gray-100">
                                      {getLanguageIcon(repo.language) && (
                                        <img
                                          src={getLanguageIcon(repo.language)!}
                                          alt={repo.language}
                                          className="w-3.5 h-3.5"
                                          onError={(e) => (e.currentTarget.style.display = 'none')}
                                        />
                                      )}
                                      <span className="text-gray-600 font-medium">{repo.language}</span>
                                    </div>
                                  )}
                                </div>
                              </li>
                            ))
                          )}
                        </ul>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Collapsible.Content>
              </Collapsible.Root>
            </div>

            {/* Private Repos Section */}
            {hasRepoScope ? (
              <Collapsible.Root open={showPrivate} onOpenChange={setShowPrivate}>
                <Collapsible.Trigger asChild>
                  <div
                    className="px-4 py-2 bg-gray-50/50 flex items-center justify-between cursor-pointer hover:bg-gray-100 transition-colors"
                  >
                    <span className="flex items-center">
                      <svg className={`w-4 h-4 mr-2 text-gray-500 transition-transform ${showPrivate ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                      <span className="text-sm font-medium text-white bg-gray-900 px-3 py-1 rounded-md">Private Repositories</span>
                      <span className="ml-2 text-sm font-semibold text-gray-900 bg-gray-200 px-2 py-0.5 rounded">{privateRepos.length}</span>
                    </span>
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">Authorized</span>
                  </div>
                </Collapsible.Trigger>
                <Collapsible.Content forceMount>
                  <AnimatePresence initial={false}>
                    {showPrivate && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                        style={{ overflow: 'hidden' }}
                      >
                        <ul className="divide-y divide-gray-100 max-h-[min(200px,35vh)] overflow-y-auto">
                          {privateRepos.length === 0 ? (
                            <li className="p-6 text-center text-gray-500 text-sm">
                              No private repositories found.
                            </li>
                          ) : (
                            privateRepos.map(repo => (
                              <li
                                key={repo.id}
                                className={`p-3 hover:bg-gray-50 transition-colors cursor-pointer flex items-center justify-between group ${selectedRepos.has(repo.fullName) ? 'bg-gray-50' : ''}`}
                                onClick={() => toggleRepo(repo.fullName)}
                              >
                                <div className="flex items-center space-x-3">
                                  <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${selectedRepos.has(repo.fullName) ? 'bg-gray-900 border-gray-900' : 'border-gray-300 bg-white group-hover:border-gray-400'}`}>
                                    {selectedRepos.has(repo.fullName) && (
                                      <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                    )}
                                  </div>
                                  <div>
                                    <div className="flex items-center space-x-2">
                                      <span className={`font-medium text-sm ${selectedRepos.has(repo.fullName) ? 'text-gray-900' : 'text-gray-600'}`}>
                                        {repo.name}
                                      </span>
                                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">PRIVATE</span>
                                    </div>
                                    {repo.description && (
                                      <p className="text-xs text-gray-400 truncate max-w-md">{repo.description}</p>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2 text-xs text-gray-400">
                                  {repo.language && (
                                    <div className="flex items-center space-x-1.5 px-2 py-0.5 rounded bg-gray-50 border border-gray-100">
                                      {getLanguageIcon(repo.language) && (
                                        <img
                                          src={getLanguageIcon(repo.language)!}
                                          alt={repo.language}
                                          className="w-3.5 h-3.5"
                                          onError={(e) => (e.currentTarget.style.display = 'none')}
                                        />
                                      )}
                                      <span className="text-gray-600 font-medium">{repo.language}</span>
                                    </div>
                                  )}
                                </div>
                              </li>
                            ))
                          )}
                        </ul>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Collapsible.Content>
              </Collapsible.Root>
            ) : (
              <div className="p-4 bg-gray-50 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Need to include private repositories?</span>
                    <p className="text-xs text-gray-400 mt-0.5">This requires additional GitHub authorization.</p>
                  </div>
                  <button
                    onClick={handleAuthorizePrivate}
                    className="px-4 py-2 text-sm font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg hover:bg-emerald-100 hover:border-emerald-300 transition-colors flex items-center space-x-2"
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
                  className={`p-4 rounded-md border text-left transition-all ${selectedStyle === style.id
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

          {/* Language Selection */}
          <div>
            <h3 className="text-base font-semibold text-gray-900 mb-4">Output Language</h3>
            <div className="max-w-xs">
              <DropdownComponent
                options={[
                  { id: OutputLanguage.CHINESE, label: '中文', description: 'Simplified Chinese' },
                  { id: OutputLanguage.ENGLISH, label: 'English', description: 'English' },
                ]}
                value={selectedLanguage}
                onChange={setSelectedLanguage}
              />
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <button
            onClick={handleGenerate}
            disabled={selectedRepos.size === 0}
            className={`px-8 py-2.5 rounded-md font-bold text-sm transition-all border ${selectedRepos.size === 0
              ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
              : 'bg-gray-900 text-white border-gray-900 hover:bg-gray-800'
              }`}
          >
            Generate Report ({selectedRepos.size} repos)
          </button>
        </div>
      </div>
    </div>
  );
};
