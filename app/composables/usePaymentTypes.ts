import type { PaymentType } from '~/types/settings'

interface PaginatedPaymentTypes {
  data: PaymentType[]
  meta: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
}

export function usePaymentTypes () {
  const { $api } = useNuxtApp()

  const paymentTypes = ref<PaymentType[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchPaymentTypes (filters: Record<string, any> = {}) {
    loading.value = true
    error.value = null
    try {
      const response = await $api<PaginatedPaymentTypes>('/api/payment-types', {
        query: filters
      })
      paymentTypes.value = response.data ?? []
    } catch (err: any) {
      error.value = err?.data?.message || 'Failed to load payment types'
    } finally {
      loading.value = false
    }
  }

  async function createPaymentType (data: Partial<PaymentType>) {
    try {
      const response = await $api('/api/payment-types', {
        method: 'POST',
        body: data
      }) as any
      return response?.data ?? response
    } catch (err: any) {
      error.value = err?.data?.message || 'Failed to create payment type'
      return null
    }
  }

  async function updatePaymentType (id: number, data: Partial<PaymentType>) {
    try {
      const response = await $api(`/api/payment-types/${id}`, {
        method: 'PUT',
        body: data
      }) as any
      return response?.data ?? response
    } catch (err: any) {
      error.value = err?.data?.message || 'Failed to update payment type'
      return null
    }
  }

  async function deletePaymentType (id: number) {
    try {
      await $api(`/api/payment-types/${id}`, { method: 'DELETE' })
      return true
    } catch (err: any) {
      error.value = err?.data?.message || 'Failed to delete payment type'
      return false
    }
  }

  return {
    paymentTypes,
    loading,
    error,
    fetchPaymentTypes,
    createPaymentType,
    updatePaymentType,
    deletePaymentType
  }
}
