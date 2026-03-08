# FlyEnv 配置指南

## 📋 项目信息

- **项目名称**: Gemini Clone
- **版本**: 0.01
- **类型**: Node.js
- **端口**: 1002
- **工作目录**: `/Users/aydinkaya/开发/chatgpt-web-midjourney-proxy`

## 🚀 在 FlyEnv 中添加项目

### 方法一：自动导入（推荐）

1. 打开 FlyEnv 应用
2. 点击 "导入项目" 或 "添加项目"
3. 选择项目目录: `/Users/aydinkaya/开发/chatgpt-web-midjourney-proxy`
4. FlyEnv 会自动识别配置文件并导入项目

### 方法二：手动添加

1. 打开 FlyEnv 应用
2. 点击 "添加项目" 或 "新建项目"
3. 填写以下信息：

   **基本信息:**
   - 项目名称: `Gemini Clone`
   - 项目类型: `Node.js`
   - 描述: `Gemini Clone Web Application - AI Chat Interface`

   **项目路径:**
   - 工作目录: `/Users/aydinkaya/开发/chatgpt-web-midjourney-proxy`

   **服务器配置:**
   - 端口: `1002`
   - 主机: `0.0.0.0`

   **启动命令:**
   - 启动命令: `npm run dev`
   - 停止命令: `pkill -f vite`
   - 重启命令: `pkill -f vite && npm run dev`

   **环境变量:**
   - `NODE_ENV`: `development`
   - `PORT`: `1002`

4. 点击 "保存" 或 "创建"

## 📁 FlyEnv 配置文件

项目包含以下 FlyEnv 配置文件：

1. **flyenv-project.json** - 主配置文件（JSON 格式）
2. **flyenv.yaml** - YAML 格式配置
3. **.flyenv** - 简化配置文件
4. **flyenv.config.json** - 完整配置文件

FlyEnv 会自动识别这些文件。

## 🔧 配置选项

### 自动启动
- 启用: 项目会在 FlyEnv 启动时自动运行
- 禁用: 需要手动启动项目

### 自动重启
- 启用: 项目崩溃时自动重启
- 禁用: 项目崩溃后需要手动重启

### 日志管理
- 日志文件: `logs/flyenv.log`
- 最大大小: 10MB
- 保留文件数: 5

### 热重载
- 启用: 代码修改后自动重新加载
- 禁用: 需要手动重启项目

## 📊 监控功能

### 健康检查
- 路径: `/`
- 间隔: 30 秒
- 状态: 已启用

### 代理路由
- `/api` → `http://localhost:1002`
- `/mjapi` → `http://localhost:1002`
- `/sunoapi` → `http://localhost:1002`
- `/uploads` → `http://localhost:1002`
- `/openapi` → `http://localhost:1002`
- `/luma` → `http://localhost:1002`
- `/viggle` → `http://localhost:1002`
- `/runwayml` → `http://localhost:1002`

## 🌐 访问地址

- **主页**: http://localhost:1002
- **Gemini 页面**: http://localhost:1002/#/gemini
- **Chat 页面**: http://localhost:1002/#/chat

## 🛠️ 故障排除

### 问题：FlyEnv 无法识别项目

**解决方案:**
1. 确认配置文件存在于项目根目录
2. 检查配置文件格式是否正确
3. 尝试手动添加项目

### 问题：项目无法启动

**解决方案:**
1. 检查端口 1002 是否被占用
2. 查看日志文件 `logs/flyenv.log`
3. 确认 Node.js 和 npm 已正确安装
4. 手动测试启动命令: `npm run dev`

### 问题：端口冲突

**解决方案:**
1. 在 FlyEnv 中修改项目端口配置
2. 或停止占用端口 1002 的其他服务

### 问题：日志文件过大

**解决方案:**
1. 清理日志文件: `> logs/flyenv.log`
2. 调整 FlyEnv 的日志轮转设置

## 📱 FlyEnv 界面操作

### 启动项目
1. 在 FlyEnv 中找到 "Gemini Clone" 项目
2. 点击 "启动" 按钮
3. 等待项目启动完成

### 停止项目
1. 在 FlyEnv 中找到 "Gemini Clone" 项目
2. 点击 "停止" 按钮

### 重启项目
1. 在 FlyEnv 中找到 "Gemini Clone" 项目
2. 点击 "重启" 按钮

### 查看日志
1. 在 FlyEnv 中找到 "Gemini Clone" 项目
2. 点击 "查看日志" 按钮
3. 可以实时查看项目日志

### 查看状态
1. 在 FlyEnv 中找到 "Gemini Clone" 项目
2. 查看项目状态指示器
3. 绿色 = 运行中，红色 = 已停止

## 🔐 安全建议

1. 不要将 `.env` 文件提交到 Git
2. 使用环境变量管理敏感信息
3. 定期更新依赖包
4. 限制 FlyEnv 的访问权限

## 📞 技术支持

- **GitHub 仓库**: https://github.com/shamsuhassan1515/geminiclonenextweb
- **问题反馈**: https://github.com/shamsuhassan1515/geminiclonenextweb/issues

## 📝 配置文件示例

### flyenv-project.json
```json
{
  "flyenv": {
    "name": "Gemini Clone",
    "description": "Gemini Clone Web Application - AI Chat Interface",
    "version": "0.01",
    "type": "nodejs",
    "port": 1002,
    "workingDirectory": "/Users/aydinkaya/开发/chatgpt-web-midjourney-proxy",
    "startCommand": "npm run dev",
    "stopCommand": "pkill -f 'vite'",
    "restartCommand": "pkill -f 'vite' && npm run dev",
    "buildCommand": "npm run build",
    "env": {
      "NODE_ENV": "development",
      "PORT": "1002"
    },
    "autoStart": true,
    "restartOnCrash": true,
    "log": {
      "file": "/Users/aydinkaya/开发/chatgpt-web-midjourney-proxy/logs/flyenv.log",
      "maxSize": "10m",
      "maxFiles": 5
    },
    "features": {
      "hotReload": true,
      "logRotation": true
    },
    "monitoring": {
      "healthCheck": {
        "enabled": true,
        "path": "/",
        "interval": 30
      }
    }
  }
}
```

---

**配置完成！现在你可以在 FlyEnv 中管理 Gemini Clone 项目了。** 🎉