import React, { useState } from 'react';
import { AuthScreen } from './components/AuthScreen';
import { RepoFilter } from './components/RepoFilter';
import { LoadingScreen } from './components/LoadingScreen';
import { Dashboard } from './components/Dashboard';
import { validateToken, fetchRecentActivity } from './services/githubService';
import { generateDailyReport } from './services/geminiService';
import { AppStep, RepoActivity, DailyReport, SummaryStyle, UserProfile } from './types';

const App: React.FC = () => {
  const [step, setStep] = useState<AppStep>(AppStep.AUTH);
  const [token, setToken] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [activeRepos, setActiveRepos] = useState<RepoActivity[]>([]);
  const [reportData, setReportData] = useState<DailyReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleVerifyToken = async (inputToken: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const user = await validateToken(inputToken);
      setToken(inputToken);
      setUserProfile(user);
      
      // Immediately fetch repos to move to next step
      const repos = await fetchRecentActivity(inputToken, user.login);
      setActiveRepos(repos);
      setStep(AppStep.FILTER);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateReport = async (selectedRepoIds: number[], style: SummaryStyle) => {
    setIsLoading(true);
    setStep(AppStep.PROCESSING);
    
    try {
      const selectedRepos = activeRepos.filter(r => selectedRepoIds.includes(r.repoId));
      const report = await generateDailyReport(selectedRepos, style);
      setReportData(report);
      setStep(AppStep.DASHBOARD);
    } catch (err) {
      console.error(err);
      setError('Failed to generate report. Please try again.');
      setStep(AppStep.FILTER); // Go back to filter on error
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setReportData(null);
    setStep(AppStep.FILTER);
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 selection:bg-gray-200 selection:text-black">
      {step === AppStep.AUTH && (
        <AuthScreen 
          onVerify={handleVerifyToken} 
          isLoading={isLoading} 
          error={error} 
        />
      )}

      {step === AppStep.FILTER && userProfile && (
        <RepoFilter 
          repos={activeRepos} 
          userLogin={userProfile.name || userProfile.login}
          onGenerate={handleGenerateReport} 
        />
      )}

      {step === AppStep.PROCESSING && (
        <LoadingScreen />
      )}

      {step === AppStep.DASHBOARD && reportData && userProfile && (
        <Dashboard 
          data={reportData} 
          onReset={handleReset} 
          user={{ name: userProfile.name || userProfile.login, avatar_url: userProfile.avatar_url }}
        />
      )}
    </div>
  );
};

export default App;