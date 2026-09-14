<script setup lang="ts">
import { formatAmount } from '~/utils/format'
import { useStockMovements } from '~/composables/useStockMovements'

definePageMeta({
  middleware: 'auth'
})

const { stockMovements, meta, loading, error, fetchStockMovements } = useStockMovements()
const { error: showError } = useNotification()

const search = ref('')
const type = ref<'in' | 'out' | 'adjustment' | null>(null)
const dateFrom = ref<string | null>(null)
const dateTo = ref<string | null>(null)
const page = ref(1)
const perPage = ref(15)
const sortBy = ref<{ key: string; order: 'asc' | 'desc' }[]>([{ key: 'created_at', order: 'desc' }])

const typeFilterItems = [
  { title: 'All', value: null },
  { title: 'Stock In', value: 'in' },
  { title: 'Stock Out', value: 'out' },
  { title: 'Adjustment', value: 'adjustment' }
]

const filters = computed(() => ({
  page: page.value,
  perPage: perPage.value,
  search: search.value || undefined,
  type: type.value || undefined,
  dateFrom: dateFrom.value || undefined,
  dateTo: dateTo.value || undefined,
  sortBy: sortBy.value[0]?.key,
  sortDirection: sortBy.value[0]?.order
}))

const activeFilterCount = computed(() =>
  [type.value, dateFrom.value, dateTo.value]
    .filter(v => v !== null && v !== undefined).length
)

const activeFilters = computed(() => {
  const list: { key: string, label: string, clear: () => void }[] = []

  if (type.value !== null) {
    const item = typeFilterItems.find(i => i.value === type.value)
    list.push({ key: 'type', label: `Type: ${item?.title ?? type.value}`, clear: () => { type.value = null } })
  }
  if (dateFrom.value) {
    list.push({ key: 'dateFrom', label: `From: ${dateFrom.value}`, clear: () => { dateFrom.value = null } })
  }
  if (dateTo.value) {
    list.push({ key: 'dateTo', label: `To: ${dateTo.value}`, clear: () => { dateTo.value = null } })
  }

  return list
})

function clearAllFilters () {
  search.value = ''
  type.value = null
  dateFrom.value = null
  dateTo.value = null
}

async function load () {
  if (!import.meta.client) return
  await fetchStockMovements(filters.value)
}

onMounted(load)
watch(filters, load, { deep: true })

watch(error, (msg) => {
  if (msg) showError(msg)
})

const headers = [
  { title: 'Date', key: 'created_at', sortable: true, minWidth: '180px' },
  { title: 'Product', key: 'product.name', sortable: false, minWidth: '180px' },
  { title: 'Type', key: 'type', sortable: false, align: 'center' },
  { title: 'Qty', key: 'quantity', sortable: true, align: 'end' },
  { title: 'Unit Cost', key: 'unit_cost', sortable: true, align: 'end' },
  { title: 'Total', key: 'total', sortable: false, align: 'end' },
  { title: 'Reference', key: 'reference', sortable: false },
  { title: 'Remarks', key: 'remarks', sortable: false },
  // { title: 'Created By', key: 'user.name', sortable: false }
]

function typeLabel (value: string) {
  return {
    in: 'Stock In',
    out: 'Stock Out',
    adjustment: 'Adjustment'
  }[value] ?? value
}

function typeColor (value: string) {
  return {
    in: 'success',
    out: 'error',
    adjustment: 'warning'
  }[value] ?? 'default'
}

function totalAmount (item: any) {
  const qty = Number(item.quantity ?? 0)
  const cost = Number(item.product?.cost_price ?? 0)
  return formatAmount(qty * cost)
}
</script>

<template>
  <div class="stock-movements-page">
    <AppPageHeader title="Stock Movements" subtitle="Track stock in, out and adjustments" />

    <AppCard class="rounded-lg" elevation="1">
      <v-row dense class="pa-3 align-center">
        <v-col cols="12" sm="6" md="3">
          <v-text-field
            v-model="search"
            label="Search..."
            prepend-inner-icon="mdi-magnify"
            clearable
            density="compact"
            variant="outlined"
            hide-details
          />
        </v-col>
        <v-col cols="6" sm="3" md="2">
          <v-select
            v-model="type"
            label="Type"
            :items="typeFilterItems"
            item-title="title"
            item-value="value"
            clearable
            density="compact"
            variant="outlined"
            hide-details
          />
        </v-col>
        <v-col cols="6" sm="3" md="2">
          <v-text-field
            v-model="dateFrom"
            label="Date From"
            type="date"
            clearable
            density="compact"
            variant="outlined"
            hide-details
          />
        </v-col>
        <v-col cols="6" sm="3" md="2">
          <v-text-field
            v-model="dateTo"
            label="Date To"
            type="date"
            clearable
            density="compact"
            variant="outlined"
            hide-details
          />
        </v-col>
        <v-col cols="12" md="auto" class="d-flex justify-end align-center ga-1">
          <v-badge
            :content="activeFilterCount"
            :model-value="activeFilterCount > 0"
            color="primary"
            offset-x="8"
            offset-y="8"
          >
            <v-tooltip text="Clear Filters" location="top">
              <template #activator="{ props: tipProps }">
                <v-btn
                  v-bind="tipProps"
                  icon="mdi-filter-remove"
                  variant="outlined"
                  size="small"
                  aria-label="Clear Filters"
                  @click="clearAllFilters"
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
        </v-col>
      </v-row>

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
        :items="stockMovements"
        :items-length="meta.total"
        :loading="loading"
        item-value="id"
        empty-text="No stock movements found"
      >
        <template #item.created_at="{ item }">
          {{ item.created_at ? new Date(item.created_at).toLocaleString() : '—' }}
        </template>

        <template #item.product.name="{ item }">
          {{ item.product?.name ?? '—' }}
        </template>

        <template #item.type="{ item }">
          <v-chip
            :color="typeColor(item.type)"
            size="small"
            variant="tonal"
          >
            {{ typeLabel(item.type) }}
          </v-chip>
        </template>

        <template #item.quantity="{ item }">
          <span :class="{ 'text-error font-weight-bold': item.type === 'out' }">
            {{ item.quantity }}
          </span>
        </template>

        <template #item.unit_cost="{ item }">
          {{ formatAmount(item.product?.cost_price ?? 0) }}
        </template>

        <template #item.total="{ item }">
          {{ totalAmount(item) }}
        </template>

        <template #item.reference="{ item }">
          {{ item.reference || '—' }}
        </template>

        <template #item.remarks="{ item }">
          {{ item.remarks || '—' }}
        </template>

        <template #item.user.name="{ item }">
          {{ item.user?.name ?? '—' }}
        </template>
      </AppDataTable>
    </AppCard>
  </div>
</template>
