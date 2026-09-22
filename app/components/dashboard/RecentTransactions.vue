<script setup lang="ts">
import type { Sale } from '~/types/sale'
import { formatAmount } from '~/utils/format'
import { useDisplay } from 'vuetify'

interface Props {
  sales: Sale[]
}

defineProps<Props>()

const { mdAndUp } = useDisplay()
</script>

<template>
  <div class="dash-card">
    <div class="dash-card-header">Recent Transactions</div>

    <v-data-table
      v-if="mdAndUp"
      :items="sales"
      :headers="[
        { title: 'Sale #', key: 'sale_number', width: '130px' },
        { title: 'Customer', key: 'customer.name' },
        { title: 'Payment', key: 'payment_type.name' },
        { title: 'Total', key: 'total', align: 'end' },
        { title: 'Status', key: 'status' },
        { title: 'Date', key: 'created_at' }
      ]"
      density="compact"
      :height="280"
      fixed-header
      items-per-page="10"
      :items-per-page-options="[{ value: 10, title: '10' }]"
    >
      <template #item.customer.name="{ item }">
        {{ item.customer?.name ?? 'Walk-in' }}
      </template>
      <template #item.payment_type.name="{ item }">
        {{ item.payment_type?.name ?? '—' }}
      </template>
      <template #item.total="{ item }">
        {{ formatAmount(item.total) }}
      </template>
      <template #item.status="{ item }">
        <v-chip size="x-small" :color="item.status === 'completed' ? 'success' : item.status === 'voided' ? 'error' : 'warning'">
          {{ item.status }}
        </v-chip>
      </template>
      <template #item.created_at="{ item }">
        <span class="text-caption">{{ new Date(item.created_at).toLocaleDateString() }}</span>
      </template>
    </v-data-table>

    <div v-else class="tx-mobile-list">
      <div v-if="!sales.length" class="text-center text-medium-emphasis text-caption py-6">
        No recent transactions
      </div>
      <div
        v-for="sale in sales"
        :key="sale.id"
        class="tx-mobile-row d-flex align-center justify-space-between ga-2 px-3 py-2"
      >
        <div class="min-w-0">
          <div class="font-weight-medium text-primary text-truncate">{{ sale.sale_number }}</div>
          <div class="text-caption text-medium-emphasis">
            {{ sale.customer?.name ?? 'Walk-in' }} · {{ new Date(sale.created_at ?? '').toLocaleDateString() }}
          </div>
        </div>
        <div class="d-flex align-center ga-2 flex-shrink-0">
          <span class="font-weight-bold">{{ formatAmount(sale.total) }}</span>
          <v-chip size="x-small" :color="sale.status === 'completed' ? 'success' : sale.status === 'voided' ? 'error' : 'warning'">
            {{ sale.status }}
          </v-chip>
        </div>
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
.tx-mobile-row + .tx-mobile-row {
  border-top: 1px solid rgba(var(--v-theme-on-surface), 0.06);
}
</style>
