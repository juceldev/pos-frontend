Stocks Inventory<script setup lang="ts">
import { formatAmount } from '~/utils/format'
import StockInForm from '~/components/stocks/StockInForm.vue'
import { usePermission } from '~/composables/usePermission'
import { useStockIn } from '~/composables/useStockIn'
import { useSuppliers } from '~/composables/useSuppliers'
import type { StockIn, StockInFormData } from '~/types/stock'

definePageMeta({ middleware: 'auth' })

const { stockIns, meta, loading, error, fetchStockIns, fetchStockIn, createStockIn, updateStockIn, voidStockIn } = useStockIn()
const { hasPermission } = usePermission()
const { notify } = useNotification()
const { suppliers, fetchSuppliers } = useSuppliers()

const search = ref('')
const supplierId = ref<number | null>(null)
const paymentStatus = ref<string | null>(null)
const status = ref<'posted' | 'voided' | null>(null)
const dateFrom = ref<string | null>(null)
const dateTo = ref<string | null>(null)
const page = ref(1)
const perPage = ref(15)
const showForm = ref(false)
const saving = ref(false)
const editingStockIn = ref<StockIn | null>(null)
const formReadOnly = ref(false)
const showVoidDialog = ref(false)
const voidTarget = ref<StockIn | null>(null)
const voidReason = ref('')
const voiding = ref(false)
const selected = ref<number[]>([])
const showFilterDrawer = ref(false)

const headers = [
  { title: 'Stock In Date', key: 'stock_in_date', sortable: true, minWidth: '160px' },
  { title: 'Stock In No.', key: 'stock_in_no', sortable: true, minWidth: '120px' },
  { title: 'DR/OR #', key: 'dr_si_no', sortable: false, minWidth: '120px' },
  { title: 'DR/OR Date', key: 'dr_date', sortable: true, minWidth: '120px' },
  { title: 'Supplier Name', key: 'supplier.name', sortable: false, minWidth: '160px' },
  { title: 'Total Amount', key: 'total', sortable: true, align: 'end', minWidth: '120px' },
  { title: 'Payment Status', key: 'payment_status', sortable: false, align: 'center', minWidth: '120px' },
  { title: 'Status', key: 'status', sortable: false, align: 'center', minWidth: '110px' },
  { title: 'Payment Mode', key: 'payment_mode', sortable: false, align: 'center', minWidth: '130px' },
  { title: 'Paid Via', key: 'payment_description', sortable: false, minWidth: '120px' },
  { title: 'Paid Date', key: 'paid_date', sortable: true, minWidth: '120px' },
  { title: '', key: 'actions', sortable: false, align: 'end', width: '60px' },
]

const columnItems = computed(() => headers.filter(h => h.key !== 'actions'))
const visibleColumns = ref<string[]>(columnItems.value
  .filter(h => h.key !== 'payment_mode' && h.key !== 'payment_description' && h.key !== 'paid_date')
  .map(h => h.key))
const filteredHeaders = computed(() => headers.filter(h => h.key === 'actions' || visibleColumns.value.includes(h.key)))
const sortBy = ref<{ key: string; order: 'asc' | 'desc' }[]>([{ key: 'created_at', order: 'desc' }])

const filters = computed(() => ({
  page: page.value,
  perPage: perPage.value,
  search: search.value || undefined,
  filterKeys: filterBy.value.length === filterByItems.length ? undefined : filterBy.value.join(','),
  supplierId: supplierId.value ?? undefined,
  paymentStatus: paymentStatus.value ?? undefined,
  status: status.value ?? undefined,
  dateFrom: dateFrom.value ?? undefined,
  dateTo: dateTo.value ?? undefined,
  sortBy: sortBy.value[0]?.key ?? 'created_at',
  sortDirection: sortBy.value[0]?.order ?? 'desc'
}))

