import { useAuthStore } from '~/stores/auth'

export function buildApiUrl (path: string, params: Record<string, any> = {}): string {
  const config = useRuntimeConfig()
  const base = ((config.public.apiBaseUrl as string) || '').replace(/\/+$/, '')
  const auth = useAuthStore()
  const query: Record<string, string> = {}
  if (auth.token) query.token = auth.token
  for (const [key, value] of Object.entries(params)) {
    if (value !== null && value !== undefined && value !== '') query[key] = String(value)
  }
  const qs = new URLSearchParams(query).toString()
  return `${base}${path}${qs ? `?${qs}` : ''}`
}
