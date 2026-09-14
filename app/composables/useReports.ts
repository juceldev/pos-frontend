import type { AnalyticsData, DashboardStats, SalesReport } from '~/types/report'
import type { Product } from '~/types/product'
import type { StockMovement } from '~/types/stock'

interface PaginatedStockMovements {
  data: StockMovement[]
  meta: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
}

interface PaginatedProducts {
  data: Product[]
  meta: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
}

export function useReports () {
  const { $api } = useNuxtApp()

  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchDashboard () {
    try {
      return await $api('/api/reports/dashboard') as DashboardStats
    } catch (err: any) {
      error.value = err?.data?.message || 'Failed to load dashboard'
      return null
    }
  }

  async function fetchAnalytics (range: string, from?: string, to?: string) {
    try {
      const query: Record<string, string> = { range }
      if (from) query.from = from
      if (to) query.to = to
      return await $api('/api/reports/analytics', { query }) as AnalyticsData
    } catch (err: any) {
      error.value = err?.data?.message || 'Failed to load analytics'
      return null
    }
  }

  async function fetchSalesReport (filters: Record<string, any> = {}) {
    try {
      return await $api('/api/reports/sales', { query: filters }) as SalesReport
    } catch (err: any) {
      error.value = err?.data?.message || 'Failed to load sales report'
      return null
    }
  }

  async function fetchStockInReport (filters: Record<string, any> = {}) {
    try {
      return await $api<PaginatedStockMovements>('/api/reports/stock-in', { query: filters })
    } catch (err: any) {
      error.value = err?.data?.message || 'Failed to load stock-in report'
      return null
    }
  }

  async function fetchStockOutReport (filters: Record<string, any> = {}) {
    try {
      return await $api<PaginatedStockMovements>('/api/reports/stock-out', { query: filters })
    } catch (err: any) {
      error.value = err?.data?.message || 'Failed to load stock-out report'
      return null
    }
  }

  async function fetchSoldOutReport (filters: Record<string, any> = {}) {
    try {
      return await $api<PaginatedProducts>('/api/reports/sold-out', { query: filters })
    } catch (err: any) {
      error.value = err?.data?.message || 'Failed to load sold-out report'
      return null
    }
  }

  return {
    loading,
    error,
    fetchDashboard,
    fetchAnalytics,
    fetchSalesReport,
    fetchStockInReport,
    fetchStockOutReport,
    fetchSoldOutReport
  }
}
