<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { NSelect, NInput, NButton, NSwitch, NCard, useMessage } from 'naive-ui'
import { SvgIcon } from '@/components/common'
import {
  getProviders,
  saveProvider,
  deleteProvider,
  activateProvider,
  deactivateProvider,
  testProvider,
} from './searchService'
import type {
  WebSearchProvider,
  WebSearchProviderType,
} from './types'
import {
  SEARCH_PROVIDER_DETAILS,
  SEARCH_PROVIDER_ORDER,
} from './types'

const ms = useMessage()

const providers = ref<WebSearchProvider[]>([])
const showForm = ref(false)
const editingProvider = ref<WebSearchProvider | null>(null)

// Form state
const formData = ref({
  name: '',
  providerType: 'google_pse' as WebSearchProviderType,
  apiKey: '',
  config: {} as Record<string, string>,
})

// Load providers
function loadProviders() {
  providers.value = getProviders()
}

// Initialize
onMounted(() => {
  loadProviders()
})

// Provider type options for select
const providerOptions = SEARCH_PROVIDER_ORDER.map((type) => ({
  label: SEARCH_PROVIDER_DETAILS[type].label,
  value: type,
}))

// Get current provider detail
const currentDetail = computed(() => {
  return SEARCH_PROVIDER_DETAILS[formData.value.providerType]
})

// Check if provider requires API key
const requiresApiKey = computed(() => {
  return currentDetail.value.requiresApiKey
})

// Get required config keys
const requiredConfigKeys = computed(() => {
  return currentDetail.value.requiredConfigKeys
})

// Get config field label
function getConfigLabel(key: string): string {
  const labels: Record<string, string> = {
    search_engine_id: 'Search Engine ID',
    searxng_base_url: 'SearXNG Base URL',
    api_base_url: 'API Base URL',
  }
  return labels[key] || key
}

// Open add form
function openAddForm() {
  editingProvider.value = null
  formData.value = {
    name: '',
    providerType: 'google_pse',
    apiKey: '',
    config: {},
  }
  showForm.value = true
}

// Open edit form
function openEditForm(provider: WebSearchProvider) {
  editingProvider.value = provider
  formData.value = {
    name: provider.name,
    providerType: provider.providerType,
    apiKey: provider.apiKey || '',
    config: { ...provider.config },
  }
  showForm.value = true
}

// Save provider
async function handleSave() {
  if (!formData.value.name.trim()) {
    ms.error('Please enter a provider name')
    return
  }

  if (requiresApiKey.value && !formData.value.apiKey.trim()) {
    ms.error('Please enter an API key')
    return
  }

  for (const key of requiredConfigKeys.value) {
    if (!formData.value.config[key]?.trim()) {
      ms.error(`Please enter ${getConfigLabel(key)}`)
      return
    }
  }

  const provider: WebSearchProvider = {
    id: editingProvider.value?.id || '',
    name: formData.value.name,
    providerType: formData.value.providerType,
    apiKey: formData.value.apiKey || undefined,
    config: formData.value.config,
    isActive: editingProvider.value?.isActive || false,
  }

  saveProvider(provider)
  loadProviders()
  showForm.value = false
  ms.success('Provider saved successfully')
}

// Delete provider
function handleDelete(id: string) {
  deleteProvider(id)
  loadProviders()
  ms.success('Provider deleted')
}

// Toggle provider active state
function handleToggleActive(provider: WebSearchProvider) {
  if (provider.isActive) {
    deactivateProvider(provider.id)
  } else {
    activateProvider(provider.id)
  }
  loadProviders()
}

// Test connection
async function handleTest() {
  const result = await testProvider(
    formData.value.providerType,
    formData.value.apiKey,
    formData.value.config
  )
  if (result.success) {
    ms.success(result.message)
  } else {
    ms.error(result.message)
  }
}

