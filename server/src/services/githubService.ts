import { RepoActivity, UserProfile, RepoAccessOptions } from '../types.js';

const GITHUB_API_BASE = 'https://api.github.com';
const LOOKBACK_HOURS = 24;

const getHeaders = (token: string) => ({
  'Authorization': `Bearer ${token}`,
  'Accept': 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28',
});

export const validateToken = async (token: string, accessOptions: RepoAccessOptions): Promise<UserProfile> => {
  const response = await fetch(`${GITHUB_API_BASE}/user`, {
    headers: getHeaders(token),
  });

  if (!response.ok) {
    throw new Error('Invalid GitHub Token. Please check your token and try again.');
  }

  const scopes = response.headers.get('X-OAuth-Scopes') || '';
  const hasRepoScope = scopes.includes('repo');
  const hasPublicRepoScope = scopes.includes('public_repo');

  // 检查用户选择的权限是否与Token权限匹配
  if (accessOptions.privateRepos && !hasRepoScope) {
    throw new Error('Token missing "repo" scope. Private repositories require full repo access.');
  }

  if (accessOptions.publicRepos && !hasRepoScope && !hasPublicRepoScope) {
    throw new Error('Token missing required permissions. Please create a token with "public_repo" or "repo" scope.');
  }

  return response.json() as Promise<UserProfile>;
};

export const fetchRecentActivity = async (token: string, username: string, accessOptions: RepoAccessOptions): Promise<RepoActivity[]> => {
  const timeWindow = new Date();
  timeWindow.setHours(timeWindow.getHours() - LOOKBACK_HOURS);
  const isoDate = timeWindow.toISOString();

  console.log(`[GitHub Service] Fetching activity since: ${isoDate}`);
  console.log(`[GitHub Service] Access options: public=${accessOptions.publicRepos}, private=${accessOptions.privateRepos}`);

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

  // 根据用户选择过滤仓库类型
  const filteredByAccess = allRepos.filter((repo: any) => {
    if (repo.private) {
      return accessOptions.privateRepos;
    } else {
      return accessOptions.publicRepos;
    }
  });

  const activeRepos = filteredByAccess.filter((repo: any) => {
    return new Date(repo.pushed_at) > timeWindow;
  });

  console.log(`[GitHub Service] Found ${activeRepos.length} repos pushed to since window (filtered by user preference).`);

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

    // 只添加用户选择范围内的仓库的 PR
    if (!targetRepo) {
      // PR 来自不在已过滤仓库列表中的仓库，跳过
      continue;
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
