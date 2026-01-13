import { db } from '../db/init.js';

export interface User {
  id: number;
  github_id: number;
  github_login: string;
  github_name: string | null;
  avatar_url: string | null;
  email: string | null;
  access_token: string;
  token_valid: number;
  created_at: string;
  updated_at: string;
}

export interface UserPreferences {
  user_id: number;
  report_style: 'PROFESSIONAL' | 'TECHNICAL' | 'ACHIEVEMENT';
  output_language: 'CHINESE' | 'ENGLISH';
  selected_repos: string | null;
  include_private_repos: number;
  push_frequency: 'DAILY' | 'WEEKLY' | null;
  push_time: string;
  push_weekday: number;
  timezone: string;
  skip_if_no_activity: number;
  email_enabled: number;
  slack_webhook: string | null;
  discord_webhook: string | null;
}

export interface GitHubUserInfo {
  id: number;
  login: string;
  name: string | null;
  avatar_url: string;
  email: string | null;
}

// User operations
export function upsertUser(githubUser: GitHubUserInfo, accessToken: string): User {
  const stmt = db.prepare(`
    INSERT INTO users (github_id, github_login, github_name, avatar_url, email, access_token, token_valid, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, 1, datetime('now'))
    ON CONFLICT(github_id) DO UPDATE SET
      github_login = excluded.github_login,
      github_name = excluded.github_name,
      avatar_url = excluded.avatar_url,
      email = excluded.email,
      access_token = excluded.access_token,
      token_valid = 1,
      updated_at = datetime('now')
    RETURNING *
  `);

  return stmt.get(
    githubUser.id,
    githubUser.login,
    githubUser.name,
    githubUser.avatar_url,
    githubUser.email,
    accessToken
  ) as User;
}

export function getUserById(id: number): User | undefined {
  const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
  return stmt.get(id) as User | undefined;
}

export function getUserByGitHubId(githubId: number): User | undefined {
  const stmt = db.prepare('SELECT * FROM users WHERE github_id = ?');
  return stmt.get(githubId) as User | undefined;
}

export function markTokenInvalid(userId: number): void {
  const stmt = db.prepare('UPDATE users SET token_valid = 0, updated_at = datetime(\'now\') WHERE id = ?');
  stmt.run(userId);
}

// Preferences operations
export function getPreferences(userId: number): UserPreferences | undefined {
  const stmt = db.prepare('SELECT * FROM user_preferences WHERE user_id = ?');
  return stmt.get(userId) as UserPreferences | undefined;
}

export function upsertPreferences(userId: number, prefs: Partial<UserPreferences>): UserPreferences {
  // First ensure the record exists
  const existingPrefs = getPreferences(userId);

  if (!existingPrefs) {
    const insertStmt = db.prepare(`
      INSERT INTO user_preferences (user_id)
      VALUES (?)
    `);
    insertStmt.run(userId);
  }

  // Build dynamic update
  const updates: string[] = [];
  const values: unknown[] = [];

  const allowedFields = [
    'report_style', 'output_language', 'selected_repos', 'include_private_repos',
    'push_frequency', 'push_time', 'push_weekday', 'timezone',
    'skip_if_no_activity', 'email_enabled', 'slack_webhook', 'discord_webhook'
  ];

  for (const field of allowedFields) {
    if (field in prefs) {
      updates.push(`${field} = ?`);
      values.push((prefs as Record<string, unknown>)[field]);
    }
  }

  if (updates.length > 0) {
    values.push(userId);
    const updateStmt = db.prepare(`
      UPDATE user_preferences
      SET ${updates.join(', ')}
      WHERE user_id = ?
    `);
    updateStmt.run(...values);
  }

  return getPreferences(userId)!;
}

// Get users for scheduled push
export function getUsersForPush(hour: string, weekday?: number): Array<User & UserPreferences> {
  let query = `
    SELECT u.*, p.*
    FROM users u
    JOIN user_preferences p ON u.id = p.user_id
    WHERE u.token_valid = 1
      AND p.push_frequency IS NOT NULL
      AND p.push_time = ?
  `;

  const params: unknown[] = [hour];

  if (weekday !== undefined) {
    query += ' AND (p.push_frequency = \'DAILY\' OR (p.push_frequency = \'WEEKLY\' AND p.push_weekday = ?))';
    params.push(weekday);
  }

  const stmt = db.prepare(query);
  return stmt.all(...params) as Array<User & UserPreferences>;
}
