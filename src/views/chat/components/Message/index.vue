<script setup lang='ts'>
import { computed, ref } from 'vue'
import { NDropdown, useMessage } from 'naive-ui'
import AvatarComponent from './Avatar.vue'
import TextComponent from './Text.vue'
import { SvgIcon } from '@/components/common'
import { useIconRender } from '@/hooks/useIconRender'
import { t } from '@/locales'
import { useBasicLayout } from '@/hooks/useBasicLayout'
import { copyToClip } from '@/utils/copy'
import { homeStore } from '@/store'
import { getSeed, isDallImageModel, mjImgUrl, mlog } from '@/api'

interface Props {
  dateTime?: string
  text?: string
  inversion?: boolean
  error?: boolean
  loading?: boolean
  chat: Chat.Chat
  index: number
}

const showResearchProcess = ref(false)

interface Emit {
  (ev: 'regenerate'): void
  (ev: 'delete'): void
  (ev: 'edit'): void
}

const props = defineProps<Props>()

const emit = defineEmits<Emit>()

const { isMobile } = useBasicLayout()

const { iconRender } = useIconRender()

const message = useMessage()

const textRef = ref<HTMLElement>()

const asRawText = ref(props.inversion && homeStore.myData.session.isCloseMdPreview)

const messageRef = ref<HTMLElement>()

const options = computed(() => {
  const common = [
    {
      label: t('chat.copy'),
      key: 'copyText',
      icon: iconRender({ icon: 'ri:file-copy-2-line' }),
    },
    {
      label: t('common.delete'),
      key: 'delete',
      icon: iconRender({ icon: 'ri:delete-bin-line' }),
    },
    {
      label: t('common.edit'),
      key: 'edit',
      icon: iconRender({ icon: 'ri:edit-2-line' }),
    },
  ]

  if (!props.inversion) {
    common.unshift({
      label: asRawText.value ? t('chat.preview') : t('chat.showRawText'),
      key: 'toggleRenderType',
      icon: iconRender({ icon: asRawText.value ? 'ic:outline-code-off' : 'ic:outline-code' }),
    })
    common.unshift({
      label: t('mj.tts'),
      key: 'tts',
      icon: iconRender({ icon: 'mdi:tts' }),
    })
  }

  return common
})

function handleSelect(key: 'copyText' | 'delete' | 'edit' | 'toggleRenderType' | 'tts') {
  switch (key) {
    case 'tts':
      homeStore.setMyData({ act: 'gpt.ttsv2', actData: { index: props.index, uuid: props.chat.uuid, text: props.text } })
      return
    case 'copyText':
      handleCopy()
      return
    case 'toggleRenderType':
      asRawText.value = !asRawText.value
      return
    case 'delete':
      emit('delete')
      return
    case 'edit':
      emit('edit')
  }
}

function handleRegenerate() {
  messageRef.value?.scrollIntoView()
  emit('regenerate')
}

async function handleCopy(txt?: string) {
  try {
    await copyToClip(txt || props.text || '')
    message.success(t('chat.copied'))
  }
  catch {
    message.error(t('mj.copyFail'))
  }
}

const sendReload = () => {
  homeStore.setMyData({ act: 'mjReload', actData: { mjID: props.chat.mjID } })
}

function handleRegenerate2() {
  messageRef.value?.scrollIntoView()
  // emit('regenerate')
  mlog('重新发送！')
  homeStore.setMyData({ act: 'gpt.resubmit', actData: { index: props.index, uuid: props.chat.uuid } })
}
</script>

