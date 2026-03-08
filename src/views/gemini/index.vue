<script setup lang='ts'>
import type { Ref } from 'vue'
import { computed, h, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import {
  NAvatar,
  NDropdown,
  NInput,
  NModal,
  useDialog,
  useMessage,
} from 'naive-ui'
import html2canvas from 'html2canvas'
import { Message } from '../chat/components'
import { useScroll } from '../chat/hooks/useScroll'
import { useChat } from '../chat/hooks/useChat'
import { useUsingContext } from '../chat/hooks/useUsingContext'
import { SvgIcon } from '@/components/common'
import { useBasicLayout } from '@/hooks/useBasicLayout'
import type { gptsType } from '@/api'
import {
  chatSetting,
  fetchChatAPIProcess,
  myFetch,
  uploadImage,
} from '@/api'
import {
  gptConfigStore,
  gptsUlistStore,
  homeStore,
  useChatStore,
  usePromptStore,
  useUserStore,
} from '@/store'
import { t } from '@/locales'
import { copyToClip } from '@/utils/copy'

let controller = new AbortController()

const openLongReply = import.meta.env.VITE_GLOB_OPEN_LONG_REPLY === 'true'

const route = useRoute()
const dialog = useDialog()
const ms = useMessage()
const router = useRouter()
const chatStore = useChatStore()

const { isMobile } = useBasicLayout()
const { addChat, updateChat, updateChatSome, getChatByUuidAndIndex }
  = useChat()

const editingIndex = ref<number>(-1)
const editingText = ref<string>('')
const { scrollRef, scrollToBottom, scrollToBottomIfAtBottom } = useScroll()
const { usingContext, toggleUsingContext } = useUsingContext()

const showRenameModal = ref(false)
const renameText = ref('')
const renameOriginalText = ref('')
const renameUuid = ref<number>()

function renderIcon(icon: string) {
  return () => h(SvgIcon, { icon })
}

const uuid = computed(() => chatStore.active)

const dataSources = computed(() => chatStore.getChatByUuid(uuid.value))
const conversationList = computed(() =>
  dataSources.value.filter(
    item => !item.inversion && !!item.conversationOptions,
  ),
)

const currentChatDetails = computed(() => {
  return chatStore.history.find(h => h.uuid === uuid.value)
})

const currentActionOptions = computed(() => {
  if (!currentChatDetails.value)
    return []
  return [
    {
      label: currentChatDetails.value.isPin ? 'Unpin' : 'Pin',
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
})

function handleShare() {
  try {
    copyToClip(window.location.href)
    ms.success('Share link copied to clipboard!')
  }
  catch (error) {
    ms.error('Failed to copy link')
  }
}

function handleCurrentAction(key: string) {
  const item = currentChatDetails.value
  if (!item)
    return
  switch (key) {
    case 'pin':
      chatStore.updateHistory(item.uuid, { isPin: !(item as any).isPin } as any)
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
          router.replace({ name: 'Gemini', params: { uuid: '' } })
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

const prompt = ref<string>('')
const loading = ref<boolean>(false)
const inputRef = ref<Ref | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)
const showUploadMenu = ref<boolean>(false)
const showToolsMenu = ref<boolean>(false)
const showModelMenu = ref<boolean>(false)
const currentModel = ref<string>('Fast')

const promptStore = usePromptStore()
const { promptList: promptTemplate } = storeToRefs<any>(promptStore)

dataSources.value.forEach((item, index) => {
  if (item.loading)
    updateChatSome(uuid.value, index, { loading: false })
})

const userStore = useUserStore()
const userInfo = computed(() => userStore.userInfo)

function handleSubmit() {
  const message = prompt.value
  if (!message || message.trim() === '')
    return
  if (loading.value)
    return
  onConversation()
}

async function onConversation() {
  let message = prompt.value

  if (loading.value)
    return

  if (!message || message.trim() === '')
    return

  controller = new AbortController()

  addChat(uuid.value, {
    dateTime: new Date().toLocaleString(),
    text: message,
    inversion: true,
    error: false,
    conversationOptions: null,
    requestOptions: { prompt: message, options: null },
  })
  scrollToBottom()

  loading.value = true
  prompt.value = ''

  let options: Chat.ConversationRequest = {}
  const lastContext
    = conversationList.value[conversationList.value.length - 1]
      ?.conversationOptions

  if (lastContext && usingContext.value)
    options = { ...lastContext }

  addChat(uuid.value, {
    dateTime: new Date().toLocaleString(),
    text: '思考中',
    loading: true,
    inversion: false,
    error: false,
    conversationOptions: null,
    requestOptions: { prompt: message, options: { ...options } },
  })
  scrollToBottom()

  try {
    let lastText = ''
    const fetchChatAPIOnce = async () => {
      await fetchChatAPIProcess<Chat.ConversationResponse>({
        prompt: message,
        options,
        signal: controller.signal,
        onDownloadProgress: ({ event }) => {
          const xhr = event.target
          const { responseText } = xhr
          const lastIndex = responseText.lastIndexOf(
            '\n',
            responseText.length - 2,
          )
          let chunk = responseText
          if (lastIndex !== -1)
            chunk = responseText.substring(lastIndex)
          try {
            const data = JSON.parse(chunk)
            updateChat(uuid.value, dataSources.value.length - 1, {
              dateTime: new Date().toLocaleString(),
              text: lastText + (data.text ?? ''),
              inversion: false,
              error: false,
              loading: true,
              conversationOptions: {
                conversationId: data.conversationId,
                parentMessageId: data.id,
              },
              requestOptions: { prompt: message, options: { ...options } },
            })

            if (
              openLongReply
              && data.detail.choices[0].finish_reason === 'length'
            ) {
              options.parentMessageId = data.id
              lastText = data.text
              message = ''
              return fetchChatAPIOnce()
            }

            scrollToBottomIfAtBottom()
          }
          catch (error) {
            //
          }
        },
      })
      updateChatSome(uuid.value, dataSources.value.length - 1, { loading: false })
    }

    await fetchChatAPIOnce()
  }
  catch (error: any) {
    const errorMessage = error?.message ?? t('common.wrong')

    if (error.message === 'canceled') {
      updateChatSome(uuid.value, dataSources.value.length - 1, {
        loading: false,
      })
      scrollToBottomIfAtBottom()
      return
    }

    const currentChat = getChatByUuidAndIndex(
      uuid.value,
      dataSources.value.length - 1,
    )

    if (currentChat?.text && currentChat.text !== '') {
      updateChatSome(uuid.value, dataSources.value.length - 1, {
        text: `${currentChat.text}\n[${errorMessage}]`,
        error: false,
        loading: false,
      })
      return
    }

    updateChat(uuid.value, dataSources.value.length - 1, {
      dateTime: new Date().toLocaleString(),
      text: errorMessage,
      inversion: false,
      error: true,
      loading: false,
      conversationOptions: null,
      requestOptions: { prompt: message, options: { ...options } },
    })
    scrollToBottomIfAtBottom()
  }
  finally {
    loading.value = false
  }
}

async function onRegenerate(index: number) {
  if (loading.value)
    return

  controller = new AbortController()

  const { requestOptions } = dataSources.value[index]

  let message = requestOptions?.prompt ?? ''

  let options: Chat.ConversationRequest = {}

  if (requestOptions.options)
    options = { ...requestOptions.options }

  loading.value = true

  updateChat(uuid.value, index, {
    dateTime: new Date().toLocaleString(),
    text: '',
    inversion: false,
    error: false,
    loading: true,
    conversationOptions: null,
    requestOptions: { prompt: message, options: { ...options } },
  })

  try {
    let lastText = ''
    const fetchChatAPIOnce = async () => {
      await fetchChatAPIProcess<Chat.ConversationResponse>({
        prompt: message,
        options,
        signal: controller.signal,
        onDownloadProgress: ({ event }) => {
          const xhr = event.target
          const { responseText } = xhr
          const lastIndex = responseText.lastIndexOf(
            '\n',
            responseText.length - 2,
          )
          let chunk = responseText
          if (lastIndex !== -1)
            chunk = responseText.substring(lastIndex)
          try {
            const data = JSON.parse(chunk)
            updateChat(uuid.value, index, {
              dateTime: new Date().toLocaleString(),
              text: lastText + (data.text ?? ''),
              inversion: false,
              error: false,
              loading: true,
              conversationOptions: {
                conversationId: data.conversationId,
                parentMessageId: data.id,
              },
              requestOptions: { prompt: message, options: { ...options } },
            })

            if (
              openLongReply
              && data.detail.choices[0].finish_reason === 'length'
            ) {
              options.parentMessageId = data.id
              lastText = data.text
              message = ''
              return fetchChatAPIOnce()
            }
          }
          catch (error) {
            //
          }
        },
      })
      updateChatSome(uuid.value, index, { loading: false })
    }
    await fetchChatAPIOnce()
  }
  catch (error: any) {
    if (error.message === 'canceled') {
      updateChatSome(uuid.value, index, {
        loading: false,
      })
      return
    }

    const errorMessage = error?.message ?? t('common.wrong')

    updateChat(uuid.value, index, {
      dateTime: new Date().toLocaleString(),
      text: errorMessage,
      inversion: false,
      error: true,
      loading: false,
      conversationOptions: null,
      requestOptions: { prompt: message, options: { ...options } },
    })
  }
  finally {
    loading.value = false
  }
}

function handleExport() {
  if (loading.value)
    return

  const d = dialog.warning({
    title: t('chat.exportImage'),
    content: t('chat.exportImageConfirm'),
    positiveText: t('common.yes'),
    negativeText: t('common.no'),
    onPositiveClick: async () => {
      try {
        d.loading = true
        const ele = document.getElementById('image-wrapper')
        const canvas = await html2canvas(ele as HTMLDivElement, {
          useCORS: true,
        })
        const imgUrl = canvas.toDataURL('image/png')
        const tempLink = document.createElement('a')
        tempLink.style.display = 'none'
        tempLink.href = imgUrl
        tempLink.setAttribute('download', 'chat-shot.png')
        if (typeof tempLink.download === 'undefined')
          tempLink.setAttribute('target', '_blank')

        document.body.appendChild(tempLink)
        tempLink.click()
        document.body.removeChild(tempLink)
        window.URL.revokeObjectURL(imgUrl)
        d.loading = false
        ms.success(t('chat.exportSuccess'))
        Promise.resolve()
      }
      catch (error: any) {
        ms.error(t('chat.exportFailed'))
      }
      finally {
        d.loading = false
      }
    },
  })
}

function handleDelete(index: number) {
  if (loading.value)
    return

  dialog.warning({
    title: t('chat.deleteMessage'),
    content: t('chat.deleteMessageConfirm'),
    positiveText: t('common.yes'),
    negativeText: t('common.no'),
    onPositiveClick: () => {
      chatStore.deleteChatByUuid(uuid.value, index)
    },
  })
}

function handleEdit(index: number) {
  if (loading.value)
    return

  editingIndex.value = index
  editingText.value = dataSources.value[index].text.slice()
}

function cancelEdit() {
  editingIndex.value = -1
  editingText.value = ''
}

function updateEdit(index: number) {
  if (editingText.value.trim() === '')
    return
  if (editingText.value === dataSources.value[index].text) {
    cancelEdit()
    return
  }

  const newText = editingText.value
  cancelEdit()

  // Destroy context from 'index' onwards to recreate this branch
  const len = dataSources.value.length
  for (let i = len - 1; i >= index; i--)
    chatStore.deleteChatByUuid(uuid.value, i)

  // Trigger submission with edited text
  prompt.value = newText
  handleSubmit()
}

function adjustTextareaHeight(e: Event) {
  const target = e.target as HTMLTextAreaElement
  target.style.height = 'auto'
  target.style.height = `${target.scrollHeight}px`
}

function handleClear() {
  if (loading.value)
    return

  dialog.warning({
    title: t('chat.clearChat'),
    content: t('chat.clearChatConfirm'),
    positiveText: t('common.yes'),
    negativeText: t('common.no'),
    onPositiveClick: () => {
      chatStore.clearChatByUuid(uuid.value)
    },
  })
}

function handleEnter(event: KeyboardEvent) {
  if (!isMobile.value) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      handleSubmit()
    }
  }
  else {
    if (event.key === 'Enter' && event.ctrlKey) {
      event.preventDefault()
      handleSubmit()
    }
  }
}

function handleStop() {
  if (loading.value) {
    homeStore.setMyData({ act: 'abort' })
    controller.abort()
    loading.value = false
  }
}

const searchOptions = computed(() => {
  if (prompt.value.startsWith('/')) {
    const abc = promptTemplate.value
      .filter((item: { key: string }) =>
        item.key.toLowerCase().includes(prompt.value.substring(1).toLowerCase()),
      )
      .map((obj: { value: any }) => {
        return {
          label: obj.value,
          value: obj.value,
        }
      })
    return abc
  }
  else if (prompt.value == '@') {
    const abc = gptsUlistStore.myData.slice(0, 10).map((v: gptsType) => {
      return {
        label: v.info,
        gpts: v,
        value: v.gid,
      }
    })
    return abc
  }
  else {
    return []
  }
})

const renderOption = (option: { label: string; gpts?: gptsType }) => {
  if (prompt.value == '@') {
    return [
      h(
        'div',
        {
          class: 'flex justify-start items-center',
          onclick: () => {
            if (option.gpts)
              goUseGpts(option.gpts)
            prompt.value = ''
            setTimeout(() => (prompt.value = ''), 80)
          },
        },
        [
          h(NAvatar, {
            'src': option.gpts?.logo,
            'fallback-src': 'https://cos.aitutu.cc/gpts/3.5net.png',
            'size': 'small',
            'round': true,
            'class': 'w-8 h-8',
          }),
          h('span', { class: 'pl-1' }, option.gpts?.name),
          h(
            'span',
            { class: 'line-clamp-1 flex-1 pl-1 opacity-50' },
            option.label,
          ),
        ],
      ),
    ]
  }
  for (const i of promptTemplate.value) {
    if (i.value === option.label)
      return [i.key]
  }

  return []
}

const goUseGpts = async (item: gptsType) => {
  const saveObj = { model: `${item.gid}`, gpts: item }
  gptConfigStore.setMyData(saveObj)
  if (chatStore.active) {
    const chatSet = new chatSetting(chatStore.active)
    chatSet.save(saveObj)
  }
  ms.success(t('mjchat.success2'))
  const gptUrl = 'https://gpts.ddaiai.com/open/gptsapi/use'
  myFetch(gptUrl, item)

  if (homeStore.myData.local !== 'Chat')
    router.replace({ name: 'Chat', params: { uuid: chatStore.active } })

  gptsUlistStore.setMyData(item)
}

const placeholder = computed(() => {
  return 'Ask Gemini 3'
})

const buttonDisabled = computed(() => {
  return loading.value || !prompt.value || prompt.value.trim() === ''
})

const footerClass = computed(() => {
  return ['gemini-footer']
})

onMounted(() => {
  homeStore.setMyData({ local: 'Gemini' })
  scrollToBottom()
  if (inputRef.value && !isMobile.value)
    inputRef.value?.focus()
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  if (loading.value)
    controller.abort()
  homeStore.setMyData({ isLoader: false })
  document.removeEventListener('click', handleClickOutside)
})

const local = computed(() => homeStore.myData.local)

watch(
  () => homeStore.myData.act,
  (n) => {
    if (n == 'draw')
      scrollToBottom()
    if (n == 'scrollToBottom')
      scrollToBottom()
    if (n == 'scrollToBottomIfAtBottom')
      scrollToBottomIfAtBottom()
    if (n == 'gpt.submit' || n == 'gpt.resubmit') {
      loading.value = true
      if (chatStore.active) {
        const chatSet = new chatSetting(chatStore.active)
        if (chatSet.findIndex() == -1) {
          chatSet.save(chatSet.getGptConfig())
          setTimeout(() => homeStore.setMyData({ act: 'saveChat' }), 600)
        }
      }
    }
    if (n == 'stopLoading')
      loading.value = false
  },
)

watch(
  () => loading.value,
  n => homeStore.setMyData({ isLoader: n }),
)

const ychat = computed(() => {
  let text = prompt.value
  if (loading.value)
    text = ''
  return { text, dateTime: t('chat.preview') } as Chat.Chat
})

const quickActions = [
  { label: 'For you', icon: '' },
  { label: 'Create image', icon: '🖼️' },
  { label: 'Create music', icon: '🎸' },
  { label: 'Help me learn', icon: '' },
  { label: 'Write anything', icon: '' },
  { label: 'Boost my day', icon: '' },
]

function handleQuickAction(label: string) {
  prompt.value = label
  handleSubmit()
}

function handleUploadClick() {
  showUploadMenu.value = !showUploadMenu.value
  showToolsMenu.value = false
}

function handleToolsClick() {
  showToolsMenu.value = !showToolsMenu.value
  showUploadMenu.value = false
}

// 模型列表
const modelList = [
  {
    id: 'Fast',
    name: 'Fast',
    description: 'Answers quickly',
  },
  {
    id: 'Thinking',
    name: 'Thinking',
    description: 'Solves complex problems',
  },
  {
    id: 'Pro',
    name: 'Pro',
    description: 'Advanced math and code with 3.1 Pro',
  },
]

function handleModelClick() {
  showModelMenu.value = !showModelMenu.value
  showUploadMenu.value = false
  showToolsMenu.value = false
}

function selectModel(modelId: string) {
  currentModel.value = modelId
  showModelMenu.value = false
}

// 点击外部关闭菜单
function handleClickOutside(event: MouseEvent) {
  const target = event.target as HTMLElement
  if (!target.closest('.upload-menu-container') && !target.closest('.tools-menu-container') && !target.closest('.model-menu-container'))
    closeAllMenus()
}

function closeAllMenus() {
  showUploadMenu.value = false
  showToolsMenu.value = false
  showModelMenu.value = false
}

function openFileSelector() {
  fileInputRef.value?.click()
  showUploadMenu.value = false
}

async function handleFileUpload(event: Event) {
  const target = event.target as HTMLInputElement
  const files = target.files
  if (!files || files.length === 0)
    return

  loading.value = true
  try {
    const formData = new FormData()
    formData.append('image', files[0])

    const response = await uploadImage(formData)
    if ((response as any).url) {
      prompt.value = `![Image](${(response as any).url})`
      inputRef.value?.focus()
    }
  }
  catch (error) {
    ms.error(t('common.wrong'))
  }
  finally {
    loading.value = false
    target.value = ''
  }
}
</script>

<template>
  <div class="gemini-container">
    <!-- Header -->
    <header class="gemini-header">
      <div class="header-left">
        <span class="gemini-logo">Gemini</span>
      </div>
      <div class="header-right relative">
        <button class="w-10 h-10 flex items-center justify-center rounded-full transition-colors gemini-action-btn" @click="handleShare">
          <SvgIcon icon="ri:share-line" class="text-[20px]" />
        </button>
        <NDropdown trigger="click" :options="currentActionOptions" placement="bottom-end" @select="handleCurrentAction">
          <button class="w-10 h-10 flex items-center justify-center rounded-full transition-colors gemini-action-btn">
            <SvgIcon icon="ri:more-2-fill" class="text-[20px]" />
          </button>
        </NDropdown>
        <div class="user-avatar-ring">
          <div class="user-avatar-inner">
            <template v-if="userInfo.avatar">
              <img :src="userInfo.avatar" alt="User">
            </template>
            <template v-else>
              <img :src="`https://api.dicebear.com/7.x/avataaars/svg?seed=${userInfo.name}`" alt="User">
            </template>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="gemini-main">
      <!-- Welcome Screen -->
      <div v-if="!dataSources.length" class="welcome-screen">
        <div class="welcome-content">
          <div class="welcome-header">
            <div class="gemini-icon">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" fill="url(#gemini-gradient)" />
                <defs>
                  <linearGradient id="gemini-gradient" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
                    <stop stop-color="#4285F4" />
                    <stop offset="0.5" stop-color="#9B72CB" />
                    <stop offset="1" stop-color="#D96570" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <h1 class="welcome-title">
              Hi {{ userInfo.name || 'shamsu' }}
            </h1>
          </div>
          <h2 class="welcome-subtitle">
            What should we try today?
          </h2>
        </div>
      </div>

      <!-- Chat Messages -->
      <div v-else ref="scrollRef" class="chat-messages">
        <div class="messages-container">
          <template v-for="(item, index) of dataSources" :key="index">
            <!-- Inline Edit Mode -->
            <div v-if="editingIndex === index" class="gemini-inline-edit-container">
              <div class="gemini-inline-edit-box">
                <textarea v-model="editingText" class="gemini-inline-edit-textarea" rows="1" @input="adjustTextareaHeight" />
              </div>
              <div class="gemini-inline-edit-actions">
                <button class="gemini-inline-edit-btn cancel" @click="cancelEdit">
                  Cancel
                </button>
                <button
                  class="gemini-inline-edit-btn update"
                  :class="{ active: editingText.trim() !== item.text.trim() }"
                  @click="updateEdit(index)"
                >
                  Update
                </button>
              </div>
            </div>

            <!-- Normal Message -->
            <Message
              v-else
              :date-time="item.dateTime"
              :text="item.text"
              :inversion="item.inversion"
              :error="item.error"
              :loading="item.loading"
              :chat="item"
              :index="index"
              class="gemini-message"
              @regenerate="onRegenerate(index)"
              @delete="handleDelete(index)"
              @edit="handleEdit(index)"
            />
          </template>

          <Message
            v-if="ychat.text"
            :key="dataSources.length"
            :inversion="true"
            :chat="ychat"
            :text="ychat.text"
            :index="dataSources.length"
            class="gemini-message"
          />
          <div v-if="loading" class="stop-button-container">
            <button class="stop-button" @click="handleStop">
              <SvgIcon icon="ri:stop-circle-line" />
              Stop responding
            </button>
          </div>
        </div>
      </div>

      <!-- Input Area -->
      <div class="input-area">
        <div class="input-container">
          <div class="input-box">
            <input
              ref="inputRef"
              v-model="prompt"
              type="text"
              :placeholder="placeholder"
              class="gemini-input"
              @keypress="handleEnter"
            >
          </div>
          <div class="input-actions">
            <div class="upload-menu-container">
              <button class="action-btn" title="Add attachment" @click="handleUploadClick">
                <SvgIcon icon="ri:add-line" />
              </button>
              <div v-if="showUploadMenu" class="upload-menu">
                <button class="upload-menu-item" @click="openFileSelector">
                  <SvgIcon icon="ri:image-line" />
                  <span>Upload image</span>
                </button>
                <button class="upload-menu-item">
                  <SvgIcon icon="ri:file-text-line" />
                  <span>Upload document</span>
                </button>
              </div>
            </div>
            <div class="tools-menu-container">
              <button class="action-btn" title="Tools" @click="handleToolsClick">
                <SvgIcon icon="ri:tools-line" />
                <span>Tools</span>
              </button>
              <div v-if="showToolsMenu" class="tools-menu">
                <div class="tools-menu-header">
                  <h3>Tools</h3>
                </div>
                <div class="tools-menu-items">
                  <button class="tools-menu-item">
                    <SvgIcon icon="ri:image-line" />
                    <span>Create image</span>
                  </button>
                  <button class="tools-menu-item">
                    <SvgIcon icon="ri:layout-grid-line" />
                    <span>Canvas</span>
                  </button>
                  <button class="tools-menu-item">
                    <SvgIcon icon="ri:search-line" />
                    <span>Deep research</span>
                  </button>
                  <button class="tools-menu-item">
                    <SvgIcon icon="ri:video-line" />
                    <span>Create video</span>
                  </button>
                  <button class="tools-menu-item">
                    <SvgIcon icon="ri:music-line" />
                    <span>Create music</span>
                    <span class="new-badge">New</span>
                  </button>
                  <button class="tools-menu-item">
                    <SvgIcon icon="ri:book-line" />
                    <span>Guided learning</span>
                  </button>
                </div>
                <div class="tools-menu-footer">
                  <div class="experimental-features">
                    <span>Experimental features</span>
                    <span class="labs-badge">Labs</span>
                  </div>
                  <div class="personal-intelligence">
                    <span>Personal Intelligence</span>
                    <label class="switch">
                      <input type="checkbox" checked>
                      <span class="slider round" />
                    </label>
                  </div>
                </div>
              </div>
            </div>
            <div class="spacer" />
            <div class="model-menu-container">
              <button class="action-btn model-selector" @click="handleModelClick">
                <span>{{ currentModel }}</span>
                <SvgIcon icon="ri:arrow-down-s-line" />
              </button>
              <div v-if="showModelMenu" class="model-menu">
                <div class="model-menu-header">
                  <h3>Gemini 3</h3>
                </div>
                <div class="model-menu-items">
                  <button
                    v-for="model in modelList"
                    :key="model.id"
                    class="model-menu-item"
                    :class="{ active: currentModel === model.id }"
                    @click="selectModel(model.id)"
                  >
                    <div class="model-info">
                      <span class="model-name">{{ model.name }}</span>
                      <span class="model-description">{{ model.description }}</span>
                    </div>
                    <div v-if="currentModel === model.id" class="model-check">
                      <div class="check-circle">
                        <SvgIcon icon="ri:check-line" />
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
            <button class="action-btn mic-btn" title="Voice input">
              <SvgIcon icon="ri:mic-line" />
            </button>
          </div>
          <input
            ref="fileInputRef"
            type="file"
            accept="image/*"
            class="file-input"
            @change="handleFileUpload"
          >
        </div>

        <!-- Quick Actions -->
        <div v-if="!dataSources.length" class="quick-actions">
          <button
            v-for="action in quickActions"
            :key="action.label"
            class="quick-action-btn"
            @click="handleQuickAction(action.label)"
          >
            <span v-if="action.icon" class="action-icon">{{ action.icon }}</span>
            <span>{{ action.label }}</span>
          </button>
        </div>

        <div class="gemini-disclaimer">
          Gemini is AI and can make mistakes.
        </div>
      </div>
    </main>
  </div>

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
.gemini-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #ffffff;
  font-family: 'Google Sans', 'Roboto', -apple-system, BlinkMacSystemFont, sans-serif;
}

/* Header */
.gemini-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 24px;
  background: transparent;
}

.header-left {
  display: flex;
  align-items: center;
}

.gemini-logo {
  font-size: 22px;
  font-weight: 500;
  color: #5f6368;
  letter-spacing: -0.5px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.gemini-action-btn {
  color: #444746 !important;
  cursor: pointer !important;
  opacity: 1 !important;
  pointer-events: auto !important;
}

.gemini-action-btn:hover {
  background-color: rgba(0, 0, 0, 0.05) !important;
}

.user-avatar-ring {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: conic-gradient(from 225deg, #fbbd04 0deg 90deg, #ea4335 90deg 180deg, #4285f4 180deg 270deg, #34a853 270deg 360deg);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.user-avatar-inner {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background-color: #f0f4f9;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.user-avatar-inner img {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  object-fit: cover;
}

/* Main Content */
.gemini-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
}

/* Welcome Screen */
.welcome-screen {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
}

.welcome-content {
  text-align: center;
  max-width: 600px;
  padding: 40px 20px;
}

.welcome-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 16px;
}

.gemini-icon {
  width: 24px;
  height: 24px;
}

.gemini-icon svg {
  width: 100%;
  height: 100%;
}

.welcome-title {
  font-size: 24px;
  font-weight: 400;
  color: #202124;
  margin: 0;
}

.welcome-subtitle {
  font-size: 32px;
  font-weight: 400;
  color: #5f6368;
  margin: 0;
  line-height: 1.2;
}

/* Chat Messages */
.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.messages-container {
  max-width: 800px;
  margin: 0 auto;
}

.stop-button-container {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.stop-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: #fff;
  border: 1px solid #dadce0;
  border-radius: 20px;
  color: #5f6368;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.stop-button:hover {
  background: #f1f3f4;
}

/* Input Area */
.input-area {
  padding: 0 20px 20px;
  background: #ffffff;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.input-container {
  width: 100%;
  max-width: 820px;
  margin: 0 auto;
  background: #ffffff;
  border-radius: 24px;
  border: 1px solid #e1e3e1;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
}

.input-box {
  margin-bottom: 8px;
}

.gemini-input {
  width: 100%;
  border: none;
  outline: none;
  font-size: 16px;
  color: #202124;
  background: transparent;
  padding: 8px 4px;
}

.gemini-input::placeholder {
  color: #9aa0a6;
}

.input-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border: none;
  background: transparent;
  color: #5f6368;
  font-size: 14px;
  cursor: pointer;
  border-radius: 8px;
  transition: background 0.2s;
}