const activeFilterCount = computed(() =>
  [dateFrom.value, dateTo.value, paymentStatus.value, status.value]
    .filter(v => v !== null && v !== undefined).length +
  (filterBy.value.length !== filterByItems.length ? 1 : 0)
)

function clearAllFilters () {
  search.value = ''
  supplierId.value = null
  paymentStatus.value = null
  status.value = null
  dateFrom.value = null
  dateTo.value = null
  filterBy.value = filterByItems.map(i => i.value)
}

const supplierItems = computed(() => [
  { title: 'All', value: null },
  ...(suppliers.value ?? []).map(s => ({ title: s.name, value: s.id }))
])

const paymentStatusItems = [
  { title: 'All', value: null },
  { title: 'Paid', value: 'paid' },
  { title: 'Unpaid', value: 'unpaid' },
  { title: 'Partial', value: 'partial' }
]

const statusItems = [
  { title: 'All', value: null },
  { title: 'Posted', value: 'posted' },
  { title: 'Voided', value: 'voided' }
]

const filterByItems = [
  { title: 'Stock In No.', value: 'stock_in_no' },
  { title: 'DR/OR #', value: 'dr_si_no' },
  { title: 'Source', value: 'source' },
  { title: 'Supplier', value: 'supplier' }
]
const filterBy = ref<string[]>(filterByItems.map(i => i.value))

async function load () {
  if (!import.meta.client) return
  await fetchStockIns(filters.value)
}

function openCreate () {
  editingStockIn.value = null
  formReadOnly.value = false
  showForm.value = true
}

async function openEdit (item: StockIn) {
  if (item.status === 'voided') {
    notify('Cannot edit a voided stock-in', 'warning')
    return
  }
  const full = await fetchStockIn(item.id)
  if (!full) {
    notify('Failed to load stock-in details', 'error')
    return
  }
  editingStockIn.value = full
  formReadOnly.value = !canEditStockIn(item)
  showForm.value = true
}

async function openView (item: StockIn) {
  const full = await fetchStockIn(item.id)
  if (!full) {
    notify('Failed to load stock-in details', 'error')
    return
  }
  editingStockIn.value = full
  formReadOnly.value = true
  showForm.value = true
}

function canEditStockIn (item: StockIn): boolean {
  return item.status !== 'voided' && item.payment_status !== 'paid'
}

function actionIcon (item: StockIn): string {
  return canEditStockIn(item) ? 'mdi-pencil' : 'mdi-eye'
}

function actionTooltip (item: StockIn): string {
  if (item.status === 'voided') return 'Cannot edit a voided stock-in'
  if (item.payment_status === 'paid') return 'View (fully paid — read only)'
  return 'Edit'
}

function openVoid (item: StockIn) {
  voidTarget.value = item
  voidReason.value = ''
  showVoidDialog.value = true
}

async function confirmVoid () {
  if (!voidTarget.value) return
  voiding.value = true
  const result = await voidStockIn(voidTarget.value.id, voidReason.value || undefined)
  voiding.value = false
  if (result) {
    showVoidDialog.value = false
    notify(`Stock In ${result.stock_in_no} voided`, 'success')
    await load()
  } else {
    notify(error.value || 'Failed to void stock-in', 'error')
  }
}

async function handleSave (data: StockInFormData) {
  saving.value = true
  const result = await createStockIn(data)
  saving.value = false
  if (result) {
    showForm.value = false
    notify(`Stock In ${result.stock_in_no} saved`, 'success')
    await load()
  } else {
    notify(error.value || 'Failed to save stock-in', 'error')
  }
}

