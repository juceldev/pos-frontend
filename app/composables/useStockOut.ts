import type { StockOut, StockOutFilters, StockOutFormData } from '~/types/stock'

interface PaginatedStockOuts {
  data: StockOut[]
  meta: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
}

export function useStockOut () {
  const { $api } = useNuxtApp()

  const stockOuts = ref<StockOut[]>([])
  const meta = ref({
    page: 1,
    lastPage: 1,
    perPage: 15,
    total: 0
  })
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchStockOuts (filters: StockOutFilters = {}) {
    loading.value = true
    error.value = null
    try {
      const response = await $api<PaginatedStockOuts>('/api/stock-outs', {
        query: {
          page: filters.page ?? 1,
          per_page: filters.perPage ?? meta.value.perPage,
          search: filters.search || undefined,
          filter_keys: filters.filterKeys || undefined,
          stock_out_type: filters.stockOutType ?? undefined,
          destination_type: filters.destinationType ?? undefined,
          status: filters.status ?? undefined,
          date_from: filters.dateFrom ?? undefined,
          date_to: filters.dateTo ?? undefined,
          sort_by: filters.sortBy,
          sort_direction: filters.sortDirection
        }
      })
      stockOuts.value = response.data ?? []
      meta.value = {
        page: response.meta.current_page,
        lastPage: response.meta.last_page,
        perPage: response.meta.per_page,
        total: response.meta.total
      }
    } catch (err: any) {
      error.value = err?.data?.message || 'Failed to load stock-outs'
    } finally {
      loading.value = false
    }
  }

  async function fetchNextNumber (): Promise<string> {
    try {
      const response = await $api<{ stock_out_no: string }>('/api/stock-outs/next-number')
      return response?.stock_out_no ?? ''
    } catch {
      return ''
    }
  }

  async function fetchStockOut (id: number): Promise<StockOut | null> {
    try {
      const response = await $api<{ data: StockOut }>(`/api/stock-outs/${id}`)
      return response?.data ?? null
    } catch (err: any) {
      error.value = err?.data?.message || 'Failed to load stock-out'
      return null
    }
  }

  async function createStockOut (data: StockOutFormData): Promise<StockOut | null> {
    try {
      const response = await $api<{ data: StockOut }>('/api/stock-outs', {
        method: 'POST',
        body: data
      })
      return response?.data ?? null
    } catch (err: any) {
      error.value = err?.data?.message || 'Failed to create stock-out'
      return null
    }
  }

  async function updateStockOut (id: number, data: StockOutFormData): Promise<StockOut | null> {
    try {
      const response = await $api<{ data: StockOut }>(`/api/stock-outs/${id}`, {
        method: 'PUT',
        body: data
      })
      return response?.data ?? null
    } catch (err: any) {
      error.value = err?.data?.message || 'Failed to update stock-out'
      return null
    }
  }

  async function voidStockOut (id: number, reason?: string): Promise<StockOut | null> {
    try {
      const response = await $api<{ data: StockOut }>(`/api/stock-outs/${id}/void`, {
        method: 'POST',
        body: { reason }
      })
      return response?.data ?? null
    } catch (err: any) {
      error.value = err?.data?.message || 'Failed to void stock-out'
      return null
    }
  }

  return {
    stockOuts,
    meta,
    loading,
    error,
    fetchStockOuts,
    fetchNextNumber,
    fetchStockOut,
    createStockOut,
    updateStockOut,
    voidStockOut
  }
}
