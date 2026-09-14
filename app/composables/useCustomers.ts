import type { Customer } from '~/types/product'

interface PaginatedCustomers {
  data: Customer[]
  meta: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
}

export function useCustomers () {
  const { $api } = useNuxtApp()

  const customers = ref<Customer[]>([])
  const customersList = ref<Customer[]>([])
  const meta = ref({
    page: 1,
    lastPage: 1,
    perPage: 15,
    total: 0
  })
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchCustomers () {
    loading.value = true
    error.value = null
    try {
      const response = await $api('/api/customers/lookup') as any
      customers.value = response?.data ?? response ?? []
    } catch (err: any) {
      error.value = err?.data?.message || 'Failed to load customers'
    } finally {
      loading.value = false
    }
  }

  async function fetchCustomersList (filters: Record<string, any> = {}) {
    loading.value = true
    error.value = null
    try {
      const response = await $api<PaginatedCustomers>('/api/customers', {
        query: filters
      })
      customersList.value = response.data ?? []
      meta.value = {
        page: response.meta.current_page,
        lastPage: response.meta.last_page,
        perPage: response.meta.per_page,
        total: response.meta.total
      }
    } catch (err: any) {
      error.value = err?.data?.message || 'Failed to load customers'
    } finally {
      loading.value = false
    }
  }

  async function createCustomer (data: Partial<Customer>) {
    try {
      const response = await $api('/api/customers', {
        method: 'POST',
        body: data
      }) as any
      return response?.data ?? response
    } catch (err: any) {
      error.value = err?.data?.message || 'Failed to create customer'
      return null
    }
  }

  async function updateCustomer (id: number, data: Partial<Customer>) {
    try {
      const response = await $api(`/api/customers/${id}`, {
        method: 'PUT',
        body: data
      }) as any
      return response?.data ?? response
    } catch (err: any) {
      error.value = err?.data?.message || 'Failed to update customer'
      return null
    }
  }

  async function deleteCustomer (id: number) {
    try {
      await $api(`/api/customers/${id}`, { method: 'DELETE' })
      return true
    } catch (err: any) {
      error.value = err?.data?.message || 'Failed to delete customer'
      return false
    }
  }

  return {
    customers,
    customersList,
    meta,
    loading,
    error,
    fetchCustomers,
    fetchCustomersList,
    createCustomer,
    updateCustomer,
    deleteCustomer
  }
}
