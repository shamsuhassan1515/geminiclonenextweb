<template>
  <div class="deep-research-plan-renderer">
    <div v-if="plan" class="plan-container">
      <div class="plan-header">
        <h3>研究计划</h3>
        <div class="plan-status">
          <span v-if="isResearching">研究中...</span>
          <span v-else>已完成</span>
          <span class="cycle-info">({{ currentCycle }}/{{ maxCycles }})</span>
        </div>
      </div>
      
      <div class="plan-steps">
        <div 
          v-for="(step, index) in planSteps" 
          :key="index"
          class="plan-step"
          :class="{ 
            'completed': step.completed,
            'current': step.current,
            'pending': !step.completed && !step.current
          }"
        >
          <div class="step-content">
            <div class="step-icon">
              <svg v-if="step.completed" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 13L9 17L19 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <svg v-else-if="step.current" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                <path d="M12 6v12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                <path d="M6 12h12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
              <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" opacity="0.3"/>
              </svg>
            </div>
            <div class="step-text">
              <div class="step-title">{{ step.title }}</div>
              <div class="step-description" v-if="step.description">{{ step.description }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div v-else class="no-plan">
      暂无研究计划
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

// Props
const props = defineProps<{
  plan: string | null
  currentCycle: number
  maxCycles: number
  isResearching: boolean
}>()

// Computed properties
const planSteps = computed(() => {
  if (!props.plan) return []
  
  // Simple parsing of the plan - in a real implementation, this would be more sophisticated
  const lines = props.plan.split('\n').filter(line => line.trim() !== '')
  return lines.map((line, index) => ({
    title: line.length > 50 ? line.substring(0, 50) + '...' : line,
    description: line.length > 50 ? line.substring(50) : '',
    completed: index < props.currentCycle - 1,
    current: index === props.currentCycle - 1 && props.isResearching,
    pending: index >= props.currentCycle || !props.isResearching
  }))
})
</script>

<style scoped>
.deep-research-plan-renderer {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 16px;
  margin: 12px 0;
  border: 1px solid #e9ecef;
}

.plan-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.plan-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #202124;
}

.plan-status {
  display: flex;
  gap: 8px;
  font-size: 14px;
  color: #5f6368;
}

.cycle-info {
  background: #e8f0fe;
  color: #1a73e8;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.plan-steps {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.plan-step {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 8px;
  border-radius: 8px;
  transition: background-color 0.2s;
}

.plan-step:hover {
  background-color: #f1f3f4;
}

.plan-step.completed {
  opacity: 0.7;
}

.plan-step.current {
  background-color: #e8f0fe;
  border-left: 2px solid #1a73e8;
}

.step-icon {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.step-content {
  flex: 1;
}

.step-title {
  font-weight: 500;
  color: #202124;
  margin-bottom: 4px;
}

.step-description {
  font-size: 14px;
  color: #5f6368;
  line-height: 1.4;
}

.no-plan {
  text-align: center;
  color: #5f6368;
  font-style: italic;
  padding: 20px;
}
</style>