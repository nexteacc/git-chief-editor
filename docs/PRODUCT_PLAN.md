# Today VibeEditor - 完整产品规划

> 文档版本: v1.0
> 更新日期: 2026-01-11

## 一、需求分析

### 1.1 用户故事

| 角色 | 需求 | 价值 |
|-----|------|------|
| 开发者 | 一键登录，无需手动配置 Token | 降低使用门槛 |
| 开发者 | 定时收到工作日报 | 无需手动触发 |
| 开发者 | 通过邮件/Slack/Discord 接收 | 在常用工具中查看 |
| 开发者 | 自定义报告风格和语言 | 个性化体验 |

### 1.2 核心功能

```
F1: GitHub OAuth 登录
F2: 用户偏好设置
F3: 手动生成报告
F4: 定时自动生成
F5: 多渠道推送
```

### 1.3 功能依赖关系

```
F1 (登录)
 └── F2 (设置)
      ├── F3 (手动生成) ← 现有功能改造
      └── F4 (定时生成)
           └── F5 (推送)
```

### 1.4 完整链条

```
用户 → GitHub OAuth 登录
         ↓
      设置偏好（仓库、频率、接收方式）
         ↓
      定时任务触发（每天/每周）
         ↓
      生成报告（Gemini）
         ↓
      推送到接收端
         ↓
   邮件 / Slack / Discord
```

---

## 二、目标设定

### 2.1 里程碑

| 里程碑 | 目标 | 交付物 |
|-------|------|--------|
| M1 | 用户可以用 GitHub 登录 | OAuth 流程完整 |
| M2 | 用户可以保存设置 | 设置页面 + 数据库 |
| M3 | 用户可以手动生成并查看报告 | 现有功能迁移 |
| M4 | 用户可以收到定时推送 | 定时任务 + 推送 |

### 2.2 验收标准

**M1 - OAuth 登录**
- [ ] 点击登录按钮跳转 GitHub 授权
- [ ] 授权后自动跳回应用
- [ ] 显示用户头像和用户名
- [ ] 可以登出

**M2 - 用户设置**
- [ ] 可以配置报告风格、语言
- [ ] 可以配置推送频率、时间
- [ ] 可以配置接收渠道
- [ ] 刷新后设置保持

**M3 - 手动生成**
- [ ] 登录后可以选择仓库
- [ ] 可以生成报告
- [ ] 可以查看报告

**M4 - 定时推送**
- [ ] 到达设定时间自动生成
- [ ] 报告发送到配置的渠道
- [ ] 推送失败有重试/通知

---

## 三、边界定义

### 3.1 做什么（In Scope）

| 功能 | 说明 |
|-----|------|
| GitHub OAuth | 仅支持 GitHub 登录 |
| 数据存储 | SQLite 本地存储 |
| 推送渠道 | 邮件、Slack、Discord |
| 推送频率 | 每天、每周 |
| 报告范围 | 过去 24 小时活动 |

### 3.2 不做什么（Out of Scope）

| 功能 | 原因 |
|-----|------|
| 其他登录方式（Google等） | 非核心需求 |
| 社交媒体发布 | 复杂度高，需要额外 OAuth |
| 团队功能 | V2 考虑 |
| 历史报告查看 | V2 考虑 |
| 移动端适配 | V2 考虑 |
| 多语言 UI | V2 考虑（报告语言已支持） |

### 3.3 技术边界

| 约束 | 决策 |
|-----|------|
| 数据库 | SQLite（Fly.io 持久卷） |
| 定时任务 | node-cron（进程内） |
| Session | express-session（内存/文件） |
| 邮件服务 | Brevo（原 Sendinblue） |

---

## 四、异常处理

### 4.1 认证异常

| 场景 | 处理方式 |
|-----|---------|
| OAuth 授权失败 | 显示错误，提供重试按钮 |
| OAuth 被用户取消 | 返回登录页 |
| Token 过期 | 自动跳转重新授权 |
| Session 过期 | 返回登录页，保留当前 URL |
| GitHub API 限流 | 显示友好提示，稍后重试 |

