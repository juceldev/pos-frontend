<script setup lang="ts">
import type { CategorySalesPoint } from '~/types/report'
import { formatAmount } from '~/utils/format'
import { useDisplay } from 'vuetify'

interface Props {
  data: CategorySalesPoint[]
}

const props = defineProps<Props>()

const { mdAndUp } = useDisplay()
const chartHeight = computed(() => mdAndUp.value ? 260 : 220)

const series = computed(() => [
  { name: 'Sales', data: props.data.map(d => Math.round(d.total)) }
])

const options = computed(() => ({
  chart: { type: 'bar' as const },
  plotOptions: { bar: { borderRadius: 4, columnWidth: '60%' } },
  xaxis: {
    categories: props.data.map(d => d.name),
    labels: { rotate: -45, rotateAlways: false }
  },
  yaxis: { labels: { formatter: (val: number) => formatAmount(val) } },
  tooltip: { y: { formatter: (val: number) => formatAmount(val) } },
  colors: ['#2196F3']
}))
</script>

<template>
  <div class="dash-card">
    <div class="dash-card-header">Sales by Category</div>
    <div class="dash-card-body">
      <AppChart v-if="data.length" type="bar" :series="series" :options="options" :height="chartHeight" />
      <AppEmptyState v-else title="No category data" />
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
  min-height: 260px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