async function handleUpdate (id: number, data: StockInFormData) {
  saving.value = true
  const result = await updateStockIn(id, data)
  saving.value = false
  if (result) {
    showForm.value = false
    editingStockIn.value = null
    notify(`Stock In ${result.stock_in_no} updated`, 'success')
    await load()
  } else {
    notify(error.value || 'Failed to update stock-in', 'error')
  }
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

onMounted(() => Promise.all([fetchSuppliers(), load()]))
watch(filters, load, { deep: true })
</script>

<template>
  <AppPageHeader title="Stock In Lists" subtitle="Incoming stock receipts">
    <template #actions>
      <v-btn v-if="hasPermission('stock.create')" color="primary" prepend-icon="mdi-plus" @click="openCreate">
        Add New Stocks (IN)
      </v-btn>
    </template>
  </AppPageHeader>

  <AppCard class="stock-in-card rounded-lg" elevation="1">
    <v-toolbar color="surface" flat density="comfortable" class="rounded-t-lg">
      <v-text-field
        v-model="search"
        label="Search stock-ins..."
        prepend-inner-icon="mdi-magnify"
        clearable
        density="compact"
        variant="outlined"
        style="max-width: 400px"
        class="align-self-center me-3"
      />
      <v-autocomplete
        v-model="supplierId"
        label="Supplier"
        prepend-inner-icon="mdi-truck-outline"
        :items="supplierItems"
        item-title="title"
        item-value="value"
        clearable
        density="compact"
        variant="outlined"
        style="max-width: 400px"
        class="align-self-center me-3"
      />
      <v-select
        v-model="paymentStatus"
        label="Payment Status"
        prepend-inner-icon="mdi-cash-check"
        :items="paymentStatusItems"
        item-title="title"
        item-value="value"
        clearable
        density="compact"
        variant="outlined"
        style="max-width: 260px"
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
    </v-toolbar>
    <v-divider />
    <AppDataTable
      v-model:page="page"
      v-model:items-per-page="perPage"
      v-model:sort-by="sortBy"
      v-model="selected"
      :headers="filteredHeaders"
      :items="stockIns"
      :items-length="meta.total"
      :loading="loading"
      class="stock-in-table"
      item-value="id"
      show-select
      select-strategy="single"
      density="compact"
      height="480"
      fixed-header
      empty-text="No stock-in records found"
      :row-props="getRowProps"
    >
      <template #item.stock_in_date="{ item }">{{ item.stock_in_date ? new Date(item.stock_in_date).toLocaleString() : '—' }}</template>
      <template #item.dr_si_no="{ item }">{{ item.dr_si_no || '—' }}</template>
      <template #item.dr_date="{ item }">{{ item.dr_date ? new Date(item.dr_date).toLocaleDateString() : '—' }}</template>
      <template #item.supplier.name="{ item }">{{ item.supplier?.name ?? '—' }}</template>
      <template #item.total="{ item }">{{ formatAmount(item.total) }}</template>
      <template #item.payment_status="{ item }">
        <v-chip
          :color="item.payment_status === 'paid' ? 'success' : item.payment_status === 'partial' ? 'info' : 'warning'"
          size="small"
          variant="tonal"
          :prepend-icon="item.payment_status === 'paid' ? 'mdi-check-circle' : item.payment_status === 'partial' ? 'mdi-progress-clock' : 'mdi-clock-outline'"
        >
          {{ item.payment_status ? item.payment_status.replace(/_/g, ' ').toUpperCase() : '—' }}
        </v-chip>
      </template>
      <template #item.status="{ item }">
        <v-chip
          :color="item.status === 'voided' ? 'error' : 'success'"
          size="small"
          variant="tonal"
          :prepend-icon="item.status === 'voided' ? 'mdi-cancel' : 'mdi-check-decagram'"
        >
          {{ item.status === 'voided' ? 'Voided' : 'Posted' }}
        </v-chip>
      </template>
      <template #item.payment_mode="{ item }">{{ item.payment_mode ? item.payment_mode.replace(/_/g, ' ').toUpperCase() : '—' }}</template>
      <template #item.payment_description="{ item }">{{ item.payment_description || '—' }}</template>
      <template #item.paid_date="{ item }">{{ item.paid_date ? new Date(item.paid_date).toLocaleDateString() : '—' }}</template>
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
              prepend-icon="mdi-eye"
              title="View"
              @click="openView(item)"
            />
            <v-list-item
              v-if="hasPermission('stock.edit')"
              :prepend-icon="actionIcon(item)"
              :title="actionTooltip(item)"
              :disabled="item.status === 'voided'"
              @click="openEdit(item)"
            />
            <v-list-item
              v-if="hasPermission('stock.edit')"
              prepend-icon="mdi-cancel"
              title="Void"
              base-color="error"
              :disabled="item.status === 'voided'"
              @click="openVoid(item)"
            />
          </v-list>
        </v-menu>
        </div>
      </template>
    </AppDataTable>
  </AppCard>

  <!-- Void confirmation dialog -->
  <AppDialog
    v-model="showVoidDialog"
    title="Void Stock In"
    icon="mdi-cancel"
    header-color="error"
    max-width="420"
    persistent
  >
    <v-card-text class="pa-4">
      <v-alert type="warning" variant="tonal" density="compact" class="mb-3 text-caption">
        Voiding <strong>{{ voidTarget?.stock_in_no }}</strong> will reverse the received quantities
        and mark its serials as voided. This cannot be undone.
      </v-alert>
      <v-text-field
        v-model="voidReason"
        label="Reason (optional)"
        variant="outlined"
        density="compact"
      />
    </v-card-text>
    <v-card-actions class="pa-3 border-t">
      <v-btn variant="text" @click="showVoidDialog = false">Cancel</v-btn>
      <v-spacer />
      <v-btn color="error" variant="elevated" prepend-icon="mdi-cancel" :loading="voiding" @click="confirmVoid">
        Void Stock In
      </v-btn>
    </v-card-actions>
  </AppDialog>

  <StockInForm
    v-model="showForm"
    :stock-in="editingStockIn"
    :loading="saving"
    :read-only="formReadOnly"
    @save="handleSave"
    @update="handleUpdate"
  />

  <v-navigation-drawer v-model="showFilterDrawer" location="right" temporary width="320">
    <v-toolbar color="surface" flat density="comfortable">
      <v-toolbar-title class="text-subtitle-1">Filters</v-toolbar-title>
      <v-spacer />
      <v-btn icon="mdi-close" variant="text" size="small" @click="showFilterDrawer = false" />
    </v-toolbar>
    <v-divider />
    <div class="pa-4">
      <div class="text-subtitle-2 mb-2">Date Range</div>
      <v-text-field v-model="dateFrom" label="Date From" type="date" clearable class="mb-2" />
      <v-text-field v-model="dateTo" label="Date To" type="date" clearable class="mb-4" />

      <div class="text-subtitle-2 mb-2">Payment Status</div>
      <v-select
        v-model="paymentStatus"
        label="Payment Status"
        :items="paymentStatusItems"
        item-title="title"
        item-value="value"
        clearable
        class="mb-4"
      />

      <div class="text-subtitle-2 mb-2">Status</div>
      <v-select
        v-model="status"
        label="Status"
        :items="statusItems"
        item-title="title"
        item-value="value"
        clearable
        class="mb-4"
      />

      <div class="text-subtitle-2 mb-2">Search in</div>
      <v-list density="compact" class="mb-4" nav>
        <v-list-item
          v-for="col in filterByItems"
          :key="col.value"
          :title="col.title"
        >
          <template #prepend>
            <v-checkbox
              v-model="filterBy"
              :value="col.value"
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
</template>

<style scoped>
.stock-in-card {
  overflow: hidden;
}

.stock-in-table :deep(tbody tr) {
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.stock-in-table :deep(tbody tr:hover) {
  background-color: rgba(var(--v-theme-primary), 0.04);
}

.stock-in-table :deep(tbody tr.v-data-table__tr--selected) {
  background-color: rgba(var(--v-theme-primary), 0.08);
}
</style>
