import React, { useState, useEffect } from 'react';
import { AuthScreen } from './components/AuthScreen';
import { RepoFilter } from './components/RepoFilter';
import { LoadingScreen } from './components/LoadingScreen';
import { Dashboard } from './components/Dashboard';
import { fetchPublicRepos, fetchPrivateRepos, fetchRecentActivity, RepoInfo } from './services/githubService';
import { generateDailyReport } from './services/geminiService';
import { getCurrentUser, redirectToLogin, logout, User, UserPreferences } from './services/authService';
import { AppStep, DailyReport, SummaryStyle, OutputLanguage } from './types';

const App: React.FC = () => {
  const [step, setStep] = useState<AppStep>(AppStep.AUTH);
  const [user, setUser] = useState<User | null>(null);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [publicRepos, setPublicRepos] = useState<RepoInfo[]>([]);
  const [privateRepos, setPrivateRepos] = useState<RepoInfo[]>([]);
  const [hasRepoScope, setHasRepoScope] = useState(false);
  const [reportData, setReportData] = useState<DailyReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check auth state on mount
  useEffect(() => {
    const checkAuth = async () => {
      // Check for error in URL (from OAuth callback)
      const urlParams = new URLSearchParams(window.location.search);
      const urlError = urlParams.get('error');
      if (urlError) {
        const errorMessages: Record<string, string> = {
          'auth_cancelled': 'Login was cancelled',
          'token_exchange_failed': 'Failed to authenticate with GitHub',
          'user_fetch_failed': 'Failed to fetch user info',
          'auth_failed': 'Authentication failed',
        };
        setError(errorMessages[urlError] || 'Authentication failed');
        // Clean URL
        window.history.replaceState({}, '', '/');
      }

      try {
        const authData = await getCurrentUser();
        if (authData) {
          setUser(authData.user);
          setPreferences(authData.preferences);

          // Fetch public repos (no auth required)
          const repos = await fetchPublicRepos(authData.user.login);
          setPublicRepos(repos);

          // Try to fetch private repos (only works if user has authorized repo scope)
          try {
            const privateReposList = await fetchPrivateRepos();
            setPrivateRepos(privateReposList);
            setHasRepoScope(true);
          } catch {
            // No repo scope, that's fine
            setHasRepoScope(false);
            setPrivateRepos([]);
          }

          setStep(AppStep.FILTER);
        } else {
          setStep(AppStep.AUTH);
        }
      } catch (err) {
        console.error('Auth check failed:', err);
        setStep(AppStep.AUTH);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const handleLogin = () => {
    redirectToLogin();
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error('Logout failed:', err);
    }
    // 无论成功失败，都重置本地状态
    setUser(null);
    setPreferences(null);
    setPublicRepos([]);
    setPrivateRepos([]);
    setHasRepoScope(false);
    setReportData(null);
    setError(null);
    setStep(AppStep.AUTH);
    setIsLoading(false);
  };

  const handleGenerateReport = async (selectedRepos: string[], style: SummaryStyle, language: OutputLanguage, days: number) => {
    if (!user) return;

    setIsLoading(true);
    setStep(AppStep.PROCESSING);

    try {
      // First, fetch activity data for the user
      const activities = await fetchRecentActivity(user.login, {
        publicRepos: true,
        privateRepos: hasRepoScope,
      }, days);

      // Filter to only selected repos
      const selectedActivities = activities.filter(a => selectedRepos.includes(a.repoName));

      // If no activity found for selected repos, show error
      if (selectedActivities.length === 0) {
        setError(`No activity found in the selected repositories in the last ${days} days.`);
        setStep(AppStep.FILTER);
        return;
      }

      const report = await generateDailyReport(selectedActivities, style, language);
      setReportData(report);
      setStep(AppStep.DASHBOARD);
    } catch (err) {
      console.error(err);
      setError('Failed to generate report. Please try again.');
      setStep(AppStep.FILTER);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setReportData(null);
    setStep(AppStep.FILTER);
  };

  // Show loading screen during initial auth check
  if (isLoading && step === AppStep.AUTH) {
    return <LoadingScreen />;
  }

  // 防护：如果需要 user 的状态但 user 为 null，回退到登录页
  // 这可能发生在 OAuth 回调后 session 还未完全生效的情况
  if (!user && (step === AppStep.FILTER || step === AppStep.DASHBOARD)) {
    return (
      <AuthScreen
        onLogin={handleLogin}
        isLoading={false}
        error={null}
      />
    );
  }

  return (
    <div className="min-h-screen bg-white text-gray-900 selection:bg-gray-200 selection:text-black">
      {step === AppStep.AUTH && (
        <AuthScreen
          onLogin={handleLogin}
          isLoading={isLoading}
          error={error}
        />
      )}

      {step === AppStep.FILTER && user && (
        <RepoFilter
          publicRepos={publicRepos}
          privateRepos={privateRepos}
          user={user}
          onLogout={handleLogout}
          onGenerate={handleGenerateReport}
          hasRepoScope={hasRepoScope}
        />
      )}

      {step === AppStep.PROCESSING && (
        <LoadingScreen />
      )}

      {step === AppStep.DASHBOARD && reportData && user && (
        <Dashboard
          data={reportData}
          onReset={handleReset}
          onLogout={handleLogout}
          user={user}
        />
      )}
    </div>
  );
};

export default App;
