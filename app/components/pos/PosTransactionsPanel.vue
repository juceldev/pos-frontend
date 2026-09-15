<script setup lang="ts">
import { formatAmount } from '~/utils/format'
import { useDisplay } from 'vuetify'
import type { Sale } from '~/types/sale'
import { usePermission } from '~/composables/usePermission'
import { useSales } from '~/composables/useSales'
import AppDataTable from '~/components/ui/AppDataTable.vue'
import { useNotification } from '~/composables/useNotification'

interface Props {
  modelValue: boolean
  defaultTab?: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const dialog = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const { sales, meta, loading, error, fetchSales, fetchSale, voidSale, returnSale } = useSales()
const { success: showSuccess, error: showError } = useNotification()
const { hasPermission } = usePermission()
const { smAndDown } = useDisplay()

const search = ref('')
const dateFrom = ref<string | null>(null)
const dateTo = ref<string | null>(null)
const page = ref(1)
const perPage = ref(15)
const activeTab = ref(props.defaultTab ?? 'all')

watch(dialog, async (open) => {
  if (open) {
    activeTab.value = props.defaultTab ?? 'all'
    await load()
  }
})

const tabs = [
  { title: 'All', value: 'all', status: null },
  { title: 'Completed', value: 'completed', status: 'completed' },
  { title: 'Voided', value: 'voided', status: 'voided' },
  { title: 'Partially Returned', value: 'partially_returned', status: 'partially_returned' },
  { title: 'Returned', value: 'returned', status: 'returned' }
]

const filters = computed(() => ({
  page: page.value,
  per_page: perPage.value,
  search: search.value || undefined,
  status: tabs.find(t => t.value === activeTab.value)?.status || undefined,
  date_from: dateFrom.value || undefined,
  date_to: dateTo.value || undefined,
  sort_by: 'created_at',
  sort_direction: 'desc'
}))

const headers = [
  { title: 'Sale #', key: 'sale_number', sortable: false },
  { title: 'Customer', key: 'customer.name', sortable: false },
  { title: 'Total', key: 'total', sortable: false, align: 'end' as const },
  { title: 'Status', key: 'status', sortable: false },
  { title: 'Date', key: 'created_at', sortable: false },
  { title: 'Actions', key: 'actions', sortable: false, align: 'end' as const, width: '240px' }
]

const selectedSale = ref<Sale | null>(null)
const showReceipt = ref(false)
const showReturn = ref(false)
const showVoid = ref(false)

async function load () {
  await fetchSales(filters.value)
}

watch(filters, () => {
  load()
}, { deep: true })

function viewSale (sale: Sale) {
  selectedSale.value = sale
  showReceipt.value = true
}

function openReturn (sale: Sale) {
  selectedSale.value = sale
  showReturn.value = true
}

function openVoid (sale: Sale) {
  selectedSale.value = sale
  showVoid.value = true
}

async function onReturn (data: any) {
  if (!selectedSale.value) return
  const result = await returnSale(selectedSale.value.id, data)
  if (result) {
    showSuccess('Return request submitted for manager approval')
    await load()
  } else if (error.value) {
    showError(error.value)
  }
}

async function onVoid (reason: string) {
  if (!selectedSale.value) return
  const result = await voidSale(selectedSale.value.id, reason)
  if (result) {
    showSuccess('Sale voided')
    await load()
  } else if (error.value) {
    showError(error.value)
  }
}

function statusColor (status: string): string {
  switch (status) {
    case 'completed':
      return 'success'
    case 'voided':
      return 'error'
    case 'partially_returned':
      return 'warning'
    case 'returned':
      return 'info'
    default:
      return 'default'
  }
}

function canReturn (sale: Sale): boolean {
  if (sale.status === 'voided' || sale.status === 'returned') return false
  return sale.items?.some(item => {
    const returned = Number(item.returned_quantity ?? 0)
    const pending = Number(item.pending_quantity ?? 0)
    const qty = Number(item.quantity ?? 0)
    return (returned + pending) < qty
  }) ?? false
}

function hasPendingReturn (sale: Sale): boolean {
  return sale.items?.some(item => Number(item.pending_quantity ?? 0) > 0) ?? false
}

function hasApprovedReturn (sale: Sale): boolean {
  return Number(sale.returned_total ?? 0) > 0
}

function printReceipt () {
  window.print()
}

onMounted(load)
</script>

<template>
  <AppDialog
    v-model="dialog"
    title="Transactions"
    subtitle="View, print, return, or void a sale"
    icon="mdi-receipt-text"
    max-width="1200"
    scrollable
    persistent
  >
    <v-card-text class="pt-2 pb-4">
      <v-row dense class="mb-2">
        <v-col cols="12" sm="5" md="5">
          <v-text-field
            v-model="search"
            placeholder="Search sale # or customer"
            prepend-inner-icon="mdi-magnify"
            variant="outlined"
            density="compact"
            clearable
            hide-details
          />
        </v-col>
        <v-col cols="12" sm="3" md="3">
          <v-select
            v-model="activeTab"
            :items="tabs"
            item-title="title"
            item-value="value"
            label="Status"
            variant="outlined"
            density="compact"
            hide-details
          />
        </v-col>
        <v-col cols="6" sm="2" md="2" style="min-width: 0;">
          <v-text-field
            v-model="dateFrom"
            label="From"
            type="date"
            variant="outlined"
            density="compact"
            hide-details
            class="pos-tx-date"
          />
        </v-col>
        <v-col cols="6" sm="2" md="2" style="min-width: 0;">
          <v-text-field
            v-model="dateTo"
            label="To"
            type="date"
            variant="outlined"
            density="compact"
            hide-details
            class="pos-tx-date"
          />
        </v-col>
      </v-row>

