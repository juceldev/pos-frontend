<script setup lang="ts">
import { formatAmount } from '~/utils/format'
import { usePaymentTypes } from '~/composables/usePaymentTypes'
import { useSales } from '~/composables/useSales'
import { useNotification } from '~/composables/useNotification'
import type { Sale, SaleItem } from '~/types/sale'

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
  is_service: boolean
}

const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  processed: []
}>()

const dialog = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const { paymentTypes, fetchPaymentTypes } = usePaymentTypes()
const { returnSale, fetchSales, sales, loading: apiLoading, error: apiError } = useSales()
const { success: showSuccess, error: showError } = useNotification()

const step = ref(1)
const returnReasonType = ref('')
const returnReasonTypes = ['Damaged / Defective', 'Wrong Item', 'Customer Changed Mind', 'Expired', 'Other']
const saleNumber = ref('')
const sale = ref<Sale | null>(null)
const returnLines = ref<ReturnLine[]>([])
const paymentTypeId = ref<number | null>(null)
const notes = ref('')

watch(dialog, (open) => {
  if (!open) {
    reset()
  }
})

onMounted(() => {
  fetchPaymentTypes()
})

function reset () {
  step.value = 1
  returnReasonType.value = ''
  saleNumber.value = ''
  sale.value = null
  returnLines.value = []
  paymentTypeId.value = null
  notes.value = ''
}

async function findSale () {
  if (!saleNumber.value.trim()) return
  apiLoading.value = true
  apiError.value = null
  try {
    const trimmed = saleNumber.value.trim()
    await fetchSales({
      search: trimmed,
      per_page: 5,
      page: 1
    })
    const matches = sales.value
    const exact = matches.find(s =>
      s.sale_number?.toLowerCase() === trimmed.toLowerCase()
    )
    const selected = exact ?? matches[0] ?? null
    if (!selected) {
      showError(`No sale found for "${trimmed}"`)
      return
    }
    sale.value = selected
    buildReturnLines(selected)
    paymentTypeId.value = selected.payment_type_id ?? null
    step.value = 2
  } finally {
    apiLoading.value = false
  }
}

function buildReturnLines (s: Sale) {
  returnLines.value = s.items
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
      selectedSerials: [],
      is_service: item.is_service ?? false
    }))
}

function updateLineTotal (line: ReturnLine) {
  if (line.qty > line.maxQty) line.qty = line.maxQty
  if (line.qty < 0) line.qty = 0
  line.total = Number((line.qty * line.unit_price).toFixed(2))
  if (line.serials.length > 0) {
    const maxSerials = Math.min(line.qty, line.maxQty)
    if (line.selectedSerials.length > maxSerials) {
      line.selectedSerials = line.selectedSerials.slice(0, maxSerials)
    }
  }
}

function increment (line: ReturnLine) {
  if (line.qty < line.maxQty) {
    line.qty++
    updateLineTotal(line)
  }
}