// Get provider icon
function getProviderIcon(type: WebSearchProviderType): string {
  const icons: Record<WebSearchProviderType, string> = {
    google_pse: 'ri:google-line',
    serper: 'ri:search-line',
    exa: 'ri:robot-line',
    searxng: 'ri:search-eye-line',
    brave: 'ri:shield-line',
    duckduckgo: 'ri:duck-line',
    tavily: 'ri:flashlight-line',
  }
  return icons[type] || 'ri:search-line'
}
</script>

<template>
  <div class="web-search-settings">
    <div class="header">
      <div class="title-section">
        <SvgIcon icon="ri:search-line" class="icon" />
        <div>
          <h3>Web Search Providers</h3>
          <p class="description">Configure search providers for deep research and web search features</p>
        </div>
      </div>
      <NButton type="primary" @click="openAddForm">
        <SvgIcon icon="ri:add-line" />
        Add Provider
      </NButton>
    </div>

    <!-- Provider List -->
    <div v-if="providers.length > 0" class="provider-list">
      <NCard v-for="provider in providers" :key="provider.id" class="provider-card">
        <div class="provider-info">
          <div class="provider-header">
            <SvgIcon :icon="getProviderIcon(provider.providerType)" class="provider-icon" />
            <div class="provider-details">
              <h4>{{ provider.name }}</h4>
              <span class="provider-type">{{ SEARCH_PROVIDER_DETAILS[provider.providerType].label }}</span>
            </div>
          </div>
          <div class="provider-actions">
            <NSwitch
              :value="provider.isActive"
              @update:value="handleToggleActive(provider)"
            />
            <NButton size="small" @click="openEditForm(provider)">
              <SvgIcon icon="ri:edit-line" />
            </NButton>
            <NButton size="small" type="error" @click="handleDelete(provider.id)">
              <SvgIcon icon="ri:delete-bin-line" />
            </NButton>
          </div>
        </div>
        <div v-if="provider.isActive" class="active-badge">
          <SvgIcon icon="ri:check-line" />
          Active
        </div>
      </NCard>
    </div>

    <!-- Empty State -->
    <div v-else class="empty-state">
      <SvgIcon icon="ri:search-line" class="empty-icon" />
      <p>No search providers configured</p>
      <p class="hint">Add a provider to enable web search in your conversations</p>
    </div>

    <!-- Add/Edit Form Modal -->
    <div v-if="showForm" class="form-overlay" @click.self="showForm = false">
      <div class="form-modal">
        <h3>{{ editingProvider ? 'Edit Provider' : 'Add Provider' }}</h3>

        <div class="form-group">
          <label>Provider Name</label>
          <NInput v-model:value="formData.name" placeholder="My Search Provider" />
        </div>

        <div class="form-group">
          <label>Provider Type</label>
          <NSelect
            v-model:value="formData.providerType"
            :options="providerOptions"
            :disabled="!!editingProvider"
          />
          <p class="help-text">{{ currentDetail.helper }}</p>
        </div>

        <div v-if="requiresApiKey" class="form-group">
          <label>API Key</label>
          <NInput
            v-model:value="formData.apiKey"
            type="password"
            show-password-on="click"
            placeholder="Enter your API key"
          />
          <a
            v-if="currentDetail.apiKeyUrl"
            :href="currentDetail.apiKeyUrl"
            target="_blank"
            class="help-link"
          >
            Get API Key →
          </a>
        </div>

        <div v-for="key in requiredConfigKeys" :key="key" class="form-group">
          <label>{{ getConfigLabel(key) }}</label>
          <NInput
            v-model:value="formData.config[key]"
            :placeholder="`Enter ${getConfigLabel(key)}`"
          />
        </div>

        <div class="form-actions">
          <NButton @click="showForm = false">Cancel</NButton>
          <NButton @click="handleTest">Test Connection</NButton>
          <NButton type="primary" @click="handleSave">Save</NButton>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.web-search-settings {
  padding: 16px;
  color: #e8eaed;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
}