<template>
  <div
    ref="messageRef"
    class="flex w-full mb-6 overflow-hidden"
    :class="[{ 'flex-row-reverse': inversion }]"
  >
    <div
      class="flex items-center justify-center flex-shrink-0 h-8 overflow-hidden rounded-full basis-8"
      :class="[inversion ? 'ml-2' : 'mr-2']"
    >
      <AvatarComponent :image="inversion" :logo="chat.logo" />
    </div>
    <div class="overflow-hidden text-sm " :class="[inversion ? 'items-end' : 'items-start']">
      <p class="text-xs group  text-[#b4bbc4] flex  items-center space-x-2 " :class="[inversion ? 'justify-end' : 'justify-start']">
        <span>{{ dateTime }}</span>
        <span v-if="chat.model" class="text-[#b4bbc4]/50">{{ chat.model }}</span>
        <!-- <span>{{ chat.opt?.progress }}</span> -->
        <template v-if="chat.opt?.status == 'SUCCESS'">
          <SvgIcon icon="ri:restart-line" class="cursor-pointer text-neutral-300 hover:text-neutral-800 dark:hover:text-neutral-300 " @click="sendReload" />

          <div class="cursor-pointer" @click="getSeed(chat, message)">
            <span v-if="chat.opt?.seed">Seed:{{ chat.opt?.seed }}</span>
            <span v-else>Seed</span>
          </div>
          <a :href=" mjImgUrl(chat.opt?.imageUrl)" class="hidden group-hover:block active  cursor-pointer underline " target="_blank">{{ $t('mj.ulink') }}</a>
        </template>
      </p>

      <div v-if="!inversion && !chat.mjID && !isDallImageModel(chat.model)" class="gemini-show-thinking-wrapper" :class="{ 'hidden': !chat.deepResearchData }">
        <button v-if="chat.deepResearchData" class="gemini-show-thinking-btn flex items-center text-[#202124] rounded-full text-[14px] font-medium transition-colors whitespace-nowrap" @click="showResearchProcess = !showResearchProcess">
          {{ showResearchProcess ? 'Hide research process' : 'Show research process' }} <SvgIcon :icon="showResearchProcess ? 'ri:arrow-up-s-line' : 'ri:arrow-down-s-line'" class="ml-1 text-lg" />
        </button>
      </div>

      <div v-if="!inversion && chat.deepResearchData && showResearchProcess" class="deep-research-process mt-2 p-3 bg-gray-100 rounded-lg text-xs max-h-60 overflow-y-auto">
        <div v-if="chat.deepResearchData.plan" class="mb-2">
          <div class="font-semibold text-gray-700">研究计划:</div>
          <div class="text-gray-600 whitespace-pre-wrap">{{ chat.deepResearchData.plan }}</div>
        </div>
        <div v-if="chat.deepResearchData.searchProcess" class="mb-2">
          <div class="font-semibold text-gray-700">搜索过程:</div>
          <div class="text-gray-600 whitespace-pre-wrap">{{ chat.deepResearchData.searchProcess }}</div>
        </div>
        <div v-if="chat.deepResearchData.thinkProcess">
          <div class="font-semibold text-gray-700">思考分析:</div>
          <div class="text-gray-600 whitespace-pre-wrap">{{ chat.deepResearchData.thinkProcess }}</div>
        </div>
      </div>

      <div
        class="flex items-end gap-1 mt-2 message-actions-wrapper"
        :class="[inversion ? 'flex-row-reverse' : 'flex-row']"
      >
        <TextComponent
          ref="textRef"
          :inversion="inversion"
          :error="error"
          :text="text"
          :loading="loading"
          :as-raw-text="asRawText"
          :chat="chat"
        />
        <div v-if="!chat.mjID && !isDallImageModel(chat.model)" class="message-action-buttons flex items-center gap-1">
          <!-- Thumbs Up -->
          <button v-if="!inversion" class="action-btn text-neutral-400 hover:text-neutral-800 transition-colors p-1 rounded-full hover:bg-neutral-100">
            <SvgIcon icon="ri:thumb-up-line" />
          </button>
          <!-- Thumbs Down -->
          <button v-if="!inversion" class="action-btn text-neutral-400 hover:text-neutral-800 transition-colors p-1 rounded-full hover:bg-neutral-100">
            <SvgIcon icon="ri:thumb-down-line" />
          </button>
          <!-- Regenerate -->
          <button
            v-if="!inversion"
            class="action-btn text-neutral-400 hover:text-neutral-800 transition-colors p-1 rounded-full hover:bg-neutral-100"
            @click="handleRegenerate2"
          >
            <SvgIcon icon="ri:restart-line" />
          </button>
          <!-- Copy -->
          <button v-if="!inversion" class="action-btn text-neutral-400 hover:text-neutral-800 transition-colors p-1 rounded-full hover:bg-neutral-100" @click="handleCopy()">
            <SvgIcon icon="ri:file-copy-line" />
          </button>
          <!-- More Options -->
          <NDropdown
            :trigger="isMobile ? 'click' : 'hover'"
            :placement="!inversion ? 'right' : 'left'"
            :options="options"
            @select="handleSelect"
          >
            <button class="action-btn more-btn text-neutral-400 hover:text-neutral-800 transition-colors p-1 rounded-full bg-[#f0f4f9] ml-1">
              <SvgIcon icon="ri:more-2-fill" />
            </button>
          </NDropdown>
        </div>
      </div>
    </div>
  </div>
</template>
