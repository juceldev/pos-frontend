import type { Product, ProductFilters, ProductFormData, ProductSerial } from '~/types/product'
import * as XLSX from 'xlsx'

interface PaginatedProducts {
  data: Product[]
  meta: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
}

export interface BulkImportError {
  row: number
  name: string
  barcode: string | null
  reason: string
}

interface BulkImportResult {
  message: string
  created: number
  updated: number
  errors: BulkImportError[]
}

export function useProducts () {
  const { $api } = useNuxtApp()

  const products = ref<Product[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const meta = ref({
    page: 1,
    lastPage: 1,
    perPage: 15,
    total: 0
  })
  const duplicateResults = ref<Product[]>([])
  const serials = ref<ProductSerial[]>([])

  async function fetchSerials (productId: number) {
    try {
      const response = await $api(`/api/products/${productId}/serials`) as any
      serials.value = response?.data ?? response ?? []
    } catch {
      serials.value = []
    }
  }
  const uploadProgress = ref(0)

  async function fetchProducts (filters: ProductFilters = {}) {
    loading.value = true
    error.value = null
    try {
      const response = await $api('/api/products', {
        params: {
          page: filters.page ?? 1,
          per_page: filters.perPage ?? meta.value.perPage,
          search: filters.search,
          search_by: filters.searchBy ?? undefined,
          category_id: filters.categoryId ?? undefined,
          supplier_id: filters.supplierId ?? undefined,
          brand_id: filters.brandId ?? undefined,
          product_type: filters.productType ?? undefined,
          has_expiry: filters.hasExpiry ?? undefined,
          has_serials: filters.hasSerials ?? undefined,
          is_active: filters.isActive ?? undefined,
          sort_by: filters.sortBy,
          sort_direction: filters.sortDirection
        }
      }) as PaginatedProducts

      products.value = response.data
      meta.value = {
        page: response.meta.current_page,
        lastPage: response.meta.last_page,
        perPage: response.meta.per_page,
        total: response.meta.total
      }
    } catch (err: any) {
      error.value = err?.data?.message || 'Failed to load products'
    } finally {
      loading.value = false
    }
  }

  async function createProduct (data: ProductFormData): Promise<Product | null> {
    loading.value = true
    error.value = null
    try {
      return await $api('/api/products', {
        method: 'POST',
        body: data
      }) as Product
    } catch (err: any) {
      error.value = err?.data?.message || 'Failed to create product'
      return null
    } finally {
      loading.value = false
    }
  }

  async function updateProduct (id: number, data: ProductFormData): Promise<Product | null> {
    loading.value = true
    error.value = null
    try {
      return await $api(`/api/products/${id}`, {
        method: 'PUT',
        body: data
      }) as Product
    } catch (err: any) {
      error.value = err?.data?.message || 'Failed to update product'
      return null
    } finally {
      loading.value = false
    }
  }

  async function deleteProduct (id: number): Promise<boolean> {
    loading.value = true
    error.value = null
    try {
      await $api(`/api/products/${id}`, { method: 'DELETE' })
      return true
    } catch (err: any) {
      error.value = err?.data?.message || 'Failed to delete product'
      return false
    } finally {
      loading.value = false
    }
  }

  async function checkDuplicate (sequence: string, barcode: string, name: string, excludeId?: number | null) {
    if (!sequence && !barcode && !name) {
      duplicateResults.value = []
      return
    }

    try {
      const response = await $api('/api/products/check', {
        params: {
          product_sequence: sequence || undefined,
          barcode: barcode || undefined,
          name: name || undefined,
          exclude_id: excludeId ?? undefined
        }
      }) as { duplicates: Product[] }
      duplicateResults.value = response.duplicates
    } catch {
      duplicateResults.value = []
    }
  }

  async function bulkUploadProducts (file: File): Promise<BulkImportResult | null> {
    loading.value = true
    error.value = null
    uploadProgress.value = 0

    try {
      const buffer = await file.arrayBuffer()
      const workbook = XLSX.read(buffer, { type: 'array' })
      const sheet = workbook.Sheets[workbook.SheetNames[0]!]!
      const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' })

      const normalizeKey = (key: string) => key.toLowerCase().replace(/[\s\-_]/g, '')
      const pick = (row: Record<string, unknown>, keys: string[]) => {
        for (const [key, value] of Object.entries(row)) {
          if (keys.includes(normalizeKey(key))) {
            return value
          }
        }
        return ''
      }

      const rows = rawRows.map((row, index) => ({
        row: index + 2,
        name: String(pick(row, ['brandproducts', 'product', 'products', 'name', 'itemname']) ?? '').trim(),
        cost: Number(pick(row, ['cost', 'costprice', 'capitalprice']) ?? 0) || 0,
        barcode: String(pick(row, ['barcode', 'barcodeno']) ?? '').trim() || null,
        unit: String(pick(row, ['unit', 'units']) ?? '').trim() || null,
        category: String(pick(row, ['category', 'categories']) ?? '').trim() || null,
        sub_category: String(pick(row, ['subcat', 'subcategory']) ?? '').trim() || null,
        supplier: String(pick(row, ['supplier', 'suppliers']) ?? '').trim() || null,
        brand: String(pick(row, ['brand', 'brands', 'brandname']) ?? '').trim() || null
      })).filter(r => r.name !== '')

      if (!rows.length) {
        error.value = 'No data rows found'
        return null
      }

      const batchSize = 25
      let created = 0
      let updated = 0
      const errors: BulkImportError[] = []

      for (let i = 0; i < rows.length; i += batchSize) {
        const batch = rows.slice(i, i + batchSize)
        const response = await $api('/api/products/bulk', {
          method: 'POST',
          body: { rows: batch }
        }) as BulkImportResult

        created += response.created
        updated += response.updated ?? 0
        errors.push(...response.errors)
        uploadProgress.value = Math.round(((i + batch.length) / rows.length) * 100)
      }

      const parts: string[] = []
      if (created) parts.push(`${created} created`)
      if (updated) parts.push(`${updated} updated`)

      return {
        message: parts.length ? parts.join(', ') : 'No products imported',
        created,
        updated,
        errors
      }
    } catch (err: any) {
      error.value = err?.data?.message || 'Failed to upload products'
      return null
    } finally {
      loading.value = false
    }
  }

  async function fetchNextSequence (): Promise<string> {
    try {
      const response = await $api('/api/products/next-sequence') as { sequence: string }
      return response.sequence
    } catch {
      return ''
    }
  }

  return {
    products,
    loading,
    error,
    meta,
    duplicateResults,
    serials,
    fetchSerials,
    fetchProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    checkDuplicate,
    fetchNextSequence,
    bulkUploadProducts,
    uploadProgress
  }
}
