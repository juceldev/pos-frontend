import type { Unit } from '~/types/product'

interface PaginatedUnits {
  data: Unit[]
  meta: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
}

export function useUnits () {
  const { $api } = useNuxtApp()

  const units = ref<Unit[]>([])
  const unitsList = ref<Unit[]>([])
  const meta = ref({
    page: 1,
    lastPage: 1,
    perPage: 15,
    total: 0
  })
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchUnits () {
    loading.value = true
    error.value = null
    try {
      const response = await $api('/api/units/lookup') as any
      units.value = response?.data ?? response ?? []
    } catch (err: any) {
      error.value = err?.data?.message || 'Failed to load units'
    } finally {
      loading.value = false
    }
  }

  async function fetchUnitsList (filters: Record<string, any> = {}) {
    loading.value = true
    error.value = null
    try {
      const response = await $api<PaginatedUnits>('/api/units', {
        query: filters
      })
      unitsList.value = response.data ?? []
      meta.value = {
        page: response.meta.current_page,
        lastPage: response.meta.last_page,
        perPage: response.meta.per_page,
        total: response.meta.total
      }
    } catch (err: any) {
      error.value = err?.data?.message || 'Failed to load units'
    } finally {
      loading.value = false
    }
  }

  async function createUnit (data: Partial<Unit>) {
    try {
      const response = await $api('/api/units', {
        method: 'POST',
        body: data
      }) as any
      return response?.data ?? response
    } catch (err: any) {
      error.value = err?.data?.message || 'Failed to create unit'
      return null
    }
  }

  async function updateUnit (id: number, data: Partial<Unit>) {
    try {
      const response = await $api(`/api/units/${id}`, {
        method: 'PUT',
        body: data
      }) as any
      return response?.data ?? response
    } catch (err: any) {
      error.value = err?.data?.message || 'Failed to update unit'
      return null
    }
  }

  async function deleteUnit (id: number) {
    try {
      await $api(`/api/units/${id}`, { method: 'DELETE' })
      return true
    } catch (err: any) {
      error.value = err?.data?.message || 'Failed to delete unit'
      return false
    }
  }

  return {
    units,
    unitsList,
    meta,
    loading,
    error,
    fetchUnits,
    fetchUnitsList,
    createUnit,
    updateUnit,
    deleteUnit
  }
}
