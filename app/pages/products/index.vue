<script setup lang="ts">
import '~/assets/styles/products.css'

import ProductForm from '~/components/products/ProductForm.vue'
import ProductTable from '~/components/products/ProductTable.vue'
import { useBrands } from '~/composables/useBrands'
import { useCategories } from '~/composables/useCategories'
import { usePermission } from '~/composables/usePermission'
import { useProducts, type BulkImportError } from '~/composables/useProducts'
import { useSuppliers } from '~/composables/useSuppliers'
import type { Product, ProductFormData } from '~/types/product'

definePageMeta({
  middleware: 'auth'
})

const { hasPermission } = usePermission()
const {
  products,
  loading: productsLoading,
  error: productsError,
  meta,
  fetchProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  bulkUploadProducts,
  uploadProgress
} = useProducts()

const { categories, fetchCategories } = useCategories()
const { suppliers, fetchSuppliers } = useSuppliers()
const { notify } = useNotification()
const { printBarcodes } = useBarcodePrint()

const selectedProducts = ref<Product[]>([])

function printSelectedBarcodes () {
  const items = selectedProducts.value.filter(p => p.barcode)
  if (items.length === 0) {
    notify('Selected products have no barcode', 'warning')
    return
  }
  printBarcodes(items.map(p => ({ name: p.name, barcode: p.barcode, price: p.regular_price })))
}
const { brands, fetchBrands } = useBrands()

const search = ref('')
const selectedCategory = ref<number | null>(null)
const selectedSupplier = ref<number | null>(null)
const selectedBrand = ref<number | null>(null)
const selectedType = ref<string | null>(null)
const withExpiry = ref<boolean | null>(null)
const withSerials = ref<boolean | null>(null)
const activeOnly = ref<boolean | null>(null)
const sortBy = ref<{ key: string; order: 'asc' | 'desc' }[]>([{ key: 'created_at', order: 'desc' }])

const showForm = ref(false)
const selectedProduct = ref<Product | null>(null)
const showFilterDrawer = ref(false)

const page = ref(1)
const perPage = ref(15)

const productItems = computed(() => products.value ?? [])
const categoryFilterItems = computed(() => [
  { title: 'All', value: null },
  ...(categories.value ?? []).map(c => ({ title: c.name, value: c.id }))
])
const supplierFilterItems = computed(() => [
  { title: 'All', value: null },
  ...(suppliers.value ?? []).map(s => ({ title: s.name, value: s.id }))
])
const brandFilterItems = computed(() => [
  { title: 'All', value: null },
  ...(brands.value ?? []).map(b => ({ title: b.name, value: b.id }))
])

const filters = computed(() => ({
  page: page.value,
  perPage: perPage.value,
  search: search.value || undefined,
  categoryId: selectedCategory.value ?? undefined,
  supplierId: selectedSupplier.value ?? undefined,
  brandId: selectedBrand.value ?? undefined,
  productType: selectedType.value || undefined,
  hasExpiry: withExpiry.value === null ? undefined : withExpiry.value,
  hasSerials: withSerials.value === null ? undefined : withSerials.value,
  isActive: activeOnly.value === null ? undefined : activeOnly.value,
  sortBy: sortBy.value[0]?.key,
  sortDirection: sortBy.value[0]?.order
}))

const activeFilterCount = computed(() =>
  [selectedCategory.value, selectedSupplier.value, selectedType.value, withExpiry.value, withSerials.value]
    .filter(v => v !== null && v !== undefined)
    .length
)

function clearAllFilters () {
  search.value = ''
  selectedCategory.value = null
  selectedSupplier.value = null
  selectedBrand.value = null
  selectedType.value = null
  withExpiry.value = null
  withSerials.value = null
  activeOnly.value = null
}

const typeFilterItems = [
  { title: 'No Serial', value: 'no_serial' },
  { title: 'With Serial', value: 'with_serial' },
  { title: 'Package', value: 'package' }
]
const statusFilterItems = [
  { title: 'Active', value: true },
  { title: 'Inactive', value: false }
]
const yesNoFilterItems = [
  { title: 'Yes', value: true },
  { title: 'No', value: false }
]

const activeFilters = computed(() => {
  const list: { key: string, label: string, clear: () => void }[] = []

  const push = (key: string, label: string, value: unknown, items: { title: string, value: unknown }[], clear: () => void) => {
    if (value !== null && value !== undefined) {
      const item = items.find(i => i.value === value)
      list.push({ key, label: `${label}: ${item?.title ?? value}`, clear })
    }
  }

  push('category', 'Category', selectedCategory.value, categoryFilterItems.value, () => { selectedCategory.value = null })
  push('supplier', 'Supplier', selectedSupplier.value, supplierFilterItems.value, () => { selectedSupplier.value = null })
  push('brand', 'Brand', selectedBrand.value, brandFilterItems.value, () => { selectedBrand.value = null })
  push('type', 'Type', selectedType.value, typeFilterItems, () => { selectedType.value = null })
  push('expiry', 'Expiry', withExpiry.value, yesNoFilterItems, () => { withExpiry.value = null })
  push('serials', 'Serials', withSerials.value, yesNoFilterItems, () => { withSerials.value = null })
  push('status', 'Status', activeOnly.value, statusFilterItems, () => { activeOnly.value = null })

  return list
})

