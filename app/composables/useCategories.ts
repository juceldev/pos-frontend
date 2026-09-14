import type { Category } from '~/types/product'

interface PaginatedCategories {
  data: Category[]
  meta: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
}

export function useCategories () {
  const { $api } = useNuxtApp()

  const categories = ref<Category[]>([])
  const categoriesList = ref<Category[]>([])
  const meta = ref({
    page: 1,
    lastPage: 1,
    perPage: 15,
    total: 0
  })
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchCategories () {
    loading.value = true
    error.value = null
    try {
      const response = await $api('/api/categories/lookup') as any
      categories.value = response?.data ?? response ?? []
    } catch (err: any) {
      error.value = err?.data?.message || 'Failed to load categories'
    } finally {
      loading.value = false
    }
  }

  async function fetchCategoriesList (filters: Record<string, any> = {}) {
    loading.value = true
    error.value = null
    try {
      const response = await $api<PaginatedCategories>('/api/categories', {
        query: filters
      })
      categoriesList.value = response.data ?? []
      meta.value = {
        page: response.meta.current_page,
        lastPage: response.meta.last_page,
        perPage: response.meta.per_page,
        total: response.meta.total
      }
    } catch (err: any) {
      error.value = err?.data?.message || 'Failed to load categories'
    } finally {
      loading.value = false
    }
  }

  async function createCategory (data: Partial<Category>) {
    try {
      const response = await $api('/api/categories', {
        method: 'POST',
        body: data
      }) as any
      return response?.data ?? response
    } catch (err: any) {
      error.value = err?.data?.message || 'Failed to create category'
      return null
    }
  }

  async function updateCategory (id: number, data: Partial<Category>) {
    try {
      const response = await $api(`/api/categories/${id}`, {
        method: 'PUT',
        body: data
      }) as any
      return response?.data ?? response
    } catch (err: any) {
      error.value = err?.data?.message || 'Failed to update category'
      return null
    }
  }

  async function deleteCategory (id: number) {
    try {
      await $api(`/api/categories/${id}`, { method: 'DELETE' })
      return true
    } catch (err: any) {
      error.value = err?.data?.message || 'Failed to delete category'
      return false
    }
  }

  return {
    categories,
    categoriesList,
    meta,
    loading,
    error,
    fetchCategories,
    fetchCategoriesList,
    createCategory,
    updateCategory,
    deleteCategory
  }
}
