<script setup lang="ts">
import type { Unit } from '~/types/product'
import { useUnits } from '~/composables/useUnits'
import { usePermission } from '~/composables/usePermission'

definePageMeta({
  middleware: 'auth'
})

const { unitsList, meta, loading, error, fetchUnitsList, createUnit, updateUnit, deleteUnit } = useUnits()
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
  { title: 'Name', key: 'name', sortable: true },
  { title: 'Abbreviation', key: 'abbreviation', sortable: true },
  { title: 'Products', key: 'products_count', sortable: false, align: 'end' },
  { title: 'Status', key: 'is_active', sortable: true },
  { title: 'Actions', key: 'actions', sortable: false, align: 'end' }
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
  await fetchUnitsList(filters.value)
}

const form = reactive({
  name: '',
  abbreviation: '',
  is_active: true
})

function openForm (unit: Unit | null = null) {
  selectedUnit.value = unit
  form.name = unit?.name ?? ''
  form.abbreviation = unit?.abbreviation ?? ''
  form.is_active = unit?.is_active ?? true
  showForm.value = true
}

function closeForm () {
  showForm.value = false
  selectedUnit.value = null
  form.name = ''
  form.abbreviation = ''
  form.is_active = true
}

async function saveUnit () {
  const ok = selectedUnit.value
    ? await updateUnit(selectedUnit.value.id, { ...form })
    : await createUnit({ ...form })
  if (ok) {
    closeForm()
    await load()
    snackbarText.value = selectedUnit.value ? 'Unit updated' : 'Unit created'
    snackbarColor.value = 'success'
    snackbar.value = true
  }
}

const { confirm } = useConfirm()

async function handleDelete (unit: Unit) {
  const confirmed = await confirm({
    title: 'Delete Unit',
    message: `Delete unit "${unit.name}"?`,
    confirmText: 'Delete'
  })
  if (!confirmed) return
  const ok = await deleteUnit(unit.id)
  if (ok) {
    await load()
    snackbarText.value = 'Unit deleted'
    snackbarColor.value = 'success'
    snackbar.value = true
  }
}

const snackbar = ref(false)
const snackbarText = ref('')
const snackbarColor = ref('success')
const showForm = ref(false)
const selectedUnit = ref<Unit | null>(null)

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
  <AppPageHeader title="Units" subtitle="Product measurement units">
    <template #actions>
      <v-btn
        v-if="hasPermission('units.create')"
        color="primary"
        prepend-icon="mdi-plus"
        @click="openForm()"
      >
        Add Unit
      </v-btn>
    </template>
  </AppPageHeader>

  <AppCard>
    <v-toolbar color="surface" flat density="comfortable" class="rounded-t-lg">
      <v-text-field
        v-model="search"
        label="Search units..."
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
      :items="unitsList"
      :items-length="meta.total"
      :loading="loading"
      empty-text="No units found"
    >
      <template #item.is_active="{ item }">
        <v-chip :color="item.is_active ? 'success' : 'error'">
          {{ item.is_active ? 'Active' : 'Inactive' }}
        </v-chip>
      </template>

      <template #item.actions="{ item }">
        <v-btn
          v-if="hasPermission('units.edit')"
          icon="mdi-pencil"
          variant="text"
          size="small"
          class="action-btn"
          @click="openForm(item)"
        />
        <v-btn
          v-if="hasPermission('units.delete')"
          icon="mdi-delete"
          variant="text"
          size="small"
          color="error"
          class="action-btn"
          @click="handleDelete(item)"
        />
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
    :title="selectedUnit ? 'Edit Unit' : 'Add Unit'"
    :can-save="!!form.name.trim() && !!form.abbreviation.trim()"
    @save="saveUnit"
  >
    <AppFormSection title="Unit Details">
      <v-row dense>
        <v-col cols="12" sm="6">
          <v-text-field v-model="form.name" label="Name" :rules="[v => !!v || 'Required']" />
        </v-col>
        <v-col cols="12" sm="6">
          <v-text-field v-model="form.abbreviation" label="Abbreviation" :rules="[v => !!v || 'Required']" />
        </v-col>
        <v-col cols="12">
          <v-switch v-model="form.is_active" label="Active" color="primary" hide-details />
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
