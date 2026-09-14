<script setup lang="ts">
import type { PaymentBreakdownPoint } from '~/types/report'
import { formatAmount } from '~/utils/format'
import { useDisplay } from 'vuetify'

interface Props {
  data: PaymentBreakdownPoint[]
}

const props = defineProps<Props>()

const { mdAndUp } = useDisplay()
const chartHeight = computed(() => mdAndUp.value ? 260 : 220)

const series = computed(() => props.data.map(d => d.total))
const labels = computed(() => props.data.map(d => d.name))

const options = computed(() => ({
  chart: { type: 'donut' as const },
  labels: labels.value,
  legend: { position: 'bottom' as const, fontSize: '12px' },
  tooltip: { y: { formatter: (val: number) => formatAmount(val) } },
  colors: ['#1976D2', '#4CAF50', '#2196F3', '#FF9800', '#F44336', '#607D8B'],
  plotOptions: { pie: { donut: { size: '70%' } } }
}))
</script>

<template>
  <div class="dash-card">
    <div class="dash-card-header">Payment Methods</div>
    <div class="dash-card-body">
      <AppChart v-if="data.length" type="donut" :series="series" :options="options" :height="chartHeight" />
      <AppEmptyState v-else title="No payment data" />
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
