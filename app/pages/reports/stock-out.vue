<script setup lang="ts">
import { formatAmount } from '~/utils/format'
import { useReports } from '~/composables/useReports'
import type { StockMovement } from '~/types/stock'

definePageMeta({
  middleware: 'auth'
})

const { loading, error, pdfDialog, pdfUrl, pdfTitle, fetchStockOutReport, openStockOutReportPdf } = useReports()

const dateFrom = ref(new Date().toISOString().split('T')[0])
const dateTo = ref(new Date().toISOString().split('T')[0])
const page = ref(1)
const perPage = ref(15)
const movements = ref<StockMovement[]>([])
const meta = ref({ total: 0 })

const search = ref('')

async function load () {
  const response = await fetchStockOutReport({
    date_from: dateFrom.value,
    date_to: dateTo.value,
    search: search.value || undefined,
    page: page.value,
    per_page: perPage.value
  })
  if (response) {
    movements.value = response.data ?? []
    meta.value = { total: response.meta.total }
  }
}

let searchTimeout: ReturnType<typeof setTimeout> | null = null
watch(search, () => {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    page.value = 1
    load()
  }, 400)
})

watch([dateFrom, dateTo, page, perPage], load)
onMounted(load)
</script>

<template>
  <div>
    <AppPageHeader title="Stock-Out Logs" subtitle="Outbound stock movements by date" />

    <AppCard class="rounded-lg" elevation="1">
      <v-row dense class="pa-3 align-center">
        <v-col cols="12" sm="6" md="4">
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
        <v-col cols="12" md="auto" class="d-flex justify-end gap-2">
          <v-btn
            color="primary"
            prepend-icon="mdi-file-pdf-box"
            size="small"
            @click="openStockOutReportPdf(dateFrom, dateTo)"
          >
            <span class="d-none d-sm-inline">Generate PDF</span>
            <v-icon class="d-sm-none" />
          </v-btn>
          <v-btn
            prepend-icon="mdi-refresh"
            variant="text"
            size="small"
            :loading="loading"
            @click="load"
          >
            Refresh
          </v-btn>
        </v-col>
      </v-row>
      <v-divider />

      <AppDataTable
        v-model:page="page"
        v-model:items-per-page="perPage"
        :headers="[
          { title: 'Date', key: 'created_at', width: '180px' },
          { title: 'Product', key: 'product.name' },
          { title: 'Qty', key: 'quantity', align: 'end', width: '80px' },
          { title: 'Unit Cost', key: 'unit_cost', align: 'end', width: '120px' },
          { title: 'Reference', key: 'reference' },
          { title: 'By', key: 'user.name', width: '140px' }
        ]"
        :items="movements"
        :items-length="meta.total"
        :loading="loading"
        empty-text="No stock-out records found"
        class="mt-2"
      >
        <template #item.product.name="{ item }">
          {{ item.product?.name ?? '—' }}
        </template>
        <template #item.user.name="{ item }">
          {{ item.user?.name ?? '—' }}
        </template>
        <template #item.quantity="{ item }">
          {{ Math.abs(item.quantity) }}
        </template>
        <template #item.unit_cost="{ item }">
          {{ formatAmount(item.unit_cost) }}
        </template>
        <template #item.created_at="{ item }">
          {{ new Date(item.created_at).toLocaleString() }}
        </template>
      </AppDataTable>

      <v-alert v-if="error" type="error" class="ma-4">{{ error }}</v-alert>
    </AppCard>

    <PdfPreviewDialog v-model="pdfDialog" :url="pdfUrl" :title="pdfTitle" />
  </div>
</template>
