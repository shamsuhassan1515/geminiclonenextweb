# NewAPI 登录集成设计文档

## 1. 概述

在 Gemini 页面 (http://localhost:1002/#/gemini) 集成 NewAPI (http://localhost:3001) 的登录功能，实现用户登录后可以自动使用 NewAPI 中设置的 API Token，无需每次手动输入密钥。

**安全原则**: 前端永远看不到原始 API Key，由后端统一管理。

## 2. 现有架构分析

### 2.1 NewAPI 登录机制

- **登录端点**: `POST http://localhost:3001/api/user/login`
  - 请求体: `{ "username": "xxx", "password": "xxx" }`
  - 响应: 返回用户信息和 session
- **Token 管理端点**: `GET http://localhost:3001/api/token`
  - 需要用户登录后通过 session 验证
  - 返回用户所有 API Token 列表

### 2.2 现有 Gemini 页面设置

- 位置: `src/views/chat/layout/sider/GeminiSider.vue`
- "Settings & help" 按钮点击后设置 `showSettingsMenu = true`
- 目前没有实际的设置菜单显示

### 2.3 现有目录结构

```
/user                    # 用户目录 (新建)
```

## 3. 设计方案

### 3.1 架构图

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Gemini 前端    │────▶│   service 后端  │────▶│  NewAPI         │     │  AI 模型        │
│  (1002端口)     │     │  (3002端口)     │     │  (3001端口)     │     │  (外部API)      │
└─────────────────┘     └─────────────────┘     └─────────────────┘     └─────────────────┘
        │                       │                       │                       │
        │                       ▼                       │                       │
        │               ┌─────────────────┐           │                       │
        │               │  JWT Token签发  │           │                       │
        │               │  (登录态管理)   │           │                       │
        │               └─────────────────┘           │                       │
        │                       │                       │                       │
        │                       ▼                       ▼                       │
        │               ┌─────────────────┐     ┌─────────────────┐           │
        │               │  用户状态存储   │     │  获取用户Token  │           │
        │               │  (localStorage)│     │  (session验证)  │           │
        │               │  仅存JWT        │     └─────────────────┘           │
        │               └─────────────────┘           │                       │
        │                       │                       │                       │
        └───────────────────────┴───────────────────────┴───────────────────────┘
                    后续请求携带JWT，后端自动注入API Key
```

### 3.2 认证流程

```
1. 用户登录 (用户名+密码)
   │
   ▼
2. service 后端调用 NewAPI /api/user/login 验证
   │
   ▼
3. NewAPI 返回 session，service 后端生成 JWT Token
   │
   ▼
4. 前端保存 JWT 到 localStorage
   │
   ▼
5. 后续请求携带 JWT
   │
   ▼
6. service 后端验证 JWT，从 NewAPI 获取对应 API Key
   │
   ▼
7. 自动注入 API Key 到请求中，转发到 AI 模型
```

### 3.3 端点设计

**在 service/src/index.ts 添加新端点:**

```
POST /api/newapi/login
请求: { "username": "xxx", "password": "xxx" }
响应: { "success": true, "token": "jwt_token", "user": {...} }

GET /api/newapi/me
请求: Header: Authorization: Bearer <jwt_token>
响应: { "user": {...}, "tokens": [{ "id": 1, "name": "...", "status": "active" }] }

POST /api/newapi/logout
响应: { "success": true }

POST /api/chat/completions (改造)
请求: Header: Authorization: Bearer <jwt_token>
      Body: { "model": "xxx", "messages": [...] }
处理: 自动从 NewAPI 获取用户 API Key 并注入到请求头
```

### 3.4 JWT Token 结构

```go
type JWTPayload struct {
    UserID   int    `json:"user_id"`
    Username string `json:"username"`
    Exp      int64  `json:"exp"`
    Iat      int64  `json:"iat"`
}
```

### 3.5 前端设计

1. **设置菜单改造**:
   - 点击 "Settings & help" 后显示设置菜单
   - 包含: 用户信息、Token 管理、退出登录

2. **登录流程**:
   - 未登录: 显示登录表单（用户名+密码）
   - 已登录: 显示用户信息（用户名、Token列表）、退出登录

3. **Token 自动使用**:
   - 登录成功后，保存 JWT 到 localStorage
   - 后续所有请求自动携带 JWT
   - 后端自动注入 API Key，前端无感知

### 3.6 数据存储

```typescript
interface StoredAuth {
  token: string          // JWT Token (唯一存储)
  user: {
    id: number
    username: string
    email: string
  }
  loginTime: number
}
```

**注意**: 不存储原始 API Key，只存储后端签发的 JWT。

## 4. 实现计划

### Phase 1: 后端 JWT 认证
- [ ] 在 service/src/ 添加 JWT 模块
- [ ] 实现 /api/newapi/login 端点（验证用户名密码，签发 JWT）
- [ ] 实现 /api/newapi/me 端点（获取用户信息和 Token 列表）
- [ ] 实现 /api/newapi/logout 端点
- [ ] 改造 /api/chat/completions，自动注入 API Key

### Phase 2: 前端集成
- [ ] 改造设置菜单，显示登录/用户信息
- [ ] 实现登录表单
- [ ] 实现 Token 列表显示（不显示原始 Key）
- [ ] 实现退出登录

### Phase 3: 测试与优化
- [ ] 登录功能测试
- [ ] Token 自动使用测试
- [ ] 退出登录测试

## 5. 技术关键点

1. **安全**: 前端不接触原始 API Key，只有后端知道
2. **JWT 过期**: 设置合理过期时间，过期后提示重新登录
3. **Token 轮换**: 用户在 NewAPI 中修改 Token 后，后端自动获取最新值
4. **错误处理**: 登录失败、Token 获取失败等情况的处理

## 6. 现有文件参考

- NewAPI 登录: `NewApi/controller/user.go` - Login 函数
- NewAPI Token: `NewApi/controller/token.go` - GetAllTokens, GetTokenKey
- 前端设置: `src/views/chat/layout/sider/GeminiSider.vue`
- 前端入口: `src/views/gemini/index.vue`