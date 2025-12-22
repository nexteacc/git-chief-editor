# API Token 安全评估报告

## 📊 总体评估

**安全等级：中等（开发环境）→ 需要改进（生产环境）**

当前实现有基本的安全措施，但生产环境部署前需要加强。

---

## ✅ 已实现的安全措施

### 1. Gemini API Key 保护 ✅

**实现方式**：
- ✅ 存储在 `server/.env` 文件中
- ✅ `.gitignore` 已正确配置（`server/.env` 不会被提交）
- ✅ 只在后端使用 `process.env.GEMINI_API_KEY`
- ✅ 前端代码中完全没有 API Key（`vite.config.ts` 注释已说明）

**评估**：**优秀** - Gemini API Key 完全不会暴露给前端

### 2. GitHub Token 传输方式 ✅

**实现方式**：
- ✅ Token 通过 POST 请求 body 传输（不是 URL 参数）
- ✅ 使用 JSON 格式，相对安全
- ✅ Token 不在前端持久化存储（只在 React state 中）
- ✅ 页面刷新后 Token 丢失（避免长期暴露）

**评估**：**良好** - 基本的安全传输方式

### 3. 后端代理模式 ✅

**实现方式**：
- ✅ 前端通过 `/api` 代理访问后端
- ✅ 所有 GitHub API 调用都在后端完成
- ✅ Token 不会直接暴露给浏览器网络请求

**评估**：**良好** - 正确的架构设计

---

## ⚠️ 存在的安全风险

### 1. GitHub Token 在前端内存中暴露 🔴

**风险描述**：
- Token 存储在 React `useState` 中
- 可以通过浏览器 DevTools → React DevTools 查看
- 可以通过浏览器 DevTools → Console 执行 `window.__REACT_DEVTOOLS_GLOBAL_HOOK__` 访问

**影响**：中等（需要用户主动使用 DevTools）

**建议**：
```typescript
// 可以考虑使用 sessionStorage（页面关闭后自动清除）
// 但注意：sessionStorage 仍然可以通过 DevTools 查看
const [token, setToken] = useState<string | null>(() => {
  return sessionStorage.getItem('github_token') || null;
});
```

### 2. 缺少 HTTPS（生产环境）🔴

**风险描述**：
- 当前使用 HTTP（`http://localhost:3000`）
- Token 在 HTTP 传输中可能被中间人攻击（MITM）
- 生产环境必须使用 HTTPS

**影响**：高（生产环境）

**建议**：
- 使用 HTTPS（Let's Encrypt、Cloudflare 等）
- 配置 HSTS（HTTP Strict Transport Security）
- 使用反向代理（Nginx、Caddy）处理 SSL

### 3. 没有 Token 验证和过期检查 ⚠️

**风险描述**：
- 后端直接使用前端传来的 Token，没有二次验证
- 没有检查 Token 是否过期
- 没有检查 Token 权限范围

**影响**：中等

**建议**：
```typescript
// 在 backend 验证 Token 时，检查权限
const response = await fetch(`${GITHUB_API_BASE}/user`, {
  headers: getHeaders(token),
});

// 检查响应中的 scope
const scopes = response.headers.get('X-OAuth-Scopes');
if (!scopes?.includes('repo')) {
  throw new Error('Token missing required "repo" scope');
}
```

### 4. 没有速率限制保护 ⚠️

**风险描述**：
- 没有对 API 调用频率进行限制
- 恶意用户可能频繁调用，导致 GitHub API 限流
- 可能导致服务不可用

**影响**：中等

**建议**：
```typescript
// 使用 express-rate-limit
import rateLimit from 'express-rate-limit';

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 分钟
  max: 100 // 最多 100 次请求
});

app.use('/api/github', apiLimiter);
```

### 5. 错误信息可能泄露敏感信息 ⚠️

**风险描述**：
- 错误信息可能包含部分 Token 或 API 响应
- 可能泄露系统内部信息

**影响**：低

