import type { StockIn, StockInFilters, StockInFormData } from '~/types/stock'

interface PaginatedStockIns {
  data: StockIn[]
  meta: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
}

export function useStockIn () {
  const { $api } = useNuxtApp()

  const stockIns = ref<StockIn[]>([])
  const meta = ref({
    page: 1,
    lastPage: 1,
    perPage: 15,
    total: 0
  })
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchStockIns (filters: StockInFilters = {}) {
    loading.value = true
    error.value = null
    try {
      const response = await $api<PaginatedStockIns>('/api/stock-ins', {
        query: {
          page: filters.page ?? 1,
          per_page: filters.perPage ?? meta.value.perPage,
          search: filters.search || undefined,
          filter_keys: filters.filterKeys || undefined,
          supplier_id: filters.supplierId ?? undefined,
          payment_status: filters.paymentStatus ?? undefined,
          status: filters.status ?? undefined,
          date_from: filters.dateFrom ?? undefined,
          date_to: filters.dateTo ?? undefined,
          sort_by: filters.sortBy,
          sort_direction: filters.sortDirection
        }
      })
      stockIns.value = response.data ?? []
      meta.value = {
        page: response.meta.current_page,
        lastPage: response.meta.last_page,
        perPage: response.meta.per_page,
        total: response.meta.total
      }
    } catch (err: any) {
      error.value = err?.data?.message || 'Failed to load stock-ins'
    } finally {
      loading.value = false
    }
  }

  async function fetchNextNumber (): Promise<string> {
    try {
      const response = await $api<{ stock_in_no: string }>('/api/stock-ins/next-number')
      return response?.stock_in_no ?? ''
    } catch {
      return ''
    }
  }

  async function fetchStockIn (id: number): Promise<StockIn | null> {
    try {
      const response = await $api<{ data: StockIn }>(`/api/stock-ins/${id}`)
      return response?.data ?? null
    } catch (err: any) {
      error.value = err?.data?.message || 'Failed to load stock-in'
      return null
    }
  }

  async function createStockIn (data: StockInFormData): Promise<StockIn | null> {
    try {
      const response = await $api<{ data: StockIn }>('/api/stock-ins', {
        method: 'POST',
        body: data
      })
      return response?.data ?? null
    } catch (err: any) {
      error.value = err?.data?.message || 'Failed to create stock-in'
      return null
    }
  }

  async function updateStockIn (id: number, data: StockInFormData): Promise<StockIn | null> {
    try {
      const response = await $api<{ data: StockIn }>(`/api/stock-ins/${id}`, {
        method: 'PUT',
        body: data
      })
      return response?.data ?? null
    } catch (err: any) {
      error.value = err?.data?.message || 'Failed to update stock-in'
      return null
    }
  }

  async function voidStockIn (id: number, reason?: string): Promise<StockIn | null> {
    try {
      const response = await $api<{ data: StockIn }>(`/api/stock-ins/${id}/void`, {
        method: 'POST',
        body: { reason }
      })
      return response?.data ?? null
    } catch (err: any) {
      error.value = err?.data?.message || 'Failed to void stock-in'
      return null
    }
  }

  return {
    stockIns,
    meta,
    loading,
    error,
    fetchStockIns,
    fetchNextNumber,
    fetchStockIn,
    createStockIn,
    updateStockIn,
    voidStockIn
  }
}
