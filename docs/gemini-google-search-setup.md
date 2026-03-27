# Gemini Google Search 功能接入教程

本文档详细介绍如何在 NewAPI 中配置和使用 Gemini 的 Google Search 功能，以实现实时网络搜索能力。

## 目录

- [功能说明](#功能说明)
- [前置要求](#前置要求)
- [配置步骤](#配置步骤)
- [常见问题与解决方案](#常见问题与解决方案)
- [易错点总结](#易错点总结)
- [测试验证](#测试验证)

---

## 功能说明

Google Search 是 Gemini API 提供的内置工具（Built-in Tool），可以让 Gemini 模型访问实时网络信息，从而：

- ✅ 获取最新新闻和事件
- ✅ 查询实时天气信息
- ✅ 搜索最新的技术文档
- ✅ 验证事实信息
- ✅ 减少模型幻觉

**重要限制**：
- Google Search 仅在 **Gemini 原生 API** 中可用
- 通过 OpenAI 兼容接口转发的请求 **不支持** Google Search
- 需要正确的渠道类型配置

---

## 前置要求

### 1. Gemini API Key

获取 Gemini API Key 的步骤：

1. 访问 [Google AI Studio](https://aistudio.google.com/app/apikey)
2. 登录 Google 账号
3. 点击 "Create API Key"
4. 选择项目或创建新项目
5. 复制生成的 API Key（格式类似：`AIzaSy...`）

### 2. NewAPI 版本

确保使用支持 Gemini 渠道类型的 NewAPI 版本。

### 3. 支持的模型

以下 Gemini 模型支持 Google Search 功能：

- `gemini-3-flash-preview`
- `gemini-3-pro-preview`
- `gemini-2.5-pro`
- `gemini-2.5-flash`
- `gemini-2.0-flash`

---

## 配置步骤

### 步骤 1：创建 Gemini 类型渠道

**⚠️ 关键：渠道类型必须选择 "Google Gemini"（类型 24）**

#### 方法 A：通过管理后台创建

1. 登录 NewAPI 管理后台（通常是 `http://localhost:3000`）
2. 进入 **渠道管理** → **添加渠道**
3. 填写以下信息：
   - **类型**：选择 `Google Gemini`（类型 24）⚠️
   - **名称**：例如 "Gemini API"
   - **API Key**：填入你的 Gemini API Key
   - **模型**：填入 `gemini-3-flash-preview`
4. 点击 **保存**

#### 方法 B：通过数据库直接创建

```sql
INSERT INTO channels (type, name, key, base_url, models, status) 
VALUES (
  24,  -- 必须是 24（Gemini 类型）
  'Gemini API',
  '你的 Gemini API Key',
  'https://generativelanguage.googleapis.com',
  'gemini-3-flash-preview,gemini-3-pro-preview',
  1
);
```

### 步骤 2：验证渠道配置

```sql
-- 检查渠道类型是否正确
SELECT id, type, name, base_url FROM channels WHERE name = 'Gemini API';

-- 正确的输出应该是：
-- id | type | name       | base_url
-- ---|------|------------|------------------------------------------
-- 3  | 24   | Gemini API | https://generativelanguage.googleapis.com
```

**⚠️ 错误示例**：
```sql
-- 错误：类型是 1（OpenAI），不支持 Google Search
-- id | type | name       | base_url
-- ---|------|------------|--------------------------
-- 2  | 1    | 老张 api   | https://api.laozhang.ai
```

### 步骤 3：创建测试令牌

1. 进入 **令牌管理** → **添加令牌**
2. 填写：
   - **名称**：例如 "test"
   - **额度**：`100000000`（足够测试使用）
3. 复制生成的令牌（格式：`sk-...`）

### 步骤 4：前端配置

在前端应用中，确保请求包含 `tools` 参数：

```javascript
const requestBody = {
  model: 'gemini-3-flash-preview',
  messages: [
    {
      role: 'user',
      content: '今天重庆天气怎么样？请搜索最新信息'
    }
  ],
  temperature: 0.7,
  top_p: 0.95,
  max_tokens: 8192,
  tools: [
    {
      type: 'function',
      function: {
        name: 'googleSearch'  // ⚠️ 注意：名称必须是 googleSearch
      }
    }
  ]
};
```

---

## 常见问题与解决方案

### 问题 1：API 返回 `tool_calls` 而不是 `content`

**现象**：
```json
{
  "choices": [{
    "message": {
      "role": "assistant",
      "tool_calls": [{
        "function": {
          "name": "googleSearch"
        }
      }]
    },
    "finish_reason": "tool_calls"
  }]
}
```

**原因**：
- 渠道类型不是 Gemini（类型 24）
- 渠道是通过 OpenAI 兼容接口转发的

**解决方案**：
1. 检查渠道类型：`SELECT type FROM channels WHERE id = ?;`
2. 确保类型是 `24`（Gemini）
3. 如果不是，删除旧渠道并创建新的 Gemini 类型渠道

### 问题 2：数据库损坏错误

**现象**：
```
database disk image is malformed (11)
```

**解决方案**：
```bash
# 1. 停止 NewAPI
killall -9 new-api-linux

# 2. 修复数据库
sqlite3 /path/to/one-api.db ".recover" > /tmp/recovered.sql
sqlite3 /path/to/one-api-fixed.db < /tmp/recovered.sql

# 3. 替换数据库
cp /path/to/one-api-fixed.db /path/to/one-api.db

# 4. 重启 NewAPI
cd /path/to/NewApi
./new-api-linux --port 3000
```

### 问题 3：端口冲突

**现象**：
```
bind: address already in use
```

**解决方案**：
```bash
# 1. 查找占用端口的进程
lsof -i :3000 | grep LISTEN

# 2. 停止占用进程
kill -9 <PID>

# 3. 或者使用其他端口启动 NewAPI
./new-api-linux --port 3001
```

### 问题 4：CORS 错误

**现象**：
```
Access to fetch at 'http://localhost:3000/v1/chat/completions' 
from origin 'http://localhost:1002' has been blocked by CORS policy
```

**原因**：
- NewAPI 没有运行
- 端口被其他应用占用

**解决方案**：
1. 检查 NewAPI 是否运行：`curl http://localhost:3000/api/status`
2. 检查端口占用：`lsof -i :3000`
3. 重启 NewAPI

### 问题 5：模型返回过时的日期

**现象**：
```
今天是 2024 年 10 月 24 日...
```

**原因**：
- Gemini 模型的训练数据截止到 2024 年
- 模型不知道当前日期

**解决方案**：
在问题中明确指定日期：
```
"今天是 2026 年 3 月 24 日，请搜索今天的新闻"
```

---

## 易错点总结

### ❌ 错误 1：渠道类型选择错误

**错误做法**：
- 类型选择 "OpenAI"（类型 1）
- Base URL 填写第三方 API 地址

**正确做法**：
- 类型必须选择 "Google Gemini"（类型 24）
- Base URL 填写 `https://generativelanguage.googleapis.com`

### ❌ 错误 2：工具名称拼写错误

**错误做法**：
```json
{
  "tools": [{
    "function": {
      "name": "google_search"  // ❌ 错误
    }
  }]
}
```

**正确做法**：
```json
{
  "tools": [{
    "function": {
      "name": "googleSearch"  // ✅ 正确
    }
  }]
}
```

### ❌ 错误 3：使用错误的后端代码

**错误代码**：
```go
// ❌ 使用 GoogleSearchRetrieval
geminiTools = append(geminiTools, dto.GeminiChatTool{
    GoogleSearchRetrieval: struct{}{},
})
```

**正确代码**：
```go
// ✅ 使用 GoogleSearch
geminiTools = append(geminiTools, dto.GeminiChatTool{
    GoogleSearch: struct{}{},
})
```

### ❌ 错误 4：数据库文件混淆

**错误做法**：
- 修改了错误的数据库文件
- NewAPI 使用的数据库和备份数据库混淆

**正确做法**：
1. 确认 NewAPI 使用的数据库路径
2. 修改后重启 NewAPI
3. 验证修改是否生效

### ❌ 错误 5：忽略日志信息

**错误做法**：
- 不查看日志直接猜测问题

**正确做法**：
```bash
# 启用调试模式
DEBUG=true ./new-api-linux --port 3000

# 查看日志
tail -100 /path/to/logs/new-api-linux-restart.log

# 查找关键信息
grep -E "GeminiRequest|google_search|geminiTools" /path/to/logs/*.log
```

---

## 测试验证

### 测试 1：使用 curl 测试

```bash
curl -X POST http://localhost:3000/v1/chat/completions \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer sk-YOUR_TOKEN' \
  -d '{
    "model": "gemini-3-flash-preview",
    "messages": [
      {"role": "user", "content": "今天重庆天气怎么样？请搜索最新信息"}
    ],
    "temperature": 0.7,
    "tools": [
      {
        "type": "function",
        "function": {
          "name": "googleSearch"
        }
      }
    ]
  }' | jq .
```

**✅ 成功响应**：
```json
{
  "choices": [{
    "message": {
      "role": "assistant",
      "content": "根据最新的气象信息..."  // ✅ 直接返回内容
    },
    "finish_reason": "stop"
  }]
}
```

**❌ 失败响应**：
```json
{
  "choices": [{
    "message": {
      "role": "assistant",
      "tool_calls": [{  // ❌ 返回 tool_calls
        "function": {
          "name": "googleSearch"
        }
      }]
    },
    "finish_reason": "tool_calls"
  }]
}
```

### 测试 2：通过前端测试

1. 访问前端页面：
   ```
   http://localhost:1002/#/gemini?key=sk-YOUR_TOKEN&url=http%3A%2F%2Flocalhost%3A3000
   ```

2. 输入测试问题：
   - "今天重庆天气怎么样？请搜索最新信息"
   - "现在美股盘前为什么大涨"
   - "2026 年 3 月 24 日的最新新闻"

3. 检查响应：
   - ✅ 直接返回搜索结果
   - ❌ 返回 tool_calls 或错误信息

### 测试 3：检查渠道测试

在 NewAPI 管理后台：
1. 进入 **渠道管理**
2. 点击 Gemini 渠道的 **测试** 按钮
3. 输入模型名称 `gemini-3-flash-preview`
4. 查看测试结果

---

## 完整配置示例

### 数据库配置

```sql
-- 创建 Gemini 渠道
INSERT INTO channels (
  type, name, key, base_url, models, status, 
  created_time, updated_time
) VALUES (
  24,
  'Gemini API',
  'AIzaSyYourGeminiApiKey',
  'https://generativelanguage.googleapis.com',
  'gemini-3-flash-preview,gemini-3-pro-preview',
  1,
  strftime('%s', 'now'),
  strftime('%s', 'now')
);

-- 验证配置
SELECT id, type, name, base_url, models 
FROM channels 
WHERE type = 24;
```

### 前端代码示例

```javascript
async function chatWithGoogleSearch(message) {
  const response = await fetch('http://localhost:3000/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer sk-YOUR_TOKEN'
    },
    body: JSON.stringify({
      model: 'gemini-3-flash-preview',
      messages: [{
        role: 'user',
        content: message
      }],
      temperature: 0.7,
      top_p: 0.95,
      max_tokens: 8192,
      tools: [{
        type: 'function',
        function: {
          name: 'googleSearch'
        }
      }]
    })
  });

  const data = await response.json();
  console.log('Response:', data);
  
  // 检查是否成功调用 Google Search
  if (data.choices[0].message.content) {
    console.log('✅ Google Search 成功:', data.choices[0].message.content);
  } else if (data.choices[0].message.tool_calls) {
    console.log('❌ Google Search 未执行:', data.choices[0].message.tool_calls);
  }
}

// 测试
chatWithGoogleSearch('今天重庆天气怎么样？');
```

---

## 性能优化建议

### 1. 启用调试模式（仅开发环境）

```bash
DEBUG=true ./new-api-linux --port 3000
```

### 2. 监控日志

```bash
# 实时查看日志
tail -f /path/to/logs/new-api-linux-restart.log | grep -E "google_search|GeminiRequest"
```

### 3. 数据库备份

```bash
# 定期备份数据库
cp /path/to/one-api.db /path/to/one-api.db.bak.$(date +%Y%m%d)
```

---

## 参考资料

- [Gemini API 官方文档](https://ai.google.dev/gemini-api/docs/grounding)
- [Google AI Studio](https://aistudio.google.com/app/apikey)
- [NewAPI 文档](https://github.com/QuantumNous/new-api)

---

## 更新日志

- **2026-03-24**: 初始版本，记录完整的配置过程和常见问题
