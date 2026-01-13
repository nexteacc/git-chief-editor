# Today VibeEditor

**AI-Powered Daily & Weekly Development Report Generator**

Automatically generate professional summaries from your GitHub activity using AI.

</div>

## About

Today VibeEditor is an AI-powered tool that helps developers automatically summarize their daily or weekly work from GitHub activity. It uses Google's Gemini AI to transform raw commits and pull requests into structured, readable reports.

### Features

- **Flexible Time Ranges** - Analyze activity for the last 24 hours (Daily) or the past week (Weekly)
- **Secure OAuth Login** - Sign in with GitHub securely. Tokens are encrypted and stored on the server (SQLite), not in your browser
- **Private Repo Support** - Works with both public and private repositories (requires authorization)
- **AI Summary** - Uses Google Gemini AI to generate structured reports
- **Multiple Styles** - Supports Professional, Technical, and Achievement report styles
- **Modern UI** - Clean, responsive interface built with shadcn/ui, Pulse Beams, and Tailwind CSS

### Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React + Vite + TypeScript + Tailwind CSS + shadcn/ui |
| Backend | Express + Node.js + TypeScript + **SQLite** |
| Auth | GitHub OAuth 2.0 + express-session |
| AI | Google Gemini |
| Infrastructure | Fly.io + Docker |

---

## Local Development

**Requirements:** Node.js 18+

1. **Clone and Install dependencies:**
   ```bash
   npm install
   cd server && npm install && cd ..
   ```

2. **Setup GitHub OAuth App:**
   - Create a new OAuth App in GitHub Developer Settings.
   - Set Homepage URL to `http://localhost:3000`
   - Set Authorization callback URL to `http://localhost:3001/api/auth/callback`

3. **Configure Environment Variables:**
   Create a `.env` file in the `server` directory:
   ```bash
   # server/.env
   PORT=3001
   NODE_ENV=development
   DATABASE_PATH=./data/app.db
   SESSION_SECRET=your_secret_key_here
   
   # GitHub OAuth
   GITHUB_CLIENT_ID=your_github_client_id
   GITHUB_CLIENT_SECRET=your_github_client_secret
   GITHUB_CALLBACK_URL=http://localhost:3001/api/auth/callback
   
   # AI
   GEMINI_API_KEY=your_gemini_api_key
   ```

4. **Start the app:**
   ```bash
   npm run dev:all
   ```
   - Frontend: http://localhost:3000
   - Backend: http://localhost:3001

---

## Deployment (Fly.io)

This app is configured for [Fly.io](https://fly.io/), which supports persistent storage (SQLite) and Docker.

> **Note:** Fly.io uses a short CLI setup (volumes + secrets) instead of a one-click deploy button.

**Prerequisites:** [Install Fly CLI](https://fly.io/docs/hands-on/install-flyctl/) and run `fly auth login`.

1. **Launch App:**
   ```bash
   fly launch
   ```

2. **Create Persistent Volume:**
   The app requires a volume named `today_vibe_data` to store the SQLite database.
   ```bash
   # Create 2 volumes for high availability (if running 2 machines)
   fly volume create today_vibe_data -n 2
   ```

3. **Set Secrets:**
   ```bash
   fly secrets set \
     GEMINI_API_KEY=your_key \
     GITHUB_CLIENT_ID=your_id \
     GITHUB_CLIENT_SECRET=your_secret \
     SESSION_SECRET=your_random_secret
   ```

4. **Deploy:**
   You can deploy manually or use the included GitHub Action.
   ```bash
   fly deploy
   ```

   **Automatic Deployment:**
   - Push to `master` branch triggers automatic deployment.
   - Requires setting `FLY_API_TOKEN` in GitHub Repository Secrets.

---

## Usage

1. Click **Sign in with GitHub** on the homepage.
2. Authorize the application (basic read access initially).
3. (Optional) Click "Authorize Private Repos" if you need to include private work.
4. Choose your report style and date range (Daily/Weekly).
5. Let AI generate your summary!
