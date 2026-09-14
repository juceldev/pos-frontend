import type { StockMovement } from '~/types/stock'

interface PaginatedStockMovements {
  data: StockMovement[]
  meta: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
}

export function useStock () {
  const { $api } = useNuxtApp()

  const movements = ref<StockMovement[]>([])
  const meta = ref({
    page: 1,
    lastPage: 1,
    perPage: 15,
    total: 0
  })
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchMovements (filters: Record<string, any> = {}) {
    loading.value = true
    error.value = null
    try {
      const response = await $api<PaginatedStockMovements>('/api/stock-movements', {
        query: filters
      })
      movements.value = response.data ?? []
      meta.value = {
        page: response.meta.current_page,
        lastPage: response.meta.last_page,
        perPage: response.meta.per_page,
        total: response.meta.total
      }
    } catch (err: any) {
      error.value = err?.data?.message || 'Failed to load stock movements'
    } finally {
      loading.value = false
    }
  }

  async function createMovement (data: Record<string, any>) {
    try {
      const response = await $api('/api/stock-movements', {
        method: 'POST',
        body: data
      }) as any
      return response?.data ?? response
    } catch (err: any) {
      error.value = err?.data?.message || 'Failed to create stock movement'
      return null
    }
  }

  return {
    movements,
    meta,
    loading,
    error,
    fetchMovements,
    createMovement
  }
}
