<script setup lang="ts">
import { formatAmount } from '~/utils/format'
import { usePaymentTypes } from '~/composables/usePaymentTypes'
import type { Sale, SaleItem } from '~/types/sale'

interface Props {
  modelValue: boolean
  sale: Sale | null
}

const props = defineProps<Props>()
const sale = computed(() => props.sale)
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  submit: [data: { items: any[]; payment_type_id?: number | null; notes?: string }]
}>()

const dialog = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const { paymentTypes, fetchPaymentTypes } = usePaymentTypes()

interface ReturnLine {
  sale_item_id: number
  product_id: number | null
  description: string
  maxQty: number
  qty: number
  unit_price: number
  total: number
  serials: string[]
  selectedSerials: string[]
}

const returnLines = ref<ReturnLine[]>([])
const paymentTypeId = ref<number | null>(null)
const notes = ref('')
const { confirm } = useConfirm()

watch(() => props.sale, (sale) => {
  if (!sale) {
    returnLines.value = []
    paymentTypeId.value = null
    return
  }
  paymentTypeId.value = sale.payment_type_id
  returnLines.value = sale.items
    .filter(item => (item.returned_quantity ?? 0) + (item.pending_quantity ?? 0) < item.quantity)
    .map(item => ({
      sale_item_id: item.id,
      product_id: item.product_id,
      description: item.is_service ? (item.description ?? 'Service') : (item.product?.name ?? 'Item'),
      maxQty: item.quantity - (item.returned_quantity ?? 0) - (item.pending_quantity ?? 0),
      qty: 0,
      unit_price: item.unit_price,
      total: 0,
      serials: item.serials ?? [],
      selectedSerials: []
    }))
}, { immediate: true })

watch(dialog, (open) => {
  if (!open) {
    paymentTypeId.value = null
    notes.value = ''
  }
})

onMounted(() => {
  fetchPaymentTypes()
})

function updateLineTotal (line: ReturnLine) {
  if (line.qty > line.maxQty) {
    line.qty = line.maxQty
  }
  if (line.qty < 0) {
    line.qty = 0
  }
  line.total = Number((line.qty * line.unit_price).toFixed(2))
  if (line.serials.length > 0) {
    const maxSerials = Math.min(line.qty, line.maxQty)
    if (line.selectedSerials.length > maxSerials) {
      line.selectedSerials = line.selectedSerials.slice(0, maxSerials)
    }
  }
}

function toggleSerial (line: ReturnLine, serial: string) {
  const idx = line.selectedSerials.indexOf(serial)
  if (idx >= 0) {
    line.selectedSerials.splice(idx, 1)
  } else if (line.selectedSerials.length < line.qty) {
    line.selectedSerials.push(serial)
  }
}

function returnAll () {
  returnLines.value.forEach(line => {
    line.qty = line.maxQty
    updateLineTotal(line)
    if (line.serials.length > 0) {
      line.selectedSerials = line.serials.slice(0, line.qty)
    }
  })
}

const totalRefund = computed(() => {
  return returnLines.value.reduce((sum, line) => sum + line.total, 0)
})

const canSubmit = computed(() => {
  return returnLines.value.some(line => {
    if (line.qty <= 0) return false
    if (line.serials.length > 0 && line.selectedSerials.length !== line.qty) return false
    return true
  })
})

function submit () {
  const items = returnLines.value
    .filter(line => line.qty > 0)
    .map(line => ({
      sale_item_id: line.sale_item_id,
      quantity: line.qty,
      unit_price: line.unit_price,
      total: line.total,
      serials: line.selectedSerials.length > 0 ? line.selectedSerials : undefined
    }))

  emit('submit', {
    items,
    payment_type_id: paymentTypeId.value,
    notes: notes.value
  })
  dialog.value = false
}

async function onProcessClick () {
  if (!props.sale) return
  const total = formatAmount(totalRefund.value)
  const ok = await confirm({
    title: 'Confirm Return',
    message: `Process return for ${props.sale.sale_number}? Total refund: ${total}`
  })
  if (ok) submit()
}
</script>

<template>
  <AppDrawer
    v-model="dialog"
    title="Process Return"
    :subtitle="sale ? `${sale.sale_number} — ${sale.customer?.name ?? 'Walk-in'}` : ''"
    icon="mdi-undo"
    width="1000"
  >
    <v-card-text v-if="sale">
      <div v-if="returnLines.length === 0" class="text-center py-4 text-medium-emphasis">
        No items available for return
      </div>

      <div class="d-flex justify-end mb-2">
        <v-btn
          size="small"
          variant="tonal"
          color="primary"
          prepend-icon="mdi-undo-variant"
          :disabled="returnLines.length === 0"
          @click="returnAll"
        >
          Return All
        </v-btn>
      </div>

      <div v-for="line in returnLines" :key="line.sale_item_id" class="mb-4 border pa-3 rounded">
        <div class="d-flex justify-space-between align-center">
          <div>
            <div class="font-weight-bold">{{ line.description }}</div>
            <div class="text-caption text-medium-emphasis">
              Max return: {{ line.maxQty }} | Unit price: {{ formatAmount(line.unit_price) }}
            </div>
          </div>
          <v-text-field
            v-model.number="line.qty"
            type="number"
            label="Return Qty"
            density="compact"
            variant="outlined"
            hide-details
            style="min-width: 130px; max-width: 130px"
            :min="0"
            @update:model-value="updateLineTotal(line)"
          />
        </div>

        <div v-if="line.serials.length > 0" class="mt-3">
          <div class="text-caption mb-2 font-weight-medium">
            Select {{ line.qty }} serial{{ line.qty === 1 ? '' : 's' }} to return
          </div>
          <v-select
            :model-value="line.selectedSerials"
            :items="line.serials"
            label="Serials"
            density="compact"
            variant="outlined"
            multiple
            chips
            closable-chips
            hide-details
            :disabled="line.qty === 0"
            :hint="`${line.selectedSerials.length} of ${line.qty} selected`"
            persistent-hint
            @update:model-value="line.selectedSerials = ($event as string[]).slice(0, line.qty)"
          />
          <div v-if="line.selectedSerials.length !== line.qty" class="text-caption text-error mt-1">
            Please select exactly {{ line.qty }} serial{{ line.qty === 1 ? '' : 's' }}.
          </div>
        </div>
        <div v-else class="mt-3 text-caption text-medium-emphasis">
          No serials required for this item.
        </div>

        <div class="text-body-2 mt-2 text-right font-weight-medium">
          Refund: {{ formatAmount(line.total) }}
        </div>
      </div>

      <v-select
        v-if="sale?.payment_type"
        v-model="paymentTypeId"
        label="Refund Payment Method"
        :items="paymentTypes"
        item-title="name"
        item-value="id"
        variant="outlined"
        density="compact"
        clearable
        hide-details
        class="mb-3"
      />

      <v-textarea
        v-model="notes"
        label="Notes"
        rows="2"
        variant="outlined"
        density="compact"
        hide-details
      />

      <v-divider class="my-3" />
      <div class="d-flex justify-space-between text-h6">
        <span>Total Refund</span>
        <span class="text-primary">{{ formatAmount(totalRefund) }}</span>
      </div>
    </v-card-text>

    <template #actions>
      <v-spacer />
      <v-btn variant="text" @click="dialog = false">Cancel</v-btn>
      <v-btn
        color="primary"
        :disabled="!canSubmit"
        @click="onProcessClick"
      >
        Process Return
      </v-btn>
    </template>
  </AppDrawer>
</template>