async function load () {
  if (!import.meta.client) return
  await fetchProducts(filters.value)
}

onMounted(async () => {
  await Promise.all([fetchCategories(), fetchSuppliers(), fetchBrands(), load()])
})

watch(filters, load, { deep: true })

function openForm (product: Product | null = null) {
  selectedProduct.value = product
  showForm.value = true
}

const saving = ref(false)

async function handleSave (data: ProductFormData) {
  saving.value = true
  try {
    const result = selectedProduct.value
      ? await updateProduct(selectedProduct.value.id, data)
      : await createProduct(data)

    if (result !== null) {
      showForm.value = false
      notify(selectedProduct.value ? 'Product updated' : 'Product created', 'success')
      await load()
    } else {
      notify(productsError || 'Failed to save product', 'error')
    }
  } finally {
    saving.value = false
  }
}

const showDeleteConfirm = ref(false)
const productToDelete = ref<Product | null>(null)

function handleDelete (product: Product) {
  productToDelete.value = product
  showDeleteConfirm.value = true
}

async function confirmDelete () {
  if (!productToDelete.value) return
  const success = await deleteProduct(productToDelete.value.id)
  showDeleteConfirm.value = false
  productToDelete.value = null
  if (success) {
    notify('Product deleted', 'success')
    await load()
  } else {
    notify(productsError || 'Failed to delete product', 'error')
  }
}

async function handleDeleteFromForm (product: Product | null) {
  if (!product) return
  showForm.value = false
  await handleDelete(product)
  selectedProduct.value = null
}

const snackbar = ref(false)
const snackbarText = ref('')
const snackbarColor = ref('success')

watch(productsError, (msg) => {
  if (msg) {
    snackbarText.value = msg
    snackbarColor.value = 'error'
    snackbar.value = true
  }
})

const showBulkDialog = ref(false)
const bulkFile = ref<File | File[] | null>(null)
const bulkFileSelected = computed(() => {
  const file = bulkFile.value
  return Array.isArray(file) ? file.length > 0 : !!file
})
const bulkErrors = ref<BulkImportError[]>([])
const showBulkErrors = ref(false)

async function handleBulkUpload () {
  const file = Array.isArray(bulkFile.value) ? bulkFile.value[0] : bulkFile.value
  if (!file) return
  const result = await bulkUploadProducts(file)
  if (result) {
    bulkErrors.value = result.errors
    snackbarText.value = result.errors.length
      ? `${result.message} · ${result.errors.length} failed`
      : result.message
    snackbarColor.value = result.errors.length ? 'warning' : 'success'
    snackbar.value = true
    if (result.created) {
      await load()
    }
  }
  showBulkDialog.value = false
  bulkFile.value = null
}
</script>

