<script setup lang="ts">
import { formatAmount } from '~/utils/format'
import { useSaleReturns } from '~/composables/useSaleReturns'
import { useSales } from '~/composables/useSales'
import { usePermission } from '~/composables/usePermission'
import type { SaleReturn } from '~/types/sale'

definePageMeta({
  middleware: 'auth'
})

const activeTab = ref<'returns' | 'voids'>('returns')

// Returns tab
const { saleReturns, meta: returnsMeta, loading: returnsLoading, error: returnsError, fetchSaleReturns, approveReturn, rejectReturn } = useSaleReturns()
const { hasPermission } = usePermission()
const { success: showSuccess, error: showError } = useNotification()

const returnSearch = ref('')
const returnStatus = ref<string | null>(null)
const returnPage = ref(1)
const returnPerPage = ref(15)
const returnSortBy = ref<{ key: string; order: 'asc' | 'desc' }[]>([{ key: 'created_at', order: 'desc' }])
const showReturnFilterDrawer = ref(false)

const returnStatusFilterItems = [
  { title: 'All', value: null },
  { title: 'Pending', value: 'pending' },
  { title: 'Approved', value: 'approved' },
  { title: 'Rejected', value: 'rejected' }
]

const returnFilters = computed(() => ({
  page: returnPage.value,
  per_page: returnPerPage.value,
  search: returnSearch.value || undefined,
  status: returnStatus.value || undefined,
  sort_by: returnSortBy.value[0]?.key ?? 'created_at',
  sort_direction: returnSortBy.value[0]?.order ?? 'desc'
}))

const returnActiveFilterCount = computed(() =>
  [returnStatus.value].filter(v => v !== null && v !== undefined).length
)

const returnActiveFilters = computed(() => {
  const list: { key: string, label: string, clear: () => void }[] = []
  if (returnStatus.value !== null) {
    const item = returnStatusFilterItems.find(i => i.value === returnStatus.value)
    list.push({ key: 'status', label: `Status: ${item?.title ?? returnStatus.value}`, clear: () => { returnStatus.value = null } })
  }
  return list
})

function clearReturnFilters () {
  returnSearch.value = ''
  returnStatus.value = null
}

async function loadReturns () {
  if (!import.meta.client) return
  await fetchSaleReturns(returnFilters.value)
}

onMounted(loadReturns)
watch(returnFilters, loadReturns, { deep: true })