.action-btn:hover {
  background: #f1f3f4;
}

.spacer {
  flex: 1;
}

.model-selector {
  font-weight: 500;
  background: #e8eaed;
  border-radius: 12px;
  padding: 6px 12px;
  color: #1f1f1f;
}

.gemini-disclaimer {
  font-size: 12px;
  color: #5f6368;
  text-align: center;
  margin-top: 16px;
}

/* Chat Messages Specific Gemini Overrides */
.gemini-container :deep(.gemini-message) {
  margin-bottom: 32px !important;
}

/* Hide user avatar container and left-margin on inversion */
.gemini-container :deep(.gemini-message.flex-row-reverse .basis-8) {
  display: none !important;
}

/* User Message Bubble */
.gemini-container :deep(.gemini-message .message-request) {
  background-color: #f0f4f9 !important;
  color: #202124 !important;
  border-radius: 24px !important;
  padding: 12px 24px !important;
  max-width: 80% !important;
  box-shadow: none !important;
}

/* Bot Message Bubble */
.gemini-container :deep(.gemini-message .message-reply) {
  background-color: transparent !important;
  color: #202124 !important;
  padding: 4px 0 !important;
  box-shadow: none !important;
}

/* Bot Sparkle Avatar */
.gemini-container :deep(.gemini-message:not(.flex-row-reverse) > .basis-8) {
  background: transparent !important;
  position: relative;
}

