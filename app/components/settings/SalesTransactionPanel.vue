<script setup lang="ts">
import type { SalesTransactionSetting } from '~/types/settings'

interface Props {
  modelValue: SalesTransactionSetting
  categories: { id: number; name: string }[]
  canEdit: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: SalesTransactionSetting]
  save: []
}>()

const form = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const transactionNos = [
  { name: 'Sales Transaction', startKey: 'transaction_sales_start_no', currentKey: 'transaction_sales_current_no' }
]
</script>

<template>
  <v-row dense>
    <v-col cols="12" md="6">
      <v-card flat class="pos-st-card border mb-3" title="Sales Entry">
        <v-card-text class="py-2">
          <v-radio-group v-model="form.sale_entry_mode" :disabled="!canEdit" hide-details density="compact" inline>
            <v-radio label="Retail" value="retail" />
            <v-radio label="Wholesale" value="wholesale" />
          </v-radio-group>
          <v-divider class="my-2" />
          <div class="d-flex flex-wrap ga-4">
            <v-checkbox v-model="form.auto_qty" label="Auto Qty" :disabled="!canEdit" hide-details density="compact" />
            <v-checkbox v-model="form.fuse_same_barcode" label="Fuse Same Barcode" :disabled="!canEdit" hide-details density="compact" />
            <v-checkbox :model-value="true" label="BarCode" :disabled="!canEdit" hide-details density="compact" />
          </div>
        </v-card-text>
      </v-card>

      <v-card flat class="pos-st-card border mb-3" title="Transaction Nos.">
        <v-card-text class="py-2">
          <v-row dense v-for="t in transactionNos" :key="t.name" class="align-center">
            <v-col cols="12" sm="4" class="text-body-2 font-weight-medium">{{ t.name }}</v-col>
            <v-col cols="6" sm="4">
              <v-text-field v-model="(form as any)[t.startKey]" label="Start at" :disabled="!canEdit" variant="outlined" density="compact" hide-details />
            </v-col>
            <v-col cols="6" sm="4">
              <v-text-field v-model="(form as any)[t.currentKey]" label="Current No." :disabled="!canEdit" variant="outlined" density="compact" hide-details />
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>

      <v-card flat class="pos-st-card border mb-3" title="Taxation">
        <v-card-text class="py-2">
          <v-row dense>
            <v-col cols="6">
              <v-select v-model="form.taxation_type" :items="[{ title: 'VAT', value: 'vat' }, { title: 'Non-VAT', value: 'non_vat' }, { title: 'Inclusive', value: 'inclusive' }]" item-title="title" item-value="value" label="Taxation" :disabled="!canEdit" variant="outlined" density="compact" hide-details />
            </v-col>
            <v-col cols="6">
              <v-text-field v-model.number="form.tax_rate" label="Tax Rate" type="number" suffix="%" :disabled="!canEdit" variant="outlined" density="compact" hide-details />
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>

      <div class="d-flex justify-end mb-2">
        <v-btn v-if="canEdit" color="primary" @click="emit('save')" class="px-8">
          Update
        </v-btn>
      </div>
    </v-col>
  </v-row>
 
</template>

<style scoped>
.pos-st-card {
  margin-bottom: 8px;
}
</style>
