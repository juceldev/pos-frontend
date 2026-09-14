export function formatAmount (amount: number | string, currency = 'PHP', locale = 'en-PH'): string {
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(Number(amount ?? 0))
}

export function formatNumber (amount: number | string, decimals = 2): string {
  return Number(amount ?? 0).toLocaleString(locale, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
}

export function formatQty (qty: number | string): string {
  return Number(qty ?? 0).toLocaleString(locale, { minimumFractionDigits: 0, maximumFractionDigits: 2 })
}

const locale = 'en-PH'
