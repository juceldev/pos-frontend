import type { Customer } from './product'
import type { Product } from './product'

export interface ServiceTicket {
  id: number
  ticket_number?: string
  customer_id: number
  product_id?: number | null
  user_id?: number
  issue: string
  diagnosis?: string
  status: 'pending' | 'in_progress' | 'waiting_parts' | 'completed' | 'cancelled'
  labor_cost?: number
  parts_cost?: number
  total?: number
  notes?: string
  is_warranty?: boolean
  created_at?: string
  updated_at?: string
  customer?: Customer
  product?: Product
  user?: { id: number; name: string }
}
