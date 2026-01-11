import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import rateLimit from 'express-rate-limit';
import session from 'express-session';
import FileStoreFactory from 'session-file-store';
import dotenv from 'dotenv';
import { initDatabase } from './db/init.js';
import { githubRouter } from './routes/github.js';
import { geminiRouter } from './routes/gemini.js';
import { authRouter } from './routes/auth.js';

dotenv.config();

// Initialize database
initDatabase();

const FileStore = FileStoreFactory(session);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const isProduction = process.env.NODE_ENV === 'production';

// Trust proxy (required for Fly.io and other reverse proxies)
if (isProduction) {
  app.set('trust proxy', 1);
}

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware
if (!isProduction) {
  app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true
  }));
}
app.use(express.json());

// Session middleware
const sessionPath = path.join(__dirname, '../../data/sessions');

// Ensure session directory exists
if (!fs.existsSync(sessionPath)) {
  fs.mkdirSync(sessionPath, { recursive: true });
  console.log('[Session] Created directory:', sessionPath);
}

app.use(session({
  store: new FileStore({
    path: sessionPath,
    ttl: 86400 * 7, // 7 days
    retries: 0,
  }),
  secret: process.env.SESSION_SECRET || 'dev-secret-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: isProduction,
    httpOnly: true,
    maxAge: 86400 * 7 * 1000, // 7 days
    sameSite: 'lax',
  }
}));

app.use('/api', apiLimiter);

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  if (isProduction) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  next();
});

// Routes
app.use('/api/auth', authRouter);
app.use('/api/github', githubRouter);
app.use('/api/gemini', geminiRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve static files in production
if (isProduction) {
  const staticPath = path.join(__dirname, '../../dist');
  app.use(express.static(staticPath));

  // SPA fallback
  app.get('*', (req, res) => {
    res.sendFile(path.join(staticPath, 'index.html'));
  });
}

// Error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[Server Error]', err.message);
  res.status(500).json({
    error: isProduction ? 'Internal server error' : err.message
  });
});

app.listen(PORT, () => {
  console.log(`[Server] Running on http://localhost:${PORT}`);
  console.log(`[Server] Health check: http://localhost:${PORT}/api/health`);
});
