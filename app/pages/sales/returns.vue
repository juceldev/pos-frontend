<script setup lang="ts">
import { formatAmount } from '~/utils/format'
import { useSaleReturns } from '~/composables/useSaleReturns'
import { usePermission } from '~/composables/usePermission'
import type { SaleReturn } from '~/types/sale'

definePageMeta({
  middleware: 'auth'
})

const { saleReturns, meta, loading, error, fetchSaleReturns, approveReturn, rejectReturn } = useSaleReturns()
const { hasPermission } = usePermission()
const { success: showSuccess, error: showError } = useNotification()

const search = ref('')
const status = ref<string | null>('pending')
const page = ref(1)
const perPage = ref(15)
const sortBy = ref<{ key: string; order: 'asc' | 'desc' }[]>([{ key: 'created_at', order: 'desc' }])
const showFilterDrawer = ref(false)

const statusFilterItems = [
  { title: 'All', value: null },
  { title: 'Pending', value: 'pending' },
  { title: 'Approved', value: 'approved' },
  { title: 'Rejected', value: 'rejected' },
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
  status.value = 'pending'
}

async function load () {
  if (!import.meta.client) return
  await fetchSaleReturns(filters.value)
}

onMounted(load)
watch(filters, load, { deep: true })

const headers = [
  { title: 'Return #', key: 'id', sortable: false },
  { title: 'Sale #', key: 'sale.sale_number', sortable: false },
  { title: 'Customer', key: 'sale.customer.name', sortable: false },
  { title: 'Requested By', key: 'user.name', sortable: false },
  { title: 'Items', key: 'items', sortable: false, width: '200px' },
  { title: 'Total', key: 'returned_total', sortable: true, align: 'end' },
  { title: 'Status', key: 'status', sortable: true },
  { title: 'Date', key: 'created_at', sortable: true },
  { title: 'Actions', key: 'actions', sortable: false, align: 'end' }
]

const statusColor: Record<string, string> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'error',
  completed: 'info'
}

const rejectDialog = ref(false)
const previewDialog = ref(false)
const selectedReturn = ref<SaleReturn | null>(null)
const rejectReason = ref('')
const isProcessing = ref(false)

function openReject (item: SaleReturn) {
  selectedReturn.value = item
  rejectReason.value = ''
  rejectDialog.value = true
}

function openPreview (item: SaleReturn) {
  selectedReturn.value = item
  previewDialog.value = true
}

async function confirmApprove () {
  if (!selectedReturn.value) return
  isProcessing.value = true
  const result = await approveReturn(selectedReturn.value.id)
  isProcessing.value = false
  previewDialog.value = false
  if (result) {
    showSuccess('Return approved and stock restored')
    await load()
  } else {
    showError(error.value || 'Approval failed')
  }
}

async function confirmReject () {
  if (!selectedReturn.value) return
  isProcessing.value = true
  const result = await rejectReturn(selectedReturn.value.id, rejectReason.value)
  isProcessing.value = false
  rejectDialog.value = false
  if (result) {
    showSuccess('Return rejected')
    await load()
  } else {
    showError(error.value || 'Rejection failed')
  }
}

watch(error, (msg) => {
  if (msg) showError(msg)
})
</script>