### 4.2 推送异常

| 场景 | 处理方式 |
|-----|---------|
| 邮件发送失败 | 重试 3 次，记录日志 |
| Webhook URL 无效 | 测试时提示，定时推送跳过 |
| 网络超时 | 重试，指数退避 |
| Gemini API 失败 | 记录日志，下次重试 |
| 无活动数据 | 发送"今日无活动"通知或跳过 |

### 4.3 数据异常

| 场景 | 处理方式 |
|-----|---------|
| 数据库连接失败 | 启动时检查，失败则退出 |
| 用户数据丢失 | 重新登录自动创建 |
| 偏好数据损坏 | 使用默认值 |

---

## 五、页面状态管理

### 5.1 应用状态

```typescript
enum AppState {
  LOADING,      // 初始加载，检查登录状态
  GUEST,        // 未登录
  AUTHENTICATED // 已登录
}

enum AuthenticatedView {
  SETTINGS,     // 设置页面
  GENERATING,   // 生成报告中
  DASHBOARD     // 查看报告
}
```

### 5.2 状态流转图

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  [App 启动]                                             │
│      │                                                  │
│      ▼                                                  │
│  ┌────────┐                                             │
│  │LOADING │ ─── 检查 /api/auth/me                       │
│  └────────┘                                             │
│      │                                                  │
│      ├── 401 未登录 ──▶ ┌───────┐                       │
│      │                  │ GUEST │ ──▶ [登录页]          │
│      │                  └───────┘                       │
│      │                      │                           │
│      │                  点击登录                         │
│      │                      │                           │
│      │                      ▼                           │
│      │               跳转 GitHub OAuth                   │
│      │                      │                           │
│      │                  授权成功                         │
│      │                      │                           │
│      ▼                      ▼                           │
│  ┌───────────────────────────┐                          │
│  │     AUTHENTICATED         │                          │
│  │  ┌─────────────────────┐  │                          │
│  │  │      SETTINGS       │◀─┼── 首次登录 / 点击设置    │
│  │  └─────────────────────┘  │                          │
│  │           │               │                          │
│  │       点击生成             │                          │
│  │           ▼               │                          │
│  │  ┌─────────────────────┐  │                          │
│  │  │     GENERATING      │  │                          │
│  │  └─────────────────────┘  │                          │
│  │           │               │                          │
│  │       生成完成             │                          │
│  │           ▼               │                          │
│  │  ┌─────────────────────┐  │                          │
│  │  │     DASHBOARD       │  │                          │
│  │  └─────────────────────┘  │                          │
│  │           │               │                          │
│  │       点击设置             │                          │
│  │           │               │                          │
│  │           └───────────────┼──▶ SETTINGS              │
│  │                           │                          │
│  │       点击登出             │                          │
│  │           │               │                          │
│  └───────────┼───────────────┘                          │
│              ▼                                          │
│          ┌───────┐                                      │
│          │ GUEST │                                      │
│          └───────┘                                      │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 5.3 状态数据结构

```typescript
// 全局状态
interface AppContext {
  // 认证状态
  authState: 'loading' | 'guest' | 'authenticated';
  user: User | null;

  // 当前视图（已登录时）
  currentView: 'settings' | 'generating' | 'dashboard';

  // 用户偏好（从服务器加载）
  preferences: UserPreferences | null;

  // 报告数据
  report: DailyReport | null;

  // 操作方法
  login: () => void;
  logout: () => void;
  updatePreferences: (prefs: Partial<UserPreferences>) => Promise<void>;
  generateReport: () => Promise<void>;
  navigateTo: (view: AuthenticatedView) => void;
}

interface User {
  id: number;
  githubId: number;
  login: string;
  name: string | null;
  avatarUrl: string;
  email: string | null;
}

interface UserPreferences {
  // 报告设置
  reportStyle: 'PROFESSIONAL' | 'TECHNICAL' | 'ACHIEVEMENT';
  outputLanguage: 'CHINESE' | 'ENGLISH';
  includePrivateRepos: boolean;

  // 推送设置
  pushFrequency: 'DAILY' | 'WEEKLY' | null;
  pushTime: string; // HH:MM
  pushWeekday: number; // 1-7, for weekly
  timezone: string;

  // 接收端
  emailEnabled: boolean;
  slackWebhook: string | null;
  discordWebhook: string | null;
}
```

