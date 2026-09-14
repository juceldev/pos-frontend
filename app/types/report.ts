import type { Sale } from './sale'
import type { Product } from './product'
import type { StockMovement } from './stock'

export interface DashboardStats {
  today_sales: number
  today_sales_count: number
  low_stock_count: number
  out_of_stock_count: number
  pending_service_tickets: number
  total_customers: number
  total_products: number
}

export interface SalesReport {
  from: string
  to: string
  summary: Array<{ date: string; total: number; count: number }>
  top_products: Array<{ product_id: number; quantity: number; total: number; product: Product }>
  totals: { total: number; count: number }
  sales: Sale[]
}

export interface AnalyticsRange {
  from: string
  to: string
  label: string
}

export interface AnalyticsSummary {
  total_sales: number
  total_transactions: number
  total_profit: number
  avg_transaction: number
  total_returns: number
  total_customers: number
  total_products: number
  low_stock_count: number
  out_of_stock_count: number
  pending_service_tickets: number
}

export interface SalesTrendPoint {
  date: string
  total: number
  count: number
}

export interface TopProductPoint {
  name: string
  quantity: number
  total: number
  profit: number
}

export interface PaymentBreakdownPoint {
  name: string
  count: number
  total: number
}

export interface CategorySalesPoint {
  name: string
  total: number
  quantity: number
}

export interface LowStockProduct {
  id: number
  name: string
  stock_quantity: number
  reorder_level: number
  is_out: boolean
}

export interface ServiceTicketSummary {
  pending: number
  in_progress: number
  completed: number
}

export interface AnalyticsData {
  range: AnalyticsRange
  summary: AnalyticsSummary
  sales_trend: SalesTrendPoint[]
  top_products: TopProductPoint[]
  payment_breakdown: PaymentBreakdownPoint[]
  category_sales: CategorySalesPoint[]
  recent_transactions: Sale[]
  low_stock_products: LowStockProduct[]
  service_tickets: ServiceTicketSummary
}
