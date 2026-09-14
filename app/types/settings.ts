export interface Setting {
  id?: number
  key: string
  value: string | null
}

export interface PaymentType {
  id: number
  name: string
  is_active: boolean
}

export interface CompanySetting {
  id?: number
  company_name: string | null
  branch_name: string | null
  address: string | null
  contact_numbers: string | null
  email: string | null
  reg_permit_no: string | null
  vat_no: string | null
  permit_no: string | null
  company_logo_url: string | null
  pc_name: string | null
  serial_nos: string | null
  terminal_id: string | null
  license_key: string | null
  license_status: string | null
  license_expiry: string | null
  permission_access_key: string | null
}

export interface SalesTransactionSetting {
  id?: number
  sale_entry_mode: 'retail' | 'wholesale'
  auto_qty: boolean
  fuse_same_barcode: boolean
  default_category_id: number | null
  operation_mode: 'server' | 'client' | 'multi_pc'
  price_markup_retail: number
  price_markup_wholesale: number
  price_markup_promotion: number
  price_round_off_to_nearest: boolean
  price_round_off_to_next: boolean
  pay_round_off_to_next: boolean
  staff_sales_commission: number
  addon_service_charge_enabled: boolean
  addon_service_charge_value: number
  addon_service_charge_type: 'amount' | 'percent'
  addon_service_charge_apply_to: 'all' | 'selected'
  transaction_start_no: string
  transaction_current_no: string
  transaction_sales_start_no: string
  transaction_sales_current_no: string
  transaction_charge_start_no: string
  transaction_charge_current_no: string
  transaction_arnow_start_no: string
  transaction_arnow_current_no: string
  taxation_type: string
  tax_rate: number
  enable_customer_credit_limit: boolean
  enable_loyalty_points: boolean
  loyalty_points_per_amount: number
  allow_tendering_receive_payment: boolean
  update_inventory_every_stock: boolean
  show_stock_availability_cashier: boolean
  allow_sales_order_no_stock: boolean
  enable_inventory_checker: boolean
  auto_update_sales_summary: boolean
  enable_costing_pricing_input: boolean
  require_customer_name: boolean
  require_salesman_name: boolean
  default_category?: { id: number; name: string } | null
}

export interface PrinterSetting {
  id?: number
  receipt_printer_name: string | null
  receipt_printer_port: string | null
  receipt_printer_2_name: string | null
  receipt_printer_2_copies: number
  receipt_printer_2_size: string
  job_order_printer: string | null
  sales_paper_size: string
  sales_paper_width_mm: number
  sales_paper_height_in: string
  number_of_copies: number
  sales_receipt_title: string
  job_order_title: string
  claim_slip_title: string
  delivery_receipt_title: string
  auto_new_transaction_after_print: boolean
  close_pay_after_printing: boolean
  print_directly: boolean
  print_preview: boolean
  receipt_footer_remark: string
  receipt_vat_remark: string
  receipt_terms: string
}

export interface SettingsBundle {
  general: Setting[]
  company: CompanySetting
  sales_transaction: SalesTransactionSetting
  printer: PrinterSetting
}
