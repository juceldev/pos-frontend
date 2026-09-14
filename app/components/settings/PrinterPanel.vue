<script setup lang="ts">
import ReceiptPreview from './ReceiptPreview.vue'
import type { CompanySetting, PrinterSetting } from '~/types/settings'

interface Props {
  modelValue: PrinterSetting
  company: CompanySetting | null
  canEdit: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: PrinterSetting]
  save: []
}>()

const form = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const titleOptions = [
  'RECEIPT', 'SALES RECEIPT', 'JOB ORDER', 'CLAIM SLIP', 'DELIVERY RECEIPT',
  'INVOICE', 'OFFICIAL RECEIPT'
]

const paperSizes = [
  { title: '57 / 58 mm', value: '3 1/8 x 58mm' },
  { title: '78 / 80 mm', value: '78 / 80mm' },
  { title: '8.5 x 11/13 inches', value: '8.5 x 11/13 inches' }
]
</script>

<template>
  <v-row class="pos-printer-row">
    <v-col cols="12" md="7" class="pos-printer-left">
      <!-- Receipt Title Header -->
      <v-card flat class="border mb-4" title="Receipt Title Header">
        <v-card-text>
          <v-row dense v-for="field in [
            { key: 'sales_receipt_title', label: 'Sales Receipt' },
          ]" :key="field.key" class="title-row">
            <v-col cols="12" sm="5" class="title-label text-caption text-medium-emphasis">{{ field.label }}</v-col>
            <v-col cols="12" sm="7">
              <v-combobox v-model="form[field.key]" :items="titleOptions" :disabled="!canEdit" variant="outlined" density="compact" hide-details />
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>

      <!-- Auto options -->
      <v-card flat class="border mb-4">
        <v-card-text>
          <v-checkbox v-model="form.auto_new_transaction_after_print" label="Enable auto new transaction and close pay window after printing sales receipt" :disabled="!canEdit" hide-details density="compact" />
        </v-card-text>
      </v-card>

      <!-- Receipt Footer -->
      <v-card flat class="border mb-4" title="Receipt Footer">
        <v-card-text>
          <v-textarea v-model="form.receipt_footer_remark" label="Footer Remark" rows="2" :disabled="!canEdit" variant="outlined" density="compact" hide-details />
          <v-textarea v-model="form.receipt_vat_remark" label="RCT Remarks" rows="2" :disabled="!canEdit" variant="outlined" density="compact" hide-details class="mt-2" />
          <v-textarea v-model="form.receipt_terms" label="Terms & Cond" rows="2" :disabled="!canEdit" variant="outlined" density="compact" hide-details class="mt-2" />
        </v-card-text>
        <v-card-actions class="justify-end pa-4">
          <v-btn v-if="canEdit" color="primary" variant="elevated" class="px-8" @click="emit('save')">
            Update
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-col>

    <v-col cols="12" md="5" class="pos-printer-right">
      <v-card flat class="border pos-preview-card" title="Receipt Preview">
        <div class="pos-preview-scroll">
          <ReceiptPreview :company="company" :printer="form" :sale="null" />
        </div>
      </v-card>
    </v-col>
  </v-row>
</template>

<style scoped>
.pos-printer-left {
  min-width: 360px;
}

.pos-printer-right {
  min-width: 360px;
}

.printer-row {
  align-items: flex-start;
}

.title-row {
  align-items: center;
  margin-bottom: 8px;
}

.title-label {
  padding-top: 8px;
  padding-bottom: 8px;
}

.pos-preview-card {
  display: flex;
  flex-direction: column;
}

.pos-preview-scroll {
  overflow-y: auto;
  max-height: 70vh;
  padding: 16px;
  display: flex;
  justify-content: center;
}
</style>
