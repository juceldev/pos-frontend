export function formatAmount (amount: number | string, currency = 'PHP', locale = 'en-PH'): string {
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(Number(amount ?? 0))
}

export function formatNumber (amount: number | string, decimals = 2): string {
  return Number(amount ?? 0).toLocaleString(locale, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
}

export function formatQty (qty: number | string): string {
  return Number(qty ?? 0).toLocaleString(locale, { minimumFractionDigits: 0, maximumFractionDigits: 2 })
}

export function formatDate (date: string | Date | null): string {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-PH')
}

export function formatBytes (bytes: number | string): string {
  const size = Number(bytes ?? 0)
  if (size <= 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.min(Math.floor(Math.log(size) / Math.log(1024)), units.length - 1)
  return `${(size / 1024 ** i).toFixed(i === 0 ? 0 : 1)} ${units[i]}`
}

const locale = 'en-PH'