.gemini-container :deep(.gemini-message:not(.flex-row-reverse) > .basis-8 > *) {
  visibility: hidden;
}

/* Inject the sparkle icon using pseudo-element */
.gemini-container :deep(.gemini-message:not(.flex-row-reverse) > .basis-8::after) {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><defs><linearGradient id="g" x1="15%" y1="0%" x2="85%" y2="100%"><stop offset="0%" stop-color="%2386a8fe" /><stop offset="50%" stop-color="%23437afe" /><stop offset="100%" stop-color="%231e5bf0" /></linearGradient></defs><path d="M12 0C12 6.62742 17.3726 12 24 12C17.3726 12 12 17.3726 12 24C12 17.3726 6.62742 12 0 12C6.62742 12 12 6.62742 12 0Z" fill="url(%23g)"/></svg>');
  background-size: 22px 22px;
  background-repeat: no-repeat;
  background-position: center top;
  visibility: visible;
}

/* Hide date/time for bot messages, replaced by Show thinking */
.gemini-container :deep(.gemini-message:not(.flex-row-reverse) > div.overflow-hidden > p.text-xs) {
  display: none !important;
}

/* Unhide and space Show thinking button */
.gemini-container :deep(.gemini-show-thinking-wrapper.hidden) {
  display: block !important;
}
.gemini-container :deep(.gemini-show-thinking-wrapper) {
  margin-top: 0;
  margin-left: 0;
  height: 32px;
  display: flex !important;
  align-items: center;
}
.gemini-container :deep(.gemini-show-thinking-btn) {
  font-family: inherit;
  color: #1f1f1f;
  background-color: transparent;
  padding: 4px 12px;
}
.gemini-container :deep(.gemini-show-thinking-btn:hover) {
  background-color: #f0f4f9;
}

