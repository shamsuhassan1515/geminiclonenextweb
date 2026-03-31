<template>
  <div class="user-panel p-4">
    <div class="flex items-center gap-3 mb-4">
      <div class="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium">
        {{ user?.username?.charAt(0).toUpperCase() }}
      </div>
      <div>
        <div class="font-medium">{{ user?.username }}</div>
        <div class="text-sm text-gray-500">已登录</div>
      </div>
    </div>
    <button
      @click="handleLogout"
      class="w-full px-4 py-2 border border-red-500 text-red-500 rounded-lg hover:bg-red-50"
    >
      退出登录
    </button>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '@/store/modules/auth'
import axios from 'axios'

const emit = defineEmits<{
  (e: 'success'): void
}>()

const authStore = useAuthStore()
const user = authStore.user

async function handleLogout() {
  try {
    await axios.post('/api/newapi/logout', {}, {
      headers: { Authorization: `Bearer ${authStore.token}` }
    })
  } catch {
    // ignore
  }
  authStore.logout()
  emit('success')
}
</script>