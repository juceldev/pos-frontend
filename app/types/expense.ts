export interface Expense {
  id: number
  expense_date: string
  type: string
  description: string
  amount: number
  user?: { id: number; name: string } | null
  created_at?: string
  updated_at?: string
}

export interface ExpenseFilters {
  page?: number
  per_page?: number
  search?: string
  type?: string
  from?: string
  to?: string
}

export interface ExpenseMonthlyTotal {
  month: number
  year: number
  total: number
  running_total: number
}