/* Message Action Buttons formatting (under message) */
.gemini-container :deep(.gemini-message .message-actions-wrapper) {
  flex-direction: column !important;
  align-items: flex-start !important;
}
.gemini-container :deep(.gemini-message.flex-row-reverse .message-actions-wrapper) {
  align-items: flex-end !important;
}
.gemini-container :deep(.message-action-buttons) {
  margin-top: 8px;
  margin-left: -4px;
}

/* Inline Edit */
.gemini-container :deep(.gemini-inline-edit-container) {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 820px;
  margin: 0 auto;
  margin-bottom: 24px;
  align-items: flex-end;
}
.gemini-container :deep(.gemini-inline-edit-box) {
  width: 100%;
  background: #ffffff;
  border: 2px solid #0b57d0;
  border-radius: 20px;
  padding: 16px 20px;
  margin-bottom: 12px;
}
.gemini-container :deep(.gemini-inline-edit-textarea) {
  width: 100%;
  border: none;
  outline: none;
  resize: none;
  font-size: 16px;
  color: #1f1f1f;
  background: transparent;
  line-height: 1.5;
  font-family: inherit;
  overflow: hidden;
}
.gemini-container :deep(.gemini-inline-edit-actions) {
  display: flex;
  gap: 8px;
}
.gemini-container :deep(.gemini-inline-edit-btn) {
  border: none;
  border-radius: 24px;
  padding: 10px 24px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}
