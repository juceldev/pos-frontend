import type { Product } from './product'

export interface CartItem {
  product: Product | null
  product_id: number | null
  description: string
  is_service: boolean
  quantity: number
  unit_price: number
  discount: number
  discount_type: 'fixed' | 'percent'
  total: number
  serials: string[]
}
