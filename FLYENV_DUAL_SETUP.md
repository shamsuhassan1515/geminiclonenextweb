# FlyEnv 前后端双服务配置指南

## 📋 概述

现在你可以在 FlyEnv 中同时管理前端和后端服务：

- **前端服务**: Gemini Clone (端口 1002)
- **后端服务**: Gemini Clone Backend (端口 3002)

## 🚀 在 FlyEnv 中添加两个服务

### 第一步：添加后端服务

1. 打开 FlyEnv 应用
2. 点击 "添加" 按钮
3. 选择项目类型: **Node项目**
4. 填写以下信息：

   ```
   项目名称: Gemini Clone Backend
   备注: 后端 API 服务
   启动文件: /Users/aydinkaya/开发/chatgpt-web-midjourney-proxy/service/package.json
   运行目录: /Users/aydinkaya/开发/chatgpt-web-midjourney-proxy/service
   NodeJS版本: node25.7.0
   TCP端口: 3002
   scripts: dev
   ```

5. 点击 "保存"

### 第二步：添加前端服务

1. 点击 "添加" 按钮
2. 选择项目类型: **Node项目**
3. 填写以下信息：

   ```
   项目名称: Gemini Clone
   备注: 前端 Web 应用
   启动文件: /Users/aydinkaya/开发/chatgpt-web-midjourney-proxy/package.json
   运行目录: /Users/aydinkaya/开发/chatgpt-web-midjourney-proxy
   NodeJS版本: node25.7.0
   TCP端口: 1002
   scripts: dev
   ```

4. 点击 "保存"

## 📊 服务架构

```
┌─────────────────────────────────────────────────────────────┐
│                      FlyEnv 管理面板                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────────┐    ┌──────────────────────┐      │
│  │ Gemini Clone         │    │ Gemini Clone Backend │      │
│  │ (前端)               │    │ (后端)               │      │
│  │ 端口: 1002           │    │ 端口: 3002           │      │
│  │                      │    │                      │      │
│  │ http://localhost:1002│    │ http://localhost:3002│      │
│  └──────────┬───────────┘    └──────────┬───────────┘      │
│             │                           │                   │
│             │  1. 用户访问前端页面        │                   │
│             │  2. 前端请求 API           │                   │
│             │  3. 代理到后端服务          │                   │
│             │                           │                   │
│             └───────────┬───────────────┘                   │
│                         │                                   │
│              ┌──────────▼───────────┐                       │
│              │   完整的 Gemini      │                       │
│              │   Clone 应用         │                       │
│              └──────────────────────┘                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 🌐 访问地址

### 前端
- **主页**: http://localhost:1002
- **Gemini 页面**: http://localhost:1002/#/gemini

### 后端
- **API 地址**: http://localhost:3002
- **配置接口**: http://localhost:3002/api/config

## 🔧 启动顺序

**重要**: 必须先启动后端服务，再启动前端服务

1. 在 FlyEnv 中启动 **Gemini Clone Backend** (端口 3002)
2. 等待后端服务完全启动
3. 在 FlyEnv 中启动 **Gemini Clone** (端口 1002)

## 📁 配置文件位置

### 前端配置
- 主目录: `/Users/aydinkaya/开发/chatgpt-web-midjourney-proxy`
- FlyEnv 配置: `flyenv.yaml`
- 环境变量: `.env`
- Vite 配置: `vite.config.ts`

### 后端配置
- 主目录: `/Users/aydinkaya/开发/chatgpt-web-midjourney-proxy/service`
- FlyEnv 配置: `flyenv.yaml`
- 环境变量: `.env` (需要创建)

## 🛠️ 故障排除

### 问题：前端无法连接后端

**检查清单:**
1. 后端服务是否已启动？
2. 后端端口 3002 是否被占用？
3. 前端 `.env` 文件中的 `VITE_APP_API_BASE_URL` 是否正确？

**解决方案:**
```bash
# 检查后端服务状态
lsof -i :3002

# 检查前端代理配置
cat /Users/aydinkaya/开发/chatgpt-web-midjourney-proxy/.env
```

### 问题：端口冲突

**后端端口 3002 被占用:**
```bash
# 查找占用进程
lsof -i :3002

# 停止占用进程
kill -9 <PID>
```

**前端端口 1002 被占用:**
```bash
# 查找占用进程
lsof -i :1002

# 停止占用进程
kill -9 <PID>
```

### 问题：后端依赖未安装

```bash
cd /Users/aydinkaya/开发/chatgpt-web-midjourney-proxy/service
pnpm install
```

## 📝 环境变量配置

### 后端环境变量 (service/.env)

创建 `/Users/aydinkaya/开发/chatgpt-web-midjourney-proxy/service/.env` 文件:

```env
# OpenAI API Key
OPENAI_API_KEY=your-api-key-here

# API 模型
OPENAI_API_MODEL=gpt-3.5-turbo

# 超时时间
TIMEOUT_MS=60000

# 端口
PORT=3002
```

### 前端环境变量 (.env)

已配置好，无需修改：

```env
VITE_GLOB_API_URL=/api
VITE_APP_API_BASE_URL=http://127.0.0.1:3002
```

## 🔄 重启服务

### 重启后端
1. 在 FlyEnv 中找到 "Gemini Clone Backend"
2. 点击 "重启" 按钮

### 重启前端
1. 在 FlyEnv 中找到 "Gemini Clone"
2. 点击 "重启" 按钮

### 同时重启
1. 先重启后端服务
2. 等待 5 秒
3. 再重启前端服务

## 📊 监控和日志

### 查看后端日志
- FlyEnv 界面中点击 "Gemini Clone Backend" 的日志按钮
- 或查看文件: `/Users/aydinkaya/开发/chatgpt-web-midjourney-proxy/service/logs/flyenv.log`

### 查看前端日志
- FlyEnv 界面中点击 "Gemini Clone" 的日志按钮
- 或查看文件: `/Users/aydinkaya/开发/chatgpt-web-midjourney-proxy/logs/flyenv.log`

## 🎯 快速检查清单

在 FlyEnv 中添加服务前，请确认：

- [ ] 后端目录有 `package.json` 文件
- [ ] 后端目录有 `flyenv.yaml` 文件
- [ ] 前端目录有 `package.json` 文件
- [ ] 前端目录有 `flyenv.yaml` 文件
- [ ] 端口 3002 未被占用
- [ ] 端口 1002 未被占用

## 📞 技术支持

- **GitHub 仓库**: https://github.com/shamsuhassan1515/geminiclonenextweb
- **问题反馈**: https://github.com/shamsuhassan1515/geminiclonenextweb/issues

---

**现在你可以在 FlyEnv 中同时管理前后端服务了！** 🚀
