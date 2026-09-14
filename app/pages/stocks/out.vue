<script setup lang="ts">
import { formatAmount } from '~/utils/format'
import StockOutForm from '~/components/stocks/StockOutForm.vue'
import { usePermission } from '~/composables/usePermission'
import { useStockOut } from '~/composables/useStockOut'
import type { StockOut, StockOutFormData } from '~/types/stock'

definePageMeta({ middleware: 'auth' })

const { stockOuts, meta, loading, error, fetchStockOuts, fetchStockOut, createStockOut, updateStockOut, voidStockOut } = useStockOut()
const { hasPermission } = usePermission()
const { notify } = useNotification()

const search = ref('')
const stockOutType = ref<string | null>(null)
const destinationType = ref<string | null>(null)
const status = ref<'posted' | 'voided' | null>(null)
const dateFrom = ref<string | null>(null)
const dateTo = ref<string | null>(null)
const page = ref(1)
const perPage = ref(15)
const showForm = ref(false)
const saving = ref(false)
const editingStockOut = ref<StockOut | null>(null)
const formReadOnly = ref(false)
const showVoidDialog = ref(false)
const voidTarget = ref<StockOut | null>(null)
const voidReason = ref('')
const voiding = ref(false)
const selected = ref<number[]>([])
const showFilterDrawer = ref(false)

const headers = [
  { title: 'Stock Out Date', key: 'stock_out_date', sortable: true, minWidth: '160px' },
  { title: 'Stock Out No.', key: 'stock_out_no', sortable: true, minWidth: '120px' },
  { title: 'Type', key: 'stock_out_type', sortable: false, align: 'center', minWidth: '110px' },
  { title: 'Reference No.', key: 'reference_no', sortable: false, minWidth: '120px' },
  { title: 'Destination', key: 'destination_name', sortable: false, minWidth: '160px' },
  { title: 'Total Amount', key: 'total', sortable: true, align: 'end', minWidth: '120px' },
  { title: 'Status', key: 'status', sortable: false, align: 'center', minWidth: '110px' },
  { title: '', key: 'actions', sortable: false, align: 'end', width: '60px' },
]

const columnItems = computed(() => headers.filter(h => h.key !== 'actions'))
const visibleColumns = ref<string[]>(columnItems.value.map(h => h.key))
const filteredHeaders = computed(() => headers.filter(h => h.key === 'actions' || visibleColumns.value.includes(h.key)))
const sortBy = ref<{ key: string; order: 'asc' | 'desc' }[]>([{ key: 'created_at', order: 'desc' }])

const filterByItems = [
  { title: 'Stock Out No.', value: 'stock_out_no' },
  { title: 'Reference No.', value: 'reference_no' },
  { title: 'Destination', value: 'destination_name' }
]
const filterBy = ref<string[]>(filterByItems.map(i => i.value))

const filters = computed(() => ({
  page: page.value,
  perPage: perPage.value,
  search: search.value || undefined,
  filterKeys: filterBy.value.length === filterByItems.length ? undefined : filterBy.value.join(','),
  stockOutType: stockOutType.value ?? undefined,
  destinationType: destinationType.value ?? undefined,
  status: status.value ?? undefined,
  dateFrom: dateFrom.value ?? undefined,
  dateTo: dateTo.value ?? undefined,
  sortBy: sortBy.value[0]?.key ?? 'created_at',
  sortDirection: sortBy.value[0]?.order ?? 'desc'
}))

const activeFilterCount = computed(() =>
  [dateFrom.value, dateTo.value, stockOutType.value, destinationType.value, status.value]
    .filter(v => v !== null && v !== undefined).length +
  (filterBy.value.length !== filterByItems.length ? 1 : 0)
)

function clearAllFilters () {
  search.value = ''
  stockOutType.value = null
  destinationType.value = null
  status.value = null
  dateFrom.value = null
  dateTo.value = null
  filterBy.value = filterByItems.map(i => i.value)
}

const stockOutTypeItems = [
  { title: 'All', value: null },
  { title: 'Transfer', value: 'transfer' },
  { title: 'Return to Supplier', value: 'return' },
  { title: 'Sale', value: 'sale' },
  { title: 'Damage', value: 'damage' },
  { title: 'Other', value: 'other' }
]

const destinationTypeItems = [
  { title: 'All', value: null },
  { title: 'Supplier', value: 'supplier' },
  { title: 'Customer', value: 'customer' },
  { title: 'Branch', value: 'branch' },
  { title: 'Stockroom', value: 'stockroom' },
  { title: 'Other', value: 'other' }
]

const statusItems = [
  { title: 'All', value: null },
  { title: 'Posted', value: 'posted' },
  { title: 'Voided', value: 'voided' }
]

async function load () {
  if (!import.meta.client) return
  await fetchStockOuts(filters.value)
}

function openCreate () {
  editingStockOut.value = null
  formReadOnly.value = false
  showForm.value = true
}

async function openEdit (item: StockOut) {
  if (item.status === 'voided') {
    notify('Cannot edit a voided stock-out', 'warning')
    return
  }
  const full = await fetchStockOut(item.id)
  if (!full) {
    notify('Failed to load stock-out details', 'error')
    return
  }
  editingStockOut.value = full
  formReadOnly.value = false
  showForm.value = true
}

