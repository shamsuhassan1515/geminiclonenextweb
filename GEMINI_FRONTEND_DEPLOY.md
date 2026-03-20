# Gemini Frontend Deployment Guide (Gemini 前端部署手册)

如果您对 `src/` 目录下的代码进行了修改，由于服务器（Nginx）正在提供 `dist/` 目录下的编译后静态文件，您需要执行以下步骤使更改生效。

## 🚀 部署步骤

### 1. 编译前端代码 (Build)
在您的 **Mac 宿主机**终端中，进入项目根目录：
`/Users/aydinkaya/开发/chatgpt-web-midjourney-proxy`

运行编译命令：
```bash
pnpm build-only
```
该命令会重新生成 `dist/` 文件夹。由于该文件夹已映射到 Lima 虚拟机，Nginx 会自动识别更新。

### 2. 刷新浏览器
由于浏览器会强烈缓存 JS 脚本，请在浏览器中：
- 按下 `Cmd + Shift + R` 强制刷新。
- 如果仍未生效，请在“开发者调试模式 (F12)”下，长按刷新图标选择“清空缓存并硬性重新加载”。

---

## 🛠️ 常见问题

### 为什么修改了代码但网页没变化？
- **原因**：Nginx 访问的是 `dist/` 目录下的旧文件。
- **解决**：必须执行 `pnpm build-only`。

### Nginx 配置信息 (仅供参考)
- **端口**: `1002`
- **根目录**: `/Users/aydinkaya/开发/chatgpt-web-midjourney-proxy/dist`
- **配置文件**: `/www/server/panel/vhost/nginx/127.0.0.1_80.conf` (在虚拟机内)
