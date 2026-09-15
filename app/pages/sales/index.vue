<script setup lang="ts">
import { formatAmount } from '~/utils/format'
import { useSales } from '~/composables/useSales'

definePageMeta({
  middleware: 'auth'
})

const { sales, meta, loading, error, currentSale, fetchSales, fetchSale } = useSales()

const search = ref('')
const status = ref<string | null>(null)
const page = ref(1)
const perPage = ref(15)
const sortBy = ref<{ key: string; order: 'asc' | 'desc' }[]>([{ key: 'created_at', order: 'desc' }])
const showFilterDrawer = ref(false)
const showSaleDialog = ref(false)
const viewingSale = ref(false)

const statusFilterItems = [
  { title: 'All', value: null },
  { title: 'Completed', value: 'completed' }
]

const filters = computed(() => ({
  page: page.value,
  per_page: perPage.value,
  search: search.value || undefined,
  status: status.value || undefined,
  sort_by: sortBy.value[0]?.key ?? 'created_at',
  sort_direction: sortBy.value[0]?.order ?? 'desc'
}))

const activeFilterCount = computed(() =>
  [status.value].filter(v => v !== null && v !== undefined).length
)

const activeFilters = computed(() => {
  const list: { key: string, label: string, clear: () => void }[] = []
  if (status.value !== null) {
    const item = statusFilterItems.find(i => i.value === status.value)
    list.push({ key: 'status', label: `Status: ${item?.title ?? status.value}`, clear: () => { status.value = null } })
  }
  return list
})

function clearAllFilters () {
  search.value = ''
  status.value = null
}

async function load () {
  if (!import.meta.client) return
  await fetchSales(filters.value)
}

async function viewSale (sale: any) {
  viewingSale.value = true
  showSaleDialog.value = true
  await fetchSale(sale.id)
  viewingSale.value = false
}

