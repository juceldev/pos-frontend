<script setup lang="ts">
import type { User } from '~/types/user'
import { useUsers } from '~/composables/useUsers'
import { usePermission } from '~/composables/usePermission'

definePageMeta({
  middleware: 'auth'
})

const { usersList, meta, loading, error, fetchUsersList, createUser, updateUser, deleteUser } = useUsers()
const { hasPermission } = usePermission()

const search = ref('')
const role = ref<string | null>(null)
const page = ref(1)
const perPage = ref(15)
const sortBy = ref<{ key: string; order: 'asc' | 'desc' }[]>([{ key: 'name', order: 'asc' }])
const showFilterDrawer = ref(false)

const roleItems = [
  { title: 'Administrator', value: 'admin' },
  { title: 'Manager', value: 'manager' },
  { title: 'Cashier', value: 'cashier' }
]

const roleFilterItems = [
  { title: 'All', value: null },
  ...roleItems
]

const headers = [
  { title: 'Name', key: 'name', sortable: true, minWidth: '200px' },
  { title: 'Username', key: 'username', sortable: true, minWidth: '140px' },
  { title: 'Email', key: 'email', sortable: true, minWidth: '220px' },
  { title: 'Role', key: 'role', sortable: true, minWidth: '120px' },
  { title: 'Created', key: 'created_at', sortable: true, minWidth: '160px' },
  { title: 'Actions', key: 'actions', sortable: false, align: 'end', width: '100px' }
]

const filters = computed(() => ({
  page: page.value,
  per_page: perPage.value,
  search: search.value || undefined,
  role: role.value || undefined,
  sort_by: sortBy.value[0]?.key ?? 'name',
  sort_direction: sortBy.value[0]?.order ?? 'asc'
}))

const activeFilterCount = computed(() =>
  [role.value].filter(v => v !== null && v !== undefined).length
)

const activeFilters = computed(() => {
  const list: { key: string, label: string, clear: () => void }[] = []
  if (role.value !== null) {
    const item = roleFilterItems.find(i => i.value === role.value)
    list.push({ key: 'role', label: `Role: ${item?.title ?? role.value}`, clear: () => { role.value = null } })
  }
  return list
})

function clearAllFilters () {
  search.value = ''
  role.value = null
}

async function load () {
  if (!import.meta.client) return
  await fetchUsersList(filters.value)
}

const form = reactive({
  name: '',
  username: '',
  email: '',
  password: '',
  role: 'cashier' as string
})

const showForm = ref(false)
const selectedUser = ref<User | null>(null)

function openForm (user: User | null = null) {
  selectedUser.value = user
  form.name = user?.name ?? ''
  form.username = user?.username ?? ''
  form.email = user?.email ?? ''
  form.password = ''
  form.role = user?.role ?? 'cashier'
  showForm.value = true
}

function closeForm () {
  showForm.value = false
  selectedUser.value = null
  form.name = ''
  form.username = ''
  form.email = ''
  form.password = ''
  form.role = 'cashier'
}

async function saveUser () {
  const data: any = {
    name: form.name,
    username: form.username,
    email: form.email,
    role: form.role
  }
  if (form.password.trim()) {
    data.password = form.password
  } else if (!selectedUser.value) {
    data.password = 'password'
  }

  const ok = selectedUser.value
    ? await updateUser(selectedUser.value.id, data)
    : await createUser(data)
  if (ok) {
    closeForm()
    await load()
    snackbarText.value = selectedUser.value ? 'User updated' : 'User created'
    snackbarColor.value = 'success'
    snackbar.value = true
  }
}

const { confirm } = useConfirm()

async function handleDelete (user: User) {
  const confirmed = await confirm({
    title: 'Delete User',
    message: `Delete user "${user.name}"?`,
    confirmText: 'Delete'
  })
  if (!confirmed) return
  const ok = await deleteUser(user.id)
  if (ok) {
    await load()
    snackbarText.value = 'User deleted'
    snackbarColor.value = 'success'
    snackbar.value = true
  }
}

const snackbar = ref(false)
const snackbarText = ref('')
const snackbarColor = ref('success')

watch(error, (msg) => {
  if (msg) {
    snackbarText.value = msg
    snackbarColor.value = 'error'
    snackbar.value = true
  }
})

onMounted(load)
watch(filters, load, { deep: true })
</script>

