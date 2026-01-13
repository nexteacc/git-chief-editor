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

I recommend using AI to help you understand the codebase.

a prompt example: summarize how to deploy this project on Fly.io