async function openView (item: StockOut) {
  const full = await fetchStockOut(item.id)
  if (!full) {
    notify('Failed to load stock-out details', 'error')
    return
  }
  editingStockOut.value = full
  formReadOnly.value = true
  showForm.value = true
}

function canEditStockOut (item: StockOut): boolean {
  return item.status !== 'voided'
}

function actionIcon (item: StockOut): string {
  return canEditStockOut(item) ? 'mdi-pencil' : 'mdi-eye'
}

function actionTooltip (item: StockOut): string {
  if (item.status === 'voided') return 'View (voided — read only)'
  return 'Edit'
}

function openVoid (item: StockOut) {
  voidTarget.value = item
  voidReason.value = ''
  showVoidDialog.value = true
}

async function confirmVoid () {
  if (!voidTarget.value) return
  voiding.value = true
  const result = await voidStockOut(voidTarget.value.id, voidReason.value || undefined)
  voiding.value = false
  if (result) {
    showVoidDialog.value = false
    notify(`Stock Out ${result.stock_out_no} voided`, 'success')
    await load()
  } else {
    notify(error.value || 'Failed to void stock-out', 'error')
  }
}

async function handleSave (data: StockOutFormData) {
  saving.value = true
  const result = await createStockOut(data)
  saving.value = false
  if (result) {
    showForm.value = false
    notify(`Stock Out ${result.stock_out_no} saved`, 'success')
    await load()
  } else {
    notify(error.value || 'Failed to save stock-out', 'error')
  }
}

async function handleUpdate (id: number, data: StockOutFormData) {
  saving.value = true
  const result = await updateStockOut(id, data)
  saving.value = false
  if (result) {
    showForm.value = false
    editingStockOut.value = null
    notify(`Stock Out ${result.stock_out_no} updated`, 'success')
    await load()
  } else {
    notify(error.value || 'Failed to update stock-out', 'error')
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

onMounted(load)
watch(filters, load, { deep: true })
</script>

<template>
  <AppPageHeader title="Stock Out Lists" subtitle="Outgoing stock movements">
    <template #actions>
      <v-btn v-if="hasPermission('stock.create')" color="primary" prepend-icon="mdi-plus" @click="openCreate">
        Add New Stocks (OUT)
      </v-btn>
    </template>
  </AppPageHeader>

  <AppCard class="stock-out-card rounded-lg" elevation="1">
    <v-toolbar color="surface" flat density="comfortable" class="rounded-t-lg">
      <v-text-field
        v-model="search"
        label="Search stock-outs..."
        prepend-inner-icon="mdi-magnify"
        clearable
        density="compact"
        variant="outlined"
        style="max-width: 400px"
        class="align-self-center me-3"
      />
      <v-select
        v-model="stockOutType"
        label="Type"
        prepend-inner-icon="mdi-arrow-up-bold-box-outline"
        :items="stockOutTypeItems"
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
      :items="stockOuts"
      :items-length="meta.total"
      :loading="loading"
      class="stock-out-table"
      item-value="id"
      show-select
      select-strategy="single"
      density="compact"
      height="480"
      fixed-header
      empty-text="No stock-out records found"
      :row-props="getRowProps"
    >
      <template #item.stock_out_date="{ item }">{{ item.stock_out_date ? new Date(item.stock_out_date).toLocaleString() : '—' }}</template>
      <template #item.stock_out_type="{ item }">
        <v-chip size="small" variant="tonal" color="info">{{ item.stock_out_type ? item.stock_out_type.replace(/_/g, ' ').toUpperCase() : '—' }}</v-chip>
      </template>
      <template #item.reference_no="{ item }">{{ item.reference_no || '—' }}</template>
      <template #item.destination_name="{ item }">{{ item.destination_name || '—' }}</template>
      <template #item.total="{ item }">{{ formatAmount(item.total) }}</template>
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
              @click="canEditStockOut(item) ? openEdit(item) : openView(item)"
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
    title="Void Stock Out"
    icon="mdi-cancel"
    header-color="error"
    max-width="420"
    persistent
  >
    <v-card-text class="pa-4">
      <v-alert type="warning" variant="tonal" density="compact" class="mb-3 text-caption">
        Voiding <strong>{{ voidTarget?.stock_out_no }}</strong> will return the released quantities to stock
        and mark its serials as in-stock again. This cannot be undone.
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
        Void Stock Out
      </v-btn>
    </v-card-actions>
  </AppDialog>

  <StockOutForm
    v-model="showForm"
    :stock-out="editingStockOut"
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

      <div class="text-subtitle-2 mb-2">Stock Out Type</div>
      <v-select
        v-model="stockOutType"
        label="Stock Out Type"
        :items="stockOutTypeItems"
        item-title="title"
        item-value="value"
        clearable
        class="mb-4"
      />

      <div class="text-subtitle-2 mb-2">Destination Type</div>
      <v-select
        v-model="destinationType"
        label="Destination Type"
        :items="destinationTypeItems"
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
.stock-out-card {
  overflow: hidden;
}

.stock-out-table :deep(tbody tr) {
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.stock-out-table :deep(tbody tr:hover) {
  background-color: rgba(var(--v-theme-primary), 0.04);
}

.stock-out-table :deep(tbody tr.v-data-table__tr--selected) {
  background-color: rgba(var(--v-theme-primary), 0.08);
}
</style>
