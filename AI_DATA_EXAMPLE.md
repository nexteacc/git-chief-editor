# 提交给 AI 的数据结构说明

本文档详细说明 Today Git Chief Editor 提交给 Gemini AI 进行总结的数据结构和实际示例。

## 📊 数据流程

```
GitHub API
    ↓
后端 githubService.ts (获取原始数据)
    ↓
前端 App.tsx (用户选择仓库)
    ↓
后端 geminiService.ts (数据清理和转换)
    ↓
Gemini AI (生成日报)
```

## 🔍 实际提交给 AI 的数据结构

### 1. 数据转换过程

在 `server/src/services/geminiService.ts` 中，我们对原始数据进行清理：

```typescript
// 清理输入数据
const dataInput = activities.map(repo => ({
  repo: repo.repoName,                                    // 仓库名称
  commits: repo.commits.map(c => c.message).slice(0, 15), // 最多15条commit消息
  prs: repo.prs.map(p => ({ 
    title: p.title,                                       // PR标题
    description: p.body?.substring(0, 200)               // PR描述（前200字符）
  }))
}));
```

### 2. 实际数据示例

假设用户在过去24小时内在两个仓库有活动：

#### 示例 1：完整数据

```json
[
  {
    "repo": "username/frontend-app",
    "commits": [
      "feat: 添加用户登录功能",
      "fix: 修复登录页面的样式问题",
      "refactor: 重构用户认证模块",
      "docs: 更新README文档",
      "chore: 更新依赖包版本"
    ],
    "prs": [
      {
        "title": "实现用户登录和注册功能",
        "description": "本次PR实现了完整的用户认证系统，包括登录、注册、密码重置等功能。使用了JWT token进行身份验证，并添加了相应的错误处理。"
      },
      {
        "title": "修复登录页面的响应式布局问题",
        "description": "修复了在移动设备上登录页面布局错乱的问题，优化了表单输入框的样式和间距。"
      }
    ]
  },
  {
    "repo": "username/backend-api",
    "commits": [
      "feat: 添加用户API端点",
      "feat: 实现JWT认证中间件",
      "test: 添加用户API的单元测试",
      "fix: 修复数据库连接池配置"
    ],
    "prs": [
      {
        "title": "实现用户管理API",
        "description": "添加了用户CRUD操作的RESTful API端点，包括GET /users, POST /users, PUT /users/:id, DELETE /users/:id。实现了数据验证和错误处理。"
      }
    ]
  }
]
```

#### 示例 2：只有 Commits，没有 PRs

```json
[
  {
    "repo": "username/utils-library",
    "commits": [
      "fix: 修复日期格式化函数的时区问题",
      "feat: 添加字符串工具函数",
      "refactor: 优化数组处理性能"
    ],
    "prs": []
  }
]
```

#### 示例 3：只有 PRs，没有 Commits

```json
[
  {
    "repo": "username/documentation",
    "commits": [],
    "prs": [
      {
        "title": "更新API文档",
        "description": "更新了所有API端点的文档，添加了请求示例和响应格式说明。"
      }
    ]
  }
]
```

### 3. 数据限制和优化

#### Commit 消息限制
- **最多15条**：`repo.commits.map(c => c.message).slice(0, 15)`
- **只提取消息**：不包含 SHA、URL、时间戳等信息
- **原因**：减少 token 消耗，聚焦核心内容

#### PR 描述限制
- **前200字符**：`p.body?.substring(0, 200)`
- **只提取标题和描述**：不包含 URL、编号等信息
- **原因**：PR 描述可能很长，截取前200字符足够 AI 理解主要内容

### 4. 完整的 Prompt 示例

实际发送给 Gemini AI 的完整 prompt 如下：

```
你是 Today Git Chief Editor，开发者的个人编辑助手。
请分析以下过去24小时的 GitHub 活动数据。

风格：简洁专业。使用商务导向的动词（完成、修复、部署）。聚焦结果，保持简洁。

数据：
[
  {
    "repo": "username/frontend-app",
    "commits": [
      "feat: 添加用户登录功能",
      "fix: 修复登录页面的样式问题",
      "refactor: 重构用户认证模块"
    ],
    "prs": [
      {
        "title": "实现用户登录和注册功能",
        "description": "本次PR实现了完整的用户认证系统，包括登录、注册、密码重置等功能。使用了JWT token进行身份验证，并添加了相应的错误处理。"
      }
    ]
  }
]

请严格按照 schema 生成 JSON 响应。所有内容必须使用中文。
```

### 5. 系统指令

除了 prompt，我们还设置了系统指令：

