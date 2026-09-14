import { defineStore } from 'pinia'

interface User {
  id: number
  name: string
  username: string
  email: string
  role: string
  roles?: string[]
  permissions?: string[]
}

export const useAuthStore = defineStore('auth', () => {
  const config = useRuntimeConfig()
  const token = ref<string | null>(null)
  const user = ref<User | null>(null)
  const loading = ref(false)
  const ready = ref(false)
  const error = ref<string | null>(null)

  const isLoggedIn = computed(() => !!token.value && !!user.value)
  const permissions = computed(() => user.value?.permissions ?? [])

  function loadFromStorage () {
    if (import.meta.client) {
      const storedToken = localStorage.getItem('pos_token')
      const storedUser = localStorage.getItem('pos_user')
      if (storedToken) {
        token.value = storedToken
      }
      if (storedUser) {
        try {
          user.value = JSON.parse(storedUser)
        } catch {
          user.value = null
        }
      }
      ready.value = true
    }
  }

  function saveToStorage () {
    if (import.meta.client) {
      if (token.value) {
        localStorage.setItem('pos_token', token.value)
      } else {
        localStorage.removeItem('pos_token')
      }
      if (user.value) {
        localStorage.setItem('pos_user', JSON.stringify(user.value))
      } else {
        localStorage.removeItem('pos_user')
      }
    }
  }

  async function login (username: string, password: string) {
    loading.value = true
    error.value = null
    try {
      const response = await $fetch<{ token: string; user: User }>(`${config.public.apiBaseUrl}/api/login`, {
        method: 'POST',
        body: { username, password }
      })
      token.value = response.token
      user.value = response.user
      saveToStorage()
      return true
    } catch (err: any) {
      error.value = err?.data?.message || err?.message || 'Login failed'
      return false
    } finally {
      loading.value = false
    }
  }

  async function logout () {
    if (!token.value) return
    try {
      await $fetch(`${config.public.apiBaseUrl}/api/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token.value}` }
      })
    } finally {
      token.value = null
      user.value = null
      saveToStorage()
    }
  }

  function setAuthHeader () {
    return token.value ? { Authorization: `Bearer ${token.value}` } : {}
  }

  return {
    token,
    user,
    loading,
    ready,
    error,
    isLoggedIn,
    permissions,
    login,
    logout,
    loadFromStorage,
    saveToStorage,
    setAuthHeader
  }
})
