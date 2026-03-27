import { reactive } from 'vue'

export const deepResearchStore = reactive({
    enabled: false,
    plan: null as string | null,
    currentCycle: 0,
    maxCycles: 8,
    isResearching: false
})

export function toggleDeepResearch() {
    deepResearchStore.enabled = !deepResearchStore.enabled
    // If disabling, reset the research state
    if (!deepResearchStore.enabled) {
        deepResearchStore.plan = null
        deepResearchStore.currentCycle = 0
        deepResearchStore.isResearching = false
    }
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

export function resetDeepResearch() {
    deepResearchStore.enabled = false
    deepResearchStore.plan = null
    deepResearchStore.currentCycle = 0
    deepResearchStore.isResearching = false
}