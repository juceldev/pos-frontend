import type { Sale, SaleItemInput } from '~/types/sale'

interface PaginatedSales {
  data: Sale[]
  meta: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
}

export function useSales () {
  const { $api } = useNuxtApp()

  const sales = ref<Sale[]>([])
  const meta = ref({
    page: 1,
    lastPage: 1,
    perPage: 15,
    total: 0
  })
  const loading = ref(false)
  const error = ref<string | null>(null)
  const lastSale = ref<Sale | null>(null)
  const currentSale = ref<Sale | null>(null)

  async function fetchSales (filters: Record<string, any> = {}) {
    loading.value = true
    error.value = null
    try {
      const response = await $api<PaginatedSales>('/api/sales', {
        query: filters
      })
      sales.value = response.data ?? []
      meta.value = {
        page: response.meta.current_page,
        lastPage: response.meta.last_page,
        perPage: response.meta.per_page,
        total: response.meta.total
      }
    } catch (err: any) {
      error.value = err?.data?.message || 'Failed to load sales'
    } finally {
      loading.value = false
    }
  }

  async function fetchSale (id: number) {
    try {
      const response = await $api(`/api/sales/${id}`) as any
      currentSale.value = response?.data ?? response
      return currentSale.value
    } catch (err: any) {
      error.value = err?.data?.message || 'Failed to load sale'
      return null
    }
  }

  async function createSale (data: {
    customer_id?: number | null
    payment_type_id?: number | null
    payment_reference_no?: string | null
    payment_approval_code?: string | null
    items: SaleItemInput[]
    subtotal: number
    tax: number
    discount: number
    total: number
    paid_amount: number
    change: number
    notes?: string
  }) {
    try {
      const response = await $api('/api/sales', {
        method: 'POST',
        body: data
      }) as any
      lastSale.value = response?.data ?? response
      return lastSale.value
    } catch (err: any) {
      error.value = err?.data?.message || 'Failed to create sale'
      return null
    }
  }

  async function voidSale (id: number, reason?: string) {
    try {
      const response = await $api(`/api/sales/${id}/void`, {
        method: 'POST',
        body: { reason }
      }) as any
      return response?.data ?? response
    } catch (err: any) {
      error.value = err?.data?.message || 'Failed to void sale'
      return null
    }
  }

  async function returnSale (id: number, data: {
    items: {
      sale_item_id: number
      quantity: number
      unit_price: number
      total: number
      serials?: string[]
    }[]
    payment_type_id?: number | null
    notes?: string
  }) {
    try {
      const response = await $api(`/api/sales/${id}/return`, {
        method: 'POST',
        body: data
      }) as any
      return response?.data ?? response
    } catch (err: any) {
      error.value = err?.data?.message || 'Failed to process return'
      return null
    }
  }

  return {
    sales,
    meta,
    loading,
    error,
    lastSale,
    currentSale,
    fetchSales,
    fetchSale,
    createSale,
    voidSale,
    returnSale
  }
}
