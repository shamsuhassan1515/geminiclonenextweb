<script setup lang='ts'>
import type { CSSProperties } from 'vue'
import { computed, ref, watch } from 'vue'
import { NLayoutSider, NScrollbar } from 'naive-ui'
import { useRouter } from 'vue-router'
import { useAppStore, useChatStore } from '@/store'
import { useBasicLayout } from '@/hooks/useBasicLayout'
import { SvgIcon } from '@/components/common'

const appStore = useAppStore()
const chatStore = useChatStore()
const router = useRouter()

const { isMobile } = useBasicLayout()
const searchQuery = ref('')
const showSettingsMenu = ref(false)

const collapsed = computed(() => appStore.siderCollapsed)
const dataSources = computed(() => chatStore.history)

function handleAdd() {
  chatStore.addHistory({ title: 'New Chat', uuid: Date.now(), isEdit: false })
  if (isMobile.value)
    appStore.setSiderCollapsed(true)
}

function handleUpdateCollapsed() {
  appStore.setSiderCollapsed(!collapsed.value)
}

async function handleSelect({ uuid }: Chat.History) {
  if (chatStore.active === uuid) return
  if (chatStore.active)
    chatStore.updateHistory(chatStore.active, { isEdit: false })
  await chatStore.setActive(uuid)
  if (isMobile.value)
    appStore.setSiderCollapsed(true)
}

function isActive(uuid: number) {
  return chatStore.active === uuid
}

function handleEdit({ uuid }: Chat.History, isEdit: boolean, event?: MouseEvent) {
  event?.stopPropagation()
  chatStore.updateHistory(uuid, { isEdit })
}

function handleDelete(index: number, event?: MouseEvent | TouchEvent) {
  event?.stopPropagation()
  chatStore.deleteHistory(index)
  if (isMobile.value)
    appStore.setSiderCollapsed(true)
}

const getMobileClass = computed<CSSProperties>(() => {
  if (isMobile.value) {
    return {
      position: 'fixed',
      zIndex: 50,
      height: '100%',
    }
  }
  return {}
})

const mobileSafeArea = computed(() => {
  if (isMobile.value) {
    return {
      paddingBottom: 'env(safe-area-inset-bottom)',
    }
  }
  return {}
})

watch(
  isMobile,
  (val) => {
    appStore.setSiderCollapsed(val)
  },
  {
    immediate: true,
    flush: 'post',
  },
)
</script>

