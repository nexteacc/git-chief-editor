import Database, { Database as DatabaseType } from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '../../data/app.db');

// Ensure the directory exists before creating the database
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
  console.log('[DB] Created directory:', dbDir);
}

export const db: DatabaseType = new Database(dbPath);

// Enable WAL mode for better concurrent access
db.pragma('journal_mode = WAL');

export function initDatabase(): void {
  console.log('[DB] Initializing database at:', dbPath);

  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      github_id INTEGER UNIQUE NOT NULL,
      github_login TEXT NOT NULL,
      github_name TEXT,
      avatar_url TEXT,
      email TEXT,
      access_token TEXT NOT NULL,
      token_valid INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);

  // User preferences table
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_preferences (
      user_id INTEGER PRIMARY KEY,
      report_style TEXT DEFAULT 'PROFESSIONAL',
      output_language TEXT DEFAULT 'CHINESE',
      selected_repos TEXT,
      include_private_repos INTEGER DEFAULT 0,
      push_frequency TEXT,
      push_time TEXT DEFAULT '09:00',
      push_weekday INTEGER DEFAULT 1,
      timezone TEXT DEFAULT 'Asia/Shanghai',
      skip_if_no_activity INTEGER DEFAULT 1,
      email_enabled INTEGER DEFAULT 0,
      slack_webhook TEXT,
      discord_webhook TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Create indexes
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_users_github_id ON users(github_id);
    CREATE INDEX IF NOT EXISTS idx_users_token_valid ON users(token_valid);
  `);

  console.log('[DB] Database initialized successfully');
}

// Graceful shutdown
process.on('exit', () => db.close());
process.on('SIGINT', () => {
  db.close();
  process.exit(0);
});
