<script setup lang="ts">
import type { TopProductPoint } from '~/types/report'
import { formatAmount } from '~/utils/format'

interface Props {
  data: TopProductPoint[]
}

const props = defineProps<Props>()

const maxTotal = computed(() => {
  if (!props.data.length) return 1
  return Math.max(...props.data.map(d => d.total), 1)
})

function barWidth (total: number) {
  return Math.max((total / maxTotal.value) * 100, 2) + '%'
}
</script>

<template>
  <div class="dash-card">
    <div class="dash-card-header">Top Products</div>
    <div class="top-products-list">
      <div v-for="(p, i) in data" :key="i" class="top-product-row">
        <div class="top-product-rank">{{ i + 1 }}</div>
        <div class="top-product-info">
          <div class="top-product-name text-truncate">{{ p.name }}</div>
          <div class="top-product-bar-track">
            <div class="top-product-bar" :style="{ width: barWidth(p.total) }" />
          </div>
        </div>
        <div class="top-product-values">
          <div class="top-product-total">{{ formatAmount(p.total) }}</div>
          <div class="top-product-qty">{{ p.quantity }} sold</div>
        </div>
      </div>
      <div v-if="!data.length" class="top-products-empty">
        <v-icon color="medium-emphasis" size="28">mdi-package-variant-closed</v-icon>
        <div class="text-caption text-medium-emphasis mt-1">No product data</div>
      </div>
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

.top-products-list {
  padding: 8px 12px;
  max-height: 260px;
  overflow-y: auto;
}

.top-product-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 0;
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.06);
}
.top-product-row:last-child {
  border-bottom: none;
}

.top-product-rank {
  width: 22px;
  height: 22px;
  border-radius: 6px;
  background: rgba(var(--v-theme-primary), 0.12);
  color: rgb(var(--v-theme-primary));
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 700;
  flex-shrink: 0;
}

.top-product-info {
  flex: 1;
  min-width: 0;
}

.top-product-name {
  font-size: 0.8rem;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.top-product-bar-track {
  height: 4px;
  border-radius: 2px;
  background: rgba(var(--v-theme-on-surface), 0.08);
  margin-top: 4px;
  overflow: hidden;
}

.top-product-bar {
  height: 100%;
  border-radius: 2px;
  background: rgb(var(--v-theme-primary));
  transition: width 0.3s ease;
}

.top-product-values {
  text-align: right;
  flex-shrink: 0;
}

.top-product-total {
  font-size: 0.8rem;
  font-weight: 600;
}

.top-product-qty {
  font-size: 0.7rem;
  color: rgba(var(--v-theme-on-surface), 0.5);
}

.top-products-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
}
</style>
