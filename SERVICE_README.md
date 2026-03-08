# Gemini Clone 服务管理指南

## 📋 概述

本项目已配置为 macOS 系统服务，可以稳定运行并通过命令行或图形界面进行管理。

## 🚀 快速开始

### 方法一：使用桌面管理器（推荐）

1. 双击 `GeminiCloneManager.command` 文件
2. 选择你需要的操作：
   - 启动服务
   - 停止服务
   - 重启服务
   - 查看状态
   - 查看日志
   - 查看错误日志
   - 卸载服务

### 方法二：使用命令行

```bash
cd /Users/a1-6/开发/chatgpt-web-midjourney-proxy

# 查看服务状态
./manage-service.sh status

# 启动服务
./manage-service.sh start

# 停止服务
./manage-service.sh stop

# 重启服务
./manage-service.sh restart

# 查看实时日志
./manage-service.sh logs

# 查看错误日志
./manage-service.sh errors

# 卸载服务
./manage-service.sh uninstall
```

## 📁 文件说明

### 配置文件

- `com.geminiclonenextweb.server.plist` - macOS LaunchAgent 服务配置
- `flyenv.config.json` - FlyEnv 配置文件（如果使用 FlyEnv）
- `.flyenv.json` - FlyEnv 专用配置
- `start.sh` - 服务启动脚本

### 管理脚本

- `manage-service.sh` - 服务管理脚本（命令行）
- `GeminiCloneManager.command` - 桌面管理器（图形界面）
- `setup-flyenv.sh` - FlyEnv 配置向导

### 文档

- `FLYENV_README.md` - FlyEnv 部署指南
- `SERVICE_README.md` - 本文件

## 🔧 服务特性

### 自动启动
- 服务会在系统启动时自动运行
- 如果服务崩溃，会自动重启

### 日志管理
- 标准日志: `logs/gemini-clone.log`
- 错误日志: `logs/gemini-clone-error.log`
- FlyEnv 日志: `logs/flyenv.log`

### 健康检查
- 服务会持续监控运行状态
- 如果检测到异常，会自动重启

## 🌐 访问地址

服务启动后，可以通过以下地址访问：

- **主页**: http://localhost:1002
- **Gemini 页面**: http://localhost:1002/#/gemini
- **Chat 页面**: http://localhost:1002/#/chat

## 📊 监控和管理

### 查看服务状态
```bash
./manage-service.sh status
```

### 查看实时日志
```bash
./manage-service.sh logs
```

### 查看错误日志
```bash
./manage-service.sh errors
```

### 使用系统监控工具
```bash
# 查看所有 LaunchAgent 服务
launchctl list | grep gemini

# 查看服务详细信息
launchctl print user/$(id -u)/com.geminiclonenextweb.server
```

## 🛠️ 故障排除

### 服务无法启动

1. 检查端口是否被占用：
```bash
lsof -i :1002
```

2. 查看错误日志：
```bash
./manage-service.sh errors
```

3. 手动启动测试：
```bash
./start.sh
```

### 端口冲突

如果端口 1002 被占用，可以修改 `com.geminiclonenextweb.server.plist` 中的端口配置。

### 依赖问题

如果依赖安装失败，手动重新安装：
```bash
cd /Users/a1-6/开发/chatgpt-web-midjourney-proxy
npm install
```

### 服务无法停止

强制停止服务：
```bash
launchctl stop com.geminiclonenextweb.server
pkill -f "vite"
```

## 🔄 更新和维护

### 更新代码后重启服务

```bash
./manage-service.sh restart
```

### 重新安装服务

```bash
./manage-service.sh uninstall
./manage-service.sh install
```

## 📱 使用 FlyEnv（可选）

如果你安装了 FlyEnv 服务器管理软件，可以使用以下配置：

1. 导入项目到 FlyEnv
2. 项目类型: Node.js
3. 项目路径: `/Users/a1-6/开发/chatgpt-web-midjourney-proxy`
4. 项目名称: `Gemini Clone`

详细说明请参考 `FLYENV_README.md`

## 💡 高级配置

### 修改端口

编辑 `com.geminiclonenextweb.server.plist`，修改以下内容：
```xml
<key>EnvironmentVariables</key>
<dict>
    <key>PORT</key>
    <string>1002</string>  <!-- 修改为你想要的端口 -->
</dict>
```

### 修改环境变量

在 `com.geminiclonenextweb.server.plist` 中添加或修改环境变量：
```xml
<key>EnvironmentVariables</key>
<dict>
    <key>NODE_ENV</key>
    <string>development</string>
    <key>PORT</key>
    <string>1002</string>
    <key>VITE_APP_API_BASE_URL</key>
    <string>your-api-url</string>
</dict>
```

## 📞 技术支持

如有问题，请访问：
- GitHub 仓库: https://github.com/shamsuhassan1515/geminiclonenextweb
- 提交 Issue: https://github.com/shamsuhassan1515/geminiclonenextweb/issues

## 📝 更新日志

### v0.01 (2026-03-08)
- ✅ 配置 macOS 系统服务
- ✅ 创建服务管理脚本
- ✅ 添加桌面管理器
- ✅ 配置自动启动和重启
- ✅ 添加日志管理功能
- ✅ 配置 FlyEnv 支持

---

**注意**: 本服务已在你的 Mac 上成功安装并运行！🎉