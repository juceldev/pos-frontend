<script setup lang="ts">
import { formatAmount } from '~/utils/format'
import { useBrands } from '~/composables/useBrands'
import { useCategories } from '~/composables/useCategories'
import { useProducts } from '~/composables/useProducts'
import { useSuppliers } from '~/composables/useSuppliers'

definePageMeta({ middleware: 'auth' })

const { products, meta, loading, error, fetchProducts } = useProducts()
const { categories, fetchCategories } = useCategories()
const { suppliers, fetchSuppliers } = useSuppliers()
const { brands, fetchBrands } = useBrands()
const { notify } = useNotification()

const search = ref('')
const selectedCategory = ref<number | null>(null)
const selectedBrand = ref<number | null>(null)
const selectedSupplier = ref<number | null>(null)
const stockFilter = ref<string | null>(null)
const page = ref(1)
const perPage = ref(15)
const showFilterDrawer = ref(false)
const selected = ref<number[]>([])
const sortBy = ref<{ key: string; order: 'asc' | 'desc' }[]>([{ key: 'name', order: 'asc' }])

const headers = [
  { title: 'Code', key: 'product_sequence', sortable: false, minWidth: '100px' },
  { title: 'Barcode', key: 'barcode', sortable: false, minWidth: '120px' },
  { title: 'Product Name', key: 'name', sortable: true, minWidth: '350px' },
  { title: 'Unit', key: 'unit.abbreviation', sortable: false, minWidth: '70px' },
  { title: 'Stock-In', key: 'stock_in_total', sortable: false, align: 'end', minWidth: '90px' },
  { title: 'Sold-Out', key: 'sold_out_total', sortable: false, align: 'end', minWidth: '90px' },
  { title: 'Inv-Out', key: 'inv_out_total', sortable: false, align: 'end', minWidth: '100px' },
  { title: 'On Stock', key: 'stock_quantity', sortable: false, align: 'end', minWidth: '90px' },
  { title: 'Category', key: 'category.name', sortable: false, minWidth: '120px' },
  { title: 'Sub-Category', key: 'sub_category.name', sortable: false, minWidth: '140px' },
  { title: 'Seller', key: 'seller', sortable: false, minWidth: '100px' },
  { title: 'C Level', key: 'reorder_level', sortable: false, align: 'end', minWidth: '80px' },
  { title: 'Supplier', key: 'supplier_name', sortable: true, minWidth: '120px' },
  { title: 'Inv Updated', key: 'updated_at', sortable: false, minWidth: '160px' },
  { title: 'SP Code', key: 'special_code', sortable: false, minWidth: '90px' }
]

const columnItems = computed(() => headers)
const visibleColumns = ref<string[]>(headers.map(h => h.key))
const filteredHeaders = computed(() => headers.filter(h => visibleColumns.value.includes(h.key)))

const categoryFilterItems = computed(() => [
  { title: 'All', value: null },
  ...(categories.value ?? []).map(c => ({ title: c.name, value: c.id }))
])
const brandFilterItems = computed(() => [
  { title: 'All', value: null },
  ...(brands.value ?? []).map(b => ({ title: b.name, value: b.id }))
])
const supplierFilterItems = computed(() => [
  { title: 'All', value: null },
  ...(suppliers.value ?? []).map(s => ({ title: s.name, value: s.id }))
])
const stockStatusItems = [
  { title: 'All', value: null },
  { title: 'In Stock', value: 'In Stock' },
  { title: 'Low Stock', value: 'Low Stock' },
  { title: 'Out of Stock', value: 'Out of Stock' }
]

const filters = computed(() => ({
  page: page.value,
  perPage: perPage.value,
  search: search.value || undefined,
  categoryId: selectedCategory.value ?? undefined,
  brandId: selectedBrand.value ?? undefined,
  supplierId: selectedSupplier.value ?? undefined,
  sortBy: sortBy.value[0]?.key ?? 'name',
  sortDirection: sortBy.value[0]?.order ?? 'asc'
}))

const activeFilterCount = computed(() =>
  [selectedCategory.value, selectedBrand.value, selectedSupplier.value, stockFilter.value]
    .filter(v => v !== null && v !== undefined).length
)

function clearAllFilters () {
  search.value = ''
  selectedCategory.value = null
  selectedBrand.value = null
  selectedSupplier.value = null
  stockFilter.value = null
}

function stockStatus (item: any) {
  const qty = Number(item.stock_quantity)
  if (qty <= 0) return { label: 'Out of Stock', color: 'error' }
  if (qty <= Number(item.reorder_level)) return { label: 'Low Stock', color: 'warning' }
  return { label: 'In Stock', color: 'success' }
}

const filtered = computed(() => {
  if (!stockFilter.value) return products.value
  return products.value.filter(p => stockStatus(p).label === stockFilter.value)
})

const totalQty = computed(() => filtered.value.reduce((s, p) => s + Number(p.stock_quantity), 0))
const totalValue = computed(() => filtered.value.reduce((s, p) => s + Number(p.stock_quantity) * Number(p.cost_price), 0))

async function load () {
  if (!import.meta.client) return
  await fetchProducts(filters.value)
}

function onRowClick (item: any, e: MouseEvent) {
  if (e.target instanceof HTMLElement && e.target.closest('button, a, input')) return
  const id = item.id ?? item.raw?.id ?? item.value
  if (id == null) return
  selected.value = selected.value.includes(id) ? [] : [id]
}

function getRowProps (row: any) {
  return {
    onClick: (e: MouseEvent) => onRowClick(row.item, e)
  }
}

const snackbar = ref(false)
const snackbarText = ref('')
watch(error, (msg) => { if (msg) { snackbarText.value = msg; snackbar.value = true } })

