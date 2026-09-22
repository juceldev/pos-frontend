<script setup lang="ts">
import type { ExpenseTrendPoint, SalesTrendPoint } from '~/types/report'
import { formatAmount } from '~/utils/format'
import { useDisplay } from 'vuetify'

interface Props {
  income: SalesTrendPoint[]
  expenses: ExpenseTrendPoint[]
}

const props = defineProps<Props>()

const { mdAndUp } = useDisplay()
const chartHeight = computed(() => mdAndUp.value ? 260 : 220)

const dates = computed(() => {
  const set = new Set<string>([
    ...props.income.map(d => d.date),
    ...props.expenses.map(d => d.date)
  ])
  return [...set].sort()
})

const series = computed(() => [
  {
    name: 'Income',
    data: dates.value.map(d => props.income.find(i => i.date === d)?.total ?? 0)
  },
  {
    name: 'Expenses',
    data: dates.value.map(d => props.expenses.find(e => e.date === d)?.total ?? 0)
  }
])

const options = computed(() => ({
  chart: { type: 'bar' as const, stacked: false, toolbar: { show: false } },
  plotOptions: { bar: { columnWidth: '55%', borderRadius: 3 } },
  xaxis: { categories: dates.value, labels: { format: 'MMM dd' } },
  yaxis: { labels: { formatter: (val: number) => formatAmount(val) } },
  tooltip: { y: { formatter: (val: number) => formatAmount(val) } },
  dataLabels: { enabled: false },
  legend: { position: 'top' as const, horizontalAlign: 'right' as const },
  colors: ['#2E7D32', '#D32F2F'],
  grid: { padding: { left: 0, right: 0 } }
}))
</script>

<template>
  <div class="dash-card">
    <div class="dash-card-header">Income vs Expenses</div>
    <div class="dash-card-body">
      <AppChart type="bar" :series="series" :options="options" :height="chartHeight" />
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
