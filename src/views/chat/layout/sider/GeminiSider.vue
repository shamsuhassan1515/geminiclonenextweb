<script setup lang='ts'>
import type { CSSProperties } from 'vue'
import { computed, h, ref, watch } from 'vue'
import { NDropdown, NInput, NLayoutSider, NModal, NScrollbar, useMessage } from 'naive-ui'
import { useAppStore, useChatStore } from '@/store'
import { useBasicLayout } from '@/hooks/useBasicLayout'
import { SvgIcon } from '@/components/common'

const appStore = useAppStore()
const chatStore = useChatStore()

const { isMobile } = useBasicLayout()
const showSettingsMenu = ref(false)
const ms = useMessage()

// Rename Modal State
const showRenameModal = ref(false)
const renameText = ref('')
const renameUuid = ref<number | null>(null)
const renameOriginalText = ref('')

const collapsed = computed(() => appStore.siderCollapsed)
const dataSources = computed(() => {
  return [...chatStore.history].sort((a, b: any) => (b.isPin ? 1 : 0) - ((a as any).isPin ? 1 : 0))
})

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

function renderIcon(icon: string) {
  return () => h(SvgIcon, { icon })
}

const actionOptions = (item: Chat.History) => [
  {
    label: 'Share conversation',
    key: 'share',
    icon: renderIcon('ri:share-line'),
  },
  {
    label: item.isPin ? 'Unpin' : 'Pin',
    key: 'pin',
    icon: renderIcon('ri:pushpin-line'),
  },
  {
    label: 'Rename',
    key: 'rename',
    icon: renderIcon('ri:pencil-line'),
  },
  {
    label: 'Delete',
    key: 'delete',
    icon: renderIcon('ri:delete-bin-line'),
  },
]

function handleAction(key: string, item: Chat.History) {
  switch (key) {
    case 'share':
      ms.success('Share link copied to clipboard!')
      break
    case 'pin':
      chatStore.updateHistory(item.uuid, { isPin: !item.isPin })
      break
    case 'rename':
      renameUuid.value = item.uuid
      renameOriginalText.value = item.title
      renameText.value = item.title
      showRenameModal.value = true
      break
    case 'delete':
      {
        const index = chatStore.history.findIndex(h => h.uuid === item.uuid)
        if (index !== -1) {
          chatStore.deleteHistory(index)
          if (isMobile.value)
            appStore.setSiderCollapsed(true)
        }
      }
      break
  }
}

