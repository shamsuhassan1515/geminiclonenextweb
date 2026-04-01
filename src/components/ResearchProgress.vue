<script setup lang="ts">
import { ref, watch, nextTick, computed } from 'vue'
import { NCard, NProgress, NScrollbar } from 'naive-ui'

export interface ProgressMessage {
  id: number
  type: 'search' | 'search_result' | 'think' | 'tool_start' | 'tool_end' | 'status' | 'error'
  content: string
  timestamp: number
}

interface Props {
  messages: ProgressMessage[]
  progress: number
  isComplete?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isComplete: false
})

const emit = defineEmits<{
  (e: 'cancel'): void
}>()

const scrollbarRef = ref<any>(null)

// Auto-scroll to bottom when new messages arrive
watch(() => props.messages.length, async () => {
  await nextTick()
  if (scrollbarRef.value) {
    scrollbarRef.value.scrollTo({ top: scrollbarRef.value.$el.scrollHeight, behavior: 'smooth' })
  }
})

const progressColor = computed(() => {
  if (props.isComplete) return '#18a058'
  if (props.progress < 30) return '#2080f0'
  if (props.progress < 60) return '#18a058'
  if (props.progress < 90) return '#f0a020'
  return '#18a058'
})

const statusIcon = computed(() => {
  if (props.isComplete) return '✅'
  return '🔍'
})

const statusText = computed(() => {
  if (props.isComplete) return '研究完成'
  if (props.progress < 20) return '正在初始化...'
  if (props.progress < 40) return '正在搜索信息...'
  if (props.progress < 60) return '正在分析数据...'
  if (props.progress < 80) return '正在整理结果...'
  return '正在生成报告...'
})

function getMessageIcon(type: string): string {
  switch (type) {
    case 'search': return '🔍'
    case 'search_result': return '📄'
    case 'think': return '💭'
    case 'tool_start': return '🔧'
    case 'tool_end': return '✓'
    case 'status': return 'ℹ️'
    case 'error': return '❌'
    default: return '•'
  }
}

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString()
}
</script>

<template>
  <div class="research-progress-container">
    <NCard class="progress-card">
      <template #header>
        <div class="progress-header">
          <span class="status-icon">{{ statusIcon }}</span>
          <span class="status-text">{{ statusText }}</span>
        </div>
      </template>

      <template #header-extra>
        <span class="progress-percent">{{ progress }}%</span>
      </template>

      <div class="progress-content">
        <!-- Progress Bar -->
        <div class="progress-bar-container">
          <NProgress
            :percentage="progress"
            :color="progressColor"
            :show-indicator="false"
            :height="8"
            :border-radius="4"
          />
        </div>

        <!-- Messages List -->
        <div class="messages-container">
          <NScrollbar ref="scrollbarRef" style="max-height: 300px;">
            <div class="messages-list">
              <TransitionGroup name="message">
                <div
                  v-for="message in messages"
                  :key="message.id"
                  :class="['message-item', `message-${message.type}`]"
                >
                  <span class="message-icon">{{ getMessageIcon(message.type) }}</span>
                  <span class="message-content">{{ message.content }}</span>
                  <span class="message-time">{{ formatTime(message.timestamp) }}</span>
                </div>
              </TransitionGroup>
            </div>
          </NScrollbar>
        </div>
      </div>
    </NCard>
  </div>
</template>

<style scoped>
.research-progress-container {
  margin: 16px 0;
}

.progress-card {
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
}

.progress-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-icon {
  font-size: 20px;
}

.status-text {
  font-weight: 600;
  color: #333;
}

.progress-percent {
  font-size: 18px;
  font-weight: 700;
  color: #2080f0;
}

.progress-content {
  padding: 8px 0;
}

.progress-bar-container {
  margin-bottom: 16px;
}

.messages-container {
  background: #f5f7fa;
  border-radius: 8px;
  padding: 12px;
}

.messages-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.message-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 8px 12px;
  background: #ffffff;
  border-radius: 6px;
  font-size: 13px;
  line-height: 1.5;
  animation: slideIn 0.3s ease;
}

.message-icon {
  flex-shrink: 0;
  width: 20px;
  text-align: center;
}

.message-content {
  flex: 1;
  color: #333;
  word-break: break-word;
}

.message-time {
  flex-shrink: 0;
  font-size: 11px;
  color: #999;
}

/* Message type styles */
.message-search {
  border-left: 3px solid #2080f0;
}

.message-search_result {
  border-left: 3px solid #18a058;
}

.message-think {
  border-left: 3px solid #f0a020;
}

.message-tool_start {
  border-left: 3px solid #8a2be2;
}

.message-tool_end {
  border-left: 3px solid #18a058;
}

.message-status {
  border-left: 3px solid #999;
  color: #666;
}

.message-error {
  border-left: 3px solid #d03050;
  background: #fff0f0;
}

/* Transition animations */
.message-enter-active {
  animation: slideIn 0.3s ease;
}

.message-leave-active {
  animation: slideOut 0.3s ease;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes slideOut {
  from {
    opacity: 1;
    transform: translateX(0);
  }
  to {
    opacity: 0;
    transform: translateX(20px);
  }
}
</style>
