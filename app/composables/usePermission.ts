import { useAuthStore } from '~/stores/auth'

export function usePermission () {
  const auth = useAuthStore()

  function hasPermission (permission: string): boolean {
    const user = auth.user
    if (user?.role === 'admin' || user?.roles?.includes('admin')) return true
    return auth.permissions.includes(permission)
  }

  return {
    hasPermission
  }
}