function handleRenameSubmit() {
  if (renameUuid.value && renameText.value.trim() && renameText.value !== renameOriginalText.value)
    chatStore.updateHistory(renameUuid.value, { title: renameText.value.trim() })

  showRenameModal.value = false
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
    :collapsed-width="isMobile ? 0 : 68"
    :width="280"
    :show-trigger="false"
    collapse-mode="width"
    :style="getMobileClass"
    class="gemini-sider"
    :class="{ 'gemini-collapsed': collapsed }"
    @update-collapsed="handleUpdateCollapsed"
  >
    <div class="flex flex-col h-full gemini-sidebar" :style="mobileSafeArea">
      <div class="p-3 gemini-header">
        <div class="flex items-center mb-2" :class="collapsed ? 'justify-center' : 'justify-between'">
          <button class="p-2 rounded-full gemini-menu-btn transition-colors" @click="handleUpdateCollapsed">
            <SvgIcon icon="ri:menu-line" class="gemini-icon text-xl" />
          </button>
          <button v-show="!collapsed" class="p-2 rounded-full gemini-menu-btn transition-colors">
            <SvgIcon icon="ri:search-line" class="gemini-icon text-xl" />
          </button>
        </div>
      </div>

      <main class="flex flex-col flex-1 min-h-0 overflow-hidden">
        <div class="mb-4" :class="collapsed ? 'px-1 flex justify-center' : 'px-3'">
          <button
            class="flex items-center rounded-full transition-colors gemini-new-chat-btn"
            :class="collapsed ? 'w-10 h-10 justify-center p-0' : 'w-full justify-between px-3 py-2'"
            :title="collapsed ? 'New chat' : ''"
            @click="handleAdd"
          >
            <div class="flex items-center gap-3">
              <SvgIcon icon="ri:edit-box-line" class="text-xl text-[#1f1f1f]" />
              <span v-show="!collapsed" class="text-sm font-medium text-[#1f1f1f]">New chat</span>
            </div>
          </button>
        </div>

        <div v-show="!collapsed" class="px-4 space-y-1 mb-4">
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
        <div v-show="!collapsed" class="flex-1 min-h-0 overflow-hidden">
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
                      <div class="flex items-center gap-1">
                        <span class="truncate">{{ item.title }}</span>
                        <SvgIcon v-if="(item as any).isPin" icon="ri:pushpin-2-fill" class="min-w-3 text-xs opacity-50 ml-0.5" />
                      </div>
                    </div>

                    <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <NDropdown trigger="click" :options="actionOptions(item)" @select="key => handleAction(key, item)">
                        <button class="p-1 rounded-full flex items-center justify-center gemini-action-btn" @click.stop>
                          <SvgIcon icon="ri:more-2-fill" class="gemini-action-icon text-base" />
                        </button>
                      </NDropdown>
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
          class="flex items-center rounded-full gemini-nav-item transition-colors text-sm"
          :class="collapsed ? 'mx-auto w-10 h-10 justify-center p-0' : 'w-full justify-between px-3 py-2'"
          :title="collapsed ? 'Settings & help' : ''"
          @click="showSettingsMenu = !showSettingsMenu"
        >
          <div class="flex items-center" :class="collapsed ? '' : 'gap-3'">
            <SvgIcon icon="ri:settings-4-line" class="gemini-icon" :class="collapsed ? 'text-xl' : ''" />
            <span v-show="!collapsed" class="text-[#1f1f1f]">Settings & help</span>
          </div>
        </button>
      </div>
    </div>
  </NLayoutSider>
  <template v-if="isMobile">
    <div v-show="!collapsed" class="fixed inset-0 z-40 w-full h-full bg-black/40" @click="handleUpdateCollapsed" />
  </template>

  <NModal v-model:show="showRenameModal" :mask-closable="true" transform-origin="center">
    <div class="bg-[#f0f4f9] rounded-[24px] p-6 w-[400px] max-w-[90vw] shadow-xl font-sans text-left">
      <h3 class="text-[22px] text-[#1f1f1f] mb-6 font-normal">
        Rename this chat
      </h3>
      <div class="mb-6">
        <NInput
          v-model:value="renameText"
          type="text"
          size="large"
          class="rename-modal-input"
          style="border-radius: 8px;"
          @keyup.enter="handleRenameSubmit"
        />
      </div>
      <div class="flex justify-end gap-2">
        <button class="px-5 py-2.5 outline-none rounded-full text-[#0b57d0] hover:bg-[#0b57d0]/10 font-medium transition-colors text-sm" @click="showRenameModal = false">
          Cancel
        </button>
        <button class="px-5 py-2.5 outline-none rounded-full text-[#0b57d0] hover:bg-[#0b57d0]/10 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm" :disabled="!renameText.trim() || renameText === renameOriginalText" @click="handleRenameSubmit">
          Rename
        </button>
      </div>
    </div>
  </NModal>
</template>

<style scoped>
:deep(.rename-modal-input) {
  --n-border: 1px solid #0b57d0 !important;
  --n-border-hover: 1px solid #0b57d0 !important;
  --n-border-focus: 2px solid #0b57d0 !important;
  --n-box-shadow-focus: none !important;
  --n-caret-color: #0b57d0 !important;
  --n-text-color: #1f1f1f !important;
  --n-color: transparent !important;
  --n-color-focus: transparent !important;
}

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
