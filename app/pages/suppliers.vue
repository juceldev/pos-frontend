<script setup lang="ts">
import type { Supplier } from '~/types/product'
import { usePermission } from '~/composables/usePermission'
import { useSuppliers } from '~/composables/useSuppliers'

definePageMeta({
  middleware: 'auth'
})

const { suppliersList, meta, loading, error, fetchSuppliersList, createSupplier, updateSupplier, deleteSupplier } = useSuppliers()
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
  { title: 'Supplier Name', key: 'name', sortable: true, minWidth: '200px' },
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
  await fetchSuppliersList(filters.value)
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
  { title: 'Local', value: 'local' },
  { title: 'International', value: 'international' },
  { title: 'Wholesale', value: 'wholesale' },
  { title: 'Retail', value: 'retail' },
  { title: 'Distributor', value: 'distributor' },
  { title: 'Manufacturer', value: 'manufacturer' }
]

const form = reactive({
  name: '',
  code: '',
  id_number: '',
  barcode: '',
  contact_person: '',
  group: '',
  vat_tin: '',
  terms_of_payment: '',
  phone: '',
  email: '',
  address: '',
  notes: '',
  is_active: true
})

const showForm = ref(false)
const selectedSupplier = ref<Supplier | null>(null)

function openForm (supplier: Supplier | null = null) {
  selectedSupplier.value = supplier
  form.name = supplier?.name ?? ''
  form.code = supplier?.code ?? ''
  form.id_number = supplier?.id_number ?? ''
  form.barcode = supplier?.barcode ?? ''
  form.contact_person = supplier?.contact_person ?? ''
  form.group = supplier?.group ?? ''
  form.vat_tin = supplier?.vat_tin ?? ''
  form.terms_of_payment = supplier?.terms_of_payment ?? ''
  form.phone = supplier?.phone ?? ''
  form.email = supplier?.email ?? ''
  form.address = supplier?.address ?? ''
  form.notes = supplier?.notes ?? ''
  form.is_active = supplier?.is_active ?? true
  showForm.value = true
}

function closeForm () {
  showForm.value = false
  selectedSupplier.value = null
  form.name = ''
  form.code = ''
  form.id_number = ''
  form.barcode = ''
  form.contact_person = ''
  form.group = ''
  form.vat_tin = ''
  form.terms_of_payment = ''
  form.phone = ''
  form.email = ''
  form.address = ''
  form.notes = ''
  form.is_active = true
}

async function saveSupplier () {
  const ok = selectedSupplier.value
    ? await updateSupplier(selectedSupplier.value.id, { ...form })
    : await createSupplier({ ...form })
  if (ok) {
    closeForm()
    await load()
    snackbarText.value = selectedSupplier.value ? 'Supplier updated' : 'Supplier created'
    snackbarColor.value = 'success'
    snackbar.value = true
  }
}

const { confirm } = useConfirm()

async function handleDelete (supplier: Supplier) {
  const confirmed = await confirm({
    title: 'Delete Supplier',
    message: `Delete supplier "${supplier.name}"?`,
    confirmText: 'Delete'
  })
  if (!confirmed) return
  const ok = await deleteSupplier(supplier.id)
  if (ok) {
    await load()
    snackbarText.value = 'Supplier deleted'
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
  <AppPageHeader title="Suppliers" subtitle="Manage product suppliers">
    <template #actions>
      <v-btn
        v-if="hasPermission('suppliers.create')"
        color="primary"
        prepend-icon="mdi-plus"
        @click="openForm()"
      >
        Add Supplier
      </v-btn>
    </template>
  </AppPageHeader>

  <AppCard>
    <v-toolbar color="surface" flat density="comfortable" class="rounded-t-lg">
      <v-text-field
        v-model="search"
        label="Search suppliers..."
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
      :items="suppliersList"
      :items-length="meta.total"
      :loading="loading"
      empty-text="No suppliers found"
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
                v-if="hasPermission('suppliers.edit')"
                prepend-icon="mdi-pencil"
                title="Edit"
                @click="openForm(item)"
              />
              <v-list-item
                v-if="hasPermission('suppliers.delete')"
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
    :title="selectedSupplier ? 'Edit Supplier' : 'Add Supplier'"
    :can-save="!!form.name.trim()"
    @save="saveSupplier"
  >
    <AppFormSection title="Supplier Details">
      <v-row dense>
        <v-col v-if="selectedSupplier" cols="12" sm="6" md="4">
          <v-text-field :model-value="form.code" label="Code" variant="outlined" density="compact" readonly />
        </v-col>
        <v-col cols="12" sm="6" md="4">
          <v-text-field v-model="form.id_number" label="ID Number" variant="outlined" density="compact" />
        </v-col>
        <v-col cols="12" sm="6" md="4">
          <v-text-field v-model="form.barcode" label="Barcode" variant="outlined" density="compact" />
        </v-col>
        <v-col cols="12">
          <v-text-field v-model="form.name" label="Supplier Name *" variant="outlined" density="compact" :rules="[v => !!v || 'Required']" />
        </v-col>
        <v-col cols="12" sm="6" md="4">
          <v-text-field v-model="form.contact_person" label="Contact Person" variant="outlined" density="compact" />
        </v-col>
        <v-col cols="12" sm="6" md="4">
          <v-select v-model="form.group" label="Group" :items="groupItems" item-title="title" item-value="value" variant="outlined" density="compact" clearable />
        </v-col>
        <v-col cols="12" sm="6" md="4">
          <v-text-field v-model="form.vat_tin" label="VAT/TIN" variant="outlined" density="compact" />
        </v-col>
        <v-col cols="12" sm="6" md="4">
          <v-select v-model="form.terms_of_payment" label="Terms of Payment" :items="termsOfPaymentItems" item-title="title" item-value="value" variant="outlined" density="compact" clearable />
        </v-col>
        <v-col cols="12" sm="6" md="4">
          <v-text-field v-model="form.phone" label="Phone" variant="outlined" density="compact" />
        </v-col>
        <v-col cols="12" sm="6" md="4">
          <v-text-field v-model="form.email" label="Email" variant="outlined" density="compact" />
        </v-col>
        <v-col cols="12" sm="6" md="4">
          <v-select v-model="form.is_active" label="Status" :items="[{ title: 'Active', value: true }, { title: 'Inactive', value: false }]" item-title="title" item-value="value" variant="outlined" density="compact" />
        </v-col>
        <v-col cols="12">
          <v-textarea v-model="form.address" label="Address" variant="outlined" density="compact" rows="2" />
        </v-col>
        <v-col cols="12">
          <v-textarea v-model="form.notes" label="Notes / Comments" variant="outlined" density="compact" rows="2" />
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
