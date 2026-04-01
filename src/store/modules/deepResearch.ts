import { reactive } from 'vue'

export interface ProgressMessage {
  id: number
  type: 'search' | 'search_result' | 'think' | 'tool_start' | 'tool_end' | 'status' | 'error'
  content: string
  timestamp: number
}

export const deepResearchStore = reactive({
  // Basic research state
  enabled: false,
  plan: null as string | null,
  currentCycle: 0,
  maxCycles: 8,
  isResearching: false,

  // DeerFlow specific state
  useDeerflow: false,
  deerflowThread: null as string | null,
  deerflowRun: null as string | null,
  researchProgress: 0,
  progressMessages: [] as ProgressMessage[],
  isComplete: false,
  isGeneratingPlan: false,

  // Research result
  researchResult: null as string | null
})

let messageIdCounter = 0

export function toggleDeepResearch() {
  deepResearchStore.enabled = !deepResearchStore.enabled
  // If disabling, reset the research state
  if (!deepResearchStore.enabled) {
    resetDeepResearchState()
  }
}

export function resetDeepResearchState() {
  deepResearchStore.plan = null
  deepResearchStore.currentCycle = 0
  deepResearchStore.isResearching = false
  deepResearchStore.useDeerflow = false
  deepResearchStore.deerflowThread = null
  deepResearchStore.deerflowRun = null
  deepResearchStore.researchProgress = 0
  deepResearchStore.progressMessages = []
  deepResearchStore.isComplete = false
  deepResearchStore.isGeneratingPlan = false
  deepResearchStore.researchResult = null
}

export function setPlan(plan: string) {
  deepResearchStore.plan = plan
}

export function setCurrentCycle(cycle: number) {
  deepResearchStore.currentCycle = cycle
}

export function setMaxCycles(cycles: number) {
  deepResearchStore.maxCycles = cycles
}

export function setIsResearching(isResearching: boolean) {
  deepResearchStore.isResearching = isResearching
}

export function setUseDeerflow(use: boolean) {
  deepResearchStore.useDeerflow = use
}

export function setIsGeneratingPlan(isGenerating: boolean) {
  deepResearchStore.isGeneratingPlan = isGenerating
}

export function addProgressMessage(
  type: ProgressMessage['type'],
  content: string
) {
  deepResearchStore.progressMessages.push({
    id: ++messageIdCounter,
    type,
    content: content.length > 500 ? content.slice(0, 500) + '...' : content,
    timestamp: Date.now()
  })
}

export function updateProgress(progress: number) {
  deepResearchStore.researchProgress = Math.min(Math.max(progress, 0), 100)
}

export function setDeerflowInfo(threadId: string, runId: string) {
  deepResearchStore.deerflowThread = threadId
  deepResearchStore.deerflowRun = runId
}

export function setResearchComplete(result?: string) {
  deepResearchStore.isComplete = true
  deepResearchStore.isResearching = false
  deepResearchStore.researchProgress = 100
  if (result) {
    deepResearchStore.researchResult = result
  }
}

export function resetDeepResearch() {
  deepResearchStore.enabled = false
  resetDeepResearchState()
}

export function clearProgressMessages() {
  deepResearchStore.progressMessages = []
  deepResearchStore.researchProgress = 0
}
