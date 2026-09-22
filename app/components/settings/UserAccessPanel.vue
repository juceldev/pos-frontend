<script setup lang="ts">
import { useRoles } from '~/composables/useRoles'

interface Props {
  canEdit: boolean
}

defineProps<Props>()

const { roles, permissionGroups, loading, fetchRoles, updateRole } = useRoles()

const activeRole = ref<number | null>(null)
const saving = ref(false)
const snackbar = ref(false)
const snackbarText = ref('')
const snackbarColor = ref('success')

const expandedGroups = computed(() => permissionGroups.value.map(g => g.resource))

const permissionMap = computed(() => {
  const map: Record<string, number> = {}
  permissionGroups.value.forEach((g) => {
    g.items.forEach((p) => {
      map[p.name] = p.id
    })
  })
  return map
})

const selectedPermissions = ref<Record<number, number[]>>({})

function roleSelection (role: any): number[] {
  return (role.permissions ?? [])
    .map((name: string) => permissionMap.value[name])
    .filter((id: number | undefined) => id !== undefined) as number[]
}

function initSelections () {
  selectedPermissions.value = roles.value.reduce((acc, role) => {
    acc[role.id] = roleSelection(role)
    return acc
  }, {} as Record<number, number[]>)
}

onMounted(async () => {
  await fetchRoles()
  if (roles.value.length) {
    activeRole.value = roles.value[0].id
  }
  initSelections()
})

watch(roles, initSelections, { deep: true })

async function saveRole (roleId: number) {
  saving.value = true
  const ok = await updateRole(roleId, selectedPermissions.value[roleId] ?? [])
  saving.value = false
  if (ok) {
    await fetchRoles()
    snackbarText.value = 'Role permissions updated'
    snackbarColor.value = 'success'
  } else {
    snackbarText.value = 'Failed to update role permissions'
    snackbarColor.value = 'error'
  }
  snackbar.value = true
}

function togglePermission (roleId: number, permissionId: number, checked: boolean) {
  const current = selectedPermissions.value[roleId] ?? []
  if (checked) {
    selectedPermissions.value[roleId] = [...current, permissionId]
  } else {
    selectedPermissions.value[roleId] = current.filter(id => id !== permissionId)
  }
}

function isSelected (roleId: number, permissionId: number): boolean {
  return (selectedPermissions.value[roleId] ?? []).includes(permissionId)
}
</script>

<template>
  <v-card flat class="border" title="User Level and Access Rights">
    <v-card-text>
      <v-progress-linear v-if="loading" indeterminate color="primary" class="mb-2" />

      <v-tabs v-model="activeRole" color="primary" class="mb-4">
        <v-tab v-for="role in roles" :key="role.id" :value="role.id">
          {{ role.label }}
        </v-tab>
      </v-tabs>

      <v-tabs-window v-model="activeRole">
        <v-tabs-window-item v-for="role in roles" :key="role.id" :value="role.id">
          <v-expansion-panels multiple :model-value="expandedGroups" density="compact" class="access-panels">
            <v-expansion-panel v-for="group in permissionGroups" :key="group.resource" :value="group.resource" density="compact" class="access-panel">
              <v-expansion-panel-title density="compact" class="text-body-2 font-weight-medium py-0 access-panel-title">
                <v-icon size="16" class="me-1">mdi-shield-account-outline</v-icon>
                {{ group.resource }}
              </v-expansion-panel-title>
              <v-expansion-panel-text density="compact" class="pt-0 access-panel-text">
                <v-row dense class="mt-0">
                  <v-col
                    v-for="permission in group.items"
                    :key="permission.id"
                    cols="12"
                    sm="6"
                    md="4"
                    lg="3"
                  >
                    <v-checkbox
                      :model-value="isSelected(role.id, permission.id)"
                      :label="permission.label"
                      :value="permission.id"
                      :disabled="!canEdit"
                      density="compact"
                      hide-details
                      @update:model-value="(v) => togglePermission(role.id, permission.id, !!v)"
                    />
                  </v-col>
                </v-row>
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>

          <div class="d-flex justify-end mt-4">
            <v-btn
              v-if="canEdit"
              color="primary"
              :loading="saving"
              @click="saveRole(role.id)"
            >
              Save {{ role.label }}
            </v-btn>
          </div>
        </v-tabs-window-item>
      </v-tabs-window>
    </v-card-text>

    <v-snackbar v-model="snackbar" :color="snackbarColor" timeout="3000" location="bottom right">
      {{ snackbarText }}
      <template #actions>
        <v-btn variant="text" size="small" @click="snackbar = false">Close</v-btn>
      </template>
    </v-snackbar>
  </v-card>
</template>

<style scoped>
.access-panels {
  gap: 4px;
}

.access-panel {
  background: rgba(var(--v-theme-on-surface), 0.03);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  border-radius: 6px;
}

.access-panel-title {
  min-height: 32px !important;
  padding: 4px 12px !important;
}

.access-panel-text :deep(.v-expansion-panel-text__wrapper) {
  padding: 4px 12px 8px 12px !important;
}
</style>