```
你是一位专业的技术写作专家，擅长总结软件开发日志。请使用中文回答，确保所有输出内容都是中文。
```

### 6. 输出 Schema

AI 需要按照以下 schema 生成 JSON：

```typescript
{
  headline: string,              // 标题（最多10个字）
  keyAchievements: string[],     // 3-5个关键成就
  repoSummaries: [               // 每个仓库的摘要
    {
      repoName: string,          // 仓库名称
      summary: string,           // 一段话总结
      tags: string[]             // 2-3个标签（如：重构、功能、修复）
    }
  ]
}
```

## 📝 数据来源说明

### Commit 数据来源
- **API 端点**：`GET /repos/{owner}/{repo}/commits`
- **过滤条件**：
  - `author={username}`：只获取该用户的提交
  - `since={24小时前的时间戳}`
  - `per_page=100`：最多100条
- **提取字段**：
  - `c.commit.message`：提交消息
  - `c.sha`：提交哈希（不传给AI）
  - `c.html_url`：提交链接（不传给AI）
  - `c.commit.committer.date`：提交时间（用于计算活跃时长，不传给AI）

### PR 数据来源
- **API 端点**：`GET /search/issues?q=type:pr author:{username} updated:>{时间戳}`
- **过滤条件**：
  - `type:pr`：只搜索 PR
  - `author:{username}`：只获取该用户的 PR
  - `updated:>{时间戳}`：最近24小时更新的
- **提取字段**：
  - `pr.title`：PR 标题
  - `pr.body`：PR 描述（截取前200字符）
  - `pr.html_url`：PR 链接（不传给AI）
  - `pr.number`：PR 编号（不传给AI）

## 🔒 隐私和安全

### 不传递给 AI 的信息
- ✅ Commit SHA（提交哈希）
- ✅ Commit URL（提交链接）
- ✅ PR URL（PR链接）
- ✅ PR 编号
- ✅ 提交时间戳（用于计算时长，但不传给AI）
- ✅ 仓库是否为私有（isPrivate）

### 传递给 AI 的信息
- ✅ 仓库名称（公开信息）
- ✅ Commit 消息（公开信息）
- ✅ PR 标题和描述（公开信息）

## 💡 优化建议

### 当前实现
- ✅ 限制 commit 数量（最多15条）
- ✅ 截取 PR 描述（前200字符）
- ✅ 只传递必要信息

### 可能的改进
- 🔄 如果 commit 消息过多，可以按类型分组
- 🔄 可以提取 commit 消息中的关键信息（如功能模块）
- 🔄 可以统计 commit 类型分布（feat/fix/refactor等）

## 📊 实际使用场景

### 场景 1：活跃开发者
```json
[
  {
    "repo": "company/main-app",
    "commits": [
      "feat: 添加支付功能",
      "feat: 实现订单管理",
      "fix: 修复支付回调问题",
      "test: 添加支付模块测试",
      "docs: 更新支付API文档"
    ],
    "prs": [
      {
        "title": "实现支付功能模块",
        "description": "完整的支付功能实现，包括支付宝、微信支付、银行卡支付三种方式。添加了支付状态管理、回调处理、退款功能等。"
      }
    ]
  }
]
```

**AI 可能生成的摘要**：
- **标题**：完成支付功能模块开发
- **关键成就**：
  - 实现多支付渠道集成
  - 完成支付状态管理和回调处理
  - 添加完整的测试覆盖
- **仓库摘要**：在 main-app 仓库中完成了支付功能模块的开发，实现了支付宝、微信支付和银行卡支付三种支付方式，并添加了支付状态管理、回调处理和退款功能。

### 场景 2：维护性工作
```json
[
  {
    "repo": "personal/toolkit",
    "commits": [
      "fix: 修复日期格式化bug",
      "fix: 修复数组去重函数",
      "refactor: 优化代码结构",
      "chore: 更新依赖版本"
    ],
    "prs": []
  }
]
```

**AI 可能生成的摘要**：
- **标题**：修复工具库中的关键bug
- **关键成就**：
  - 修复日期格式化问题
  - 优化代码结构
- **仓库摘要**：在 toolkit 仓库中进行了维护性工作，修复了日期格式化和数组去重函数中的bug，并优化了代码结构。

## 🎯 总结

提交给 AI 的数据是**精简且聚焦**的：
1. **只包含文本内容**：commit 消息、PR 标题和描述
2. **数量限制**：最多15条 commit，PR 描述前200字符
3. **结构化**：按仓库组织，便于 AI 理解上下文
4. **隐私保护**：不传递敏感信息（URL、SHA等）

这样的数据结构既能让 AI 充分理解工作内容，又能控制 token 消耗，提高生成效率。

