<script setup lang='ts'>
import type { CSSProperties } from 'vue'
import { computed, ref, watch } from 'vue'
import { NLayoutSider, NScrollbar } from 'naive-ui'
import { useAppStore, useChatStore } from '@/store'
import { useBasicLayout } from '@/hooks/useBasicLayout'
import { SvgIcon } from '@/components/common'

const appStore = useAppStore()
const chatStore = useChatStore()

const { isMobile } = useBasicLayout()
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
  if (chatStore.active === uuid)
    return
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
    class="gemini-sider"
    @update-collapsed="handleUpdateCollapsed"
  >
    <div class="flex flex-col h-full gemini-sidebar" :style="mobileSafeArea">
      <div class="p-3 gemini-header">
        <div class="flex items-center justify-between mb-2">
          <button class="p-2 rounded-full gemini-menu-btn transition-colors" @click="handleUpdateCollapsed">
            <SvgIcon icon="ri:menu-line" class="gemini-icon text-xl" />
          </button>
          <button class="p-2 rounded-full gemini-menu-btn transition-colors">
            <SvgIcon icon="ri:search-line" class="gemini-icon text-xl" />
          </button>
        </div>
      </div>

      <main class="flex flex-col flex-1 min-h-0 overflow-hidden">
        <div class="px-3 mb-4">
          <button
            class="w-full flex items-center justify-between px-3 py-2 rounded-full transition-colors gemini-new-chat-btn"
            @click="handleAdd"
          >
            <div class="flex items-center gap-3">
              <SvgIcon icon="ri:edit-box-line" class="text-xl text-[#1f1f1f]" />
              <span class="text-sm font-medium text-[#1f1f1f]">New chat</span>
            </div>
          </button>
        </div>

        <div class="px-4 space-y-1 mb-4">
          <button class="w-full flex items-center gap-3 px-3 py-2 rounded-full gemini-nav-item transition-colors text-sm">
            <SvgIcon icon="ri:history-line" class="gemini-icon" />
            <span class="text-[#1f1f1f]">Scheduled actions</span>
          </button>
          <button class="w-full flex items-center gap-3 px-3 py-2 rounded-full gemini-nav-item transition-colors text-sm">
            <SvgIcon icon="ri:vip-diamond-line" class="text-[#1f1f1f]" />
            <span class="text-[#1f1f1f]">Gems</span>
          </button>
          <button class="w-full flex items-center gap-3 px-3 py-2 rounded-full gemini-nav-item transition-colors text-sm">
            <SvgIcon icon="ri:bookmark-line" class="gemini-icon" />
            <span class="text-[#1f1f1f]">My stuff</span>
          </button>
        </div>
        <div class="flex-1 min-h-0 overflow-hidden">
          <div class="px-4 mb-2">
            <h3 class="text-xs font-medium gemini-section-title tracking-wider ml-1">
              Chats
            </h3>
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
                    class="relative flex items-center justify-between px-3 py-2.5 cursor-pointer group rounded-full gemini-chat-item transition-colors"
                    :class="isActive(item.uuid) ? 'gemini-chat-item-active' : ''"
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
          class="w-full flex items-center justify-between px-3 py-2 rounded-full gemini-nav-item transition-colors text-sm"
          @click="showSettingsMenu = !showSettingsMenu"
        >
          <div class="flex items-center gap-3">
            <SvgIcon icon="ri:settings-4-line" class="gemini-icon" />
            <span class="text-[#1f1f1f]">Settings & help</span>
          </div>
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
  background: #f0f4f9 !important;
  border-right: none !important;
}

.gemini-sidebar {
  background: #f0f4f9;
  color: #1f1f1f;
}

.gemini-header {
  border-bottom: none;
  background: transparent;
}

.gemini-icon {
  color: #1f1f1f;
}

.gemini-menu-btn {
  color: #1f1f1f;
}

.gemini-menu-btn:hover {
  background: rgba(0, 0, 0, 0.04);
}

.gemini-new-chat-btn {
  background: transparent;
  border: none;
  color: #1f1f1f;
}

.gemini-new-chat-btn:hover {
  background: rgba(0, 0, 0, 0.04);
}

.gemini-text {
  color: #1f1f1f;
}

.gemini-nav-item {
  color: #1f1f1f;
}

.gemini-nav-item:hover {
  background: rgba(0, 0, 0, 0.04);
}

.gemini-section-title {
  color: #1f1f1f;
  font-size: 13px;
}

.gemini-chat-item {
  color: #1f1f1f;
}

.gemini-chat-item:hover {
  background: rgba(0, 0, 0, 0.04);
}

.gemini-chat-item-active {
  background: #d3e3fd !important;
  color: #041e49 !important;
}

.gemini-chat-item-active .gemini-chat-text {
  font-weight: 500;
}

.gemini-chat-text {
  color: inherit;
}

.gemini-empty-text {
  color: #5f6368;
}

.gemini-action-btn {
  color: #1f1f1f;
}

.gemini-action-btn:hover {
  background: rgba(0, 0, 0, 0.08);
}

.gemini-footer {
  border-top: none;
  background: transparent;
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
