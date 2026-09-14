<script setup lang="ts">
import type { LowStockProduct } from '~/types/report'

interface Props {
  products: LowStockProduct[]
}

defineProps<Props>()
</script>

<template>
  <div class="dash-card">
    <div class="dash-card-header d-flex align-center">
      <span>Inventory Alerts</span>
      <v-spacer />
      <v-chip v-if="products.length" size="x-small" color="warning">{{ products.length }}</v-chip>
    </div>
    <v-list density="compact" v-if="products.length" class="py-0" max-height="280">
      <v-list-item v-for="p in products" :key="p.id" :to="`/products`" density="compact" class="px-3">
        <template #prepend>
          <v-icon :color="p.is_out ? 'error' : 'warning'" size="16">
            {{ p.is_out ? 'mdi-close-circle' : 'mdi-alert' }}
          </v-icon>
        </template>
        <v-list-item-title class="text-body-2 text-truncate">{{ p.name }}</v-list-item-title>
        <v-list-item-subtitle class="text-caption">
          Stock: {{ p.stock_quantity }} / Reorder: {{ p.reorder_level }}
        </v-list-item-subtitle>
      </v-list-item>
    </v-list>
    <div v-else class="dash-empty">
      <v-icon color="success" size="32">mdi-check-circle</v-icon>
      <div class="text-caption mt-1 text-medium-emphasis">All stock levels healthy</div>
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
.dash-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
}
</style>
