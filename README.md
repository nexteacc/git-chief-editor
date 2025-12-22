<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1VkJOGaNFShGzic-T_ZP9Lepnt4qkKSsP

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   ```bash
   npm install
   cd server && npm install && cd ..
   ```

2. Set the `GEMINI_API_KEY` in `server/.env` to your Gemini API key:
   ```bash
   cd server
   echo "GEMINI_API_KEY=your_gemini_api_key_here" > .env
   cd ..
   ```

3. Run the app:
   ```bash
   # Start both frontend and backend
   npm run dev:all
   
   # Or start separately:
   # Terminal 1: npm run dev (frontend on port 3000)
   # Terminal 2: npm run dev:server (backend on port 3001)
   ```
