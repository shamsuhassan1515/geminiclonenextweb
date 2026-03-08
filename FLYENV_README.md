# FlyEnv 部署指南

## 项目信息
- **项目名称**: Gemini Clone
- **版本**: 0.01
- **作者**: shamsuhassan1515
- **仓库**: https://github.com/shamsuhassan1515/geminiclonenextweb

## 在 FlyEnv 中部署

### 1. 导入项目到 FlyEnv

1. 打开 FlyEnv 应用
2. 点击 "导入项目" 或 "添加新项目"
3. 选择项目类型: Node.js
4. 项目路径: `/Users/aydinkaya/开发/chatgpt-web-midjourney-proxy`
5. 项目名称: `Gemini Clone`

### 2. 配置项目

FlyEnv 会自动识别以下配置文件:
- `flyenv.config.json` - 主配置文件
- `start.sh` - 启动脚本
- `.flyenv.json` - FlyEnv 专用配置

### 3. 启动项目

在 FlyEnv 界面中:
1. 找到 "Gemini Clone" 项目
2. 点击 "启动" 按钮
3. 等待服务启动完成

### 4. 访问应用

服务启动后，可以通过以下地址访问:
- 本地访问: http://localhost:1002
- Gemini 页面: http://localhost:1002/#/gemini

## FlyEnv 功能特性

### 自动重启
- 项目崩溃时自动重启
- 代码修改后自动重新加载（热重载）

### 日志管理
- 日志文件位置: `logs/flyenv.log`
- 日志轮转: 最大 10MB，保留 5 个文件
- 在 FlyEnv 界面中可以实时查看日志

### 健康检查
- 每 30 秒检查一次服务状态
- 自动检测服务是否正常运行

### 代理配置
项目已配置以下代理路由:
- `/api` - API 接口
- `/mjapi` - Midjourney API
- `/sunoapi` - Suno API
- `/uploads` - 文件上传
- `/openapi` - OpenAI API
- `/luma` - Luma API
- `/viggle` - Viggle API
- `/runwayml` - Runway ML API

## 手动操作

### 手动启动
```bash
cd /Users/aydinkaya/开发/chatgpt-web-midjourney-proxy
./start.sh
```

### 手动停止
在 FlyEnv 界面中点击 "停止" 按钮

### 查看日志
在 FlyEnv 界面中点击 "查看日志" 或访问:
```bash
tail -f logs/flyenv.log
```

## 环境要求

- Node.js >= 18.0.0
- npm (随 Node.js 安装)
- macOS 系统

## 故障排除

### 端口被占用
如果端口 1002 被占用，可以修改 `flyenv.config.json` 中的端口配置。

### 依赖安装失败
在 FlyEnv 界面中点击 "重新安装依赖" 或手动运行:
```bash
cd /Users/aydinkaya/开发/chatgpt-web-midjourney-proxy
npm install
```

### 服务无法启动
1. 检查日志文件 `logs/flyenv.log`
2. 确认 Node.js 和 npm 已正确安装
3. 确认端口 1002 未被其他程序占用

## 技术支持

如有问题，请访问项目仓库:
https://github.com/shamsuhassan1515/geminiclonenextweb/issues