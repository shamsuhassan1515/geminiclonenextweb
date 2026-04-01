import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

interface AuthUser {
  id: number
  username: string
  email?: string
}

interface AuthState {
  token: string | null
  user: AuthUser | null
}

const STORAGE_KEY = 'auth'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(null)
  const user = ref<AuthUser | null>(null)

  const isLoggedIn = computed(() => !!token.value && !!user.value)

  function loadFromStorage() {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        const data = JSON.parse(stored)
        token.value = data.token
        user.value = data.user
      } catch {
        logout()
      }
    }
  }

  function login(newToken: string, newUser: AuthUser) {
    token.value = newToken
    user.value = newUser
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ token: newToken, user: newUser }))
  }

  function logout() {
    token.value = null
    user.value = null
    localStorage.removeItem(STORAGE_KEY)
  }

  // 初始化时加载
  loadFromStorage()

  return {
    token,
    user,
    isLoggedIn,
    login,
    logout,
    loadFromStorage
  }
})
