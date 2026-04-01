<script setup lang="ts">
import { ref, computed } from 'vue'
import { NCard, NButton, NInput, NSpace } from 'naive-ui'

interface Props {
  plan: string
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false
})

const emit = defineEmits<{
  (e: 'start', plan: string): void
  (e: 'cancel'): void
}>()

const isEditing = ref(false)
const editedPlan = ref(props.plan)

const displayPlan = computed(() => {
  return isEditing.value ? editedPlan.value : props.plan
})

function startEdit() {
  editedPlan.value = props.plan
  isEditing.value = true
}

function saveEdit() {
  isEditing.value = false
}

function cancelEdit() {
  editedPlan.value = props.plan
  isEditing.value = false
}

function startResearch() {
  emit('start', isEditing.value ? editedPlan.value : props.plan)
}

function cancelResearch() {
  emit('cancel')
}
</script>

<template>
  <div class="research-plan-container">
    <NCard title="📋 深度研究方案" class="research-plan-card">
      <template #header-extra>
        <NSpace v-if="!isEditing">
          <NButton size="small" @click="startEdit">
            ✏️ 修改方案
          </NButton>
        </NSpace>
        <NSpace v-else>
          <NButton size="small" type="primary" @click="saveEdit">
            💾 保存
          </NButton>
          <NButton size="small" @click="cancelEdit">
            取消
          </NButton>
        </NSpace>
      </template>

      <div class="plan-content">
        <NInput
          v-if="isEditing"
          v-model:value="editedPlan"
          type="textarea"
          :rows="12"
          placeholder="编辑研究方案..."
        />
        <div v-else class="plan-display" v-html="formatPlan(displayPlan)"></div>
      </div>

      <template #action>
        <NSpace justify="end">
          <NButton @click="cancelResearch">
            取消
          </NButton>
          <NButton type="primary" :loading="loading" @click="startResearch">
            🚀 开始研究
          </NButton>
        </NSpace>
      </template>
    </NCard>
  </div>
</template>

<script lang="ts">
function formatPlan(plan: string): string {
  // Convert markdown-like formatting to HTML
  return plan
    .replace(/\n/g, '<br>')
    .replace(/#{1,3}\s+(.+)/g, '<strong>$1</strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\d+\.\s+/g, '<br>• ')
}
</script>

<style scoped>
.research-plan-container {
  margin: 16px 0;
}

.research-plan-card {
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.plan-content {
  min-height: 200px;
  max-height: 400px;
  overflow-y: auto;
}

.plan-display {
  padding: 12px;
  background: #f9f9f9;
  border-radius: 8px;
  line-height: 1.8;
  font-size: 14px;
}

.plan-display :deep(strong) {
  color: #18a058;
}
</style>