<template>
  <NLayoutSider
    :collapsed="collapsed"
    :collapsed-width="0"
    :width="280"
    :show-trigger="isMobile ? false : 'arrow-circle'"
    collapse-mode="transform"
    :style="getMobileClass"
    @update-collapsed="handleUpdateCollapsed"
    class="gemini-sider"
  >
    <div class="flex flex-col h-full gemini-sidebar" :style="mobileSafeArea">
      <div class="p-4 gemini-header">
        <div class="flex items-center justify-between mb-4">
          <h1 class="text-lg font-semibold gemini-title flex items-center gap-2">
            <SvgIcon icon="ri:gemini-line" class="text-purple-500 text-xl" />
            <span>Gemini</span>
          </h1>
          <button class="p-2 rounded-full gemini-menu-btn transition-colors">
            <SvgIcon icon="ri:menu-line" class="gemini-icon" />
          </button>
        </div>
        
        <div class="relative">
          <SvgIcon icon="ri:search-line" class="absolute left-3 top-1/2 transform -translate-y-1/2 gemini-search-icon" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search..."
            class="w-full pl-10 pr-4 py-2 rounded-full gemini-search-input text-sm"
          />
        </div>
      </div>
      
      <main class="flex flex-col flex-1 min-h-0 overflow-hidden">
        <div class="p-4">
          <button 
            @click="handleAdd"
            class="w-full flex items-center gap-2 px-4 py-2.5 rounded-lg gemini-new-chat-btn transition-colors"
          >
            <SvgIcon icon="ri:edit-line" class="gemini-icon" />
            <span class="text-sm font-medium gemini-text">New chat</span>
          </button>
        </div>
        
        <div class="px-4 space-y-1 mb-4">
          <button class="w-full flex items-center gap-3 px-3 py-2 rounded-md gemini-nav-item transition-colors text-sm">
            <SvgIcon icon="ri:calendar-line" class="gemini-icon" />
            <span>Scheduled actions</span>
          </button>
          <button class="w-full flex items-center gap-3 px-3 py-2 rounded-md gemini-nav-item transition-colors text-sm">
            <SvgIcon icon="ri:star-line" class="text-yellow-500" />
            <span>Gems</span>
          </button>
          <button class="w-full flex items-center gap-3 px-3 py-2 rounded-md gemini-nav-item transition-colors text-sm">
            <SvgIcon icon="ri:folder-line" class="gemini-icon" />
            <span>My stuff</span>
          </button>
        </div>
        
        <div class="flex-1 min-h-0 overflow-hidden">
          <div class="px-4 mb-2">
            <h3 class="text-xs font-medium gemini-section-title uppercase tracking-wider">Chats</h3>
          </div>
          <NScrollbar class="h-full">
            <div class="flex flex-col text-sm px-2">
              <template v-if="!dataSources.length">
                <div class="flex flex-col items-center mt-8 text-center gemini-empty-text">
                  <SvgIcon icon="ri:inbox-line" class="mb-2 text-2xl" />
                  <span>No chats yet</span>
                </div>
              </template>
              <template v-else>
                <div v-for="(item, index) of dataSources" :key="index">
                  <div 
                    class="relative flex items-center justify-between px-3 py-2.5 cursor-pointer group rounded-md gemini-chat-item transition-colors"
                    :class="isActive(item.uuid) && 'gemini-chat-item-active'"
                    @click="handleSelect(item)"
                  >
                    <div class="flex-1 min-w-0 truncate text-sm gemini-chat-text">
                      {{ item.title }}
                    </div>
                    
                    <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        class="p-1.5 rounded-full gemini-action-btn"
                        @click="handleEdit(item, true, $event)"
                      >
                        <SvgIcon icon="ri:edit-line" class="gemini-action-icon text-xs" />
                      </button>
                      <button 
                        class="p-1.5 rounded-full gemini-action-btn"
                        @click="handleDelete(index, $event)"
                      >
                        <SvgIcon icon="ri:delete-bin-line" class="gemini-action-icon text-xs" />
                      </button>
                    </div>
                  </div>
                </div>
              </template>
            </div>
          </NScrollbar>
        </div>
      </main>
      
      <div class="gemini-footer p-4 space-y-1">
        <button 
          class="w-full flex items-center justify-between px-3 py-2 rounded-md gemini-nav-item transition-colors text-sm"
          @click="showSettingsMenu = !showSettingsMenu"
        >
          <div class="flex items-center gap-3">
            <SvgIcon icon="ri:settings-4-line" class="gemini-icon" />
            <span>Settings & privacy</span>
          </div>
          <SvgIcon icon="ri:arrow-right-s-line" class="gemini-icon" />
        </button>
        <button class="w-full flex items-center gap-3 px-3 py-2 rounded-md gemini-nav-item transition-colors text-sm">
          <SvgIcon icon="ri:question-line" class="gemini-icon" />
          <span>Help</span>
        </button>
        <button class="w-full flex items-center gap-3 px-3 py-2 rounded-md gemini-nav-item transition-colors text-sm">
          <SvgIcon icon="ri:send-plane-line" class="gemini-icon" />
          <span>Send feedback</span>
        </button>
      </div>
    </div>
  </NLayoutSider>
  <template v-if="isMobile">
    <div v-show="!collapsed" class="fixed inset-0 z-40 w-full h-full bg-black/40" @click="handleUpdateCollapsed" />
  </template>
</template>

<style scoped>
.gemini-sider {
  background: #f8f9fa !important;
  border-right: 1px solid #e8eaed !important;
}

.gemini-sidebar {
  background: #f8f9fa;
  color: #202124;
}

.gemini-header {
  border-bottom: 1px solid #e8eaed;
  background: #f8f9fa;
}

.gemini-title {
  color: #202124;
  font-weight: 500;
}

.gemini-icon {
  color: #5f6368;
}

.gemini-menu-btn {
  color: #5f6368;
}

.gemini-menu-btn:hover {
  background: #e8eaed;
}

.gemini-search-input {
  background: #ffffff;
  border: 1px solid #dadce0;
  color: #202124;
}

.gemini-search-input::placeholder {
  color: #9aa0a6;
}

.gemini-search-input:focus {
  outline: none;
  border-color: #8ab4f8;
  box-shadow: 0 0 0 1px #8ab4f8;
}

.gemini-search-icon {
  color: #9aa0a6;
}

.gemini-new-chat-btn {
  background: #ffffff;
  border: 1px solid #dadce0;
  color: #202124;
}

.gemini-new-chat-btn:hover {
  background: #f1f3f4;
  border-color: #bdc1c6;
}

.gemini-text {
  color: #202124;
}

.gemini-nav-item {
  color: #5f6368;
}

.gemini-nav-item:hover {
  background: #e8eaed;
  color: #202124;
}

.gemini-section-title {
  color: #5f6368;
}

.gemini-chat-item {
  color: #5f6368;
}

.gemini-chat-item:hover {
  background: #e8eaed;
  color: #202124;
}

.gemini-chat-item-active {
  background: #e8eaed !important;
  color: #202124;
}

.gemini-chat-text {
  color: inherit;
}

.gemini-empty-text {
  color: #9aa0a6;
}

.gemini-action-btn {
  color: #5f6368;
}

.gemini-action-btn:hover {
  background: #dadce0;
}

.gemini-action-icon {
  color: #5f6368;
}

.gemini-footer {
  border-top: 1px solid #e8eaed;
  background: #f8f9fa;
}

:deep(.n-scrollbar-rail) {
  background: transparent;
}

:deep(.n-scrollbar-rail__scrollbar) {
  background: #dadce0;
  border-radius: 3px;
}

:deep(.n-scrollbar-rail__scrollbar:hover) {
  background: #bdc1c6;
}
</style>