.gemini-container :deep(.gemini-inline-edit-btn.cancel) {
  background: transparent;
  color: #0b57d0;
}
.gemini-container :deep(.gemini-inline-edit-btn.cancel:hover) {
  background: #f0f4f9;
}
.gemini-container :deep(.gemini-inline-edit-btn.update) {
  background: #e3e3e3;
  color: #8b8b8b;
  pointer-events: none;
}
.gemini-container :deep(.gemini-inline-edit-btn.update.active) {
  background: #0b57d0;
  color: #ffffff;
  pointer-events: auto;
}
.gemini-container :deep(.gemini-inline-edit-btn.update.active:hover) {
  background: #0842a0;
  color: #ffffff;
}

/* Fix raw text color for bot messages */
.gemini-container :deep(.markdown-body) {
  --color-fg-default: #202124 !important;
  background-color: transparent !important;
}
.gemini-container :deep(.message-reply .whitespace-pre-wrap) {
  color: #202124;
}

.model-selector:hover {
  background: #dce0e3;
}

.mic-btn {
  padding: 8px;
}

/* File Input */
.file-input {
  display: none;
}

/* Upload Menu */
.upload-menu-container {
  position: relative;
}

.upload-menu {
  position: absolute;
  bottom: 100%;
  left: 0;
  margin-bottom: 8px;
  background: #fff;
  border: 1px solid #dadce0;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  min-width: 180px;
  z-index: 1000;
  overflow: hidden;
}

