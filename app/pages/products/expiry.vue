<script setup lang="ts">
import { useProducts } from '~/composables/useProducts'
import { usePermission } from '~/composables/usePermission'

definePageMeta({ middleware: 'auth' })

const { products, meta, loading, error, fetchProducts } = useProducts()
const { hasPermission } = usePermission()

const search = ref('')
const page = ref(1)
const perPage = ref(15)
const expiringWithin = ref<number | null>(30)

const headers = [
  { title: 'Seq', key: 'product_sequence', sortable: true },
  { title: 'Name', key: 'name', sortable: true },
  { title: 'Barcode', key: 'barcode', sortable: false },
  { title: 'Expiry Date', key: 'expiry_date', sortable: true },
  { title: 'Days Left', key: 'days_left', sortable: false },
  { title: 'Stock', key: 'stock_quantity', sortable: true, align: 'end' },
  { title: 'Status', key: 'is_active', sortable: false }
]

const filters = computed(() => ({
  page: page.value,
  perPage: perPage.value,
  search: search.value || undefined,
  hasExpiry: true,
  sortBy: 'expiry_date',
  sortDirection: 'asc' as const
}))

const activeFilterCount = computed(() =>
  [expiringWithin.value].filter(v => v !== null && v !== undefined).length
)

function clearAllFilters () {
  search.value = ''
  expiringWithin.value = null
}

async function load () {
  if (!import.meta.client) return
  await fetchProducts(filters.value)
}

function daysLeft (date?: string | null) {
  if (!date) return null
  return Math.ceil((new Date(date).getTime() - Date.now()) / 86400000)
}

function expiryColor (date?: string | null) {
  const d = daysLeft(date)
  if (d === null) return 'grey'
  if (d < 0) return 'error'
  if (d <= 30) return 'warning'
  return 'success'
}

const filtered = computed(() => {
  if (expiringWithin.value === null) return products.value
  return products.value.filter(p => {
    const d = daysLeft(p.expiry_date)
    return d !== null && d <= expiringWithin.value!
  })
})

const snackbar = ref(false)
const snackbarText = ref('')
watch(error, (msg) => { if (msg) { snackbarText.value = msg; snackbar.value = true } })

onMounted(load)
watch(filters, load, { deep: true })
</script>

<template>
  <AppPageHeader title="Products w/ Expiry" subtitle="Track expiring inventory" />

  <AppCard class="mb-4">
    <v-row dense align="center">
      <v-col cols="12" sm="6" md="5">
        <v-text-field v-model="search" label="Search" prepend-inner-icon="mdi-magnify" clearable />
      </v-col>
      <v-col cols="12" sm="6" md="7" class="d-flex align-center justify-start ga-2">
        <v-menu :close-on-content-click="false" location="bottom end">
          <template #activator="{ props: menuProps }">
            <v-badge
              :content="activeFilterCount"
              :model-value="activeFilterCount > 0"
              color="primary"
              offset-x="4"
              offset-y="4"
            >
              <v-btn variant="outlined" prepend-icon="mdi-filter-variant" v-bind="menuProps">
                Filters
              </v-btn>
            </v-badge>
          </template>
          <v-card min-width="280" class="pa-3">
            <div class="text-subtitle-2 mb-2">Filter by Expiry</div>
            <v-select
              v-model="expiringWithin"
              label="Expiring Within"
              :items="[
                { title: 'All', value: null },
                { title: '30 days', value: 30 },
                { title: '60 days', value: 60 },
                { title: '90 days', value: 90 }
              ]"
              clearable
              class="mb-2"
            />
            <v-btn
              block
              class="mt-2"
              size="small"
              variant="tonal"
              color="error"
              prepend-icon="mdi-filter-remove"
              :disabled="activeFilterCount === 0 && !search"
              @click="clearAllFilters"
            >
              Clear All
            </v-btn>
          </v-card>
        </v-menu>
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
      :items="filtered"
      :items-length="meta.total"
      :loading="loading"
      empty-text="No products with expiry found"
    >
      <template #item.expiry_date="{ item }">
        <v-chip :color="expiryColor(item.expiry_date)" size="small">
          {{ item.expiry_date ?? '-' }}
        </v-chip>
      </template>
      <template #item.days_left="{ item }">
        {{ daysLeft(item.expiry_date) ?? '-' }}
      </template>
      <template #item.is_active="{ item }">
        <v-chip :color="item.is_active ? 'success' : 'error'" size="small">
          {{ item.is_active ? 'Active' : 'Inactive' }}
        </v-chip>
      </template>
    </AppDataTable>
  </AppCard>

  <v-snackbar v-model="snackbar" color="error" timeout="4000">
    {{ snackbarText }}
    <template #actions>
      <v-btn variant="text" @click="snackbar = false">Close</v-btn>
    </template>
  </v-snackbar>
</template>
