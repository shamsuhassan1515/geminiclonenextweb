# NewAPI 登录集成实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 Gemini 页面集成 NewAPI 登录功能，用户登录后自动使用 NewAPI 中设置的 API Token，前端不接触原始密钥

**Architecture:** 后端 JWT 认证方案 - 前端登录携带用户名密码 → service 后端验证 NewAPI → 签发 JWT → 前端存储 JWT → 后续请求携带 JWT → 后端自动注入 API Key

**Tech Stack:** 
- 后端: Node.js/TypeScript (service), JWT (jsonwebtoken)
- 前端: Vue3, localStorage
- 认证: NewAPI session + JWT

---

## 文件结构

### 后端 (service/src/)
- 创建: `service/src/middleware/auth.ts` - JWT 验证中间件
- 创建: `service/src/routes/newapi.ts` - NewAPI 代理路由
- 修改: `service/src/index.ts` - 添加新路由

### 前端 (src/)
- 创建: `src/store/modules/auth.ts` - 认证状态管理
- 修改: `src/views/chat/layout/sider/GeminiSider.vue` - 设置菜单改造
- 创建: `src/components/common/LoginForm.vue` - 登录表单组件
- 创建: `src/components/common/UserPanel.vue` - 用户信息面板

---

## Task 1: 后端 JWT 模块

**Files:**
- Create: `service/src/utils/jwt.ts`
- Modify: `service/src/index.ts`

- [ ] **Step 1: 创建 JWT 工具模块**

```typescript
// service/src/utils/jwt.ts
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'
const JWT_EXPIRY = 7 * 24 * 60 * 60 * 1000 // 7 days

export interface JWTPayload {
  userId: number
  username: string
  email?: string
  iat: number
  exp: number
}

export function signJWT(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}

export function verifyJWT(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload
  } catch {
    return null
  }
}
```

- [ ] **Step 2: 安装 jsonwebtoken**

Run: `cd /Users/aydinkaya/开发/chatgpt-web-midjourney-proxy/service && pnpm add jsonwebtoken && pnpm add -D @types/jsonwebtoken`

- [ ] **Step 3: 修改 index.ts 添加路由**

在 `service/src/index.ts` 顶部添加导入:
```typescript
import newApiRouter from './routes/newapi'
```

在路由注册处添加:
```typescript
app.use('/api/newapi', newApiRouter)
```

- [ ] **Step 4: Commit**

```bash
git add service/src/utils/jwt.ts service/src/index.ts service/package.json
git commit -m "feat: add JWT module for authentication"
```

---

## Task 2: NewAPI 代理路由

**Files:**
- Create: `service/src/routes/newapi.ts`
- Modify: `service/src/utils/jwt.ts`

- [ ] **Step 1: 创建 NewAPI 路由模块**

```typescript
// service/src/routes/newapi.ts
import express from 'express'
import axios from 'axios'
import { signJWT, verifyJWT } from '../utils/jwt'

const router = express.Router()
const NEWAPI_BASE = process.env.NEWAPI_BASE || 'http://localhost:3001'

// 登录
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body
    
    const response = await axios.post(`${NEWAPI_BASE}/api/user/login`, {
      username,
      password
    }, {
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (response.data.success) {
      const user = response.data.data
      const token = signJWT({
        userId: user.id,
        username: user.username,
        email: user.email
      })

      res.json({
        success: true,
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email
        }
      })
    } else {
      res.json(response.data)
    }
  } catch (error: any) {
    res.json({
      success: false,
      message: error.response?.data?.message || '登录失败'
    })
  }
})

// 获取当前用户信息
router.get('/me', async (req, res) => {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    res.json({ success: false, message: '未登录' })
    return
  }

  const token = authHeader.substring(7)
  const payload = verifyJWT(token)
  
  if (!payload) {
    res.json({ success: false, message: 'Token 无效' })
    return
  }

  res.json({
    success: true,
    user: {
      id: payload.userId,
      username: payload.username,
      email: payload.email
    }
  })
})

// 登出
router.post('/logout', (req, res) => {
  res.json({ success: true })
})

export default router
```

- [ ] **Step 2: 测试登录端点**

Run: `curl -X POST http://localhost:3002/api/newapi/login -H "Content-Type: application/json" -d '{"username":"test","password":"test"}'`

Expected: 返回 JSON 含 token 和 user 信息

- [ ] **Step 3: Commit**

```bash
git add service/src/routes/newapi.ts
git commit -m "feat: add NewAPI proxy routes"
```

---

## Task 3: 前端认证状态管理

**Files:**
- Create: `src/store/modules/auth.ts`

- [ ] **Step 1: 创建认证 Store**

```typescript
// src/store/modules/auth.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

interface AuthUser {
  id: number
  username: string
  email?: string
}

interface AuthState {
  token: string | null
  user: AuthUser | null
}

const STORAGE_KEY = 'auth'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(null)
  const user = ref<AuthUser | null>(null)

  const isLoggedIn = computed(() => !!token.value && !!user.value)

  function loadFromStorage() {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        const data = JSON.parse(stored)
        token.value = data.token
        user.value = data.user
      } catch {
        logout()
      }
    }
  }

  function login(newToken: string, newUser: AuthUser) {
    token.value = newToken
    user.value = newUser
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ token: newToken, user: newUser }))
  }

  function logout() {
    token.value = null
    user.value = null
    localStorage.removeItem(STORAGE_KEY)
  }

  // 初始化时加载
  loadFromStorage()

  return {
    token,
    user,
    isLoggedIn,
    login,
    logout,
    loadFromStorage
  }
})
```