function decrement (line: ReturnLine) {
  if (line.qty > 0) {
    line.qty--
    updateLineTotal(line)
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

function selectAll () {
  returnLines.value.forEach(line => {
    line.qty = line.maxQty
    updateLineTotal(line)
    if (line.serials.length > 0) {
      line.selectedSerials = line.serials.slice(0, line.qty)
    }
  })
}

const totalRefund = computed(() =>
  returnLines.value.reduce((sum, line) => sum + line.total, 0)
)

const canGoToStep3 = computed(() =>
  returnLines.value.some(line => {
    if (line.qty <= 0) return false
    if (line.serials.length > 0 && line.selectedSerials.length !== line.qty) return false
    return true
  })
)

const canSubmit = computed(() => canGoToStep3.value)

async function submit () {
  if (!sale.value) return
  const items = returnLines.value
    .filter(line => line.qty > 0)
    .map(line => ({
      sale_item_id: line.sale_item_id,
      quantity: line.qty,
      unit_price: line.unit_price,
      total: line.total,
      serials: line.selectedSerials.length > 0 ? line.selectedSerials : undefined
    }))

  const reasonPrefix = returnReasonType.value ? `[${returnReasonType.value}] ` : ''
  const result = await returnSale(sale.value.id, {
    items,
    payment_type_id: paymentTypeId.value,
    notes: `${reasonPrefix}${notes.value}`
  })

  if (result) {
    showSuccess('Return request submitted for manager approval')
    emit('processed')
    dialog.value = false
  } else if (apiError.value) {
    showError(apiError.value)
  }
}
</script>

<template>
  <AppDialog
    v-model="dialog"
    title="Return"
    subtitle="Process returns and refunds"
    icon="mdi-undo-variant"
    max-width="800"
    scrollable
  >
    <v-card-text class="pa-4">
      <!-- Stepper -->
      <div class="d-flex align-center w-100 mb-6">
        <div
          v-for="(s, idx) in ['Find Invoice', 'Choose Items', 'Finalize']"
          :key="s"
          class="d-flex align-center"
          :class="idx < 2 ? 'flex-grow-1' : ''"
        >
          <div
            class="rounded-circle d-flex align-center justify-center text-caption font-weight-bold flex-shrink-0"
            :class="step >= idx + 1 ? 'bg-primary text-white' : 'bg-grey-lighten-2 text-medium-emphasis'"
            style="width: 28px; height: 28px; min-width: 28px"
          >
            {{ idx + 1 }}
          </div>
          <span class="ml-2 text-body-2 text-no-wrap" :class="step >= idx + 1 ? 'font-weight-medium' : 'text-medium-emphasis'">
            {{ s }}
          </span>
          <v-divider v-if="idx < 2" class="mx-3 flex-grow-1" />
        </div>
      </div>

      <!-- Step 1: Find Invoice -->
      <div v-if="step === 1">
        <div class="text-h6 mb-2">Search Original Transaction</div>
        <p class="text-body-2 text-medium-emphasis mb-4">
          Enter the <strong>Sale Number</strong> or <strong>Customer Name</strong> to load the original sale details.
        </p>
        <v-text-field
          v-model="saleNumber"
          label="Sale ID or OR Number"
          placeholder="e.g. SALE-000001 or customer name"
          variant="outlined"
          density="compact"
          hide-details
          prepend-inner-icon="mdi-receipt-text"
          class="mb-4"
          @keyup.enter="findSale"
        />
      </div>

      <!-- Step 2: Choose Items -->
      <div v-else-if="step === 2">
        <div class="d-flex justify-space-between align-center mb-4">
          <div>
            <div class="text-h6">{{ sale?.sale_number }}</div>
            <div class="text-body-2 text-medium-emphasis">{{ sale?.customer?.name ?? 'Walk-in' }}</div>
          </div>
          <v-btn size="small" variant="tonal" color="primary" prepend-icon="mdi-undo-variant" @click="selectAll">
            Return All
          </v-btn>
        </div>

        <div v-if="returnLines.length === 0" class="text-center py-4 text-medium-emphasis">
          No items available for return
        </div>

        <v-card
          v-for="line in returnLines"
          :key="line.sale_item_id"
          variant="outlined"
          class="mb-3 rounded-lg"
        >
          <v-card-text class="pa-3">
            <div class="d-flex justify-space-between align-start">
              <div class="flex-1 min-w-0 pr-3">
                <div class="font-weight-bold text-body-1 text-truncate">{{ line.description }}</div>
                <div class="text-caption text-medium-emphasis mt-1">
                  Max: {{ line.maxQty }}&nbsp;&nbsp;|&nbsp;&nbsp;Unit: {{ formatAmount(line.unit_price) }}
                </div>

                <div v-if="line.serials.length > 0" class="mt-2">
                  <div class="text-caption mb-1">
                    Select {{ line.qty }} serial{{ line.qty === 1 ? '' : 's' }} to return:
                  </div>
                  <div class="d-flex flex-wrap ga-1">
                    <v-chip
                      v-for="serial in line.serials"
                      :key="serial"
                      size="small"
                      :color="line.selectedSerials.includes(serial) ? 'primary' : 'default'"
                      :variant="line.selectedSerials.includes(serial) ? 'flat' : 'outlined'"
                      :disabled="line.qty === 0"
                      @click="line.qty > 0 && toggleSerial(line, serial)"
                    >
                      {{ serial }}
                    </v-chip>
                  </div>
                  <div v-if="line.qty === 0" class="text-caption text-medium-emphasis mt-1">
                    Set quantity above to enable serial selection.
                  </div>
                </div>
              </div>

              <div class="d-flex flex-column align-end" style="min-width: 120px">
                <div class="d-flex align-center mb-2">
                  <v-btn
                    icon="mdi-minus"
                    size="small"
                    variant="tonal"
                    density="compact"
                    :disabled="line.qty <= 0"
                    @click="decrement(line)"
                  />
                  <v-text-field
                    v-model.number="line.qty"
                    type="number"
                    density="compact"
                    variant="outlined"
                    hide-details
                    class="mx-2"
                    style="width: 56px"
                    :min="0"
                    :max="line.maxQty"
                    @update:model-value="updateLineTotal(line)"
                  />
                  <v-btn
                    icon="mdi-plus"
                    size="small"
                    variant="tonal"
                    density="compact"
                    :disabled="line.qty >= line.maxQty"
                    @click="increment(line)"
                  />
                </div>
                <div class="text-caption text-medium-emphasis">Return Qty</div>
                <div class="text-body-1 font-weight-bold text-primary mt-1">
                  {{ formatAmount(line.total) }}
                </div>
                <div class="text-caption text-medium-emphasis">Refund</div>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </div>

      <!-- Step 3: Finalize -->
      <div v-else-if="step === 3">
        <div class="text-h6 mb-3">Review and Finalize Return</div>

        <!-- Selected items summary -->
        <v-card
          v-for="line in returnLines.filter(l => l.qty > 0)"
          :key="line.sale_item_id"
          variant="outlined"
          class="mb-3 rounded-lg"
        >
          <v-card-text class="pa-3">
            <div class="d-flex justify-space-between align-start">
              <div class="flex-1 min-w-0 pr-3">
                <div class="font-weight-bold text-body-1 text-truncate">
                  {{ line.description }}
                </div>
                <div class="text-caption text-medium-emphasis mt-1">
                  Return Qty: {{ line.qty }} &nbsp;|&nbsp; Unit: {{ formatAmount(line.unit_price) }}
                </div>
                <div v-if="line.selectedSerials.length > 0" class="d-flex flex-wrap ga-1 mt-2">
                  <v-chip
                    v-for="serial in line.selectedSerials"
                    :key="serial"
                    size="small"
                    color="primary"
                    variant="flat"
                  >
                    {{ serial }}
                  </v-chip>
                </div>
              </div>
              <div class="text-right" style="min-width: 100px">
                <div class="text-body-1 font-weight-bold text-primary">
                  {{ formatAmount(line.total) }}
                </div>
                <div class="text-caption text-medium-emphasis">Refund</div>
              </div>
            </div>
          </v-card-text>
        </v-card>

        <div class="d-flex justify-space-between text-h6 mb-4">
          <span>Total Refund</span>
          <span class="text-primary">{{ formatAmount(totalRefund) }}</span>
        </div>

        <v-select
          v-model="paymentTypeId"
          label="Refund Payment Method"
          :items="paymentTypes"
          item-title="name"
          item-value="id"
          variant="outlined"
          density="compact"
          clearable
          hide-details
          class="mb-4"
        />

        <v-select
          v-model="returnReasonType"
          label="Return Type"
          :items="returnReasonTypes"
          variant="outlined"
          density="compact"
          clearable
          hide-details
          class="mb-4"
        />

        <v-textarea
          v-model="notes"
          label="Reason (optional)"
          rows="2"
          variant="outlined"
          density="compact"
          hide-details
        />
      </div>
    </v-card-text>

    <v-card-actions class="pa-4 pt-0">
      <v-spacer />
      <v-btn variant="text" @click="dialog = false">Cancel</v-btn>
      <v-btn
        v-if="step === 1"
        color="primary"
        :loading="apiLoading"
        :disabled="!saleNumber.trim()"
        prepend-icon="mdi-magnify"
        @click="findSale"
      >
        Find Sale
      </v-btn>
      <template v-else>
        <v-btn
          v-if="step > 1"
          variant="text"
          @click="step--"
        >
          Back
        </v-btn>
        <v-btn
          v-if="step === 2"
          color="primary"
          :disabled="!canGoToStep3"
          @click="step = 3"
        >
          Continue
        </v-btn>
        <v-btn
          v-if="step === 3"
          color="primary"
          :disabled="!canSubmit"
          :loading="apiLoading"
          @click="submit"
        >
          Finalize
        </v-btn>
      </template>
    </v-card-actions>
  </AppDialog>
</template>