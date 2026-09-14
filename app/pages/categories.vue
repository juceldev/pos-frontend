<script setup lang="ts">
import type { Category } from '~/types/product'
import { useCategories } from '~/composables/useCategories'
import { usePermission } from '~/composables/usePermission'

definePageMeta({
  middleware: 'auth'
})

const { categoriesList, categories, meta, loading, error, fetchCategoriesList, fetchCategories, createCategory, updateCategory, deleteCategory } = useCategories()
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
  { title: 'Code', key: 'code', sortable: true },
  { title: 'Parent', key: 'parent.name', sortable: false },
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
  await fetchCategoriesList(filters.value)
}

async function saveCategory (data: Partial<Category>) {
  const ok = selectedCategory.value
    ? await updateCategory(selectedCategory.value.id, data)
    : await createCategory(data)
  if (ok) {
    closeForm()
    await load()
    await fetchCategories()
    snackbarText.value = selectedCategory.value ? 'Category updated' : 'Category created'
    snackbarColor.value = 'success'
    snackbar.value = true
  }
}

async function handleDelete (category: Category) {
  if (!confirm(`Delete category ${category.name}?`)) return
  const ok = await deleteCategory(category.id)
  if (ok) {
    await load()
    await fetchCategories()
    snackbarText.value = 'Category deleted'
    snackbarColor.value = 'success'
    snackbar.value = true
  }
}

function openForm (category: Category | null = null) {
  selectedCategory.value = category
  form.name = category?.name ?? ''
  form.code = category?.code ?? ''
  form.parent_id = category?.parent_id ?? null
  form.is_active = category?.is_active ?? true
  showForm.value = true
}

function closeForm () {
  showForm.value = false
  selectedCategory.value = null
  form.name = ''
  form.code = ''
  form.parent_id = null
  form.is_active = true
}

const form = reactive({
  name: '',
  code: '',
  parent_id: null as number | null,
  is_active: true
})

const parentItems = computed(() => [
  { title: 'None', value: null },
  ...(categories.value ?? []).filter(c => c.parent_id === null).map(c => ({ title: c.name, value: c.id }))
])

const snackbar = ref(false)
const snackbarText = ref('')
const snackbarColor = ref('success')
const showForm = ref(false)
const selectedCategory = ref<Category | null>(null)

watch(error, (msg) => {
  if (msg) {
    snackbarText.value = msg
    snackbarColor.value = 'error'
    snackbar.value = true
  }
})

onMounted(async () => {
  await Promise.all([fetchCategories(), load()])
})

watch(filters, load, { deep: true })
</script>

<template>
  <AppPageHeader title="Categories" subtitle="Organize products by category">
    <template #actions>
      <v-btn
        v-if="hasPermission('categories.create')"
        color="primary"
        prepend-icon="mdi-plus"
        @click="openForm()"
      >
        Add Category
      </v-btn>
    </template>
  </AppPageHeader>

  <AppCard>
    <v-toolbar color="surface" flat density="comfortable" class="rounded-t-lg">
      <v-text-field
        v-model="search"
        label="Search categories..."
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
      :items="categoriesList"
      :items-length="meta.total"
      :loading="loading"
      empty-text="No categories found"
    >
      <template #item.is_active="{ item }">
        <v-chip :color="item.is_active ? 'success' : 'error'">
          {{ item.is_active ? 'Active' : 'Inactive' }}
        </v-chip>
      </template>

      <template #item.parent.name="{ item }">
        {{ item.parent?.name ?? '-' }}
      </template>

      <template #item.actions="{ item }">
        <v-btn
          v-if="hasPermission('categories.edit')"
          icon="mdi-pencil"
          variant="text"
          size="small"
          class="action-btn"
          @click="openForm(item)"
        />
        <v-btn
          v-if="hasPermission('categories.delete')"
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
    :title="selectedCategory ? 'Edit Category' : 'Add Category'"
    :can-save="!!form.name.trim()"
    @save="saveCategory({ ...form })"
  >
    <AppFormSection title="Category Details">
      <v-row dense>
        <v-col cols="12" sm="6">
          <v-text-field
            v-model="form.name"
            label="Name"
            :rules="[v => !!v || 'Required']"
          />
        </v-col>
        <v-col cols="12" sm="6">
          <v-text-field v-model="form.code" label="Code" />
        </v-col>
        <v-col cols="12">
          <v-select
            v-model="form.parent_id"
            label="Parent Category"
            :items="parentItems"
            item-title="title"
            item-value="value"
            clearable
          />
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