.upload-menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  width: 100%;
  border: none;
  background: transparent;
  color: #202124;
  font-size: 14px;
  cursor: pointer;
  text-align: left;
  transition: background 0.2s;
}

.upload-menu-item:hover {
  background: #f1f3f4;
}

/* Tools Menu */
.tools-menu-container {
  position: relative;
}

.tools-menu {
  position: absolute;
  bottom: 100%;
  left: 0;
  margin-bottom: 8px;
  background: #fff;
  border: 1px solid #dadce0;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  min-width: 200px;
  z-index: 1000;
  overflow: hidden;
}

.tools-menu-header {
  padding: 12px 16px;
  border-bottom: 1px solid #e8eaed;
  background: #f8f9fa;
}

.tools-menu-header h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 500;
  color: #202124;
}

.tools-menu-items {
  padding: 8px 0;
}

.tools-menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  width: 100%;
  border: none;
  background: transparent;
  color: #202124;
  font-size: 14px;
  cursor: pointer;
  text-align: left;
  transition: background 0.2s;
  position: relative;
}

.tools-menu-item:hover {
  background: #f1f3f4;
}

.new-badge {
  margin-left: auto;
  padding: 2px 6px;
  background: #1a73e8;
  color: #fff;
  font-size: 10px;
  font-weight: 500;
  border-radius: 10px;
  text-transform: uppercase;
}

