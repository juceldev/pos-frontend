<script setup lang="ts">
import type { PaymentType } from '~/types/settings'
import { formatAmount } from '~/utils/format'

interface Props {
  modelValue: boolean
  total: number
  paymentTypes: PaymentType[]
  defaultPaymentTypeId?: number | null
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  confirm: [payload: {
    payment_type_id: number | null
    payment_reference_no: string | null
    payment_approval_code: string | null
    paid_amount: number
    change: number
  }]
  cancel: []
}>()

const dialog = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const activeTypes = computed(() => props.paymentTypes.filter(pt => pt.is_active !== false))

const paidAmount = ref(props.total)
const referenceNo = ref('')
const approvalCode = ref('')

const selectedPaymentType = computed(() => {
  const found = activeTypes.value.find(pt => pt.id === props.defaultPaymentTypeId)
  return found ?? activeTypes.value[0] ?? null
})
const selectedPaymentTypeName = computed(() => selectedPaymentType.value?.name ?? '—')
const isCash = computed(() => selectedPaymentType.value?.name?.toLowerCase() === 'cash')

const change = computed(() => Math.max(0, Number((paidAmount.value - props.total).toFixed(2))))
const short = computed(() => Math.max(0, Number((props.total - paidAmount.value).toFixed(2))))
const canConfirm = computed(() => {
  if (paidAmount.value < props.total) return false
  if (!selectedPaymentType.value) return false
  if (isCash.value) return true
  return referenceNo.value.trim() !== '' && approvalCode.value.trim() !== ''
})

function paymentIcon (name: string): string {
  const n = name.toLowerCase()
  if (n.includes('cash')) return 'mdi-cash-register'
  if (n.includes('card')) return 'mdi-credit-card'
  if (n.includes('gcash')) return 'mdi-cellphone'
  if (n.includes('maya')) return 'mdi-wallet'
  if (n.includes('bank')) return 'mdi-bank'
  return 'mdi-credit-card'
}

function resetFields () {
  paidAmount.value = Number(props.total.toFixed(2))
  referenceNo.value = ''
  approvalCode.value = ''
}

watch(() => props.total, (val) => {
  if (paidAmount.value < val) {
    paidAmount.value = Number(val.toFixed(2))
  }
})

watch(dialog, (open) => {
  if (open) resetFields()
})

function addAmount (amount: number) {
  paidAmount.value = Number((paidAmount.value + amount).toFixed(2))
}

function setExact () {
  paidAmount.value = Number(props.total.toFixed(2))
}

function onConfirm () {
  if (!canConfirm.value) return
  emit('confirm', {
    payment_type_id: selectedPaymentType.value?.id ?? null,
    payment_reference_no: isCash.value ? null : referenceNo.value,
    payment_approval_code: isCash.value ? null : approvalCode.value,
    paid_amount: Number(paidAmount.value.toFixed(2)),
    change: change.value
  })
  dialog.value = false
}

function onCancel () {
  emit('cancel')
  dialog.value = false
}
</script>

<template>
  <AppDialog
    v-model="dialog"
    :title="selectedPaymentType ? `${selectedPaymentType.name.toUpperCase()} PAYMENT` : 'PAYMENT'"
    :icon="paymentIcon(selectedPaymentTypeName)"
    max-width="480"
    persistent
    @close="$emit('cancel')"
  >
    <v-card-text class="pt-2 pb-0">
      <v-card
        v-if="!selectedPaymentType"
        flat
        color="warning"
        variant="tonal"
        class="text-center mb-4 pa-3"
      >
        <div class="text-caption text-warning font-weight-bold">NO PAYMENT METHOD SELECTED</div>
      </v-card>

      <v-card
        flat
        color="green-lighten-5"
        class="text-center mb-4 pa-3"
      >
        <div class="text-caption text-success font-weight-bold">TOTAL AMOUNT DUE</div>
        <div class="text-h5 text-success font-weight-bold">{{ formatAmount(total) }}</div>
      </v-card>

      <v-text-field
        v-model.number="paidAmount"
        label="AMOUNT TENDERED"
        type="number"
        variant="outlined"
        density="compact"
        hide-details
        class="mb-3"
      />

      <div class="d-flex ga-2 mb-4">
        <v-btn size="small" variant="tonal" @click="setExact">Exact</v-btn>
        <v-btn size="small" variant="tonal" @click="addAmount(50)">+50</v-btn>
        <v-btn size="small" variant="tonal" @click="addAmount(100)">+100</v-btn>
        <v-btn size="small" variant="tonal" @click="addAmount(500)">+500</v-btn>
        <v-btn size="small" variant="tonal" @click="addAmount(1000)">+1000</v-btn>
      </div>

      <v-text-field
        v-if="!isCash"
        v-model="referenceNo"
        label="Reference No *"
        variant="outlined"
        density="compact"
        hide-details
        class="mb-3"
      />

      <v-text-field
        v-if="!isCash"
        v-model="approvalCode"
        label="Approval Code *"
        variant="outlined"
        density="compact"
        hide-details
        class="mb-3"
      />

      <v-card
        v-if="isCash"
        flat
        color="blue-lighten-5"
        class="d-flex justify-space-between align-center pa-3 mb-4"
      >
        <span class="font-weight-bold text-primary">CHANGE DUE:</span>
        <span class="text-h6 text-primary font-weight-bold">{{ formatAmount(change) }}</span>
      </v-card>

      <v-alert
        v-if="short > 0"
        type="warning"
        density="compact"
        variant="tonal"
        class="mb-3"
      >
        Short by {{ formatAmount(short) }}
      </v-alert>

     <v-btn
        color="primary"
        size="large"
        block
        :disabled="!canConfirm"
        class="mb-4"
        @click="onConfirm"
      >
        CONFIRM TRANSACTION
      </v-btn>
    </v-card-text>
  </AppDialog>
</template>
