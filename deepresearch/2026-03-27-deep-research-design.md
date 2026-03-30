# Deep Research 功能设计文档

## 1. 概述

在 Gemini 页面 (http://localhost:1002/#/gemini) 实现类似 Onyx (http://localhost:3029/app) 的 Deep Research 功能。当用户勾选 Tools 中的 "Deep research" 时，开启多轮搜索、多 Agent、多轮思考的深度研究功能。

## 2. 现有架构分析

### 2.1 现有代码结构

- **前端 Gemini 页面**: `src/views/gemini/index.vue` - 已包含 deep research 开关基础 UI
- **Deep Research Store**: `src/store/modules/deepResearch.ts` - 状态管理
- **搜索设置**: `web search/` - 包含搜索提供商配置 (localStorage)
- **后端 relay**: `NewApi/relay/` - Go 实现的各种 AI API 中转

### 2.2 现有搜索提供商

支持以下搜索类型: `google_pse`, `serper`, `exa`, `searxng`, `brave`, `duckduckgo`, `tavily`

### 2.3 已有 Deep Research 代码参考

- `deepresearch/dr_loop.py` - Onyx 的 Python 实现 (770行)
- `deepresearch/prompts.py` - Tool prompts
- `deepresearch/utils.py` - 工具函数

## 3. 推荐架构 (原后端 TypeScript 实现)

### 3.1 架构图

```
┌─────────────────┐     ┌─────────────────────┐     ┌─────────────────┐
│  Gemini 前端    │────▶│  service 后端       │────▶│  Gemini API     │
│  (启用DeepR)    │     │  (DeepR循环:3002)   │     │  (LLM)          │
└─────────────────┘     └─────────────────────┘     └─────────────────┘
        │                       │                       │
        │                       ▼                       ▼
        │               ┌─────────────────┐     ┌─────────────────┐
        │               │  激活的搜索     │◀────│  搜索提供商API  │
        │               │  提供商服务     │     │  (Google/Serper)│
        │               └─────────────────┘     └─────────────────┘
        │
        ▼
┌─────────────────┐
│  实时显示搜索   │
│  和思考过程     │
└─────────────────┘
```

### 3.2 端点设计

**在 `service/src/index.ts` 添加新端点:**

```
POST /chat-deep-research
Content-Type: application/octet-stream
Authorization: Bearer {auth_token}

{
  "message": "研究量子计算的最近进展",
  "model": "gemini-2.5-pro-preview-06-17",
  "search_provider": "serper",
  "gemini_api_key": "xxx",
  "gemini_api_url": "xxx"
}
```

响应 (SSE 流式):
```
{ "type": "search", "query": "...", "results": [...] }
{ "type": "think", "content": "..." }
{ "type": "plan_start", "plan": "..." }
{ "type": "plan_delta", "content": "..." }
{ "type": "report_start" }
{ "type": "report_delta", "content": "..." }
{ "type": "done" }
```

### 3.3 服务端 Deep Research 循环

参考 `deepresearch/dr_loop.py` 实现 TypeScript 版本:

```
1. 用户问题 → 研究计划生成 (Research Plan)
2. 循环 (最多8轮):
   a. 研究 Agent 执行搜索
   b. Think Tool 进行深度思考分析
   c. 根据结果决定下一步
3. 生成最终报告 (Final Report)
```

### 3.4 流式响应事件

```typescript
// 搜索事件
{ "type": "search", "query": "...", "results": [...] }

// 思考事件  
{ "type": "think", "content": "..." }

// 计划更新事件
{ "type": "plan_start", "plan": "..." }
{ "type": "plan_delta", "content": "..." }

// 报告事件
{ "type": "report_start" }
{ "type": "report_delta", "content": "..." }
```

## 4. 前端设计

### 4.1 UI 组件

1. **工具栏 Deep Research 开关**: 已有基础 (`src/views/gemini/index.vue:1243`)
2. **搜索过程面板**: 显示搜索查询、搜索结果
3. **思考过程面板**: 显示 Think Tool 的推理过程
4. **研究计划显示**: 显示 DeepResearchPlanRenderer (已有)

### 4.2 Message 渲染组件扩展

在 `src/views/chat/components/Message/Text.vue` 添加对 deep research 事件类型渲染支持:

- `search_event` - 显示搜索结果卡片
- `think_event` - 显示思考过程 (可折叠)
- `plan_event` - 显示研究计划
- `report_event` - 显示最终报告

## 5. 搜索 API 调用

### 5.1 前端搜索设置

- 位置: `web search/WebSearchSettings.vue`
- 存储: `localStorage`
- 提供商: Google PSE, Serper, Exa, SearXNG, Brave, DuckDuckGo, Tavily

### 5.2 后端搜索服务

在 Go 后端实现统一搜索接口:

```go
type SearchResult struct {
    Title   string `json:"title"`
    URL     string `json:"url"`
    Snippet string `json:"snippet"`
}

type SearchProvider interface {
    Search(query string) ([]SearchResult, error)
}
```

各提供商实现:
- `GooglePSESearch` - Google Programmable Search Engine
- `SerperSearch` - Serper.dev
- `ExaSearch` - Exa.ai
- `TavilySearch` - Tavily
- `BraveSearch` - Brave Search API

## 6. 实现计划

### Phase 1: 后端 Deep Research API (service/)
- [ ] 在 `service/src/` 创建 `deepresearch/` 目录
- [ ] 创建搜索服务接口 (`service/src/deepresearch/search.ts`)
- [ ] 实现各搜索提供商 (GooglePSE, Serper, Exa, Tavily, Brave)
- [ ] 实现 Deep Research 循环逻辑 (`service/src/deepresearch/dr_loop.ts`)
- [ ] 在 `service/src/index.ts` 添加 `/chat-deep-research` 端点
- [ ] 流式响应支持 (SSE)

### Phase 2: 前端集成 (Gemini 页面)
- [ ] 扩展 Message 组件支持 deep research 事件渲染
- [ ] 修改 `src/views/gemini/index.vue` 调用新端点
- [ ] 显示搜索过程面板
- [ ] 显示思考过程面板
- [ ] 完善研究计划显示

### Phase 3: 测试与优化
- [ ] 单元测试
- [ ] 集成测试
- [ ] 性能优化

## 7. 技术关键点

1. **流式响应 (Server-Sent Events)**: 参考 `service/src/index.ts` 的 `/chat-process` 实现
2. **搜索会话管理**: 同一研究话题使用同一个搜索会话
3. **思考预算控制**: 参考 Gemini 的 ThinkingConfig
4. **超时处理**: 30分钟超时强制生成最终报告 (参考 Onyx)
5. **多轮循环**: 最多8轮研究循环

## 8. 现有文件参考

- 前端入口: `src/views/gemini/index.vue`
- 前端 Store: `src/store/modules/deepResearch.ts`
- **原后端入口: `service/src/index.ts`**
- **原后端 chatgpt: `service/src/chatgpt/`**
- 搜索设置: `web search/WebSearchSettings.vue`
- 搜索服务: `web search/searchService.ts`
- Onyx 参考: `deepresearch/dr_loop.py`