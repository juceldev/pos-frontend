import type { Expense, ExpenseFilters, ExpenseMonthlyTotal } from '~/types/expense'

export function useExpenses () {
  const { $api } = useNuxtApp()

  const expenses = ref<Expense[]>([])
  const meta = ref({ total: 0, last_page: 1 })
  const loading = ref(false)
  const error = ref<string | null>(null)
  const monthlyTotal = ref<ExpenseMonthlyTotal | null>(null)

  async function fetchExpenses (filters: ExpenseFilters = {}) {
    loading.value = true
    error.value = null
    try {
      const response = await $api('/api/expenses', { query: filters }) as any
      expenses.value = response.data ?? []
      meta.value = {
        total: response.meta?.total ?? 0,
        last_page: response.meta?.last_page ?? 1
      }
    } catch (err: any) {
      error.value = err?.data?.message || 'Failed to load expenses'
    } finally {
      loading.value = false
    }
  }

  async function createExpense (data: Partial<Expense>) {
    try {
      await $api('/api/expenses', { method: 'POST', body: data })
      return true
    } catch (err: any) {
      error.value = err?.data?.message || 'Failed to create expense'
      return false
    }
  }

  async function updateExpense (id: number, data: Partial<Expense>) {
    try {
      await $api(`/api/expenses/${id}`, { method: 'PUT', body: data })
      return true
    } catch (err: any) {
      error.value = err?.data?.message || 'Failed to update expense'
      return false
    }
  }

  async function deleteExpense (id: number) {
    try {
      await $api(`/api/expenses/${id}`, { method: 'DELETE' })
      return true
    } catch (err: any) {
      error.value = err?.data?.message || 'Failed to delete expense'
      return false
    }
  }

  async function fetchMonthlyTotal (year?: number, month?: number) {
    try {
      const response = await $api('/api/expenses/monthly-total', {
        query: { year: year ?? new Date().getFullYear(), month: month ?? new Date().getMonth() + 1 }
      }) as any
      monthlyTotal.value = response
    } catch (err: any) {
      monthlyTotal.value = null
    }
  }

  return {
    expenses,
    meta,
    loading,
    error,
    monthlyTotal,
    fetchExpenses,
    createExpense,
    updateExpense,
    deleteExpense,
    fetchMonthlyTotal
  }
}
