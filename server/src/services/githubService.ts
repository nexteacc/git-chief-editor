import { RepoActivity, UserProfile } from '../types.js';

const GITHUB_API_BASE = 'https://api.github.com';
// 时间窗口：过去 24 小时的所有活动
const LOOKBACK_HOURS = 24;

const getHeaders = (token: string) => ({
  'Authorization': `Bearer ${token}`,
  'Accept': 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28',
});

/**
 * 验证 Token 并返回用户信息
 */
export const validateToken = async (token: string): Promise<UserProfile> => {
  const response = await fetch(`${GITHUB_API_BASE}/user`, {
    headers: getHeaders(token),
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error('Invalid GitHub Token. Ensure it has "repo" scope (and SSO authorized if needed).');
  }

  return response.json();
};

/**
 * 获取用户最近的活动
 */
export const fetchRecentActivity = async (token: string, username: string): Promise<RepoActivity[]> => {
  const timeWindow = new Date();
  timeWindow.setHours(timeWindow.getHours() - LOOKBACK_HOURS);
  const isoDate = timeWindow.toISOString();

  console.log(`[GitHub Service] Fetching activity since: ${isoDate}`);

  // 1. 获取 PRs（使用 Search API）
  const prQuery = `type:pr author:${username} updated:>${isoDate}`;
  const prUrl = `${GITHUB_API_BASE}/search/issues?q=${encodeURIComponent(prQuery)}&per_page=100`;

  const prResponse = await fetch(prUrl, {
    headers: getHeaders(token),
    cache: 'no-store'
  });
  const prData = prResponse.ok ? await prResponse.json() : { items: [] };
  const rawPRs = prData.items || [];

  console.log(`[GitHub Service] Found ${rawPRs.length} updated PRs.`);

  // 2. 获取活跃仓库
  const reposUrl = `${GITHUB_API_BASE}/user/repos?sort=pushed&direction=desc&per_page=100&type=all`;
  const reposResponse = await fetch(reposUrl, {
    headers: getHeaders(token),
    cache: 'no-store'
  });

  if (!reposResponse.ok) {
    throw new Error('Failed to fetch repository list.');
  }

  const allRepos = await reposResponse.json();

  // 过滤时间窗口内有活动的仓库
  const activeRepos = allRepos.filter((repo: any) => {
    return new Date(repo.pushed_at) > timeWindow;
  });

  console.log(`[GitHub Service] Found ${activeRepos.length} repos pushed to since window.`);

  // 3. 并行获取每个仓库的 commits
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
        cache: 'no-store'
      });

      if (res.ok) {
        const commits = await res.json();
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

  // 4. 整合 PRs
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

  // 5. 过滤空结果并排序
  const results = Array.from(repoMap.values()).filter(r => r.eventCount > 0);
  results.sort((a, b) => b.eventCount - a.eventCount);

  console.log(`[GitHub Service] Final: ${results.length} repos with activity.`);
  return results;
};
