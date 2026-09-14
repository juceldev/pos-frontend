import type { Supplier } from '~/types/product'

export interface PurchaseOrderItem {
  id?: number
  product_id: number
  product?: { id: number; name: string; barcode: string }
  quantity: number
  received_quantity?: number
  unit_cost: number
  subtotal?: number
}

export interface PurchaseOrder {
  id: number
  po_number: string
  supplier_id?: number | null
  supplier?: Supplier
  status: 'draft' | 'ordered' | 'partial' | 'received' | 'cancelled'
  expected_date?: string | null
  notes?: string
  total: number
  items?: PurchaseOrderItem[]
  created_by?: { id: number; name: string }
  created_at?: string
  updated_at?: string
}

interface PaginatedPOs {
  data: PurchaseOrder[]
  meta: { current_page: number; last_page: number; per_page: number; total: number }
}

export function usePurchaseOrders () {
  const { $api } = useNuxtApp()

  const purchaseOrders = ref<PurchaseOrder[]>([])
  const current = ref<PurchaseOrder | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const meta = ref({ page: 1, lastPage: 1, perPage: 15, total: 0 })

  async function fetchPurchaseOrders (filters: Record<string, any> = {}) {
    loading.value = true
    error.value = null
    try {
      const response = await $api<PaginatedPOs>('/api/purchase-orders', { params: filters })
      purchaseOrders.value = response.data ?? []
      meta.value = {
        page: response.meta.current_page,
        lastPage: response.meta.last_page,
        perPage: response.meta.per_page,
        total: response.meta.total
      }
    } catch (err: any) {
      error.value = err?.data?.message || 'Failed to load purchase orders'
    } finally {
      loading.value = false
    }
  }

  async function fetchPurchaseOrder (id: number) {
    try {
      const response = await $api(`/api/purchase-orders/${id}`) as any
      current.value = response?.data ?? response
      return current.value
    } catch (err: any) {
      error.value = err?.data?.message || 'Failed to load purchase order'
      return null
    }
  }

  async function createPurchaseOrder (data: Partial<PurchaseOrder>) {
    try {
      const response = await $api('/api/purchase-orders', { method: 'POST', body: data }) as any
      return response?.data ?? response
    } catch (err: any) {
      error.value = err?.data?.message || 'Failed to create purchase order'
      return null
    }
  }

  async function updatePurchaseOrder (id: number, data: Partial<PurchaseOrder>) {
    try {
      const response = await $api(`/api/purchase-orders/${id}`, { method: 'PUT', body: data }) as any
      return response?.data ?? response
    } catch (err: any) {
      error.value = err?.data?.message || 'Failed to update purchase order'
      return null
    }
  }

  async function deletePurchaseOrder (id: number) {
    try {
      await $api(`/api/purchase-orders/${id}`, { method: 'DELETE' })
      return true
    } catch (err: any) {
      error.value = err?.data?.message || 'Failed to delete purchase order'
      return false
    }
  }

  async function receivePurchaseOrder (id: number, items: { item_id: number; quantity: number; serials?: string[] }[]) {
    try {
      const response = await $api(`/api/purchase-orders/${id}/receive`, { method: 'POST', body: { items } }) as any
      return response?.data ?? response
    } catch (err: any) {
      error.value = err?.data?.message || 'Failed to receive purchase order'
      return null
    }
  }

  return {
    purchaseOrders,
    current,
    loading,
    error,
    meta,
    fetchPurchaseOrders,
    fetchPurchaseOrder,
    createPurchaseOrder,
    updatePurchaseOrder,
    deletePurchaseOrder,
    receivePurchaseOrder
  }
}
