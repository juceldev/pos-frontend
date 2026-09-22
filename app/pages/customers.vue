<script setup lang="ts">
import type { Customer } from '~/types/product'
import { useCustomers } from '~/composables/useCustomers'
import { usePermission } from '~/composables/usePermission'

definePageMeta({
  middleware: 'auth'
})

const { customersList, meta, loading, error, fetchCustomersList, createCustomer, updateCustomer, deleteCustomer } = useCustomers()
const { hasPermission } = usePermission()

const search = ref('')
const isActive = ref<boolean | null>(null)
const page = ref(1)
const perPage = ref(15)
const sortBy = ref<{ key: string; order: 'asc' | 'desc' }[]>([{ key: 'name', order: 'asc' }])
const showFilterDrawer = ref(false)

const statusFilterItems = [
  { title: 'All', value: null },
  { title: 'Active', value: true },
  { title: 'Inactive', value: false }
]

const headers = [
  { title: 'Code', key: 'code', sortable: true, minWidth: '120px' },
  { title: 'Customer Name', key: 'name', sortable: true, minWidth: '200px' },
  { title: 'Contact Person', key: 'contact_person', sortable: false, minWidth: '150px' },
  { title: 'Phone', key: 'phone', sortable: false, minWidth: '120px' },
  { title: 'Group', key: 'group', sortable: false, minWidth: '120px' },
  { title: 'Status', key: 'is_active', sortable: false, minWidth: '100px' },
  { title: 'Actions', key: 'actions', sortable: false, align: 'end', width: '60px' }
]

const filters = computed(() => ({
  page: page.value,
  per_page: perPage.value,
  search: search.value || undefined,
  is_active: isActive.value === null ? undefined : isActive.value,
  sort_by: sortBy.value[0]?.key ?? 'name',
  sort_direction: sortBy.value[0]?.order ?? 'asc'
}))

const activeFilterCount = computed(() =>
  [isActive.value].filter(v => v !== null && v !== undefined).length
)

const activeFilters = computed(() => {
  const list: { key: string, label: string, clear: () => void }[] = []
  if (isActive.value !== null) {
    const item = statusFilterItems.find(i => i.value === isActive.value)
    list.push({ key: 'status', label: `Status: ${item?.title ?? isActive.value}`, clear: () => { isActive.value = null } })
  }
  return list
})

function clearAllFilters () {
  search.value = ''
  isActive.value = null
}

async function load () {
  if (!import.meta.client) return
  await fetchCustomersList(filters.value)
}

const termsOfPaymentItems = [
  { title: 'Cash on Delivery', value: 'COD' },
  { title: 'Net 15', value: 'NET15' },
  { title: 'Net 30', value: 'NET30' },
  { title: 'Net 45', value: 'NET45' },
  { title: 'Net 60', value: 'NET60' },
  { title: 'Prepaid', value: 'PREPAID' },
  { title: 'Consignment', value: 'CONSIGNMENT' }
]

const groupItems = [
  { title: 'Walk-in', value: 'walk-in' },
  { title: 'Regular', value: 'regular' },
  { title: 'VIP', value: 'vip' },
  { title: 'Wholesale', value: 'wholesale' },
  { title: 'Retail', value: 'retail' },
  { title: 'Corporate', value: 'corporate' },
  { title: 'Consignment', value: 'consignment' }
]

const form = reactive({
  code: '',
  name: '',
  contact_person: '',
  group: '',
  phone: '',
  is_active: true
})

const showForm = ref(false)
const selectedCustomer = ref<Customer | null>(null)

function openForm (customer: Customer | null = null) {
  selectedCustomer.value = customer
  form.code = customer?.code ?? ''
  form.name = customer?.name ?? ''
  form.contact_person = customer?.contact_person ?? ''
  form.group = customer?.group ?? ''
  form.phone = customer?.phone ?? ''
  form.is_active = customer?.is_active ?? true
  showForm.value = true
}

