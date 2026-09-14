import type { Brand } from '~/types/brand'

interface PaginatedBrands {
  data: Brand[]
  meta: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
}

export function useBrands () {
  const { $api } = useNuxtApp()

  const brands = ref<Brand[]>([])
  const brandsList = ref<Brand[]>([])
  const meta = ref({
    page: 1,
    lastPage: 1,
    perPage: 15,
    total: 0
  })
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchBrands () {
    loading.value = true
    error.value = null
    try {
      const response = await $api('/api/brands/lookup') as any
      brands.value = response?.data ?? response ?? []
    } catch (err: any) {
      error.value = err?.data?.message || 'Failed to load brands'
    } finally {
      loading.value = false
    }
  }

  async function fetchBrandsList (filters: Record<string, any> = {}) {
    loading.value = true
    error.value = null
    try {
      const response = await $api<PaginatedBrands>('/api/brands', {
        query: filters
      })
      brandsList.value = response.data ?? []
      meta.value = {
        page: response.meta.current_page,
        lastPage: response.meta.last_page,
        perPage: response.meta.per_page,
        total: response.meta.total
      }
    } catch (err: any) {
      error.value = err?.data?.message || 'Failed to load brands'
    } finally {
      loading.value = false
    }
  }

  async function createBrand (data: Partial<Brand>) {
    try {
      const response = await $api('/api/brands', {
        method: 'POST',
        body: data
      }) as any
      return response?.data ?? response
    } catch (err: any) {
      error.value = err?.data?.message || 'Failed to create brand'
      return null
    }
  }

  async function updateBrand (id: number, data: Partial<Brand>) {
    try {
      const response = await $api(`/api/brands/${id}`, {
        method: 'PUT',
        body: data
      }) as any
      return response?.data ?? response
    } catch (err: any) {
      error.value = err?.data?.message || 'Failed to update brand'
      return null
    }
  }

  async function deleteBrand (id: number) {
    try {
      await $api(`/api/brands/${id}`, { method: 'DELETE' })
      return true
    } catch (err: any) {
      error.value = err?.data?.message || 'Failed to delete brand'
      return false
    }
  }

  return {
    brands,
    brandsList,
    meta,
    loading,
    error,
    fetchBrands,
    fetchBrandsList,
    createBrand,
    updateBrand,
    deleteBrand
  }
}
