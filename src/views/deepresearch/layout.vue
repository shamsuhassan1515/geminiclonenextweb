<script setup lang='ts'>
import { computed, ref } from 'vue'
import { NLayout, NLayoutContent } from 'naive-ui'
import { useRouter } from 'vue-router'
import Sider from '../chat/layout/sider/index.vue'
import Permission from '../chat/layout/Permission.vue'
import { useBasicLayout } from '@/hooks/useBasicLayout'
import { homeStore, useAppStore, useAuthStore, useChatStore } from '@/store'
import { aiSider, aiFooter } from '@/views/mj'
import aiMobileMenu from '@/views/mj/aiMobileMenu.vue'

const router = useRouter()
const appStore = useAppStore()
const chatStore = useChatStore()
const authStore = useAuthStore()

homeStore.setMyData({ local: 'deepResearch' })
const { isMobile } = useBasicLayout()

const collapsed = computed(() => appStore.siderCollapsed)

const needPermission = computed(() => !!authStore.session?.auth && !authStore.token)

const getMobileClass = computed(() => {
  if (isMobile.value)
    return ['rounded-none', 'shadow-none']
  return ['shadow-md', 'dark:border-neutral-800']
})

const getContainerClass = computed(() => {
  return [
    'h-full',
    { 'abc': !isMobile.value && !collapsed.value },
  ]
})

const iframeUrl = ref('http://localhost:2026/workspace/chats/new')
</script>

<template>
  <div class="dark:bg-[#24272e] transition-all p-0" :class="[isMobile ? 'h55' : 'h-full']">
    <div class="h-full overflow-hidden" :class="getMobileClass">
      <NLayout class="z-40 transition" :class="getContainerClass" has-sider :sider-placement="isMobile ? 'left' : 'right'">
        <aiSider v-if="!isMobile" />

        <NLayoutContent class="h-full">
          <iframe
            :src="iframeUrl"
            class="w-full h-full border-0"
            allow="clipboard-write; microphone"
          />
        </NLayoutContent>
        <Sider />
      </NLayout>
    </div>
    <Permission :visible="needPermission" />
  </div>
  <aiMobileMenu v-if="isMobile" />
  <aiFooter />
</template>
<style>
.h55 {
  height: calc(100% - 55px)
}
</style>
