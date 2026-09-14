import type { Product } from './product'

export interface SaleItemInput {
  product_id: number | null
  description?: string
  is_service?: boolean
  quantity: number
  unit_price: number
  discount?: number
  discount_type?: 'fixed' | 'percent'
  total: number
  serials?: string[]
}

export interface SaleItem {
  id: number
  product_id: number | null
  description?: string
  is_service?: boolean
  quantity: number
  unit_price: number
  discount?: number
  discount_type?: 'fixed' | 'percent'
  cost_price?: number
  total: number
  serials?: string[] | null
  returned_quantity?: number
  returned_total?: number
  pending_quantity?: number
  product?: Product
}

export interface SaleReturnItem {
  id: number
  sale_return_id: number
  sale_item_id: number
  product_id: number | null
  quantity: number
  unit_price: number
  total: number
  serials?: string[] | null
  product?: Product
}

export interface SaleReturn {
  id: number
  sale_id: number
  user_id: number
  approved_by?: number | null
  approved_at?: string | null
  rejected_by?: number | null
  rejected_at?: string | null
  rejected_reason?: string
  payment_type_id?: number | null
  returned_total: number
  returned_amount: number
  status: 'pending' | 'approved' | 'rejected' | 'completed'
  notes?: string
  created_at?: string
  user?: { id: number; name: string }
  approved_by_user?: { id: number; name: string }
  rejected_by_user?: { id: number; name: string }
  payment_type?: { id: number; name: string }
  items: SaleReturnItem[]
}

export interface Sale {
  id: number
  sale_number?: string
  customer_id?: number | null
  user_id?: number
  payment_type_id?: number | null
  payment_reference_no?: string | null
  payment_approval_code?: string | null
  subtotal: number
  tax: number
  discount: number
  total: number
  paid_amount: number
  change: number
  status?: 'completed' | 'voided' | 'partially_returned' | 'returned'
  voided_at?: string | null
  voided_by?: { id: number; name: string } | null
  returned_total?: number
  returned_amount?: number
  notes?: string
  created_at?: string
  customer?: { id: number; name: string }
  payment_type?: { id: number; name: string }
  user?: { id: number; name: string }
  items: SaleItem[]
  returns?: SaleReturn[]
}