.tools-menu-footer {
  padding: 12px 16px;
  border-top: 1px solid #e8eaed;
  background: #f8f9fa;
}

.experimental-features {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.experimental-features span {
  font-size: 12px;
  color: #5f6368;
}

.labs-badge {
  padding: 2px 6px;
  background: #dadce0;
  color: #202124;
  font-size: 10px;
  font-weight: 500;
  border-radius: 10px;
}

.personal-intelligence {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.personal-intelligence span {
  font-size: 12px;
  color: #202124;
  font-weight: 500;
}

/* Model Menu */
.model-menu-container {
  position: relative;
}

.model-menu {
  position: absolute;
  bottom: 100%;
  left: 0;
  margin-bottom: 12px;
  background: #e9eef6;
  border: none;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05), 0 1px 3px rgba(0,0,0,0.05);
  min-width: 260px;
  z-index: 1000;
  overflow: hidden;
}

.model-menu-header {
  padding: 16px 16px 8px 16px;
  background: transparent;
  border-bottom: none;
}

.model-menu-header h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 500;
  color: #1f1f1f;
}

.model-menu-items {
  padding: 0 8px 8px 8px;
}

.model-menu-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  width: 100%;
  margin: 0;
  border: none;
  background: transparent;
  color: #1f1f1f;
  font-size: 14px;
  cursor: pointer;
  text-align: left;
  transition: all 0.2s;
  border-radius: 8px;
  border-bottom: none;
}