**建议**：
```typescript
// 统一错误处理，不暴露详细信息
catch (error) {
  console.error('[Server Error]', error); // 只在服务器日志记录
  res.status(500).json({ 
    error: 'An error occurred. Please try again.' // 通用错误信息
  });
}
```

### 6. 没有 Token 加密存储（如果需要持久化）⚠️

**风险描述**：
- 如果未来需要持久化 Token（如"记住我"功能）
- 明文存储 Token 存在风险

**影响**：低（当前不需要）

**建议**：
- 如果未来需要持久化，使用加密存储
- 考虑使用浏览器加密 API（Web Crypto API）
- 或使用服务端加密存储

---

## 🔒 安全改进建议（按优先级）

### 高优先级（生产环境必需）

1. **启用 HTTPS**
   ```bash
   # 使用 Let's Encrypt
   certbot --nginx -d yourdomain.com
   ```

2. **添加速率限制**
   ```bash
   npm install express-rate-limit
   ```

3. **环境变量验证**
   ```typescript
   // 启动时检查必需的环境变量
   if (!process.env.GEMINI_API_KEY) {
     throw new Error('GEMINI_API_KEY is required');
   }
   ```

### 中优先级（建议实现）

4. **Token 权限验证**
   - 验证 Token 是否有 `repo` scope
   - 检查 Token 是否过期

5. **请求日志记录**
   - 记录 API 调用（不记录 Token）
   - 监控异常请求

6. **CORS 配置加强**
   ```typescript
   app.use(cors({
     origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
     credentials: true,
     methods: ['GET', 'POST'],
   }));
   ```

### 低优先级（可选）

7. **Token 混淆**（前端）
   - 使用简单的编码/解码（不是加密，只是增加查看难度）

8. **安全响应头**
   ```typescript
   app.use((req, res, next) => {
     res.setHeader('X-Content-Type-Options', 'nosniff');
     res.setHeader('X-Frame-Options', 'DENY');
     res.setHeader('X-XSS-Protection', '1; mode=block');
     next();
   });
   ```

---

## 📋 安全检查清单

### 开发环境 ✅
- [x] Gemini API Key 在 `.env` 文件中
- [x] `.env` 在 `.gitignore` 中
- [x] Token 通过 POST body 传输
- [x] 后端代理模式
- [x] 前端不存储 Token

### 生产环境 ⚠️
- [ ] 使用 HTTPS
- [ ] 配置速率限制
- [ ] 验证 Token 权限
- [ ] 配置 CORS 白名单
- [ ] 添加安全响应头
- [ ] 配置错误日志（不记录敏感信息）
- [ ] 使用环境变量管理密钥
- [ ] 定期轮换 API Key

---

## 🎯 当前安全架构总结

```
用户输入 Token
    ↓
前端 React State（内存，页面刷新后丢失）
    ↓
POST /api/github/validate (HTTP)
    ↓
后端 Express 路由
    ↓
后端调用 GitHub API（使用 Token）
    ↓
返回结果给前端
```

**优点**：
- ✅ Token 不持久化
- ✅ 后端代理保护
- ✅ Gemini API Key 完全隔离

**缺点**：
- ⚠️ 开发环境使用 HTTP
- ⚠️ 没有速率限制
- ⚠️ Token 在 DevTools 可见（但这是前端应用的常见情况）

---

## 💡 最佳实践建议

1. **永远不要在代码中硬编码 Token/Key**
   - ✅ 当前实现正确

2. **使用环境变量管理密钥**
   - ✅ 当前实现正确

3. **生产环境必须使用 HTTPS**
   - ⚠️ 需要配置

4. **实施最小权限原则**
   - ⚠️ 可以加强 Token 权限验证

5. **监控和日志**
   - ⚠️ 建议添加（不记录敏感信息）

---

## 📝 结论

**当前安全状态**：
- **开发环境**：✅ 基本安全，可以继续开发
- **生产环境**：⚠️ 需要加强（主要是 HTTPS 和速率限制）

**总体评价**：项目采用了正确的安全架构（后端代理、环境变量），但在生产环境部署前需要添加 HTTPS 和速率限制等保护措施。

