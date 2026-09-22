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

  const pdfDialog = ref(false)
  const pdfUrl = ref<string | null>(null)
  const pdfTitle = ref('Report Preview')

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

  function buildPdfUrl (path: string, params: Record<string, any> = {}): string {
    return buildApiUrl(path, params)
  }

  function previewPdf (title: string, path: string, params: Record<string, any> = {}) {
    if (!import.meta.client) return
    pdfTitle.value = title
    pdfUrl.value = buildPdfUrl(path, params)
    pdfDialog.value = true
  }

  function openSalesReportPdf (from?: string, to?: string) {
    previewPdf('Sales Report', '/api/reports/sales/pdf', { date_from: from, date_to: to })
  }

  function openStockInReportPdf (from?: string, to?: string) {
    previewPdf('Stock-In Logs', '/api/reports/stock-in/pdf', { date_from: from, date_to: to })
  }

  function openStockOutReportPdf (from?: string, to?: string) {
    previewPdf('Stock-Out Logs', '/api/reports/stock-out/pdf', { date_from: from, date_to: to })
  }

  function openSoldOutReportPdf () {
    previewPdf('Sold-Out / Out-of-Stock', '/api/reports/sold-out/pdf')
  }

  function openExpensesReportPdf (from?: string, to?: string, type?: string | null) {
    previewPdf('Expenses Report', '/api/reports/expenses/pdf', { date_from: from, date_to: to, type })
  }

  return {
    loading,
    error,
    pdfDialog,
    pdfUrl,
    pdfTitle,
    fetchDashboard,
    fetchAnalytics,
    fetchSalesReport,
    fetchStockInReport,
    fetchStockOutReport,
    fetchSoldOutReport,
    openSalesReportPdf,
    openStockInReportPdf,
    openStockOutReportPdf,
    openSoldOutReportPdf,
    openExpensesReportPdf
  }
}
