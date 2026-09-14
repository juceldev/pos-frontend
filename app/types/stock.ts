import type { Product } from './product'

export interface StockMovement {
  id: number
  product_id: number
  product?: Product
  type: 'in' | 'out' | 'adjustment'
  quantity: number
  unit_cost?: number
  reference?: string
  remarks?: string
  created_at?: string
  user?: { id: number; name: string }
}

export interface StockInItem {
  id?: number
  product_id: number
  product?: Product
  quantity: number
  unit_cost: number
  markup_percent?: number | null
  markup_amount?: number | null
  retail_price?: number | null
  line_total?: number
  serials?: string[]
}

export interface StockIn {
  id: number
  stock_in_no: string
  stock_in_date: string
  purchase_order_id?: number | null
  source?: string | null
  dr_si_no?: string | null
  dr_date?: string | null
  supplier_id?: number | null
  payment_status: 'paid' | 'unpaid' | 'partial'
  payment_mode?: string | null
  payment_description?: string | null
  paid_date?: string | null
  requested_by?: string | null
  total: number
  remarks?: string | null
  status?: 'posted' | 'voided'
  voided_at?: string | null
  void_reason?: string | null
  voided_by?: { id: number; name: string } | null
  items_count?: number
  supplier?: { id: number; name: string } | null
  purchase_order?: { id: number; po_number: string } | null
  received_by?: { id: number; name: string } | null
  items?: StockInItem[]
  created_at?: string
}

export interface StockInFormData {
  stock_in_date?: string
  purchase_order_id?: number | null
  source?: string
  dr_si_no?: string
  dr_date?: string
  supplier_id?: number | null
  payment_status: string
  payment_mode?: string
  payment_description?: string
  paid_date?: string
  requested_by?: string
  received_by?: number | null
  remarks?: string
  items: {
    product_id: number
    quantity: number
    unit_cost?: number
    markup_percent?: number
    markup_amount?: number
    retail_price?: number
    serials?: string[]
  }[]
}

export interface StockInFilters {
  page?: number
  perPage?: number
  search?: string
  filterKeys?: string
  supplierId?: number | null
  paymentStatus?: string | null
  status?: 'posted' | 'voided' | null
  dateFrom?: string | null
  dateTo?: string | null
  sortBy?: string
  sortDirection?: 'asc' | 'desc'
}

export interface StockOutItem {
  id?: number
  product_id: number
  product?: Product
  quantity: number
  unit_cost: number
  line_total?: number
  serials?: string[]
}

export interface StockOut {
  id: number
  stock_out_no: string
  stock_out_date: string
  stock_out_type?: string | null
  reference_no?: string | null
  encode_date?: string | null
  destination_type?: string | null
  destination_id?: number | null
  destination_name?: string | null
  checked_by?: string | null
  approved_by?: string | null
  total: number
  remarks?: string | null
  status?: 'posted' | 'voided'
  voided_at?: string | null
  void_reason?: string | null
  voided_by?: { id: number; name: string } | null
  items_count?: number
  created_by?: { id: number; name: string } | null
  items?: StockOutItem[]
  created_at?: string
}

export interface StockOutFormData {
  stock_out_date?: string
  stock_out_type?: string
  reference_no?: string
  encode_date?: string
  destination_type?: string
  destination_id?: number | null
  destination_name?: string
  checked_by?: string
  approved_by?: string
  remarks?: string
  items: {
    product_id: number
    quantity: number
    unit_cost?: number
    serials?: string[]
  }[]
}

export interface StockOutFilters {
  page?: number
  perPage?: number
  search?: string
  filterKeys?: string
  stockOutType?: string | null
  destinationType?: string | null
  status?: 'posted' | 'voided' | null
  dateFrom?: string | null
  dateTo?: string | null
  sortBy?: string
  sortDirection?: 'asc' | 'desc'
}

export interface StockMovementFilters {
  page?: number
  perPage?: number
  search?: string
  type?: 'in' | 'out' | 'adjustment' | null
  dateFrom?: string | null
  dateTo?: string | null
  sortBy?: string
  sortDirection?: 'asc' | 'desc'
}
