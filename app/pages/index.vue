<script setup lang="ts">
import type { AnalyticsData } from '~/types/report'
import { useReports } from '~/composables/useReports'

definePageMeta({
  middleware: 'auth'
})

const { fetchAnalytics } = useReports()

const range = ref<'today' | '7d' | '30d' | 'custom'>('7d')
const customFrom = ref(new Date().toISOString().split('T')[0])
const customTo = ref(new Date().toISOString().split('T')[0])
const data = ref<AnalyticsData | null>(null)
const loading = ref(false)

const rangeOptions = [
  { title: 'Today', value: 'today' },
  { title: '7D', value: '7d' },
  { title: '30D', value: '30d' },
  { title: 'Custom', value: 'custom' }
]

async function load () {
  loading.value = true
  const from = range.value === 'custom' ? customFrom.value : undefined
  const to = range.value === 'custom' ? customTo.value : undefined
  data.value = await fetchAnalytics(range.value, from, to)
  loading.value = false
}

watch(range, () => {
  if (range.value !== 'custom') load()
})

onMounted(load)
</script>

<template>
  <div class="dash-page">
    <!-- Header bar -->
    <div class="dash-header">
      <div>
        <h1 class="dash-title">Dashboard</h1>
        <p class="dash-subtitle">{{ data?.range.label ?? 'Business analytics overview' }}</p>
      </div>
      <div class="dash-controls">
        <v-btn-toggle v-model="range" mandatory density="compact" color="primary" divided>
          <v-btn v-for="opt in rangeOptions" :key="opt.value" :value="opt.value" size="x-small" class="px-2">
            {{ opt.title }}
          </v-btn>
        </v-btn-toggle>
        <template v-if="range === 'custom'">
          <v-text-field v-model="customFrom" type="date" density="compact" hide-details variant="outlined" class="dash-date" />
          <v-text-field v-model="customTo" type="date" density="compact" hide-details variant="outlined" class="dash-date" />
          <v-btn color="primary" size="small" :loading="loading" @click="load">Go</v-btn>
        </template>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="dash-loading">
      <v-progress-circular indeterminate color="primary" size="40" />
    </div>

    <template v-else-if="data">
      <!-- Stat cards -->
      <DashboardStatCards :summary="data.summary" />

      <!-- Sales trend + Category sales -->
      <div class="dash-grid-2-1">
        <SalesTrendChart :data="data.sales_trend" />
        <CategorySalesChart :data="data.category_sales" />
      </div>

      <!-- Two columns -->
      <div class="dash-grid-2">
        <PaymentBreakdownChart :data="data.payment_breakdown" />
        <TopProductsChart :data="data.top_products" />
      </div>

      <!-- Bottom row -->
      <div class="dash-grid-2-3">
        <RecentTransactions :sales="data.recent_transactions" />
        <InventoryAlerts :products="data.low_stock_products" />
      </div>
    </template>

    <AppEmptyState v-else title="No data available" icon="mdi-chart-box-outline" />
  </div>
</template>

<style scoped>
.dash-page {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.dash-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 4px;
}

.dash-title {
  font-size: 1.5rem;
  font-weight: 700;
  line-height: 1.2;
}

.dash-subtitle {
  font-size: 0.8rem;
  color: rgba(var(--v-theme-on-surface), 0.6);
  margin: 0;
}

.dash-controls {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.dash-date {
  max-width: 140px;
}

.dash-loading {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 48px 0;
}

.dash-grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.dash-grid-2-1 {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 12px;
}

.dash-grid-2-3 {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 12px;
}

/* Tablet */
@media (max-width: 960px) {
  .dash-grid-2,
  .dash-grid-2-1,
  .dash-grid-2-3 {
    grid-template-columns: 1fr;
  }
}

/* Mobile */
@media (max-width: 600px) {
  .dash-page {
    gap: 8px;
  }

  .dash-header {
    flex-direction: column;
    align-items: stretch;
  }

  .dash-controls {
    justify-content: center;
  }

  .dash-date {
    max-width: 100%;
    flex: 1;
  }

  .dash-title {
    font-size: 1.25rem;
  }
}
</style>