const returnHeaders = [
  { title: 'Return #', key: 'id', sortable: false },
  { title: 'Sale #', key: 'sale.sale_number', sortable: false },
  { title: 'Customer', key: 'sale.customer.name', sortable: false },
  { title: 'Requested By', key: 'user.name', sortable: false },
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
const selectedReturn = ref<SaleReturn | null>(null)
const rejectReason = ref('')
const isProcessing = ref(false)

function openReject (item: SaleReturn) {
  selectedReturn.value = item
  rejectReason.value = ''
  rejectDialog.value = true
}

async function confirmApprove (item: SaleReturn) {
  isProcessing.value = true
  const result = await approveReturn(item.id)
  isProcessing.value = false
  if (result) {
    showSuccess('Return approved and stock restored')
    await loadReturns()
  } else {
    showError(returnsError.value || 'Approval failed')
  }
}

async function confirmReject () {
  if (!selectedReturn.value) return
  isProcessing.value = true
  const result = await rejectReturn(selectedReturn.value.id, rejectReason.value)
  isProcessing.value = false
  rejectDialog.value = false
  previewDialog.value = false
  if (result) {
    showSuccess('Return rejected')
    await loadReturns()
  } else {
    showError(returnsError.value || 'Rejection failed')
  }
}

const previewDialog = ref(false)

function openPreview (item: SaleReturn) {
  selectedReturn.value = item
  previewDialog.value = true
}

function closePreview () {
  previewDialog.value = false
}

async function previewApprove () {
  if (!selectedReturn.value) return
  await confirmApprove(selectedReturn.value)
  previewDialog.value = false
}

function previewReject () {
  rejectDialog.value = true
}

// Voids tab
const { sales: voids, meta: voidsMeta, loading: voidsLoading, error: voidsError, fetchSales } = useSales()

const voidSearch = ref('')
const voidPage = ref(1)
const voidPerPage = ref(15)
const voidSortBy = ref<{ key: string; order: 'asc' | 'desc' }[]>([{ key: 'voided_at', order: 'desc' }])

const voidFilters = computed(() => ({
  page: voidPage.value,
  per_page: voidPerPage.value,
  search: voidSearch.value || undefined,
  status: 'voided',
  sort_by: voidSortBy.value[0]?.key ?? 'voided_at',
  sort_direction: voidSortBy.value[0]?.order ?? 'desc'
}))

const voidHeaders = [
  { title: 'Sale #', key: 'sale_number', sortable: false },
  { title: 'Customer', key: 'customer.name', sortable: false },
  { title: 'Voided By', key: 'voidedBy.name', sortable: false },
  { title: 'Total', key: 'total', sortable: true, align: 'end' },
  { title: 'Reason', key: 'notes', sortable: false },
  { title: 'Voided At', key: 'voided_at', sortable: true }
]

async function loadVoids () {
  if (!import.meta.client) return
  await fetchSales(voidFilters.value)
}

watch(voidFilters, loadVoids, { deep: true })

watch(returnsError, (msg) => { if (msg) showError(msg) })
watch(voidsError, (msg) => { if (msg) showError(msg) })
</script>

<template>
  <AppPageHeader title="Returns & Voids" subtitle="Review return requests and voided sales" />

  <v-tabs v-model="activeTab" color="primary" class="mb-4">
    <v-tab value="returns" prepend-icon="mdi-undo-variant">Return Requests</v-tab>
    <v-tab value="voids" prepend-icon="mdi-cancel">Voided Sales</v-tab>
  </v-tabs>

  <v-tabs-window v-model="activeTab">
    <v-tabs-window-item value="returns">
      <AppCard>
        <v-toolbar color="surface" flat density="comfortable" class="rounded-t-lg">
          <v-text-field
            v-model="returnSearch"
            label="Search returns..."
            prepend-inner-icon="mdi-magnify"
            clearable
            density="compact"
            variant="outlined"
            style="max-width: 400px"
            class="align-self-center me-3"
          />
          <v-select
            v-model="returnStatus"
            label="Status"
            :items="returnStatusFilterItems"
            item-title="title"
            item-value="value"
            clearable
            density="compact"
            variant="outlined"
            style="max-width: 180px"
            class="align-self-center me-4"
          />
          <v-badge
            :content="returnActiveFilterCount"
            :model-value="returnActiveFilterCount > 0"
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
                  @click="showReturnFilterDrawer = true"
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
                :loading="returnsLoading"
                @click="loadReturns"
              />
            </template>
          </v-tooltip>
        </v-toolbar>
        <div v-if="returnActiveFilters.length" class="d-flex flex-wrap ga-1 px-4 pb-2">
          <v-chip
            v-for="f in returnActiveFilters"
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
          v-model:page="returnPage"
          v-model:items-per-page="returnPerPage"
          v-model:sort-by="returnSortBy"
          :headers="returnHeaders"
          :items="saleReturns"
          :items-length="returnsMeta.total"
          :loading="returnsLoading"
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
                  color="primary"
                  variant="tonal"
                  @click="openPreview(item)"
                >
                  View
                </v-btn>
              </template>
              <span v-else class="text-medium-emphasis text-caption">-</span>
            </div>
          </template>
        </AppDataTable>
      </AppCard>

      <v-navigation-drawer v-model="showReturnFilterDrawer" location="right" temporary width="320">
        <v-toolbar color="surface" flat density="comfortable">
          <v-toolbar-title class="text-subtitle-1">Filters</v-toolbar-title>
          <v-spacer />
          <v-btn icon="mdi-close" variant="text" size="small" @click="showReturnFilterDrawer = false" />
        </v-toolbar>
        <v-divider />
        <div class="pa-4">
          <div class="text-subtitle-2 mb-2">Status</div>
          <v-select
            v-model="returnStatus"
            label="Status"
            :items="returnStatusFilterItems"
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
            :disabled="returnActiveFilterCount === 0 && !returnSearch"
            @click="clearReturnFilters"
          >
            Clear All
          </v-btn>
        </div>
      </v-navigation-drawer>
    </v-tabs-window-item>

    <v-tabs-window-item value="voids">
      <AppCard>
        <v-toolbar color="surface" flat density="comfortable" class="rounded-t-lg">
          <v-text-field
            v-model="voidSearch"
            label="Search voids..."
            prepend-inner-icon="mdi-magnify"
            clearable
            density="compact"
            variant="outlined"
            style="max-width: 400px"
            class="align-self-center me-3"
          />
          <v-spacer />
          <v-tooltip text="Refresh" location="top">
            <template #activator="{ props: tipProps }">
              <v-btn
                v-bind="tipProps"
                icon="mdi-refresh"
                variant="text"
                size="small"
                aria-label="Refresh"
                :loading="voidsLoading"
                @click="loadVoids"
              />
            </template>
          </v-tooltip>
        </v-toolbar>
        <v-divider />
        <AppDataTable
          v-model:page="voidPage"
          v-model:items-per-page="voidPerPage"
          v-model:sort-by="voidSortBy"
          :headers="voidHeaders"
          :items="voids"
          :items-length="voidsMeta.total"
          :loading="voidsLoading"
          empty-text="No voided sales found"
        >
          <template #item.customer.name="{ item }">
            {{ item.customer?.name ?? 'Walk-in' }}
          </template>

          <template #item.voidedBy.name="{ item }">
            {{ item.voidedBy?.name ?? '-' }}
          </template>

          <template #item.total="{ item }">
            {{ formatAmount(item.total) }}
          </template>

          <template #item.notes="{ item }">
            <span class="text-truncate d-inline-block" style="max-width: 240px">
              {{ item.notes ? item.notes.replace(/^Void reason: /, '') : '-' }}
            </span>
          </template>

          <template #item.voided_at="{ item }">
            {{ item.voided_at ? new Date(item.voided_at).toLocaleString() : '-' }}
          </template>
        </AppDataTable>
      </AppCard>
    </v-tabs-window-item>
  </v-tabs-window>

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
    title="Return Request Preview"
    :subtitle="selectedReturn ? `Return #${selectedReturn.id} — ${selectedReturn.sale?.sale_number}` : ''"
    icon="mdi-clipboard-text"
    max-width="900"
    scrollable
  >
    <v-card-text v-if="selectedReturn">
      <div class="d-flex justify-space-between py-1">
        <span class="text-caption text-medium-emphasis">Customer</span>
        <span class="font-weight-medium">{{ selectedReturn.sale?.customer?.name ?? 'Walk-in' }}</span>
      </div>
      <div class="d-flex justify-space-between py-1">
        <span class="text-caption text-medium-emphasis">Requested By</span>
        <span class="font-weight-medium">{{ selectedReturn.user?.name ?? '-' }}</span>
      </div>
      <div class="d-flex justify-space-between py-1">
        <span class="text-caption text-medium-emphasis">Date</span>
        <span class="font-weight-medium">{{ new Date(selectedReturn.created_at ?? '').toLocaleString() }}</span>
      </div>
      <div class="d-flex justify-space-between py-1">
        <span class="text-caption text-medium-emphasis">Total Refund</span>
        <span class="font-weight-medium text-primary">{{ formatAmount(selectedReturn.returned_total) }}</span>
      </div>

      <div v-if="selectedReturn.notes" class="mt-2">
        <div class="text-caption text-medium-emphasis">Reason / Notes</div>
        <div class="text-body-2">{{ selectedReturn.notes }}</div>
      </div>

      <v-divider class="my-4" />
      <div class="text-subtitle-2 mb-2">Items to Return</div>
      <div style="max-height: 280px; overflow-y: auto;">
        <v-card
          v-for="(i, index) in selectedReturn.items"
          :key="i.id"
          variant="outlined"
          class="mb-2"
        >
          <v-card-text class="pa-3">
            <div class="d-flex justify-space-between align-center mb-1">
              <span class="text-body-2 font-weight-medium">{{ index + 1 }}. {{ i.product?.name ?? i.description ?? '-' }}</span>
              <span class="text-body-2 font-weight-medium">{{ formatAmount(i.total) }}</span>
            </div>
            <div class="text-caption text-medium-emphasis">
              {{ i.quantity }} × {{ formatAmount(i.unit_price) }}
              <span v-if="i.serials && i.serials.length"> · Serials: {{ i.serials.join(', ') }}</span>
            </div>
          </v-card-text>
        </v-card>
      </div>
    </v-card-text>
    <v-card-actions class="pa-4 pt-0">
      <v-spacer />
      <v-btn variant="text" @click="closePreview">Close</v-btn>
      <template v-if="selectedReturn?.status === 'pending'">
        <v-btn
          color="error"
          variant="tonal"
          :loading="isProcessing"
          @click="previewReject"
        >
          Reject
        </v-btn>
        <v-btn
          color="success"
          :loading="isProcessing"
          @click="previewApprove"
        >
          Approve
        </v-btn>
      </template>
    </v-card-actions>
  </AppDialog>
</template>
