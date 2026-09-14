<script setup lang="ts">
import { formatAmount } from '~/utils/format'
import { useProducts } from '~/composables/useProducts'
import type { Product } from '~/types/product'

definePageMeta({ middleware: 'auth' })

const { products, meta, loading, error, fetchProducts } = useProducts()

const search = ref('')
const page = ref(1)
const perPage = ref(15)
const showItems = ref(false)
const selected = ref<Product | null>(null)

const headers = [
  { title: 'Seq', key: 'product_sequence', sortable: true },
  { title: 'Package Name', key: 'name', sortable: true },
  { title: 'Barcode', key: 'barcode', sortable: false },
  { title: 'Items', key: 'items_count', sortable: false, align: 'end' },
  { title: 'Price', key: 'regular_price', sortable: true, align: 'end' },
  { title: 'Actions', key: 'actions', sortable: false, align: 'end' }
]

const filters = computed(() => ({
  page: page.value,
  perPage: perPage.value,
  search: search.value || undefined,
  productType: 'package',
  sortBy: 'name',
  sortDirection: 'asc'
}))

async function load () {
  if (!import.meta.client) return
  await fetchProducts(filters.value)
}

function openItems (product: Product) {
  selected.value = product
  showItems.value = true
}

const snackbar = ref(false)
const snackbarText = ref('')
watch(error, (msg) => { if (msg) { snackbarText.value = msg; snackbar.value = true } })

onMounted(load)
watch(filters, load, { deep: true })
</script>

<template>
  <AppPageHeader title="Package / Item Kit" subtitle="Products bundled as packages" />

  <AppCard class="mb-4">
    <v-row dense align="center">
      <v-col cols="12" sm="6" md="5">
        <v-text-field v-model="search" label="Search" prepend-inner-icon="mdi-magnify" clearable />
      </v-col>
      <v-col cols="12" sm="6" md="7" class="d-flex align-center justify-start ga-2">
        <v-btn
          icon="mdi-refresh"
          variant="text"
          aria-label="Refresh"
          :loading="loading"
          @click="load"
        />
      </v-col>
    </v-row>
  </AppCard>

  <AppCard>
    <AppDataTable
      v-model:page="page"
      v-model:items-per-page="perPage"
      :headers="headers"
      :items="products"
      :items-length="meta.total"
      :loading="loading"
      empty-text="No packages found. Set product type to 'Package' in the product form."
    >
      <template #item.items_count="{ item }">
        {{ item.package_items?.length ?? 0 }}
      </template>
      <template #item.regular_price="{ item }">
        {{ formatAmount(item.regular_price) }}
      </template>
      <template #item.actions="{ item }">
        <v-btn icon="mdi-eye" variant="text" color="primary" @click="openItems(item)" />
      </template>
    </AppDataTable>
  </AppCard>

  <AppDialog
    v-model="showItems"
    title="Package Contents"
    :subtitle="selected?.name"
    icon="mdi-package-variant"
    max-width="500"
  >
    <v-card-text>
      <v-list density="compact" v-if="selected?.package_items?.length">
        <v-list-item
          v-for="item in selected.package_items"
          :key="item.product_id"
          :title="item.name"
          :subtitle="item.barcode"
        >
          <template #append>
            <v-chip color="primary">x{{ item.quantity }}</v-chip>
          </template>
        </v-list-item>
      </v-list>
      <p v-else class="text-body-2 text-medium-emphasis">No items in this package.</p>
    </v-card-text>
    <v-card-actions class="border-t pa-3">
      <v-spacer />
      <v-btn variant="text" @click="showItems = false">Close</v-btn>
    </v-card-actions>
  </AppDialog>

  <v-snackbar v-model="snackbar" color="error" timeout="4000">
    {{ snackbarText }}
    <template #actions>
      <v-btn variant="text" @click="snackbar = false">Close</v-btn>
    </template>
  </v-snackbar>
</template>
