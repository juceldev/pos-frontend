import type { Supplier } from '~/types/product'

interface PaginatedSuppliers {
  data: Supplier[]
  meta: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
}

export function useSuppliers () {
  const { $api } = useNuxtApp()

  const suppliers = ref<Supplier[]>([])
  const suppliersList = ref<Supplier[]>([])
  const meta = ref({
    page: 1,
    lastPage: 1,
    perPage: 15,
    total: 0
  })
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchSuppliers () {
    loading.value = true
    error.value = null
    try {
      const response = await $api('/api/suppliers/lookup') as any
      suppliers.value = response?.data ?? response ?? []
    } catch (err: any) {
      error.value = err?.data?.message || 'Failed to load suppliers'
    } finally {
      loading.value = false
    }
  }

  async function fetchSuppliersList (filters: Record<string, any> = {}) {
    loading.value = true
    error.value = null
    try {
      const response = await $api<PaginatedSuppliers>('/api/suppliers', {
        query: filters
      })
      suppliersList.value = response.data ?? []
      meta.value = {
        page: response.meta.current_page,
        lastPage: response.meta.last_page,
        perPage: response.meta.per_page,
        total: response.meta.total
      }
    } catch (err: any) {
      error.value = err?.data?.message || 'Failed to load suppliers'
    } finally {
      loading.value = false
    }
  }

  async function createSupplier (data: Partial<Supplier>) {
    try {
      const response = await $api('/api/suppliers', {
        method: 'POST',
        body: data
      }) as any
      return response?.data ?? response
    } catch (err: any) {
      error.value = err?.data?.message || 'Failed to create supplier'
      return null
    }
  }

  async function updateSupplier (id: number, data: Partial<Supplier>) {
    try {
      const response = await $api(`/api/suppliers/${id}`, {
        method: 'PUT',
        body: data
      }) as any
      return response?.data ?? response
    } catch (err: any) {
      error.value = err?.data?.message || 'Failed to update supplier'
      return null
    }
  }

  async function deleteSupplier (id: number) {
    try {
      await $api(`/api/suppliers/${id}`, { method: 'DELETE' })
      return true
    } catch (err: any) {
      error.value = err?.data?.message || 'Failed to delete supplier'
      return false
    }
  }

  return {
    suppliers,
    suppliersList,
    meta,
    loading,
    error,
    fetchSuppliers,
    fetchSuppliersList,
    createSupplier,
    updateSupplier,
    deleteSupplier
  }
}