### 5.4 页面组件映射

| 状态 | 组件 | 说明 |
|-----|------|------|
| LOADING | `<LoadingScreen />` | 全屏加载动画 |
| GUEST | `<AuthScreen />` | 登录按钮 |
| SETTINGS | `<SettingsScreen />` | 用户设置表单 |
| GENERATING | `<LoadingScreen />` | 生成中动画 |
| DASHBOARD | `<Dashboard />` | 报告展示 |

### 5.5 路由设计（可选）

如果需要 URL 路由：

| 路径 | 状态 | 说明 |
|-----|------|------|
| `/` | GUEST | 登录页 |
| `/auth/callback` | - | OAuth 回调 |
| `/settings` | SETTINGS | 设置页 |
| `/report` | DASHBOARD | 报告页 |

当前实现：**不使用路由**，纯状态管理（保持简单）

---

## 六、API 设计

### 6.1 认证 API

```
GET  /api/auth/login     → 重定向到 GitHub OAuth
GET  /api/auth/callback  → 处理 OAuth 回调
GET  /api/auth/me        → 获取当前用户
POST /api/auth/logout    → 登出
```

### 6.2 用户 API

```
GET  /api/user/preferences       → 获取用户偏好
PUT  /api/user/preferences       → 更新用户偏好
POST /api/user/test-push         → 测试推送
POST /api/user/test-push/email   → 测试邮件
POST /api/user/test-push/slack   → 测试 Slack
POST /api/user/test-push/discord → 测试 Discord
```

### 6.3 报告 API（改造现有）

```
GET  /api/github/repos    → 获取用户仓库列表
POST /api/report/generate → 生成报告（不需要传 token）
```

---

## 七、数据库设计

### 7.1 Schema

```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  github_id INTEGER UNIQUE NOT NULL,
  github_login TEXT NOT NULL,
  github_name TEXT,
  avatar_url TEXT,
  email TEXT,
  access_token TEXT NOT NULL,
  token_valid BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_preferences (
  user_id INTEGER PRIMARY KEY,
  -- 报告设置
  report_style TEXT DEFAULT 'PROFESSIONAL',
  output_language TEXT DEFAULT 'CHINESE',
  selected_repos TEXT, -- JSON array
  include_private_repos BOOLEAN DEFAULT FALSE,
  -- 推送设置
  push_frequency TEXT, -- 'DAILY', 'WEEKLY', NULL (disabled)
  push_time TEXT DEFAULT '09:00', -- HH:MM
  push_weekday INTEGER DEFAULT 1, -- 1=Monday (for weekly)
  timezone TEXT DEFAULT 'Asia/Shanghai',
  skip_if_no_activity BOOLEAN DEFAULT TRUE,
  -- 接收端
  email_enabled BOOLEAN DEFAULT FALSE,
  slack_webhook TEXT,
  discord_webhook TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

---

## 八、定时推送机制

### 8.1 后端定时任务

```typescript
// server/src/services/schedulerService.ts
import cron from 'node-cron';