      <AppDataTable
        v-model:page="page"
        v-model:items-per-page="perPage"
        :headers="headers"
        :items="sales"
        :items-length="meta.total"
        :loading="loading"
        height="360"
      >
        <template #item.customer.name="{ item }">
          {{ item.customer?.name ?? 'Walk-in' }}
        </template>

        <template #item.total="{ item }">
          {{ formatAmount(item.total) }}
        </template>

        <template #item.status="{ item }">
          <v-chip
            size="small"
            :color="item.status === 'partially_returned' && hasApprovedReturn(item) ? 'info' : statusColor(item.status ?? '')"
            variant="tonal"
          >
            {{ item.status === 'partially_returned' && hasApprovedReturn(item) ? 'Return Approved' : (item.status ?? '—') }}
          </v-chip>
        </template>

        <template #item.created_at="{ item }">
          {{ new Date(item.created_at ?? '').toLocaleString() }}
        </template>

        <template #item.actions="{ item }">
          <div class="d-flex justify-end ga-2 align-center">
            <div class="d-flex align-center">
              <v-btn
                icon="mdi-receipt-text"
                :size="smAndDown ? 'default' : 'small'"
                density="comfortable"
                variant="tonal"
                color="primary"
                @click.stop="viewSale(item)"
              />
              <span class="d-none d-sm-inline text-caption ml-1">Receipt</span>
            </div>
            <div v-if="hasPermission('sales.edit') && canReturn(item)" class="d-flex align-center">
              <v-btn
                icon="mdi-undo-variant"
                :size="smAndDown ? 'default' : 'small'"
                density="comfortable"
                variant="tonal"
                color="warning"
                @click.stop="openReturn(item)"
              />
              <span class="d-none d-sm-inline text-caption ml-1">Return</span>
            </div>
            <div v-if="hasPermission('sales.delete') && item.status !== 'voided'" class="d-flex align-center">
              <v-btn
                icon="mdi-close-circle"
                :size="smAndDown ? 'default' : 'small'"
                density="comfortable"
                variant="tonal"
                color="error"
                @click.stop="openVoid(item)"
              />
              <span class="d-none d-sm-inline text-caption ml-1">Void</span>
            </div>
          </div>
        </template>
      </AppDataTable>
    </v-card-text>
  </AppDialog>

  <ReceiptDialog
    v-model="showReceipt"
    :sale="selectedSale"
    @print="printReceipt"
    @new-sale="showReceipt = false"
  />

  <ReturnDialog
    v-model="showReturn"
    :sale="selectedSale"
    @submit="onReturn"
  />

  <VoidDialog
    v-model="showVoid"
    :sale="selectedSale"
    @submit="onVoid"
  />
</template>

<style scoped>
.gap-2 {
  gap: 8px;
}

.pos-tx-date :deep(input[type="date"]) {
  min-width: 0;
  width: 100%;
}
</style>