const headers = [
  { title: 'Sale #', key: 'sale_number', sortable: true },
  { title: 'Customer', key: 'customer.name', sortable: false },
  { title: 'Payment', key: 'payment_type.name', sortable: false },
  { title: 'Total', key: 'total', sortable: true, align: 'end' },
  { title: 'Paid', key: 'paid_amount', sortable: true, align: 'end' },
  { title: 'Change', key: 'change', sortable: false, align: 'end' },
  { title: 'Status', key: 'status', sortable: true },
  { title: 'Date', key: 'created_at', sortable: true },
  { title: '', key: 'actions', sortable: false, align: 'end', width: '60px' }
]

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
  <AppPageHeader title="Sales History" subtitle="Review completed transactions" />

  <AppCard>
    <v-toolbar color="surface" flat density="comfortable" class="rounded-t-lg">
      <v-text-field
        v-model="search"
        label="Search sales..."
        prepend-inner-icon="mdi-magnify"
        clearable
        density="compact"
        variant="outlined"
        style="max-width: 400px"
        class="align-self-center me-3"
      />
      <v-select
        v-model="status"
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
      :items="sales"
      :items-length="meta.total"
      :loading="loading"
      empty-text="No sales found"
    >
      <template #item.customer.name="{ item }">
        {{ item.customer?.name ?? 'Walk-in' }}
      </template>

      <template #item.payment_type.name="{ item }">
        {{ item.payment_type?.name ?? '-' }}
      </template>

      <template #item.total="{ item }">
        {{ formatAmount(item.total) }}
      </template>

      <template #item.paid_amount="{ item }">
        {{ formatAmount(item.paid_amount) }}
      </template>

      <template #item.change="{ item }">
        {{ formatAmount(item.change) }}
      </template>

      <template #item.status="{ item }">
        <v-chip color="success">
          {{ item.status }}
        </v-chip>
      </template>

      <template #item.created_at="{ item }">
        {{ new Date(item.created_at).toLocaleString() }}
      </template>
      <template #item.actions="{ item }">
        <v-btn icon="mdi-eye" variant="text" size="small" @click="viewSale(item)" />
      </template>
    </AppDataTable>
  </AppCard>

  <AppDialog
    v-model="showSaleDialog"
    title="Sale Details"
    :subtitle="currentSale?.sale_number"
    icon="mdi-receipt-text"
    max-width="720"
    scrollable
  >
    <v-card-text v-if="currentSale">
      <div class="d-flex flex-column ga-2 mb-4">
        <div class="d-flex justify-space-between">
          <span class="text-medium-emphasis">Sale #</span>
          <span>{{ currentSale.sale_number }}</span>
        </div>
        <div class="d-flex justify-space-between">
          <span class="text-medium-emphasis">Customer</span>
          <span>{{ currentSale.customer?.name ?? 'Walk-in' }}</span>
        </div>
        <div class="d-flex justify-space-between">
          <span class="text-medium-emphasis">Cashier</span>
          <span>{{ currentSale.user?.name ?? '-' }}</span>
        </div>
        <div class="d-flex justify-space-between">
          <span class="text-medium-emphasis">Payment</span>
          <span>{{ currentSale.payment_type?.name ?? '-' }}</span>
        </div>
        <div v-if="currentSale.payment_reference_no" class="d-flex justify-space-between">
          <span class="text-medium-emphasis">Reference No</span>
          <span>{{ currentSale.payment_reference_no }}</span>
        </div>
        <div class="d-flex justify-space-between">
          <span class="text-medium-emphasis">Date</span>
          <span>{{ currentSale.created_at ? new Date(currentSale.created_at).toLocaleString() : '-' }}</span>
        </div>
      </div>

      <v-divider class="mb-4" />

      <div class="text-subtitle-2 mb-2">Items</div>
      <v-table v-if="currentSale.items?.length" density="compact" class="border rounded mb-4">
        <thead>
          <tr>
            <th>Product</th>
            <th class="text-end">Qty</th>
            <th class="text-end">Unit Price</th>
            <th class="text-end">Total</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(it, i) in currentSale.items" :key="i">
            <td>
              {{ it.product?.name ?? it.description ?? '-' }}
              <div v-if="it.serials?.length" class="text-caption text-medium-emphasis">
                SN: {{ it.serials.join(', ') }}
              </div>
            </td>
            <td class="text-end">{{ it.quantity }}</td>
            <td class="text-end">{{ formatAmount(it.unit_price) }}</td>
            <td class="text-end font-weight-medium">{{ formatAmount(it.total) }}</td>
          </tr>
        </tbody>
      </v-table>

      <v-divider class="mb-4" />

      <div class="d-flex flex-column ga-2">
        <div class="d-flex justify-space-between">
          <span class="text-medium-emphasis">Subtotal</span>
          <span>{{ formatAmount(currentSale.subtotal) }}</span>
        </div>
        <div class="d-flex justify-space-between">
          <span class="text-medium-emphasis">Discount</span>
          <span>{{ formatAmount(currentSale.discount) }}</span>
        </div>
        <div v-if="currentSale.tax" class="d-flex justify-space-between">
          <span class="text-medium-emphasis">Tax</span>
          <span>{{ formatAmount(currentSale.tax) }}</span>
        </div>
        <div class="d-flex justify-space-between font-weight-bold">
          <span>Total</span>
          <span>{{ formatAmount(currentSale.total) }}</span>
        </div>
        <div class="d-flex justify-space-between">
          <span class="text-medium-emphasis">Paid</span>
          <span>{{ formatAmount(currentSale.paid_amount) }}</span>
        </div>
        <div class="d-flex justify-space-between">
          <span class="text-medium-emphasis">Change</span>
          <span>{{ formatAmount(currentSale.change) }}</span>
        </div>
        <div v-if="currentSale.notes" class="d-flex justify-space-between">
          <span class="text-medium-emphasis">Notes</span>
          <span>{{ currentSale.notes }}</span>
        </div>
      </div>
    </v-card-text>
    <v-card-text v-else-if="viewingSale" class="text-center py-8">
      <v-progress-circular indeterminate color="primary" />
    </v-card-text>
    <v-card-text v-else class="text-center py-8 text-medium-emphasis">
      Failed to load sale details.
    </v-card-text>
    <v-card-actions class="pa-4 pt-0">
      <v-spacer />
      <v-btn variant="text" @click="showSaleDialog = false">Close</v-btn>
    </v-card-actions>
  </AppDialog>

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
        v-model="status"
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

  <v-snackbar v-model="snackbar" :color="snackbarColor" timeout="4000">
    {{ snackbarText }}
    <template #actions>
      <v-btn variant="text" @click="snackbar = false">Close</v-btn>
    </template>
  </v-snackbar>
</template>
