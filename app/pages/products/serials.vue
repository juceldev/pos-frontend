<script setup lang="ts">
import { useProducts } from '~/composables/useProducts'
import type { Product, ProductSerial } from '~/types/product'

definePageMeta({ middleware: 'auth' })

const { products, meta, loading, error, fetchProducts, serials, fetchSerials, addSerial, updateSerialStatus, deleteSerial } = useProducts()

const search = ref('')
const page = ref(1)
const perPage = ref(15)
const showSerials = ref(false)
const selectedProduct = ref<Product | null>(null)
const newSerial = ref('')

const headers = [
  { title: 'Seq', key: 'product_sequence', sortable: true },
  { title: 'Name', key: 'name', sortable: true },
  { title: 'Barcode', key: 'barcode', sortable: false },
  { title: 'Serials', key: 'serials_count', sortable: false, align: 'end' },
  { title: 'Stock', key: 'stock_quantity', sortable: true, align: 'end' },
  { title: 'Actions', key: 'actions', sortable: false, align: 'end' }
]

const serialHeaders = [
  { title: 'Serial Number', key: 'serial_number' },
  { title: 'Status', key: 'status' },
  { title: 'Added', key: 'created_at' },
  { title: 'Actions', key: 'actions', align: 'end' }
]

const filters = computed(() => ({
  page: page.value,
  perPage: perPage.value,
  search: search.value || undefined,
  productType: 'with_serial',
  sortBy: 'name',
  sortDirection: 'asc'
}))

async function load () {
  if (!import.meta.client) return
  await fetchProducts(filters.value)
}

async function openSerials (product: Product) {
  selectedProduct.value = product
  showSerials.value = true
  await fetchSerials(product.id)
}

async function handleAddSerial () {
  if (!newSerial.value.trim() || !selectedProduct.value) return
  const created = await addSerial(selectedProduct.value.id, newSerial.value.trim())
  if (created) {
    newSerial.value = ''
    await fetchSerials(selectedProduct.value.id)
  }
}

async function handleStatusChange (serial: ProductSerial, status: string) {
  await updateSerialStatus(serial.id, status)
  if (selectedProduct.value) await fetchSerials(selectedProduct.value.id)
}

async function handleDeleteSerial (serial: ProductSerial) {
  if (!confirm(`Delete serial ${serial.serial_number}?`)) return
  await deleteSerial(serial.id)
  if (selectedProduct.value) await fetchSerials(selectedProduct.value.id)
}

const statusColor = (s: string) => ({ in_stock: 'success', sold: 'info', defective: 'error', returned: 'warning' }[s] ?? 'grey')

const snackbar = ref(false)
const snackbarText = ref('')
watch(error, (msg) => { if (msg) { snackbarText.value = msg; snackbar.value = true } })

onMounted(load)
watch(filters, load, { deep: true })
</script>

<template>
  <AppPageHeader title="Products w/ Serial Nos." subtitle="Manage serialized inventory" />

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
      empty-text="No serialized products found"
    >
      <template #item.serials_count="{ item }">
        {{ item.serials_count ?? item.serials?.length ?? 0 }}
      </template>
      <template #item.actions="{ item }">
        <v-btn icon="mdi-barcode-scan" variant="text" color="primary" @click="openSerials(item)" />
      </template>
    </AppDataTable>
  </AppCard>

  <AppDialog
    v-model="showSerials"
    title="Serials"
    :subtitle="selectedProduct?.name"
    icon="mdi-barcode-scan"
    max-width="700"
    scrollable
  >
    <v-card-text>
      <div class="d-flex ga-2 mb-4">
        <v-text-field
          v-model="newSerial"
          label="New Serial Number"
          variant="outlined"
          density="compact"
          hide-details
          @keyup.enter="handleAddSerial"
        />
        <v-btn color="primary" :disabled="!newSerial.trim()" @click="handleAddSerial">
          Add
        </v-btn>
      </div>
      <v-data-table :headers="serialHeaders" :items="serials" density="compact" :items-per-page="10">
        <template #item.status="{ item }">
          <v-menu>
            <template #activator="{ props }">
              <v-chip v-bind="props" :color="statusColor(item.status)" style="cursor:pointer">
                {{ item.status.replace('_', ' ') }}
              </v-chip>
            </template>
            <v-list density="compact">
              <v-list-item
                v-for="s in ['in_stock', 'sold', 'defective', 'returned']"
                :key="s"
                :title="s.replace('_', ' ')"
                @click="handleStatusChange(item, s)"
              />
            </v-list>
          </v-menu>
        </template>
        <template #item.created_at="{ item }">
          {{ item.created_at ? new Date(item.created_at).toLocaleDateString() : '-' }}
        </template>
        <template #item.actions="{ item }">
          <v-btn icon="mdi-delete" variant="text" color="error" @click="handleDeleteSerial(item)" />
        </template>
      </v-data-table>
    </v-card-text>
    <v-card-actions class="border-t pa-3">
      <v-spacer />
      <v-btn variant="text" @click="showSerials = false">Close</v-btn>
    </v-card-actions>
  </AppDialog>

  <v-snackbar v-model="snackbar" color="error" timeout="4000">
    {{ snackbarText }}
    <template #actions>
      <v-btn variant="text" @click="snackbar = false">Close</v-btn>
    </template>
  </v-snackbar>
</template>