// 每小时运行一次
cron.schedule('0 * * * *', async () => {
  const currentHour = getCurrentHourInAllTimezones();

  // 查找需要推送的用户
  const users = db.getUsersForPush(currentHour);

  for (const user of users) {
    try {
      // 用存储的 token 获取活动
      const activity = await fetchActivity(user.access_token);

      // 生成报告
      const report = await generateReport(activity, user.preferences);

      // 推送
      await pushReport(user, report);
    } catch (error) {
      logError(user.id, error);
    }
  }
});
```

### 8.2 推送服务

```typescript
// server/src/services/pushService.ts
export async function pushReport(user, report) {
  const results = [];

  if (user.email_enabled && user.email) {
    results.push(await sendEmail(user.email, report));
  }
  if (user.slack_webhook) {
    results.push(await sendSlack(user.slack_webhook, report));
  }
  if (user.discord_webhook) {
    results.push(await sendDiscord(user.discord_webhook, report));
  }

  return results;
}
```

### 8.3 邮件服务（Brevo）

```typescript
// server/src/services/emailService.ts
import {
  TransactionalEmailsApi,
  TransactionalEmailsApiApiKeys
} from '@getbrevo/brevo';

const emailAPI = new TransactionalEmailsApi();
emailAPI.setApiKey(
  TransactionalEmailsApiApiKeys.apiKey,
  process.env.BREVO_API_KEY!
);

export async function sendEmail(
  to: string,
  report: DailyReport
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const result = await emailAPI.sendTransacEmail({
      sender: {
        name: 'Git Chief Editor',
        email: process.env.BREVO_FROM_EMAIL
      },
      to: [{ email: to }],
      subject: `Git Daily Report - ${report.date}`,
      htmlContent: formatReportAsHtml(report),
    });

    return { success: true, messageId: result.body.messageId };
  } catch (error) {
    console.error('[Email] Failed to send:', error);
    return { success: false, error: error.message };
  }
}

function formatReportAsHtml(report: DailyReport): string {
  return `
    <h1>${report.headline}</h1>
    <p>Date: ${report.date}</p>
    <p>Commits: ${report.totalCommits} | PRs: ${report.totalPRs}</p>
    <h2>Key Achievements</h2>
    <ul>
      ${report.keyAchievements.map(a => `<li>${a}</li>`).join('')}
    </ul>
    <h2>Repository Summaries</h2>
    ${report.repoSummaries.map(r => `
      <h3>${r.repoName}</h3>
      <p>${r.summary}</p>
    `).join('')}
  `;
}
```

### 8.4 Slack/Discord 推送

```typescript
// server/src/services/pushService.ts
export async function sendSlack(webhookUrl: string, report: DailyReport) {
  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: `*${report.headline}*\n${report.date}\n\n` +
            `Commits: ${report.totalCommits} | PRs: ${report.totalPRs}\n\n` +
            report.keyAchievements.map(a => `• ${a}`).join('\n')
    })
  });
  return { success: response.ok };
}

