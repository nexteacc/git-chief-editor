import { RepoActivity, UserProfile } from '../types.js';

const GITHUB_API_BASE = 'https://api.github.com';
const LOOKBACK_HOURS = 24;

const getHeaders = (token: string) => ({
  'Authorization': `Bearer ${token}`,
  'Accept': 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28',
});

export const validateToken = async (token: string): Promise<UserProfile> => {
  const response = await fetch(`${GITHUB_API_BASE}/user`, {
    headers: getHeaders(token),
  });

  if (!response.ok) {
    throw new Error('Invalid GitHub Token. Please check your token and try again.');
  }

  const scopes = response.headers.get('X-OAuth-Scopes') || '';
  const hasRepoAccess = scopes.includes('repo') || scopes.includes('public_repo');

  if (!hasRepoAccess) {
    throw new Error('Token missing required permissions. Please create a token with "repo" scope.');
  }

  return response.json() as Promise<UserProfile>;
};

export const fetchRecentActivity = async (token: string, username: string): Promise<RepoActivity[]> => {
  const timeWindow = new Date();
  timeWindow.setHours(timeWindow.getHours() - LOOKBACK_HOURS);
  const isoDate = timeWindow.toISOString();

  console.log(`[GitHub Service] Fetching activity since: ${isoDate}`);

  const prQuery = `type:pr author:${username} updated:>${isoDate}`;
  const prUrl = `${GITHUB_API_BASE}/search/issues?q=${encodeURIComponent(prQuery)}&per_page=100`;

  const prResponse = await fetch(prUrl, {
    headers: getHeaders(token),
  });
  const prData = prResponse.ok ? await prResponse.json() as { items?: any[] } : { items: [] };
  const rawPRs = prData.items || [];

  console.log(`[GitHub Service] Found ${rawPRs.length} updated PRs.`);

  const reposUrl = `${GITHUB_API_BASE}/user/repos?sort=pushed&direction=desc&per_page=100&type=all`;
  const reposResponse = await fetch(reposUrl, {
    headers: getHeaders(token),
  });

  if (!reposResponse.ok) {
    throw new Error('Failed to fetch repository list.');
  }

  const allRepos = await reposResponse.json() as any[];

  const activeRepos = allRepos.filter((repo: any) => {
    return new Date(repo.pushed_at) > timeWindow;
  });

  console.log(`[GitHub Service] Found ${activeRepos.length} repos pushed to since window.`);

  const repoMap = new Map<number, RepoActivity>();

  activeRepos.forEach((repo: any) => {
    repoMap.set(repo.id, {
      repoId: repo.id,
      repoName: repo.full_name,
      isPrivate: repo.private,
      commits: [],
      prs: [],
      eventCount: 0
    });
  });

  const commitPromises = activeRepos.map(async (repo: any) => {
    try {
      const commitsUrl = `${GITHUB_API_BASE}/repos/${repo.full_name}/commits?author=${username}&since=${isoDate}&per_page=100`;
      const res = await fetch(commitsUrl, {
        headers: getHeaders(token),
      });

      if (res.ok) {
        const commits = await res.json() as any[];
        if (Array.isArray(commits) && commits.length > 0) {
          const repoData = repoMap.get(repo.id);
          if (repoData) {
            repoData.commits = commits.map((c: any) => ({
              message: c.commit.message,
              sha: c.sha,
              url: c.html_url,
              timestamp: c.commit.committer.date
            }));
            repoData.eventCount += commits.length;
          }
        }
      }
    } catch (err) {
      console.warn(`[GitHub Service] Failed to fetch commits for ${repo.full_name}`, err);
    }
  });

  await Promise.all(commitPromises);

  for (const pr of rawPRs) {
    const repoNameMatch = pr.repository_url.match(/repos\/(.+?\/.+?)$/);
    const repoFullName = repoNameMatch ? repoNameMatch[1] : 'unknown/repo';

    let targetRepo: RepoActivity | undefined;

    for (const r of repoMap.values()) {
      if (r.repoName === repoFullName) {
        targetRepo = r;
        break;
      }
    }

    if (!targetRepo) {
      const newId = Math.floor(Math.random() * 100000);
      targetRepo = {
        repoId: newId,
        repoName: repoFullName,
        isPrivate: false,
        commits: [],
        prs: [],
        eventCount: 0
      };
      repoMap.set(newId, targetRepo);
    }

    const exists = targetRepo.prs.some(p => p.number === pr.number);
    if (!exists) {
      targetRepo.prs.push({
        title: pr.title,
        body: pr.body || '',
        url: pr.html_url,
        number: pr.number
      });
      targetRepo.eventCount += 1;
    }
  }

  const results = Array.from(repoMap.values()).filter(r => r.eventCount > 0);
  results.sort((a, b) => b.eventCount - a.eventCount);

  console.log(`[GitHub Service] Final: ${results.length} repos with activity.`);
  return results;
};
