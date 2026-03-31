<template>
  <div class="login-form p-4">
    <h3 class="text-lg font-medium mb-4">登录 NewAPI 账号</h3>
    <form @submit.prevent="handleLogin">
      <div class="mb-3">
        <label class="block text-sm mb-1">用户名/邮箱</label>
        <input
          v-model="username"
          type="text"
          class="w-full px-3 py-2 border rounded-lg"
          placeholder="请输入用户名或邮箱"
          required
        />
      </div>
      <div class="mb-4">
        <label class="block text-sm mb-1">密码</label>
        <input
          v-model="password"
          type="password"
          class="w-full px-3 py-2 border rounded-lg"
          placeholder="请输入密码"
          required
        />
      </div>
      <div v-if="error" class="mb-3 text-red-500 text-sm">{{ error }}</div>
      <button
        type="submit"
        class="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
        :disabled="loading"
      >
        {{ loading ? '登录中...' : '登录' }}
      </button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '@/store/modules/auth'
import axios from 'axios'

const emit = defineEmits<{
  (e: 'success'): void
}>()

const authStore = useAuthStore()
const username = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

async function handleLogin() {
  loading.value = true
  error.value = ''

  try {
    const response = await axios.post('/api/newapi/login', {
      username: username.value,
      password: password.value
    })

    if (response.data.success) {
      authStore.login(response.data.token, response.data.user)
      emit('success')
    } else {
      error.value = response.data.message || '登录失败'
    }
  } catch (e: any) {
    error.value = e.response?.data?.message || '登录失败，请检查网络'
  } finally {
    loading.value = false
  }
}
</script>