<template>
  <AppPageHeader title="Return Approvals" subtitle="Review and approve staff return requests" />

  <AppCard>
    <v-toolbar color="surface" flat density="comfortable" class="rounded-t-lg">
      <v-text-field
        v-model="search"
        label="Search returns..."
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
      :items="saleReturns"
      :items-length="meta.total"
      :loading="loading"
      empty-text="No return requests found"
    >
      <template #item.sale.sale_number="{ item }">
        {{ item.sale?.sale_number ?? '-' }}
      </template>

      <template #item.sale.customer.name="{ item }">
        {{ item.sale?.customer?.name ?? 'Walk-in' }}
      </template>

      <template #item.user.name="{ item }">
        {{ item.user?.name ?? '-' }}
      </template>

      <template #item.items="{ item }">
        <div class="d-flex flex-column">
          <div
            v-for="(returnItem, i) in item.items"
            :key="i"
            class="text-caption"
          >
            {{ returnItem.product?.name ?? '-' }} x{{ returnItem.quantity }}
            <span v-if="returnItem.serials?.length" class="text-medium-emphasis">
              ({{ returnItem.serials.join(', ') }})
            </span>
          </div>
        </div>
      </template>

      <template #item.returned_total="{ item }">
        {{ formatAmount(item.returned_total) }}
      </template>

      <template #item.status="{ item }">
        <v-chip :color="statusColor[item.status] ?? 'default'" size="small">
          {{ item.status }}
        </v-chip>
      </template>

      <template #item.created_at="{ item }">
        {{ new Date(item.created_at).toLocaleString() }}
      </template>

      <template #item.actions="{ item }">
        <div class="d-flex justify-end ga-2">
          <template v-if="item.status === 'pending' && hasPermission('returns.approve')">
            <v-btn
              size="small"
              color="success"
              variant="tonal"
              :loading="isProcessing && selectedReturn?.id === item.id"
              @click="openPreview(item)"
            >
              Approve
            </v-btn>
            <v-btn
              size="small"
              color="error"
              variant="tonal"
              @click="openReject(item)"
            >
              Reject
            </v-btn>
          </template>
          <span v-else class="text-medium-emphasis text-caption">-</span>
        </div>
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

  <AppDialog
    v-model="rejectDialog"
    title="Reject Return"
    subtitle="Enter a reason for rejecting this return request"
    icon="mdi-close-circle"
    max-width="500"
  >
    <v-card-text>
      <v-textarea
        v-model="rejectReason"
        label="Reason (optional)"
        rows="3"
        variant="outlined"
        density="compact"
        hide-details
      />
    </v-card-text>
    <v-card-actions class="pa-4 pt-0">
      <v-spacer />
      <v-btn variant="text" @click="rejectDialog = false">Cancel</v-btn>
      <v-btn
        color="error"
        :loading="isProcessing"
        @click="confirmReject"
      >
        Reject
      </v-btn>
    </v-card-actions>
  </AppDialog>

  <AppDialog
    v-model="previewDialog"
    title="Approve Return"
    subtitle="Review return items and reason before approving"
    icon="mdi-check-circle"
    max-width="700"
  >
    <v-card-text v-if="selectedReturn">
      <v-sheet color="surface" rounded="lg" class="pa-4 mb-4 border">
        <div class="d-flex flex-column ga-2">
          <div class="d-flex justify-space-between">
            <span class="text-medium-emphasis">Return #</span>
            <span>{{ selectedReturn.id }}</span>
          </div>
          <div class="d-flex justify-space-between">
            <span class="text-medium-emphasis">Sale #</span>
            <span>{{ selectedReturn.sale?.sale_number ?? '-' }}</span>
          </div>
          <div class="d-flex justify-space-between">
            <span class="text-medium-emphasis">Customer</span>
            <span>{{ selectedReturn.sale?.customer?.name ?? 'Walk-in' }}</span>
          </div>
          <div class="d-flex justify-space-between">
            <span class="text-medium-emphasis">Requested By</span>
            <span>{{ selectedReturn.user?.name ?? '-' }}</span>
          </div>
          <div class="d-flex justify-space-between">
            <span class="text-medium-emphasis">Total Refund</span>
            <span class="font-weight-bold text-primary">{{ formatAmount(selectedReturn.returned_total) }}</span>
          </div>
          <v-alert
            v-if="selectedReturn.notes"
            color="info"
            variant="tonal"
            density="compact"
            class="mt-2"
          >
            <span class="font-weight-medium">Notes:</span> {{ selectedReturn.notes }}
          </v-alert>
        </div>
      </v-sheet>

      <div class="text-h6 mb-2">Return Items</div>
      <v-table v-if="selectedReturn.items?.length" density="compact" class="border rounded">
        <thead>
          <tr>
            <th>Product</th>
            <th class="text-end">Qty</th>
            <th class="text-end">Unit Price</th>
            <th class="text-end">Total</th>
            <th>Serials</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(returnItem, i) in selectedReturn.items" :key="i">
            <td>{{ returnItem.product?.name ?? '-' }}</td>
            <td class="text-end">{{ returnItem.quantity }}</td>
            <td class="text-end">{{ formatAmount(returnItem.unit_price) }}</td>
            <td class="text-end font-weight-medium">{{ formatAmount(returnItem.total) }}</td>
            <td>
              <span v-if="returnItem.serials?.length" class="text-caption">
                {{ returnItem.serials.join(', ') }}
              </span>
              <span v-else class="text-caption text-medium-emphasis">-</span>
            </td>
          </tr>
        </tbody>
      </v-table>
      <v-alert v-else color="warning" variant="tonal" density="compact" class="mb-2">
        No items in this return.
      </v-alert>
    </v-card-text>
    <v-card-actions class="pa-4 pt-0">
      <v-spacer />
      <v-btn variant="text" @click="previewDialog = false">Cancel</v-btn>
      <v-btn
        color="success"
        :loading="isProcessing"
        @click="confirmApprove"
      >
        Approve
      </v-btn>
    </v-card-actions>
  </AppDialog>
</template>
