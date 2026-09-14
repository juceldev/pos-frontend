<script setup lang="ts">
import type { ApexOptions } from 'apexcharts'

interface Props {
  type: 'line' | 'bar' | 'donut' | 'area' | 'pie'
  series: any[]
  options?: Partial<ApexOptions>
  height?: number | string
}

const props = withDefaults(defineProps<Props>(), {
  height: 300
})

const baseOptions = computed<ApexOptions>(() => ({
  chart: {
    type: props.type,
    background: 'transparent',
    toolbar: { show: false }
  },
  grid: {
    strokeDashArray: 4
  },
  legend: {
    position: 'bottom'
  },
  dataLabels: {
    enabled: false
  },
  ...props.options
}))
</script>

<template>
  <client-only>
    <apexchart
      :type="type"
      :series="series"
      :options="baseOptions"
      :height="height"
    />
    <template #fallback>
      <div class="d-flex align-center justify-center" :style="{ height: typeof height === 'number' ? height + 'px' : height }">
        <v-progress-circular indeterminate color="primary" size="32" />
      </div>
    </template>
  </client-only>
</template>
