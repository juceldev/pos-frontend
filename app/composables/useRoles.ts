export interface Permission {
  id: number
  name: string
  label: string
  action: string
}

export interface PermissionGroup {
  resource: string
  items: Permission[]
}

export interface Role {
  id: number
  name: string
  label: string
  permissions: string[]
}

export interface RolesResponse {
  roles: Role[]
  permissions: PermissionGroup[]
}

export function useRoles () {
  const { $api } = useNuxtApp()

  const roles = ref<Role[]>([])
  const permissionGroups = ref<PermissionGroup[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchRoles () {
    loading.value = true
    error.value = null
    try {
      const response = await $api<RolesResponse>('/api/roles')
      roles.value = response.roles ?? []
      permissionGroups.value = response.permissions ?? []
    } catch (err: any) {
      error.value = err?.data?.message || 'Failed to load roles'
    } finally {
      loading.value = false
    }
  }

  async function updateRole (id: number, permissionIds: number[]) {
    try {
      await $api(`/api/roles/${id}`, {
        method: 'PUT',
        body: { permissions: permissionIds }
      })
      return true
    } catch (err: any) {
      error.value = err?.data?.message || 'Failed to update role'
      return false
    }
  }

  return {
    roles,
    permissionGroups,
    loading,
    error,
    fetchRoles,
    updateRole
  }
}
