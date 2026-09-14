<script setup lang="ts">
import type { Sale } from '~/types/sale'
import { formatAmount } from '~/utils/format'
import { useDisplay } from 'vuetify'

interface Props {
  sales: Sale[]
}

const props = defineProps<Props>()

const { mdAndUp } = useDisplay()

const mobileHeaders = computed(() => {
  if (mdAndUp.value) {
    return [
      { title: 'Sale #', key: 'sale_number', width: '130px' },
      { title: 'Customer', key: 'customer.name' },
      { title: 'Payment', key: 'payment_type.name' },
      { title: 'Total', key: 'total', align: 'end' },
      { title: 'Status', key: 'status' },
      { title: 'Date', key: 'created_at' }
    ]
  }
  return [
    { title: 'Sale #', key: 'sale_number' },
    { title: 'Total', key: 'total', align: 'end' },
    { title: 'Status', key: 'status' }
  ]
})
</script>

<template>
  <div class="dash-card">
    <div class="dash-card-header">Recent Transactions</div>
    <v-data-table
      :items="sales"
      :headers="mobileHeaders"
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
</style>