.title-section {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.title-section .icon {
  font-size: 24px;
  color: #8ab4f8;
  margin-top: 4px;
}

.title-section h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #e8eaed;
}

.title-section .description {
  margin: 4px 0 0;
  font-size: 14px;
  color: #9aa0a6;
}

.provider-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.provider-card {
  position: relative;
  background: #202124;
  border: 1px solid #3c4043;
  border-radius: 12px;
}

.provider-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
}

.provider-header {
  display: flex;
  gap: 12px;
  align-items: center;
}

.provider-icon {
  font-size: 24px;
  color: #9aa0a6;
}

.provider-details h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
  color: #e8eaed;
}

.provider-type {
  font-size: 12px;
  color: #9aa0a6;
}

.provider-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.active-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: rgba(138, 180, 248, 0.2);
  color: #8ab4f8;
  font-size: 12px;
  font-weight: 500;
  border-radius: 12px;
}

.empty-state {
  text-align: center;
  padding: 48px 24px;
  color: #9aa0a6;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-state p {
  margin: 0;
  font-size: 16px;
  color: #e8eaed;
}

.empty-state .hint {
  margin-top: 8px;
  font-size: 14px;
  color: #9aa0a6;
}

.form-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.form-modal {
  background: #202124;
  border: 1px solid #3c4043;
  border-radius: 16px;
  padding: 24px;
  width: 90%;
  max-width: 480px;
  max-height: 90vh;
  overflow-y: auto;
}

.form-modal h3 {
  margin: 0 0 24px;
  font-size: 20px;
  font-weight: 600;
  color: #e8eaed;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #e8eaed;
}

.help-text {
  margin: 8px 0 0;
  font-size: 12px;
  color: #9aa0a6;
}

.help-link {
  display: inline-block;
  margin-top: 8px;
  font-size: 12px;
  color: #8ab4f8;
  text-decoration: none;
}

.help-link:hover {
  text-decoration: underline;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
}

/* Input styles for dark theme */
.form-modal :deep(.n-input) {
  --n-color: #202124;
  --n-color-focus: #202124;
  --n-border: 1px solid #3c4043;
  --n-border-hover: 1px solid #8ab4f8;
  --n-border-focus: 1px solid #8ab4f8;
  --n-text-color: #e8eaed;
  --n-placeholder-color: #9aa0a6;
  --n-caret-color: #8ab4f8;
}

.form-modal :deep(.n-select) {
  --n-color: #202124;
  --n-color-active: #202124;
  --n-border: 1px solid #3c4043;
  --n-border-hover: 1px solid #8ab4f8;
  --n-border-focus: 1px solid #8ab4f8;
  --n-text-color: #e8eaed;
  --n-placeholder-color: #9aa0a6;
  --n-peer-active-color: #8ab4f8;
}

/* Button styles for dark theme */
.form-modal :deep(.n-button) {
  --n-color: #3c4043;
  --n-color-hover: #5f6368;
  --n-color-pressed: #5f6368;
  --n-color-focus: #3c4043;
  --n-text-color: #e8eaed;
  --n-text-color-hover: #e8eaed;
  --n-text-color-pressed: #e8eaed;
  --n-text-color-focus: #e8eaed;
  --n-border: 1px solid #5f6368;
  --n-border-hover: 1px solid #8ab4f8;
  --n-border-pressed: 1px solid #8ab4f8;
  --n-border-focus: 1px solid #8ab4f8;
}

.form-modal :deep(.n-button--primary-type) {
  --n-color: #8ab4f8;
  --n-color-hover: #aecbfa;
  --n-color-pressed: #8ab4f8;
  --n-text-color: #202124;
  --n-text-color-hover: #202124;
  --n-text-color-pressed: #202124;
  --n-border: none;
  --n-border-hover: none;
  --n-border-pressed: none;
}
</style>
