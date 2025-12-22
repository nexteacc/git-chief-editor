<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />

# Git Chief Editor

**AI-Powered Daily Development Report Generator**

从 GitHub 活动自动生成专业的开发日报

</div>

## 产品介绍

Git Chief Editor 是一个 AI 驱动的开发日报生成工具，帮助开发者自动汇总每日工作成果。

### 核心功能

- **自动获取活动** - 获取过去 24 小时内的 Commits 和 Pull Requests
- **AI 智能总结** - 使用 Google Gemini AI 生成结构化日报
- **多种报告风格** - 支持专业、技术、成就三种风格
- **隐私安全** - GitHub Token 不存储，API Key 仅在后端使用

### 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | React + Vite + TypeScript + Tailwind CSS |
| 后端 | Express + Node.js + TypeScript |
| AI | Google Gemini |

---

## 本地运行

**环境要求:** Node.js 18+

1. 安装依赖：
   ```bash
   npm install
   cd server && npm install && cd ..
   ```

2. 配置 Gemini API Key：
   ```bash
   echo "GEMINI_API_KEY=your_api_key_here" > server/.env
   ```

3. 启动应用：
   ```bash
   npm run dev:all
   ```

   前端: http://localhost:3000
   后端: http://localhost:3001

---

## 部署

支持一键部署到 Fly.io：

```bash
fly launch
fly secrets set GEMINI_API_KEY=your_api_key
fly deploy
```

---

## 使用方式

1. 输入 GitHub Personal Access Token（需要 `repo` 权限）
2. 选择要包含的仓库
3. 选择报告风格
4. 生成并导出日报
