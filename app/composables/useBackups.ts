import type { DatabaseBackup, PaginatedBackups } from '~/types/backup'

export function useBackups () {
  const { $api } = useNuxtApp()

  const backups = ref<DatabaseBackup[]>([])
  const meta = ref({
    page: 1,
    lastPage: 1,
    perPage: 15,
    total: 0
  })
  const loading = ref(false)
  const creating = ref(false)
  const error = ref<string | null>(null)

  async function fetchBackups (filters: Record<string, any> = {}) {
    loading.value = true
    error.value = null
    try {
      const response = await $api<PaginatedBackups>('/api/settings/backups', {
        query: filters
      })
      backups.value = response.data ?? []
      meta.value = {
        page: response.meta.current_page,
        lastPage: response.meta.last_page,
        perPage: response.meta.per_page,
        total: response.meta.total
      }
    } catch (err: any) {
      error.value = err?.data?.message || 'Failed to load backups'
    } finally {
      loading.value = false
    }
  }

  async function createBackup () {
    creating.value = true
    error.value = null
    try {
      const response = await $api('/api/settings/backups', {
        method: 'POST',
        timeout: 600000
      }) as any
      return (response?.data ?? response) as DatabaseBackup
    } catch (err: any) {
      error.value = err?.data?.message || 'Failed to create backup'
      return null
    } finally {
      creating.value = false
    }
  }

  async function deleteBackup (id: number) {
    try {
      await $api(`/api/settings/backups/${id}`, { method: 'DELETE' })
      return true
    } catch (err: any) {
      error.value = err?.data?.message || 'Failed to delete backup'
      return false
    }
  }

  function downloadBackup (backup: DatabaseBackup) {
    if (import.meta.client) {
      window.open(buildApiUrl(`/api/settings/backups/${backup.id}/download`), '_blank')
    }
  }

  return {
    backups,
    meta,
    loading,
    creating,
    error,
    fetchBackups,
    createBackup,
    deleteBackup,
    downloadBackup
  }
}