function closeForm () {
  showForm.value = false
  selectedCustomer.value = null
  form.code = ''
  form.name = ''
  form.contact_person = ''
  form.group = ''
  form.phone = ''
  form.is_active = true
}

async function saveCustomer () {
  const ok = selectedCustomer.value
    ? await updateCustomer(selectedCustomer.value.id, { ...form })
    : await createCustomer({ ...form })
  if (ok) {
    closeForm()
    await load()
    snackbarText.value = selectedCustomer.value ? 'Customer updated' : 'Customer created'
    snackbarColor.value = 'success'
    snackbar.value = true
  }
}

const { confirm } = useConfirm()

async function handleDelete (customer: Customer) {
  const confirmed = await confirm({
    title: 'Delete Customer',
    message: `Delete customer "${customer.name}"?`,
    confirmText: 'Delete'
  })
  if (!confirmed) return
  const ok = await deleteCustomer(customer.id)
  if (ok) {
    await load()
    snackbarText.value = 'Customer deleted'
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
  <AppPageHeader title="Customers" subtitle="Manage customer accounts">
    <template #actions>
      <v-btn
        v-if="hasPermission('customers.create')"
        color="primary"
        prepend-icon="mdi-plus"
        @click="openForm()"
      >
        Add Customer
      </v-btn>
    </template>
  </AppPageHeader>

  <AppCard>
    <v-toolbar color="surface" flat density="comfortable" class="rounded-t-lg">
      <v-text-field
        v-model="search"
        label="Search customers..."
        prepend-inner-icon="mdi-magnify"
        clearable
        density="compact"
        variant="outlined"
        style="max-width: 400px"
        class="align-self-center me-3"
      />
      <v-select
        v-model="isActive"
        label="Status"
        :items="statusFilterItems"
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
      <v-btn
        prepend-icon="mdi-refresh"
        variant="text"
        size="small"
        :loading="loading"
        @click="load"
      >
        <span class="d-none d-sm-inline">Refresh</span>
      </v-btn>
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
      :items="customersList"
      :items-length="meta.total"
      :loading="loading"
      empty-text="No customers found"
    >
      <template #item.is_active="{ item }">
        <v-chip :color="item.is_active ? 'success' : 'error'" size="small">
          {{ item.is_active ? 'Active' : 'Inactive' }}
        </v-chip>
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
                v-if="hasPermission('customers.edit')"
                prepend-icon="mdi-pencil"
                title="Edit"
                @click="openForm(item)"
              />
              <v-list-item
                v-if="hasPermission('customers.delete')"
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
      <div class="text-subtitle-2 mb-2">Status</div>
      <v-select
        v-model="isActive"
        label="Status"
        :items="statusFilterItems"
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
    :title="selectedCustomer ? 'Edit Customer' : 'Add Customer'"
    :can-save="!!form.name.trim()"
    :max-width="600"
    @save="saveCustomer"
  >
    <AppFormSection title="Customer Details">
      <v-row dense>
        <v-col cols="12">
          <v-text-field v-model="form.name" label="Customer Name *" variant="outlined" density="compact" :rules="[v => !!v || 'Required']" />
        </v-col>
        <v-col cols="12" sm="6">
          <v-text-field v-model="form.contact_person" label="Contact Person" variant="outlined" density="compact" />
        </v-col>
        <v-col cols="12" sm="6">
          <v-text-field v-model="form.phone" label="Phone" variant="outlined" density="compact" />
        </v-col>
        <v-col cols="12" sm="6">
          <v-select v-model="form.group" label="Group" :items="groupItems" item-title="title" item-value="value" variant="outlined" density="compact" clearable />
        </v-col>
        <v-col cols="12" sm="6">
          <v-select v-model="form.is_active" label="Status" :items="[{ title: 'Active', value: true }, { title: 'Inactive', value: false }]" item-title="title" item-value="value" variant="outlined" density="compact" />
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
