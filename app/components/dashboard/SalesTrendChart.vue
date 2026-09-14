<script setup lang="ts">
import type { SalesTrendPoint } from '~/types/report'
import { formatAmount } from '~/utils/format'
import { useDisplay } from 'vuetify'

interface Props {
  data: SalesTrendPoint[]
}

const props = defineProps<Props>()

const { mdAndUp } = useDisplay()
const chartHeight = computed(() => mdAndUp.value ? 260 : 200)

const series = computed(() => [
  {
    name: 'Sales',
    data: props.data.map(d => ({ x: d.date, y: d.total }))
  }
])

const options = computed(() => ({
  chart: { type: 'area' as const, sparkline: { enabled: false } },
  stroke: { curve: 'smooth' as const, width: 2 },
  fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0.05 } },
  xaxis: { type: 'category' as const, labels: { format: 'MMM dd' } },
  yaxis: { labels: { formatter: (val: number) => formatAmount(val) } },
  tooltip: { y: { formatter: (val: number) => formatAmount(val) } },
  colors: ['#1976D2'],
  grid: { padding: { left: 0, right: 0 } }
}))
</script>

<template>
  <div class="dash-card">
    <div class="dash-card-header">Sales Trend</div>
    <div class="dash-card-body">
      <AppChart type="area" :series="series" :options="options" :height="chartHeight" />
    </div>
  </div>
</template>

<style scoped>
.dash-card {
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  border-radius: 8px;
  overflow: hidden;
}
.dash-card-header {
  padding: 10px 14px;
  font-weight: 600;
  font-size: 0.875rem;
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}
.dash-card-body {
  padding: 8px 4px 0;
}
</style>
