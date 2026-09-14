import type { SaleReturn } from '~/types/sale'

interface PaginatedSaleReturns {
  data: SaleReturn[]
  meta: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
}

export function useSaleReturns () {
  const { $api } = useNuxtApp()

  const saleReturns = ref<SaleReturn[]>([])
  const meta = ref({
    page: 1,
    lastPage: 1,
    perPage: 15,
    total: 0
  })
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchSaleReturns (filters: Record<string, any> = {}) {
    loading.value = true
    error.value = null
    try {
      const response = await $api<PaginatedSaleReturns>('/api/sale-returns', {
        query: filters
      })
      saleReturns.value = response.data ?? []
      meta.value = {
        page: response.meta.current_page,
        lastPage: response.meta.last_page,
        perPage: response.meta.per_page,
        total: response.meta.total
      }
    } catch (err: any) {
      error.value = err?.data?.message || 'Failed to load returns'
    } finally {
      loading.value = false
    }
  }

  async function approveReturn (id: number) {
    loading.value = true
    error.value = null
    try {
      const response = await $api(`/api/sale-returns/${id}/approve`, {
        method: 'POST'
      }) as any
      return response?.data ?? response
    } catch (err: any) {
      error.value = err?.data?.message || 'Failed to approve return'
      return null
    } finally {
      loading.value = false
    }
  }

  async function rejectReturn (id: number, reason?: string) {
    loading.value = true
    error.value = null
    try {
      const response = await $api(`/api/sale-returns/${id}/reject`, {
        method: 'POST',
        body: { rejected_reason: reason }
      }) as any
      return response?.data ?? response
    } catch (err: any) {
      error.value = err?.data?.message || 'Failed to reject return'
      return null
    } finally {
      loading.value = false
    }
  }

  return {
    saleReturns,
    meta,
    loading,
    error,
    fetchSaleReturns,
    approveReturn,
    rejectReturn
  }
}