- [ ] **Step 2: Commit**

```bash
git add src/store/modules/auth.ts
git commit -m "feat: add auth store for login state"
```

---

## Task 4: 前端登录表单组件

**Files:**
- Create: `src/components/common/LoginForm.vue`

- [ ] **Step 1: 创建登录表单组件**

```vue
<template>
  <div class="login-form p-4">
    <h3 class="text-lg font-medium mb-4">登录 NewAPI 账号</h3>
    <form @submit.prevent="handleLogin">
      <div class="mb-3">
        <label class="block text-sm mb-1">用户名/邮箱</label>
        <input
          v-model="username"
          type="text"
          class="w-full px-3 py-2 border rounded-lg"
          placeholder="请输入用户名或邮箱"
          required
        />
      </div>
      <div class="mb-4">
        <label class="block text-sm mb-1">密码</label>
        <input
          v-model="password"
          type="password"
          class="w-full px-3 py-2 border rounded-lg"
          placeholder="请输入密码"
          required
        />
      </div>
      <div v-if="error" class="mb-3 text-red-500 text-sm">{{ error }}</div>
      <button
        type="submit"
        class="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
        :disabled="loading"
      >
        {{ loading ? '登录中...' : '登录' }}
      </button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '@/store/modules/auth'
import axios from 'axios'

const emit = defineEmits<{
  (e: 'success'): void
}>()

const authStore = useAuthStore()
const username = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

async function handleLogin() {
  loading.value = true
  error.value = ''

  try {
    const response = await axios.post('/api/newapi/login', {
      username: username.value,
      password: password.value
    })

    if (response.data.success) {
      authStore.login(response.data.token, response.data.user)
      emit('success')
    } else {
      error.value = response.data.message || '登录失败'
    }
  } catch (e: any) {
    error.value = e.response?.data?.message || '登录失败，请检查网络'
  } finally {
    loading.value = false
  }
}
</script>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/common/LoginForm.vue
git commit -m "feat: add login form component"
```

---

## Task 5: 前端用户面板组件

**Files:**
- Create: `src/components/common/UserPanel.vue`

- [ ] **Step 1: 创建用户面板组件**

```vue
<template>
  <div class="user-panel p-4">
    <div class="flex items-center gap-3 mb-4">
      <div class="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium">
        {{ user?.username?.charAt(0).toUpperCase() }}
      </div>
      <div>
        <div class="font-medium">{{ user?.username }}</div>
        <div class="text-sm text-gray-500">已登录</div>
      </div>
    </div>
    <button
      @click="handleLogout"
      class="w-full px-4 py-2 border border-red-500 text-red-500 rounded-lg hover:bg-red-50"
    >
      退出登录
    </button>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '@/store/modules/auth'
import axios from 'axios'

const authStore = useAuthStore()
const user = authStore.user

async function handleLogout() {
  try {
    await axios.post('/api/newapi/logout', {}, {
      headers: { Authorization: `Bearer ${authStore.token}` }
    })
  } catch {
    // ignore
  }
  authStore.logout()
}
</script>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/common/UserPanel.vue
git commit -m "feat: add user panel component"
```

---

## Task 6: 改造设置菜单

**Files:**
- Modify: `src/views/chat/layout/sider/GeminiSider.vue:249-261`

- [ ] **Step 1: 添加设置菜单内容**

在 `showSettingsMenu` 点击后显示的内容区域添加:

```vue
<div v-if="showSettingsMenu" class="settings-menu-content">
  <LoginForm v-if="!authStore.isLoggedIn" @success="showSettingsMenu = false" />
  <UserPanel v-else @success="showSettingsMenu = false" />
</div>
```

添加导入:
```typescript
import LoginForm from '@/components/common/LoginForm.vue'
import UserPanel from '@/components/common/UserPanel.vue'
import { useAuthStore } from '@/store/modules/auth'

const authStore = useAuthStore()
```

- [ ] **Step 2: 添加设置菜单样式**

```css
.settings-menu-content {
  padding: 1rem;
  border-top: 1px solid #e5e7eb;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/views/chat/layout/sider/GeminiSider.vue
git commit -m "feat: add settings menu with login/user panel"
```

---

## Task 7: 整体测试

**Files:**
- All created files

- [ ] **Step 1: 重启后端服务**

Run: `cd /Users/aydinkaya/开发/chatgpt-web-midjourney-proxy/service && pnpm start`

- [ ] **Step 2: 测试登录流程**

1. 打开 http://localhost:1002/#/gemini
2. 点击左下角 "Settings & help"
3. 输入 NewAPI 用户名密码登录
4. 确认显示用户信息

- [ ] **Step 3: 测试 Token 自动使用**

1. 登录成功后发送消息
2. 确认请求携带 JWT
3. 确认后端正确注入 API Key

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "feat: complete NewAPI login integration"
```

---

## 执行方式

**Plan complete and saved to `user/2026-04-01-newapi-login-design.md`. Two execution options:**

**1. Subagent-Driven (recommended)** - 调度子任务逐个执行，任务间审查，快速迭代

**2. Inline Execution** - 在当前会话中执行任务，带检查点的批量执行

**Which approach?**