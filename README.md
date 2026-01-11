<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />

# Today Git Chief Editor

**AI-Powered Daily Development Report Generator**

Automatically generate professional daily reports from your GitHub activity

</div>

## About

Today Git Chief Editor is an AI-powered tool that helps developers automatically summarize their daily work from GitHub activity.

### Features

- **Auto-fetch Activity** - Retrieves commits and pull requests from the last 24 hours
- **AI Summary** - Uses Google Gemini AI to generate structured daily reports
- **Multiple Styles** - Supports Professional, Technical, and Achievement report styles
- **Modern UI** - Clean, responsive interface built with shadcn/ui and Pulse Beams
- **Privacy First** - GitHub Token is never stored, API Key stays on the server

### Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React + Vite + TypeScript + Tailwind CSS + shadcn/ui |
| Backend | Express + Node.js + TypeScript |
| AI | Google Gemini |

---

## Local Development

**Requirements:** Node.js 18+

1. Install dependencies:
   ```bash
   npm install
   cd server && npm install && cd ..
   ```

2. Configure Gemini API Key:
   ```bash
   echo "GEMINI_API_KEY=your_api_key_here" > server/.env
   ```

3. Start the app:
   ```bash
   npm run dev:all
   ```

   Frontend: http://localhost:3000
   Backend: http://localhost:3001

---

## Deployment

Deploy to Fly.io:

```bash
fly launch
fly secrets set GEMINI_API_KEY=your_api_key
fly deploy
```

---

## Usage

1. Enter your GitHub Personal Access Token (requires `repo` scope)
2. Select repositories to include
3. Choose a report style
4. Generate and export your daily report