<template>
  <AppPageHeader title="Users" subtitle="Manage staff accounts">
    <template #actions>
      <v-btn
        v-if="hasPermission('users.create')"
        color="primary"
        prepend-icon="mdi-plus"
        @click="openForm()"
      >
        Add User
      </v-btn>
    </template>
  </AppPageHeader>

  <AppCard>
    <v-toolbar color="surface" flat density="comfortable" class="rounded-t-lg">
      <v-text-field
        v-model="search"
        label="Search users..."
        prepend-inner-icon="mdi-magnify"
        clearable
        density="compact"
        variant="outlined"
        style="max-width: 400px"
        class="align-self-center me-3"
      />
      <v-select
        v-model="role"
        label="Role"
        :items="roleFilterItems"
        item-title="title"
        item-value="value"
        clearable
        density="compact"
        variant="outlined"
        style="max-width: 180px"
        class="align-self-center me-4"
      />
      <v-badge
        :content="activeFilterCount"
        :model-value="activeFilterCount > 0"
        color="primary"
        offset-x="8"
        offset-y="8"
      >
        <v-tooltip text="Filters" location="top">
          <template #activator="{ props: tipProps }">
            <v-btn
              v-bind="tipProps"
              icon="mdi-filter-variant"
              variant="outlined"
              size="small"
              aria-label="Filters"
              @click="showFilterDrawer = true"
            />
          </template>
        </v-tooltip>
      </v-badge>
      <v-spacer />
      <v-tooltip text="Refresh" location="top">
        <template #activator="{ props: tipProps }">
          <v-btn
            v-bind="tipProps"
            icon="mdi-refresh"
            variant="text"
            size="small"
            aria-label="Refresh"
            :loading="loading"
            @click="load"
          />
        </template>
      </v-tooltip>
    </v-toolbar>
    <div v-if="activeFilters.length" class="d-flex flex-wrap ga-1 px-4 pb-2">
      <v-chip
        v-for="f in activeFilters"
        :key="f.key"
        size="small"
        color="primary"
        variant="tonal"
        closable
        @click:close="f.clear"
      >
        {{ f.label }}
      </v-chip>
    </div>
    <v-divider />
    <AppDataTable
      v-model:page="page"
      v-model:items-per-page="perPage"
      v-model:sort-by="sortBy"
      :headers="headers"
      :items="usersList"
      :items-length="meta.total"
      :loading="loading"
      empty-text="No users found"
    >
      <template #item.created_at="{ item }">
        {{ new Date(item.created_at).toLocaleString() }}
      </template>

      <template #item.actions="{ item }">
        <div class="d-flex justify-end">
          <v-menu location="bottom end">
            <template #activator="{ props }">
              <v-btn
                v-bind="props"
                icon="mdi-dots-vertical"
                variant="text"
                size="small"
                aria-label="Actions"
              />
            </template>
            <v-list density="compact" min-width="160">
              <v-list-item
                v-if="hasPermission('users.edit')"
                prepend-icon="mdi-pencil"
                title="Edit"
                @click="openForm(item)"
              />
              <v-list-item
                v-if="hasPermission('users.delete')"
                prepend-icon="mdi-delete"
                title="Delete"
                base-color="error"
                @click="handleDelete(item)"
              />
            </v-list>
          </v-menu>
        </div>
      </template>
    </AppDataTable>
  </AppCard>

  <v-navigation-drawer v-model="showFilterDrawer" location="right" temporary width="320">
    <v-toolbar color="surface" flat density="comfortable">
      <v-toolbar-title class="text-subtitle-1">Filters</v-toolbar-title>
      <v-spacer />
      <v-btn icon="mdi-close" variant="text" size="small" @click="showFilterDrawer = false" />
    </v-toolbar>
    <v-divider />
    <div class="pa-4">
      <div class="text-subtitle-2 mb-2">Role</div>
      <v-select
        v-model="role"
        label="Role"
        :items="roleFilterItems"
        item-title="title"
        item-value="value"
        clearable
        class="mb-4"
      />

      <v-btn
        block
        size="small"
        variant="tonal"
        color="error"
        prepend-icon="mdi-filter-remove"
        :disabled="activeFilterCount === 0 && !search"
        @click="clearAllFilters"
      >
        Clear All
      </v-btn>
    </div>
  </v-navigation-drawer>

  <AppFormDialog
    v-model="showForm"
    :title="selectedUser ? 'Edit User' : 'Add User'"
    :can-save="!!form.name.trim() && !!form.username.trim()"
    @save="saveUser"
  >
    <AppFormSection title="User Details">
      <v-row dense>
        <v-col cols="12" sm="6">
          <v-text-field v-model="form.name" label="Name" :rules="[v => !!v || 'Required']" />
        </v-col>
        <v-col cols="12" sm="6">
          <v-text-field
            v-model="form.username"
            label="Username"
            :rules="[v => !!v || 'Required']"
            prepend-inner-icon="mdi-account-outline"
            hint="Used for login"
            persistent-hint
          />
        </v-col>
        <v-col cols="12" sm="6">
          <v-text-field v-model="form.email" label="Email" :rules="[v => !!v || 'Required']" />
        </v-col>
        <v-col cols="12" sm="6">
          <v-select v-model="form.role" label="Role" :items="roleItems" item-title="title" item-value="value" />
        </v-col>
        <v-col cols="12" sm="6">
          <v-text-field
            v-model="form.password"
            label="Password"
            type="password"
            :rules="selectedUser ? [] : [v => !!v || 'Required']"
            :hint="selectedUser ? 'Leave blank to keep current' : ''"
            persistent-hint
          />
        </v-col>
      </v-row>
    </AppFormSection>
  </AppFormDialog>

  <v-snackbar v-model="snackbar" :color="snackbarColor" timeout="4000">
    {{ snackbarText }}
    <template #actions>
      <v-btn variant="text" @click="snackbar = false">Close</v-btn>
    </template>
  </v-snackbar>
</template>