.model-menu-item:last-child {
  border-bottom: none;
}

.model-menu-item:hover {
  background: rgba(0, 0, 0, 0.04);
}

.model-menu-item.active {
  background: transparent;
  border: none;
  box-shadow: none;
}

.model-info {
  flex: 1;
}

.model-name {
  display: block;
  font-weight: 500;
  margin-bottom: 2px;
  color: #1f1f1f;
}

.model-description {
  display: block;
  font-size: 12px;
  color: #5f6368;
}

.model-check {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 12px;
}

.check-circle {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #0a56d0;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
}

.check-circle svg {
  width: 12px;
  height: 12px;
}

/* Switch */
.switch {
  position: relative;
  display: inline-block;
  width: 36px;
  height: 20px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #dadce0;
  transition: .4s;
}

.slider:before {
  position: absolute;
  content: "";
  height: 16px;
  width: 16px;
  left: 2px;
  bottom: 2px;
  background-color: white;
  transition: .4s;
}

input:checked + .slider {
  background-color: #1a73e8;
}

input:checked + .slider:before {
  transform: translateX(16px);
}

.slider.round {
  border-radius: 20px;
}

.slider.round:before {
  border-radius: 50%;
}

/* Quick Actions */
.quick-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
  margin-top: 16px;
  max-width: 720px;
  margin-left: auto;
  margin-right: auto;
}

.quick-action-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  background: #fff;
  border: 1px solid #dadce0;
  border-radius: 20px;
  color: #5f6368;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.quick-action-btn:hover {
  background: #f1f3f4;
  border-color: #bdc1c6;
}

.action-icon {
  font-size: 16px;
}

/* Scrollbar */
.chat-messages::-webkit-scrollbar {
  width: 8px;
}

.chat-messages::-webkit-scrollbar-track {
  background: transparent;
}

.chat-messages::-webkit-scrollbar-thumb {
  background: #dadce0;
  border-radius: 4px;
}

.chat-messages::-webkit-scrollbar-thumb:hover {
  background: #bdc1c6;
}

/* Responsive */
@media (max-width: 768px) {
  .gemini-header {
    padding: 12px 16px;
  }

  .welcome-title,
  .welcome-subtitle {
    font-size: 24px;
  }

  .quick-actions {
    padding: 0 10px;
  }

  .quick-action-btn {
    font-size: 13px;
    padding: 8px 12px;
  }
}
</style>
