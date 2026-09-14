export interface Product {
  id: number
  product_sequence: string
  barcode: string
  special_code?: string
  image_url?: string
  name: string
  description?: string
  brand?: string
  brand_id?: number | null
  brand_name?: string | null
  brand_data?: { id: number; name: string }
  product_type: 'no_serial' | 'with_serial' | 'package' | 'service'
  category?: { id: number; name: string }
  sub_category?: { id: number; name: string }
  supplier?: { id: number; name: string }
  unit?: { id: number; name: string; abbreviation: string }
  seller?: string
  cost_price: string | number
  regular_price: string | number
  wholesale_price: string | number
  markup_percent: string | number
  markup_amount: string | number
  wholesale_markup_percent?: string | number
  wholesale_markup_amount?: string | number
  promo_markup_percent?: string | number
  promo_price?: string | number
  reorder_level: string | number
  warranty_period?: string
  has_expiry?: boolean
  expiry_date?: string | null
  stock_quantity: string | number
  stock_in_total?: number
  sold_out_total?: number
  inv_out_total?: number
  serials_count?: number
  in_stock_serials_count?: number
  serials?: ProductSerial[]
  package_items?: { product_id: number; name: string; barcode: string; quantity: number }[]
  is_active: boolean
  created_by?: { id: number; name: string }
  updated_by?: { id: number; name: string }
  created_at?: string
  updated_at?: string
}

export interface ProductFormData {
  product_sequence: string
  barcode: string
  special_code?: string
  image_url?: string
  name: string
  description?: string
  brand?: string
  brand_id?: number | null
  product_type: 'no_serial' | 'with_serial' | 'package' | 'service'
  category_id?: number | null
  sub_category_id?: number | null
  supplier_id?: number | null
  unit_id?: number | null
  seller?: string
  cost_price: number
  regular_price: number
  wholesale_price: number
  markup_percent: number
  markup_amount: number
  wholesale_markup_percent?: number
  wholesale_markup_amount?: number
  promo_markup_percent?: number
  promo_price?: number
  reorder_level: number
  warranty_period?: string
  has_expiry?: boolean
  expiry_date?: string | null
  stock_quantity: number
  is_active: boolean
  package_items?: { product_id: number; quantity: number }[]
}

export interface ProductSerial {
  id: number
  product_id: number
  serial_number: string
  status: 'in_stock' | 'sold' | 'defective' | 'returned'
  stock_movement_id?: number | null
  sale_item_id?: number | null
  product?: { id: number; name: string; barcode: string }
  created_at?: string
  updated_at?: string
}

export interface ProductFilters {
  page?: number
  perPage?: number
  search?: string
  searchBy?: 'name' | 'code' | 'barcode' | 'serial' | string
  categoryId?: number | null
  supplierId?: number | null
  brandId?: number | null
  productType?: string | null
  hasExpiry?: boolean | null
  hasSerials?: boolean | null
  isActive?: boolean | null
  sortBy?: string
  sortDirection?: 'asc' | 'desc'
}

export interface Category {
  id: number
  name: string
  code?: string
  parent_id?: number | null
  parent?: { id: number; name: string }
  is_active?: boolean
  products_count?: number
  children?: Category[]
}

export interface Supplier {
  id: number
  name: string
  code?: string
  id_number?: string
  barcode?: string
  contact_person?: string
  group?: string
  vat_tin?: string
  terms_of_payment?: string
  phone?: string
  email?: string
  address?: string
  notes?: string
  is_active?: boolean
  products_count?: number
}

export interface Customer {
  id: number
  code?: string
  name: string
  id_number?: string
  barcode?: string
  contact_person?: string
  group?: string
  vat_tin?: string
  terms_of_payment?: string
  email?: string
  phone?: string
  address?: string
  notes?: string
  is_active?: boolean
  sales_count?: number
}

export interface Unit {
  id: number
  name: string
  abbreviation: string
  is_active?: boolean
  products_count?: number
}