export async function sendDiscord(webhookUrl: string, report: DailyReport) {
  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      content: `**${report.headline}**\n${report.date}\n\n` +
               `Commits: ${report.totalCommits} | PRs: ${report.totalPRs}\n\n` +
               report.keyAchievements.map(a => `• ${a}`).join('\n')
    })
  });
  return { success: response.ok };
}
```

---

## 九、开发计划

### 阶段 1：认证基础（M1）

**任务清单：**
1. [ ] 创建 GitHub OAuth App
2. [ ] 安装依赖（better-sqlite3, express-session）
3. [ ] 创建数据库 schema 和初始化脚本
4. [ ] 实现 `/api/auth/*` 路由
5. [ ] 改造 AuthScreen 为 OAuth 按钮
6. [ ] 实现 App 状态管理
7. [ ] 测试完整登录流程

**交付：** 用户可以登录/登出

### 阶段 2：设置页面（M2）

**任务清单：**
1. [ ] 实现 `/api/user/preferences` API
2. [ ] 创建 SettingsScreen 组件
3. [ ] 实现表单验证
4. [ ] 实现保存功能
5. [ ] 测试设置持久化

**交付：** 用户可以保存设置

### 阶段 3：报告生成迁移（M3）

**任务清单：**
1. [ ] 改造 GitHub API 从 session 获取 token
2. [ ] 更新前端服务调用
3. [ ] 添加仓库选择到设置页
4. [ ] 测试报告生成流程

**交付：** 用户可以生成报告

### 阶段 4：定时推送（M4）

**任务清单：**
1. [ ] 实现 emailService
2. [ ] 实现 pushService（Slack/Discord）
3. [ ] 实现 schedulerService
4. [ ] 实现测试推送 API
5. [ ] 测试定时触发
6. [ ] 测试各渠道推送

**交付：** 用户可以收到定时报告

---

## 十、测试清单

### 10.1 功能测试

| 场景 | 预期结果 |
|-----|---------|
| 首次访问 | 显示登录页 |
| 点击登录 | 跳转 GitHub |
| 授权成功 | 跳转设置页，显示用户信息 |
| 保存设置 | 提示成功，刷新后保持 |
| 生成报告 | 显示报告内容 |
| 测试推送 | 收到测试消息 |
| 登出 | 返回登录页 |

### 10.2 异常测试

| 场景 | 预期结果 |
|-----|---------|
| 取消 OAuth 授权 | 返回登录页，显示提示 |
| 无效 Webhook URL | 测试时提示错误 |
| 网络断开 | 显示错误，提供重试 |
| Session 过期 | 跳转登录页 |

---

## 十一、文件清单

```
server/
├── src/
│   ├── index.ts              [修改] 添加 session, db, cron
│   ├── db/
│   │   └── init.ts           [新建] 数据库初始化
│   ├── routes/
│   │   ├── auth.ts           [新建] OAuth 路由
│   │   ├── user.ts           [新建] 用户设置路由
│   │   ├── github.ts         [修改] 从 session 获取 token
│   │   └── gemini.ts         [保持]
│   └── services/
│       ├── dbService.ts      [新建] 数据库操作
│       ├── pushService.ts    [新建] 推送服务
│       ├── emailService.ts   [新建] 邮件发送
│       ├── schedulerService.ts [新建] 定时任务
│       ├── githubService.ts  [保持]
│       └── geminiService.ts  [保持]
├── package.json              [修改] 添加依赖
└── .env                      [修改] 添加新变量

components/
├── AuthScreen.tsx            [修改] OAuth 按钮
├── SettingsScreen.tsx        [新建] 设置页面
├── Dashboard.tsx             [修改] 添加设置入口
├── LoadingScreen.tsx         [保持]
└── RepoFilter.tsx            [可能删除或合并到 Settings]

services/
├── authService.ts            [新建] 认证服务
├── userService.ts            [新建] 用户设置服务
├── apiClient.ts              [保持]
├── githubService.ts          [修改] 移除 token 参数
└── geminiService.ts          [保持]

App.tsx                       [修改] 状态管理重构
types.ts                      [修改] 添加新类型
fly.toml                      [修改] 添加存储卷
```

**统计：**
- 新建：10 个文件
- 修改：9 个文件
- 删除：0-1 个文件（RepoFilter 可能合并）

---

## 十二、外部依赖

### 12.1 需要手动配置

1. **GitHub OAuth App**
   - 开发环境：callback URL = `http://localhost:3001/api/auth/callback`
   - 生产环境：callback URL = `https://your-app.fly.dev/api/auth/callback`

2. **Brevo（原 Sendinblue）**
   - 注册 https://www.brevo.com
   - 进入 SMTP & API 页面
   - 获取 API Key（以 `xkeysib-` 开头）

3. **Fly.io 配置**

   创建存储卷：
   ```bash
   fly volumes create data --size 1
   ```

   更新 fly.toml：
   ```toml
   [http_service]
     min_machines_running = 1
     max_machines_running = 1  # 单实例，避免定时任务重复

   [mounts]
     source = "data"
     destination = "/app/data"
   ```

### 12.2 新增 NPM 依赖

```bash
# 后端
cd server && npm install \
  better-sqlite3 \
  express-session \
  session-file-store \
  node-cron \
  @getbrevo/brevo

npm install -D \
  @types/better-sqlite3 \
  @types/express-session \
  @types/node-cron
```

---

## 十三、风险与解决方案

### 13.1 GitHub OAuth Token 生命周期

**问题：** Token 会过期或被用户撤销

**解决方案：** 每次使用前验证，失效时标记

```typescript
async function getValidToken(userId: number): Promise<string | null> {
  const user = db.getUserById(userId);

  try {
    await fetch('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${user.access_token}` }
    });
    return user.access_token;
  } catch (error) {
    if (error.status === 401) {
      db.markUserTokenInvalid(userId);
      return null;
    }
    throw error;
  }
}
```

### 13.2 Fly.io 单实例 vs 多实例

**问题：** 多实例部署时，定时任务会重复执行

**解决方案：** 强制单实例部署

```toml
# fly.toml
[http_service]
  min_machines_running = 1
  max_machines_running = 1  # 限制最多 1 个实例
```

### 13.3 用户 24 小时无活动

**问题：** 推送空报告还是跳过？

**解决方案：** 用户可选，默认跳过

```typescript
interface UserPreferences {
  skipIfNoActivity: boolean; // true = 跳过, false = 发送"今日无活动"
}
```

### 13.4 Session 存储

**问题：** 内存 session 在实例重启后丢失

**解决方案：** 使用文件存储

```typescript
import session from 'express-session';
import FileStore from 'session-file-store';

const FileStoreSession = FileStore(session);

app.use(session({
  store: new FileStoreSession({
    path: './data/sessions',
    ttl: 86400 * 7, // 7 天
  }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 86400 * 7 * 1000,
  }
}));
```

### 13.5 用户时区

**问题：** 跨时区用户推送时间错乱

**解决方案：** 存储用户时区，按当地时间推送

```typescript
function shouldPushNow(user: UserPreferences): boolean {
  const now = new Date();
  const userLocalTime = new Intl.DateTimeFormat('en-US', {
    timeZone: user.timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(now);

  return userLocalTime === user.pushTime;
}
```

### 13.6 重复授权

**问题：** 同一用户多次授权导致数据库重复

**解决方案：** UPSERT + UNIQUE 约束

```typescript
db.run(`
  INSERT INTO users (github_id, github_login, ...)
  VALUES (?, ?, ...)
  ON CONFLICT(github_id) DO UPDATE SET
    access_token = excluded.access_token,
    token_valid = TRUE,
    updated_at = datetime('now')
`);
```

### 13.7 Webhook URL 无效

**问题：** 用户填错 URL 收不到推送

**解决方案：** 提供测试按钮

```typescript
// POST /api/user/test-push/slack
async function testSlackWebhook(webhookUrl: string) {
  const response = await fetch(webhookUrl, {
    method: 'POST',
    body: JSON.stringify({ text: '✅ 测试消息 - 配置成功！' })
  });
  return { success: response.ok };
}
```

---

## 十四、环境变量

### 开发环境 (server/.env)

```env
# 现有
GEMINI_API_KEY=xxx
PORT=3001
NODE_ENV=development

# 新增
GITHUB_CLIENT_ID=xxx
GITHUB_CLIENT_SECRET=xxx
GITHUB_CALLBACK_URL=http://localhost:3001/api/auth/callback
SESSION_SECRET=random_secret_string
DATABASE_PATH=./data/app.db
BREVO_API_KEY=xkeysib-xxx
BREVO_FROM_EMAIL=reports@yourapp.com
```

### 生产环境 (Fly.io Secrets)

```bash
fly secrets set GITHUB_CLIENT_ID=xxx
fly secrets set GITHUB_CLIENT_SECRET=xxx
fly secrets set GITHUB_CALLBACK_URL=https://your-app.fly.dev/api/auth/callback
fly secrets set SESSION_SECRET=xxx
fly secrets set BREVO_API_KEY=xkeysib-xxx
fly secrets set BREVO_FROM_EMAIL=reports@yourapp.com
```

---

## 十五、预期行为（输入 → 输出）

### 15.1 认证流程

| 步骤 | 输入 | 输出 |
|-----|------|------|
| 点击登录 | 无 | 重定向到 GitHub 授权页 |
| GitHub 回调 | `code` 参数 | 创建用户 + Session，重定向到设置页 |
| 获取当前用户 | Session Cookie | `{ user, preferences }` |
| 登出 | Session Cookie | 清除 Session，返回 `{ success: true }` |

### 15.2 用户设置

| 操作 | 输入 | 输出 |
|-----|------|------|
| 获取偏好 | userId (from session) | `UserPreferences` 对象 |
| 保存偏好 | `Partial<UserPreferences>` | 更新后的完整 `UserPreferences` |
| 测试推送 | channel + config | `{ success: boolean, message: string }` |

### 15.3 报告生成

| 操作 | 输入 | 输出 |
|-----|------|------|
| 获取仓库列表 | userId (from session) | `Repository[]` |
| 生成报告 | preferences | `DailyReport` |

### 15.4 定时推送

| 触发条件 | 处理 | 输出 |
|---------|------|------|
| 每小时整点 | 查找匹配用户 | 生成并推送报告 |
| 用户时间匹配 | 获取活动 → 生成报告 → 推送 | 日志记录 |

---

## 十六、异常处理（降级策略）

### 16.1 认证异常

| 异常场景 | 检测方式 | 降级策略 | 用户提示 |
|---------|---------|---------|---------|
| OAuth code 无效 | GitHub API 返回 400 | 重定向到登录页 | "授权失败，请重试" |
| OAuth 被取消 | 回调无 code 参数 | 重定向到登录页 | "您取消了授权" |
| Session 过期 | `/api/auth/me` 返回 401 | 前端跳转登录页 | 自动跳转，无提示 |
| Token 失效 | GitHub API 返回 401 | 标记 token_valid=false | "请重新登录" |
| GitHub API 限流 | 返回 403 + rate limit | 等待重试 | "GitHub 繁忙，稍后重试" |

### 16.2 设置异常

| 异常场景 | 检测方式 | 降级策略 | 用户提示 |
|---------|---------|---------|---------|
| 无效 Webhook URL | 格式校验失败 | 拒绝保存 | "请输入有效的 Webhook URL" |
| Webhook 测试失败 | fetch 返回非 200 | 允许保存但警告 | "测试失败，请检查 URL" |
| 无效时区 | 不在时区列表中 | 使用默认时区 | "已使用默认时区" |
| 无效推送时间 | 格式不是 HH:MM | 拒绝保存 | "请输入正确的时间格式" |

### 16.3 报告生成异常

| 异常场景 | 检测方式 | 降级策略 | 用户提示 |
|---------|---------|---------|---------|
| GitHub API 失败 | fetch 抛出异常 | 返回错误 | "获取 GitHub 数据失败" |
| Gemini API 失败 | API 返回错误 | 重试 1 次 | "AI 生成失败，请重试" |
| 无活动数据 | commits + PRs = 0 | 返回空报告或跳过 | "过去 24 小时无活动" |
| 超时 | 30s 无响应 | 中止请求 | "请求超时，请重试" |

### 16.4 定时推送异常

| 异常场景 | 检测方式 | 降级策略 | 记录 |
|---------|---------|---------|------|
| Token 失效 | GitHub 401 | 跳过该用户 | 标记 token_valid=false |
| 推送失败 | 渠道返回错误 | 重试 3 次 | 记录失败日志 |
| 无活动 | 空数据 | 根据用户设置跳过或发送 | 正常日志 |
| 生成失败 | Gemini 错误 | 跳过本次 | 记录错误 |

---

## 十七、一致性约束

### 17.1 命名规范

**服务方法命名（动词 + 名词）：**
```typescript
// ✅ 正确
upsertUser()
getUserById()
updatePreferences()
pushReport()

// ❌ 避免
createOrUpdateUser()
findUserById()
setPreferences()
sendReport()
```

**类型命名（PascalCase）：**
```typescript
// ✅ 正确
User
UserPreferences
PushResult

// ❌ 避免
UserEntity
UserSettings
SendResult
```

**API 路径（/api/{资源}/{动作}）：**
```typescript
// ✅ 正确
/api/auth/login
/api/auth/callback
/api/user/preferences

// ❌ 避免
/api/login
/auth/callback
/api/preferences
```

### 17.2 文件结构

遵循现有模式：
```
server/src/
├── routes/
│   ├── github.ts      # 现有
│   ├── gemini.ts      # 现有
│   ├── auth.ts        # 新增
│   └── user.ts        # 新增
├── services/
│   ├── githubService.ts   # 现有
│   ├── geminiService.ts   # 现有
│   ├── dbService.ts       # 新增
│   ├── pushService.ts     # 新增
│   └── schedulerService.ts # 新增
```

### 17.3 代码风格

**路由结构：**
```typescript
const authRouter = Router();
authRouter.get('/login', async (req, res) => { ... });
export { authRouter };
```

**错误处理：**
```typescript
if (!code) {
  return res.status(400).json({ error: 'Authorization code is required' });
}
```

**服务返回：**
```typescript
export const upsertUser = async (
  githubUser: GitHubUser,
  token: string
): Promise<User> => {
  // ...
};
```

### 17.4 前端模式

**组件 Props：**
```typescript
interface SettingsScreenProps {
  user: User;
  preferences: UserPreferences;
  onSave: (prefs: Partial<UserPreferences>) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}
```

**状态管理：**
```typescript
const [authState, setAuthState] = useState<'loading' | 'guest' | 'authenticated'>('loading');
const [currentView, setCurrentView] = useState<AuthenticatedView>('settings');
```

---

## 十八、验证标准

### 18.1 M1 - OAuth 登录验证

| 步骤 | 操作 | 预期结果 | ✓ |
|-----|------|---------|---|
| 1 | 打开首页 | 显示登录按钮 | |
| 2 | 点击登录 | 跳转 GitHub | |
| 3 | 授权 | 跳回应用，显示头像和用户名 | |
| 4 | 刷新页面 | 保持登录状态 | |
| 5 | 点击登出 | 返回登录页 | |
| 6 | 再次刷新 | 保持未登录状态 | |

### 18.2 M2 - 用户设置验证

| 步骤 | 操作 | 预期结果 | ✓ |
|-----|------|---------|---|
| 1 | 进入设置页 | 显示默认值 | |
| 2 | 修改报告风格 | UI 更新 | |
| 3 | 填写邮箱 | 无报错 | |
| 4 | 点击保存 | 提示成功 | |
| 5 | 刷新页面 | 设置保持 | |
| 6 | 查看数据库 | 数据正确存储 | |

### 18.3 M3 - 报告生成验证

| 步骤 | 操作 | 预期结果 | ✓ |
|-----|------|---------|---|
| 1 | 点击生成报告 | 显示加载动画 | |
| 2 | 等待完成 | 显示报告内容 | |
| 3 | 检查报告 | 包含正确的活动数据 | |

### 18.4 M4 - 定时推送验证

| 步骤 | 操作 | 预期结果 | ✓ |
|-----|------|---------|---|
| 1 | 配置 Slack Webhook | 保存成功 | |
| 2 | 点击测试推送 | Slack 收到消息 | |
| 3 | 设置推送时间为当前+1分钟 | 保存成功 | |
| 4 | 等待触发 | Slack 收到报告 | |
| 5 | 检查服务器日志 | 显示推送记录 | |

### 18.5 数据库验证命令

```bash
# 检查用户
sqlite3 server/data/app.db "SELECT * FROM users;"

# 检查偏好
sqlite3 server/data/app.db "SELECT * FROM user_preferences;"

# 检查 token 状态
sqlite3 server/data/app.db "SELECT github_login, token_valid FROM users;"
```

### 18.6 日志验证

关键节点日志：
```typescript
console.log('[Auth] User logged in:', user.github_login);
console.log('[Scheduler] Checking users for push at', currentHour);
console.log('[Push] Sending to', user.github_login, 'via', channel);
console.log('[Push] Result:', success ? 'OK' : 'FAILED');
```

生产环境查看：
```bash
fly logs --app your-app-name
```