<template>
  <div class="products-page">
    <AppPageHeader title="Products and Services" subtitle="Manage inventory and catalog">
      <template #actions>
        <v-btn
          color="primary"
          prepend-icon="mdi-plus"
          @click="openForm()"
        >
          Add New
        </v-btn>
        <v-btn
          v-if="selectedProducts.length"
          color="indigo"
          prepend-icon="mdi-barcode"
          @click="printSelectedBarcodes"
        >
          Print Barcode ({{ selectedProducts.length }})
        </v-btn>
        <v-btn
          color="secondary"
          prepend-icon="mdi-upload"
          @click="showBulkDialog = true"
        >
          Bulk Upload
        </v-btn>
      </template>
    </AppPageHeader>

    <AppCard class="products-card rounded-lg" elevation="1">
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
          v-model="selectedBrand"
          label="Brand"
          prepend-inner-icon="mdi-tag-outline"
          :items="brandFilterItems"
          clearable
          density="compact"
          variant="outlined"
          style="max-width: 300px"
          class="align-self-center me-3"
        />
        <v-select
          v-model="selectedType"
          label="Type"
          prepend-inner-icon="mdi-package-variant-closed"
          :items="[{ title: 'All', value: null }, ...typeFilterItems]"
          item-title="title"
          item-value="value"
          clearable
          density="compact"
          variant="outlined"
          style="max-width: 220px"
          class="align-self-center me-3"
        />
        <v-select
          v-model="activeOnly"
          label="Status"
          prepend-inner-icon="mdi-toggle-switch-outline"
          :items="statusFilterItems"
          clearable
          density="compact"
          variant="outlined"
          style="max-width: 220px"
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
        <v-tooltip text="Refresh" location="top">
          <template #activator="{ props: tipProps }">
            <v-btn
              v-bind="tipProps"
              icon="mdi-refresh"
              variant="text"
              size="small"
              aria-label="Refresh"
              :loading="productsLoading"
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
      <ProductTable
        v-model:page="page"
        v-model:items-per-page="perPage"
        v-model:sort-by="sortBy"
        :items="productItems"
        :loading="productsLoading"
        :total-items="meta.total"
        @edit="openForm"
        @delete="handleDelete"
        @update:selection="selectedProducts = $event"
      />
    </AppCard>

    <ProductForm
      v-model="showForm"
      :product="selectedProduct"
      :loading="saving"
      @save="handleSave"
      @delete="handleDeleteFromForm"
    />

    <AppDialog
      v-model="showBulkDialog"
      title="Bulk Upload Products"
      icon="mdi-file-excel"
      max-width="480"
      persistent
    >
      <v-card-text>
        <v-file-input
          v-model="bulkFile"
          label="Excel / CSV file"
          accept=".xlsx,.xls,.csv"
          prepend-icon="mdi-file-excel"
          variant="outlined"
          show-size
          chips
        />
        <p class="text-body-2 text-medium-emphasis mt-2">
          Expected columns: BarCode, Brand Products, Unit, Cost, SubCat, Category, Supplier.
        </p>
        <v-progress-linear
          v-if="productsLoading"
          :model-value="uploadProgress"
          color="primary"
          height="6"
          class="mt-3"
        />
        <p v-if="productsLoading" class="text-caption text-medium-emphasis mt-1">
          Uploading... {{ uploadProgress }}%
        </p>
      </v-card-text>
      <v-card-actions class="pa-3">
        <v-spacer />
        <v-btn variant="text" @click="showBulkDialog = false">
          Cancel
        </v-btn>
        <v-btn
          color="primary"
          :disabled="!bulkFileSelected"
          :loading="productsLoading"
          @click="handleBulkUpload"
        >
          Upload
        </v-btn>
      </v-card-actions>
    </AppDialog>

    <AppDialog
      v-model="showBulkErrors"
      title="Import Errors"
      :subtitle="`${bulkErrors.length} errors found`"
      icon="mdi-alert-circle-outline"
      header-color="error"
      max-width="640"
      scrollable
    >
      <v-card-text class="pa-0" style="max-height: 400px">
        <v-list density="compact" lines="three">
          <v-list-item v-for="err in bulkErrors" :key="err.row">
            <v-list-item-title class="text-body-2 font-weight-medium">
              {{ err.row }} : {{ err.name }}
            </v-list-item-title>
            <v-list-item-subtitle>
              Barcode: {{ err.barcode || '—' }}
            </v-list-item-subtitle>
            <v-list-item-subtitle class="text-error">
              {{ err.reason }}
            </v-list-item-subtitle>
          </v-list-item>
        </v-list>
      </v-card-text>
    </AppDialog>

    <AppConfirmDialog
      v-model="showDeleteConfirm"
      title="Delete Product"
      :message="`Delete product ${productToDelete?.name ?? ''}?`"
      confirm-text="Delete"
      :loading="productsLoading"
      @confirm="confirmDelete"
    />

    <v-snackbar v-model="snackbar" :color="snackbarColor" timeout="6000">
      {{ snackbarText }}
      <template #actions>
        <v-btn v-if="bulkErrors.length" variant="text" @click="showBulkErrors = true; snackbar = false">
          View
        </v-btn>
        <v-btn variant="text" @click="snackbar = false">
          Close
        </v-btn>
      </template>
    </v-snackbar>

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
          clearable
          class="mb-4"
        />

        <div class="text-subtitle-2 mb-2">Supplier</div>
        <v-autocomplete
          v-model="selectedSupplier"
          label="Supplier"
          :items="supplierFilterItems"
          clearable
          class="mb-4"
        />

        <div class="text-subtitle-2 mb-2">Type</div>
        <v-select
          v-model="selectedType"
          label="Type"
          :items="[{ title: 'All', value: null }, ...typeFilterItems]"
          clearable
          class="mb-4"
        />

        <div class="text-subtitle-2 mb-2">With Expiry</div>
        <v-select
          v-model="withExpiry"
          label="With Expiry"
          :items="[{ title: 'All', value: null }, ...yesNoFilterItems]"
          clearable
          class="mb-4"
        />

        <div class="text-subtitle-2 mb-2">With Serials</div>
        <v-select
          v-model="withSerials"
          label="With Serials"
          :items="[{ title: 'All', value: null }, ...yesNoFilterItems]"
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
  </div>
</template>
