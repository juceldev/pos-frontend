import type { StockMovement, StockMovementFilters } from '~/types/stock'

interface PaginatedStockMovements {
  data: StockMovement[]
  meta: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
}

export function useStockMovements () {
  const { $api } = useNuxtApp()

  const stockMovements = ref<StockMovement[]>([])
  const meta = ref({
    page: 1,
    lastPage: 1,
    perPage: 15,
    total: 0
  })
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchStockMovements (filters: StockMovementFilters = {}) {
    loading.value = true
    error.value = null
    try {
      const response = await $api<PaginatedStockMovements>('/api/stock-movements', {
        query: {
          page: filters.page ?? 1,
          per_page: filters.perPage ?? meta.value.perPage,
          search: filters.search || undefined,
          type: filters.type || undefined,
          date_from: filters.dateFrom || undefined,
          date_to: filters.dateTo || undefined,
          sort_by: filters.sortBy,
          sort_direction: filters.sortDirection
        }
      })
      stockMovements.value = response.data ?? []
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

  return {
    stockMovements,
    meta,
    loading,
    error,
    fetchStockMovements
  }
}
