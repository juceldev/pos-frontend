<script setup lang="ts">
import type { AnalyticsSummary } from '~/types/report'
import { formatAmount } from '~/utils/format'

interface Props {
  summary: AnalyticsSummary
}

const props = defineProps<Props>()

const heroCards = computed(() => [
  { title: 'Total Sales', value: formatAmount(props.summary.total_sales), color: 'primary', icon: 'mdi-cash', subtitle: `${props.summary.total_transactions} transactions` },
  { title: 'Gross Profit', value: formatAmount(props.summary.total_profit), color: 'info', icon: 'mdi-chart-line-variant', subtitle: `Avg ${formatAmount(props.summary.avg_transaction)}` },
  { title: 'Returns', value: formatAmount(props.summary.total_returns), color: 'warning', icon: 'mdi-undo', subtitle: 'Total returned' }
])

const miniCards = computed(() => [
  { title: 'Customers', value: props.summary.total_customers, color: 'success', icon: 'mdi-account-multiple' },
  { title: 'Products', value: props.summary.total_products, color: 'secondary', icon: 'mdi-package-variant' },
  { title: 'Low Stock', value: props.summary.low_stock_count, color: 'warning', icon: 'mdi-alert' },
  { title: 'Out of Stock', value: props.summary.out_of_stock_count, color: 'error', icon: 'mdi-close-circle' }
])
</script>

<template>
  <div class="dash-stats-wrap">
    <!-- Hero cards (3 large) -->
    <div class="dash-heroes">
      <div v-for="(s, i) in heroCards" :key="i" class="hero-card" :class="`hero-${s.color}`">
        <div class="hero-top">
          <div class="hero-icon">
            <v-icon :icon="s.icon" size="22" />
          </div>
          <div class="hero-label">{{ s.title }}</div>
        </div>
        <div class="hero-value">{{ s.value }}</div>
        <div class="hero-subtitle">{{ s.subtitle }}</div>
      </div>
    </div>

    <!-- Mini cards (4 compact) -->
    <div class="dash-minis">
      <div v-for="(s, i) in miniCards" :key="i" class="mini-card">
        <v-icon :icon="s.icon" size="16" :class="`text-${s.color}`" />
        <div class="mini-info">
          <div class="mini-value">{{ s.value }}</div>
          <div class="mini-label">{{ s.title }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dash-stats-wrap {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* Hero cards */
.dash-heroes {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.hero-card {
  padding: 14px 16px;
  border-radius: 10px;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.1);
  position: relative;
  overflow: hidden;
}

.hero-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
}

.hero-primary::before { background: rgb(var(--v-theme-primary)); }
.hero-info::before { background: rgb(var(--v-theme-info)); }
.hero-warning::before { background: rgb(var(--v-theme-warning)); }

.hero-top {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.hero-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.hero-primary .hero-icon { background: rgba(var(--v-theme-primary), 0.12); color: rgb(var(--v-theme-primary)); }
.hero-info .hero-icon { background: rgba(var(--v-theme-info), 0.12); color: rgb(var(--v-theme-info)); }
.hero-warning .hero-icon { background: rgba(var(--v-theme-warning), 0.12); color: rgb(var(--v-theme-warning)); }

.hero-label {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: rgba(var(--v-theme-on-surface), 0.6);
  font-weight: 500;
}

.hero-value {
  font-size: 1.5rem;
  font-weight: 700;
  line-height: 1.1;
}

.hero-subtitle {
  font-size: 0.72rem;
  color: rgba(var(--v-theme-on-surface), 0.5);
  margin-top: 2px;
}

/* Mini cards */
.dash-minis {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

.mini-card {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 8px;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}

.mini-info {
  min-width: 0;
}

.mini-value {
  font-size: 1rem;
  font-weight: 700;
  line-height: 1.1;
}

.mini-label {
  font-size: 0.68rem;
  color: rgba(var(--v-theme-on-surface), 0.55);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.text-primary { color: rgb(var(--v-theme-primary)); }
.text-success { color: rgb(var(--v-theme-success)); }
.text-warning { color: rgb(var(--v-theme-warning)); }
.text-error { color: rgb(var(--v-theme-error)); }
.text-secondary { color: rgb(var(--v-theme-secondary)); }

/* Tablet */
@media (max-width: 960px) {
  .dash-heroes {
    grid-template-columns: 1fr;
  }
  .dash-minis {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Mobile */
@media (max-width: 600px) {
  .dash-heroes {
    grid-template-columns: 1fr;
    gap: 6px;
  }
  .dash-minis {
    grid-template-columns: repeat(2, 1fr);
    gap: 6px;
  }
  .hero-card {
    padding: 10px 12px;
  }
  .hero-value {
    font-size: 1.25rem;
  }
  .hero-icon {
    width: 28px;
    height: 28px;
  }
  .mini-card {
    padding: 6px 10px;
  }
  .mini-value {
    font-size: 0.9rem;
  }
}
</style>
