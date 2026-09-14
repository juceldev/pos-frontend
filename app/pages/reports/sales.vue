<script setup lang="ts">
import { formatAmount } from '~/utils/format'
import { useReports } from '~/composables/useReports'
import type { Sale } from '~/types/sale'

definePageMeta({
  middleware: 'auth'
})

const { loading, error, fetchSalesReport } = useReports()

const dateFrom = ref(new Date().toISOString().split('T')[0])
const dateTo = ref(new Date().toISOString().split('T')[0])
const report = ref<Awaited<ReturnType<typeof fetchSalesReport>>>(null)

const search = ref('')
const statusFilter = ref<string | null>(null)

const statusItems = [
  { title: 'All', value: null },
  { title: 'Completed', value: 'completed' },
  { title: 'Partially Returned', value: 'partially_returned' },
  { title: 'Returned', value: 'returned' },
  { title: 'Voided', value: 'voided' }
]

const allSales = computed<Sale[]>(() => report.value?.sales ?? [])
const totals = computed(() => report.value?.totals ?? { total: 0, count: 0 })

const filteredSales = computed(() => {
  let list = allSales.value
  if (search.value) {
    const q = search.value.toLowerCase()
    list = list.filter(s =>
      (s.sale_number ?? '').toLowerCase().includes(q) ||
      (s.customer?.name ?? '').toLowerCase().includes(q) ||
      (s.payment_type?.name ?? '').toLowerCase().includes(q)
    )
  }
  if (statusFilter.value) {
    list = list.filter(s => s.status === statusFilter.value)
  }
  return list
})

const activeFilters = computed(() => {
  const list: { key: string, label: string, clear: () => void }[] = []
  if (statusFilter.value) {
    const item = statusItems.find(i => i.value === statusFilter.value)
    list.push({ key: 'status', label: `Status: ${item?.title ?? statusFilter.value}`, clear: () => { statusFilter.value = null } })
  }
  return list
})

async function load () {
  report.value = await fetchSalesReport({
    date_from: dateFrom.value,
    date_to: dateTo.value
  })
}

onMounted(load)
</script>

<template>
  <div>
    <AppPageHeader title="Sales Report" subtitle="Sales performance by date range" />

    <AppCard class="rounded-lg" elevation="1">
      <v-row dense class="pa-3 align-center">
        <v-col cols="12" sm="6" md="3">
          <v-text-field
            v-model="search"
            label="Search sales..."
            prepend-inner-icon="mdi-magnify"
            clearable
            density="compact"
            variant="outlined"
            hide-details
          />
        </v-col>
        <v-col cols="12" sm="6" md="2">
          <v-select
            v-model="statusFilter"
            label="Status"
            :items="statusItems"
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
            label="From"
            type="date"
            density="compact"
            variant="outlined"
            hide-details
          />
        </v-col>
        <v-col cols="6" sm="3" md="2">
          <v-text-field
            v-model="dateTo"
            label="To"
            type="date"
            density="compact"
            variant="outlined"
            hide-details
          />
        </v-col>
        <v-col cols="12" md="auto" class="d-flex justify-end">
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

      <div v-if="report" class="pa-4 pb-0">
        <v-row dense>
          <v-col cols="6" sm="3">
            <AppStatCard
              title="Total Sales"
              :value="formatAmount(totals.total)"
              color="primary"
              icon="mdi-cash"
            />
          </v-col>
          <v-col cols="6" sm="3">
            <AppStatCard
              title="Transactions"
              :value="totals.count"
              color="success"
              icon="mdi-swap-horizontal"
            />
          </v-col>
          <v-col cols="6" sm="3">
            <AppStatCard
              title="Filtered"
              :value="filteredSales.length"
              color="info"
              icon="mdi-filter-variant"
            />
          </v-col>
          <v-col cols="6" sm="3">
            <AppStatCard
              title="Avg Sale"
              :value="formatAmount(totals.count > 0 ? totals.total / totals.count : 0)"
              color="secondary"
              icon="mdi-calculator"
            />
          </v-col>
        </v-row>
      </div>

      <AppDataTable
        :headers="[
          { title: 'Date', key: 'created_at', width: '180px' },
          { title: 'Sale #', key: 'sale_number', width: '130px' },
          { title: 'Customer', key: 'customer.name' },
          { title: 'Payment', key: 'payment_type.name', width: '10px' },
          { title: 'Subtotal', key: 'subtotal', align: 'end' },
          { title: 'Tax', key: 'tax', align: 'end' },
          { title: 'Total', key: 'total', align: 'end' },
          { title: 'Status', key: 'status', width: '120px' },
        ]"
        :items="filteredSales"
        :items-length="filteredSales.length"
        :loading="loading"
        :page="1"
        :items-per-page="filteredSales.length"
        empty-text="No sales found"
        class="mt-2"
      >
        <template #item.customer.name="{ item }">
          {{ item.customer?.name ?? 'Walk-in' }}
        </template>
        <template #item.payment_type.name="{ item }">
          {{ item.payment_type?.name ?? '—' }}
        </template>
        <template #item.subtotal="{ item }">
          {{ formatAmount(item.subtotal) }}
        </template>
        <template #item.tax="{ item }">
          {{ formatAmount(item.tax) }}
        </template>
        <template #item.total="{ item }">
          {{ formatAmount(item.total) }}
        </template>
        <template #item.status="{ item }">
          <v-chip size="x-small" :color="item.status === 'completed' ? 'success' : item.status === 'voided' ? 'error' : 'warning'">
            {{ item.status }}
          </v-chip>
        </template>
        <template #item.created_at="{ item }">
          {{ new Date(item.created_at).toLocaleString() }}
        </template>
      </AppDataTable>

      <v-alert v-if="error" type="error" class="ma-4">{{ error }}</v-alert>
    </AppCard>
  </div>
</template>
