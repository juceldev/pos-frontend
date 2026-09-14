import { useAuthStore } from '~/stores/auth'

export default defineNuxtRouteMiddleware(async () => {
  if (!import.meta.client) return

  const auth = useAuthStore()

  if (!auth.ready) {
    await new Promise<void>((resolve) => {
      const stop = watchEffect(() => {
        if (auth.ready) {
          resolve()
          stop?.()
        }
      })
    })
  }

  if (!auth.isLoggedIn) {
    return navigateTo('/login')
  }
})
