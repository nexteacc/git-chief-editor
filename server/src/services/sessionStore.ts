import { Store, SessionData } from 'express-session';
import { db } from '../db/init.js';

export class SQLiteStore extends Store {
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    super();
    // Clean expired sessions every hour
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60 * 60 * 1000);
  }

  private cleanup(): void {
    try {
      const now = Date.now();
      const stmt = db.prepare('DELETE FROM sessions WHERE expired < ?');
      const result = stmt.run(now);
      if (result.changes > 0) {
        console.log(`[Session] Cleaned up ${result.changes} expired sessions`);
      }
    } catch (err) {
      console.error('[Session] Cleanup error:', err);
    }
  }

  get(sid: string, callback: (err: any, session?: SessionData | null) => void): void {
    try {
      const now = Date.now();
      const stmt = db.prepare('SELECT sess FROM sessions WHERE sid = ? AND expired > ?');
      const row = stmt.get(sid, now) as { sess: string } | undefined;

      if (row) {
        const session = JSON.parse(row.sess) as SessionData;
        callback(null, session);
      } else {
        callback(null, null);
      }
    } catch (err) {
      callback(err);
    }
  }

  set(sid: string, session: SessionData, callback?: (err?: any) => void): void {
    try {
      const maxAge = session.cookie?.maxAge || 86400 * 1000; // Default 1 day
      const expired = Date.now() + maxAge;
      const sess = JSON.stringify(session);

      const stmt = db.prepare(`
        INSERT INTO sessions (sid, sess, expired)
        VALUES (?, ?, ?)
        ON CONFLICT(sid) DO UPDATE SET sess = ?, expired = ?
      `);
      stmt.run(sid, sess, expired, sess, expired);

      callback?.();
    } catch (err) {
      callback?.(err);
    }
  }

  destroy(sid: string, callback?: (err?: any) => void): void {
    try {
      const stmt = db.prepare('DELETE FROM sessions WHERE sid = ?');
      stmt.run(sid);
      callback?.();
    } catch (err) {
      callback?.(err);
    }
  }

  touch(sid: string, session: SessionData, callback?: () => void): void {
    try {
      const maxAge = session.cookie?.maxAge || 86400 * 1000;
      const expired = Date.now() + maxAge;

      const stmt = db.prepare('UPDATE sessions SET expired = ? WHERE sid = ?');
      stmt.run(expired, sid);
      callback?.();
    } catch (err) {
      console.error('[Session] Touch error:', err);
      callback?.();
    }
  }

  clear(callback?: (err?: any) => void): void {
    try {
      db.exec('DELETE FROM sessions');
      callback?.();
    } catch (err) {
      callback?.(err);
    }
  }

  length(callback: (err: any, length?: number) => void): void {
    try {
      const stmt = db.prepare('SELECT COUNT(*) as count FROM sessions WHERE expired > ?');
      const row = stmt.get(Date.now()) as { count: number };
      callback(null, row.count);
    } catch (err) {
      callback(err);
    }
  }

  close(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}