onMounted(async () => {
  await Promise.all([fetchCategories(), fetchBrands(), fetchSuppliers(), load()])
})
watch(filters, load, { deep: true })
</script>

<template>
  <AppPageHeader title="Products Inventory" subtitle="All products and services — stock levels and movement summary" />

  <AppCard class="inventory-card rounded-lg" elevation="1">
    <v-toolbar color="surface" flat density="comfortable" class="rounded-t-lg">
      <v-text-field
        v-model="search"
        label="Search products..."
        prepend-inner-icon="mdi-magnify"
        clearable
        density="compact"
        variant="outlined"
        style="max-width: 400px"
        class="align-self-center me-3"
      />
      <v-autocomplete
        v-model="selectedCategory"
        label="Category"
        prepend-inner-icon="mdi-folder-outline"
        :items="categoryFilterItems"
        item-title="title"
        item-value="value"
        clearable
        density="compact"
        variant="outlined"
        style="max-width: 320px"
        class="align-self-center me-3"
      />
      <v-autocomplete
        v-model="selectedBrand"
        label="Brand"
        prepend-inner-icon="mdi-tag-outline"
        :items="brandFilterItems"
        item-title="title"
        item-value="value"
        clearable
        density="compact"
        variant="outlined"
        style="max-width: 320px"
        class="align-self-center me-3"
      />
      <v-autocomplete
        v-model="selectedSupplier"
        label="Supplier"
        prepend-inner-icon="mdi-truck-outline"
        :items="supplierFilterItems"
        item-title="title"
        item-value="value"
        clearable
        density="compact"
        variant="outlined"
        style="max-width: 360px"
        class="align-self-center me-3"
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
      <v-spacer />
      <v-chip color="info" size="small" class="me-2">Total Qty: {{ totalQty }}</v-chip>
      <v-chip color="primary" size="small">Value: {{ formatAmount(totalValue) }}</v-chip>
    </v-toolbar>
    <v-divider />
    <AppDataTable
      v-model:page="page"
      v-model:items-per-page="perPage"
      v-model:sort-by="sortBy"
      v-model="selected"
      :headers="filteredHeaders"
      :items="filtered"
      :items-length="meta.total"
      :loading="loading"
      class="inventory-table"
      item-value="id"
      show-select
      select-strategy="single"
      density="compact"
      height="520"
      fixed-header
      empty-text="No products found"
      :row-props="getRowProps"
    >
      <template #item.unit.abbreviation="{ item }">{{ item.unit?.abbreviation ?? '—' }}</template>
      <template #item.stock_in_total="{ item }">{{ Number(item.stock_in_total ?? 0) }}</template>
      <template #item.sold_out_total="{ item }">{{ Number(item.sold_out_total ?? 0) }}</template>
      <template #item.inv_out_total="{ item }">{{ Number(item.inv_out_total ?? 0) }}</template>
      <template #item.stock_quantity="{ item }">
        <span :class="stockStatus(item).color + '--text'">{{ Number(item.stock_quantity) }}</span>
      </template>
      <template #item.category.name="{ item }">{{ item.category?.name ?? '—' }}</template>
      <template #item.sub_category.name="{ item }">{{ item.sub_category?.name ?? '—' }}</template>
      <template #item.seller="{ item }">{{ item.seller || '—' }}</template>
      <template #item.reorder_level="{ item }">{{ Number(item.reorder_level ?? 0) }}</template>
      <template #item.supplier_name="{ item }">{{ item.supplier?.name ?? '—' }}</template>
      <template #item.updated_at="{ item }">{{ item.updated_at ? new Date(item.updated_at).toLocaleDateString() : '—' }}</template>
      <template #item.special_code="{ item }">{{ item.special_code || '—' }}</template>
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
      <div class="text-subtitle-2 mb-2">Category</div>
      <v-select
        v-model="selectedCategory"
        label="Category"
        :items="categoryFilterItems"
        item-title="title"
        item-value="value"
        clearable
        class="mb-4"
      />

      <div class="text-subtitle-2 mb-2">Brand</div>
      <v-autocomplete
        v-model="selectedBrand"
        label="Brand"
        :items="brandFilterItems"
        item-title="title"
        item-value="value"
        clearable
        class="mb-4"
      />

      <div class="text-subtitle-2 mb-2">Supplier</div>
      <v-autocomplete
        v-model="selectedSupplier"
        label="Supplier"
        :items="supplierFilterItems"
        item-title="title"
        item-value="value"
        clearable
        class="mb-4"
      />

      <div class="text-subtitle-2 mb-2">Stock Status</div>
      <v-select
        v-model="stockFilter"
        label="Stock Status"
        :items="stockStatusItems"
        item-title="title"
        item-value="value"
        clearable
        class="mb-4"
      />

      <div class="text-subtitle-2 mb-2">Columns</div>
      <v-list density="compact" class="mb-4" nav>
        <v-list-item
          v-for="col in columnItems"
          :key="col.key"
          :title="col.title"
        >
          <template #prepend>
            <v-checkbox
              v-model="visibleColumns"
              :value="col.key"
              hide-details
              density="compact"
            />
          </template>
        </v-list-item>
      </v-list>

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

  <v-snackbar v-model="snackbar" color="error" timeout="4000">
    {{ snackbarText }}
    <template #actions>
      <v-btn variant="text" @click="snackbar = false">Close</v-btn>
    </template>
  </v-snackbar>
</template>

<style scoped>
.inventory-card {
  overflow: hidden;
}

.inventory-table :deep(tbody tr) {
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.inventory-table :deep(tbody tr:hover) {
  background-color: rgba(var(--v-theme-primary), 0.04);
}

.inventory-table :deep(tbody tr.v-data-table__tr--selected) {
  background-color: rgba(var(--v-theme-primary), 0.08);
}
</style>
