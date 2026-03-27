# Deep Research 功能迁移与集成文档 (Development Document)

## 1. 项目概述
将 Onyx 项目中的 "Deep Research" (深度研究) 功能迁移至 `chatgpt-web-midjourney-proxy` 项目。目标是在目标项目的工具栏 (Tools) 中启用该功能后，能够提供与 Onyx 一致的深度调研能力。

## 2. 技术架构对比
*   **源项目 (Onyx)**:
    *   后端: Python (FastAPI + Celery)
    *   前端: Next.js (React)
    *   检索: 集成了 Web Search, Thinking Tool, Internal Search.
*   **目标项目 (chatgpt-web-midjourney-proxy)**:
    *   前端: Vue 3 (基于 Vite)
    *   功能集成: 需要适配 Vue 的组件系统。

## 3. 迁移范围与核心文件
### 3.1 后端逻辑 (逻辑参考)
*   `backend/onyx/deep_research/dr_loop.py`: 核心研究循环（初始化、迭代、生成报告）。
*   `backend/onyx/prompts/deep_research/research_agent.py`: 深度研究专用的 System Prompts。

### 3.2 前端渲染组件
*   `DeepResearchPlanRenderer.tsx`: 显示研究计划。
*   `ResearchAgentRenderer.tsx`: 显示研究过程中的实时状态。
*   `useDeepResearchToggle.ts`: 功能开关逻辑。

## 4. 实施计划
1.  **初始化目录**: 在 `src/deepresearch` 创建基础结构。
2.  **Prompt 移植**: 将 Python 文件中的 Prompt 提取为 JSON 或常量文件，供目标项目调用。
3.  **逻辑适配**:
    *   由于目标项目主要是前端代理/包装，Deep Research 的“循环”逻辑（Loop）可能需要适配为前端驱动或集成到现有的 API 流程中。
4.  **UI 组件转换**:
    *   将 React (.tsx) 组件逻辑转换为 Vue 3 组件。
    *   适配 Tailwind CSS 或目标项目的样式变量。
5.  **工具栏集成**: 在 `settings` 或 `tools` 菜单中增加 "Deep Research" 选项，驱动 Prompt 切换。

## 5. 注意事项
*   **依赖项**: 深度研究依赖搜索引擎（如 Google/Bing API）和 LLM。
*   **状态管理**: 研究过程是异步的，需要确保状态（Cycle Count, Current Step）在 UI 上正确反映。


最终需要http://localhost:1002/#/gemini 项目的 tools 里面打开 deep research 功能后就能用 onyx 一样的 deep research 功能
