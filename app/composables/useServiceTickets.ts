import type { ServiceTicket } from '~/types/service'

interface PaginatedServiceTickets {
  data: ServiceTicket[]
  meta: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
}

export function useServiceTickets () {
  const { $api } = useNuxtApp()

  const serviceTickets = ref<ServiceTicket[]>([])
  const meta = ref({
    page: 1,
    lastPage: 1,
    perPage: 15,
    total: 0
  })
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchServiceTickets (filters: Record<string, any> = {}) {
    loading.value = true
    error.value = null
    try {
      const response = await $api<PaginatedServiceTickets>('/api/service-tickets', {
        query: filters
      })
      serviceTickets.value = response.data ?? []
      meta.value = {
        page: response.meta.current_page,
        lastPage: response.meta.last_page,
        perPage: response.meta.per_page,
        total: response.meta.total
      }
    } catch (err: any) {
      error.value = err?.data?.message || 'Failed to load service tickets'
    } finally {
      loading.value = false
    }
  }

  async function createServiceTicket (data: Partial<ServiceTicket>) {
    try {
      const response = await $api('/api/service-tickets', {
        method: 'POST',
        body: data
      }) as any
      return response?.data ?? response
    } catch (err: any) {
      error.value = err?.data?.message || 'Failed to create service ticket'
      return null
    }
  }

  async function updateServiceTicket (id: number, data: Partial<ServiceTicket>) {
    try {
      const response = await $api(`/api/service-tickets/${id}`, {
        method: 'PUT',
        body: data
      }) as any
      return response?.data ?? response
    } catch (err: any) {
      error.value = err?.data?.message || 'Failed to update service ticket'
      return null
    }
  }

  async function deleteServiceTicket (id: number) {
    try {
      await $api(`/api/service-tickets/${id}`, { method: 'DELETE' })
      return true
    } catch (err: any) {
      error.value = err?.data?.message || 'Failed to delete service ticket'
      return false
    }
  }

  return {
    serviceTickets,
    meta,
    loading,
    error,
    fetchServiceTickets,
    createServiceTicket,
    updateServiceTicket,
    deleteServiceTicket
  }
}
