import type { User } from '~/types/user'

interface PaginatedUsers {
  data: User[]
  meta: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
}

export function useUsers () {
  const { $api } = useNuxtApp()

  const usersList = ref<User[]>([])
  const meta = ref({
    page: 1,
    lastPage: 1,
    perPage: 15,
    total: 0
  })
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchUsersList (filters: Record<string, any> = {}) {
    loading.value = true
    error.value = null
    try {
      const response = await $api<PaginatedUsers>('/api/users', {
        query: filters
      })
      usersList.value = response.data ?? []
      meta.value = {
        page: response.meta.current_page,
        lastPage: response.meta.last_page,
        perPage: response.meta.per_page,
        total: response.meta.total
      }
    } catch (err: any) {
      error.value = err?.data?.message || 'Failed to load users'
    } finally {
      loading.value = false
    }
  }

  async function createUser (data: Partial<User>) {
    try {
      const response = await $api('/api/users', {
        method: 'POST',
        body: data
      }) as any
      return response?.data ?? response
    } catch (err: any) {
      error.value = err?.data?.message || 'Failed to create user'
      return null
    }
  }

  async function updateUser (id: number, data: Partial<User>) {
    try {
      const response = await $api(`/api/users/${id}`, {
        method: 'PUT',
        body: data
      }) as any
      return response?.data ?? response
    } catch (err: any) {
      error.value = err?.data?.message || 'Failed to update user'
      return null
    }
  }

  async function deleteUser (id: number) {
    try {
      await $api(`/api/users/${id}`, { method: 'DELETE' })
      return true
    } catch (err: any) {
      error.value = err?.data?.message || 'Failed to delete user'
      return false
    }
  }

  return {
    usersList,
    meta,
    loading,
    error,
    fetchUsersList,
    createUser,
    updateUser,
    deleteUser
  }
}
