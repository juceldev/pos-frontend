<script setup lang="ts">
import type { Sale } from '~/types/sale'
import { useSettings } from '~/composables/useSettings'
import ReceiptPreview from '~/components/settings/ReceiptPreview.vue'

interface Props {
  modelValue: boolean
  sale: Sale | null
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  print: []
  'new-sale': []
}>()

const dialog = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const { company, printer, fetchSettings } = useSettings()

const isBond = computed(() => {
  const size = (printer.value?.sales_paper_size ?? '').toLowerCase()
  return size.includes('bond') || size.includes('5.5') || size.includes('8.5 x 11') || size.includes('8.5 x 13')
})

const dialogMaxWidth = computed(() => isBond.value ? '900' : '400')

onMounted(fetchSettings)

function print () {
  emit('print')
}

function newSale () {
  emit('new-sale')
}
</script>

<template>
  <AppDialog
    v-model="dialog"
    id="receipt-print"
    title="Sale Receipt"
    icon="mdi-receipt-text"
    :max-width="dialogMaxWidth"
    scrollable
  >
    <v-card-text class="d-flex justify-center pa-4">
      <ReceiptPreview :company="company" :printer="printer" :sale="sale" />
    </v-card-text>
    <v-divider></v-divider>
    <v-card-actions>
      <v-spacer />
      <v-btn    
        class="text-none"
        color="indigo-darken-3"
        text="New Sale"
        variant="flat"
         prepend-icon="mdi-printer" @click="print">
        Print Receipt
      </v-btn>
      <v-btn
        class="text-none"
        color="indigo-darken-3"
        text="New Sale"
        variant="flat"
        prepend-icon="mdi-plus"
        @click="newSale"
      />
    </v-card-actions>
  </AppDialog>
</template>
