import type { CompanySetting, PrinterSetting, SalesTransactionSetting, Setting, SettingsBundle } from '~/types/settings'

export function useSettings () {
  const { $api } = useNuxtApp()

  const settings = ref<Record<string, string | null>>({})
  const company = ref<CompanySetting | null>(null)
  const salesTransaction = ref<SalesTransactionSetting | null>(null)
  const printer = ref<PrinterSetting | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchSettings () {
    loading.value = true
    error.value = null
    try {
      const response = await $api('/api/settings') as any
      const bundle: SettingsBundle = response?.data ?? response ?? {}

      if (bundle.general) {
        settings.value = bundle.general.reduce((acc: Record<string, string | null>, s: Setting) => {
          acc[s.key] = s.value
          return acc
        }, {})
      }

      company.value = bundle.company ?? null
      salesTransaction.value = bundle.sales_transaction ?? null
      printer.value = bundle.printer ?? null
    } catch (err: any) {
      error.value = err?.data?.message || 'Failed to load settings'
    } finally {
      loading.value = false
    }
  }

  async function saveSettings (items: Array<{ key: string; value: string | null }>) {
    try {
      const response = await $api('/api/settings', {
        method: 'PUT',
        body: { items }
      }) as any
      const updated: Setting[] = response?.data ?? response ?? []
      settings.value = updated.reduce((acc, s) => {
        acc[s.key] = s.value
        return acc
      }, {} as Record<string, string | null>)
      return true
    } catch (err: any) {
      error.value = err?.data?.message || 'Failed to save settings'
      return false
    }
  }

  async function saveCompany (data: Partial<CompanySetting>) {
    try {
      const response = await $api('/api/settings/company', {
        method: 'PUT',
        body: data
      }) as any
      company.value = response?.data ?? response
      return true
    } catch (err: any) {
      error.value = err?.data?.message || 'Failed to save company settings'
      return false
    }
  }

  async function saveSalesTransaction (data: Partial<SalesTransactionSetting>) {
    try {
      const response = await $api('/api/settings/sales-transaction', {
        method: 'PUT',
        body: data
      }) as any
      salesTransaction.value = response?.data ?? response
      return true
    } catch (err: any) {
      error.value = err?.data?.message || 'Failed to save sales transaction settings'
      return false
    }
  }

  async function savePrinter (data: Partial<PrinterSetting>) {
    try {
      const response = await $api('/api/settings/printer', {
        method: 'PUT',
        body: data
      }) as any
      printer.value = response?.data ?? response
      return true
    } catch (err: any) {
      error.value = err?.data?.message || 'Failed to save printer settings'
      return false
    }
  }

  return {
    settings,
    company,
    salesTransaction,
    printer,
    loading,
    error,
    fetchSettings,
    saveSettings,
    saveCompany,
    saveSalesTransaction,
    savePrinter
  }
}
