import { useAuthStore } from '~/stores/auth'

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  const auth = useAuthStore()

  const api = $fetch.create({
    baseURL: config.public.apiBaseUrl as string,
    credentials: 'include',
    headers: {
      Accept: 'application/json'
    },
    onRequest ({ options }) {
      const token = auth.token
      if (token) {
        const headers = options.headers ||= {}
        if (headers instanceof Headers) {
          headers.set('Authorization', `Bearer ${token}`)
        } else if (Array.isArray(headers)) {
          const existing = headers.findIndex(([key]) => key.toLowerCase() === 'authorization')
          if (existing >= 0) headers[existing] = ['Authorization', `Bearer ${token}`]
          else headers.push(['Authorization', `Bearer ${token}`])
        } else {
          ;(headers as Record<string, string>).Authorization = `Bearer ${token}`
        }
      }
    },
    onResponseError ({ response }) {
      if (response.status === 401 && import.meta.client) {
        auth.logout()
        navigateTo('/login')
      }
    }
  })

  return {
    provide: {
      api
    }
  }
})
