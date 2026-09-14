<script setup lang="ts">
import type { CartItem } from '~/types/cart'
import type { Customer } from '~/types/product'
import type { PaymentType } from '~/types/settings'
import { formatAmount, formatNumber } from '~/utils/format'

interface Props {
  orderNumber: string
  cart: CartItem[]
  customerId: number | null
  customers: Customer[]
  paymentTypes: PaymentType[]
  paymentTypeId: number | null
  subtotal: number
  vat: number
  taxRate: number
  discount: number
  total: number
}

const props = defineProps<Props>()
const emit = defineEmits<{
  clear: []
  removeItem: [index: number]
  increment: [index: number]
  decrement: [index: number]
  openDiscount: [index: number]
  removeSerial: [index: number, serial: string]
  'update:paymentTypeId': [value: number | null]
  pay: []
}>()

const selectedCustomerName = computed(() => {
  const customer = props.customers.find(c => c.id === props.customerId)
  return customer?.name ?? 'Walk-in customer'
})

const activePaymentTypes = computed(() => props.paymentTypes.filter(pt => pt.is_active !== false))
const selectedPaymentType = computed(() => props.paymentTypes.find(pt => pt.id === props.paymentTypeId))

function paymentIcon (name: string): string {
  const n = name.toLowerCase()
  if (n.includes('cash')) return 'mdi-cash-register'
  if (n.includes('card')) return 'mdi-credit-card'
  if (n.includes('gcash')) return 'mdi-cellphone'
  if (n.includes('maya')) return 'mdi-wallet'
  if (n.includes('bank')) return 'mdi-bank'
  return 'mdi-credit-card'
}

function selectPaymentType (id: number) {
  emit('update:paymentTypeId', id)
}



const showSerialsDialog = ref(false)
const serialDialogIndex = ref<number | null>(null)
const serialDialogItem = computed(() => serialDialogIndex.value !== null ? props.cart[serialDialogIndex.value] ?? null : null)
const dialogSerials = computed(() => [...new Set(serialDialogItem.value?.serials?.filter((s: any) => !!s) ?? [])])

function openSerialsDialog (index: number) {
  serialDialogIndex.value = index
  showSerialsDialog.value = true
}

function closeSerialsDialog () {
  showSerialsDialog.value = false
  serialDialogIndex.value = null
}

watch(dialogSerials, (serials) => {
  if (serials.length === 0) {
    closeSerialsDialog()
  }
})
</script>

<template>
  <div class="pos-right-panel">
    <v-sheet color="primary" class="pos-sale-header pa-3 mb-2 text-white rounded-lg">
      <v-row dense align="center">
        <v-col cols="4" sm="4">
          <div class="text-caption text-uppercase font-weight-bold pos-sale-label" style="color: rgba(255,255,255,0.8)">Transaction No.</div>
          <div class="pos-order-number" style="color: white">{{ orderNumber }}</div>
        </v-col>
        <v-col cols="6" sm="6">
          <div class="text-caption text-uppercase font-weight-bold pos-sale-label" style="color: rgba(255,255,255,0.8)">Customer</div>
          <div class="pos-customer-name" style="color: rgba(255,255,255,0.95)">
            <v-icon size="16" class="mr-1">mdi-account</v-icon>
            <span class="text-truncate d-inline-block" style="max-width: 100%">
              {{ selectedCustomerName }}
            </span>
          </div>
        </v-col>
        <v-col cols="2" sm="2" class="text-right">
          <v-btn
            prepend-icon="mdi-delete-sweep"
            variant="flat"
            size="small"
            color="error"
            :disabled="cart.length === 0"
            class="pos-clear-btn"
            @click="emit('clear')"
          >
            Clear
          </v-btn>
        </v-col>
      </v-row>
    </v-sheet>

    <v-divider class="mb-2" />

    <div v-if="cart.length === 0" class="pos-cart-empty">
      <v-icon size="56" color="medium-emphasis">mdi-cart-outline</v-icon>
      <p class="text-body-1 text-medium-emphasis mt-2">Your cart is empty</p>
    </div>

    <div v-else class="pos-cart-items">
      <div v-for="(item, index) in cart" :key="index" class="pos-cart-item">
        <div class="pos-cart-item-info">
          <div class="pos-cart-item-name">{{ item.is_service ? item.description : item.product?.name ?? item.description }}</div>
          <div v-if="!item.is_service && item.product" class="pos-cart-item-sub">
            {{ formatAmount(item.unit_price) }} each
            <span v-if="item.discount > 0" class="pos-cart-item-discount ml-2">
              <v-icon size="12" color="success">mdi-tag-off</v-icon>
              {{ item.discount_type === 'percent' ? `${item.discount}%` : formatAmount(item.discount) }}
            </span>
          </div>
          <div v-if="!item.is_service && item.product" class="d-flex flex-wrap ga-1 mt-1">
            <v-chip v-if="item.product.product_sequence" size="x-small" variant="flat" color="grey-lighten-3">
              Code: {{ item.product.product_sequence }}
            </v-chip>
            <v-chip v-if="item.product.barcode" size="x-small" variant="flat" color="grey-lighten-3">
              Barcode: {{ item.product.barcode }}
            </v-chip>
            <v-chip v-if="item.product.unit" size="x-small" variant="flat" color="grey-lighten-3">
              Unit: {{ item.product.unit.name }}
            </v-chip>
            <v-chip size="x-small" variant="flat" color="grey-lighten-3">
              Stock: {{ formatNumber(item.product.stock_quantity) }}
            </v-chip>
          </div>
          <div v-if="item.serials.length > 0" class="d-flex flex-wrap ga-1 mt-1">
            <v-chip
              size="x-small"
              closable
              @click:close="emit('removeSerial', index, item.serials[0] ?? '')"
            >
              {{ item.serials[0] }}
            </v-chip>
            <v-chip
              v-if="item.serials.length > 1"
              size="x-small"
              color="primary"
              class="cursor-pointer"
              @click="openSerialsDialog(index)"
            >
              +{{ item.serials.length - 1 }} more
            </v-chip>
          </div>
        </div>

        <div class="pos-cart-item-actions">
          <div class="pos-cart-item-total">{{ formatAmount(item.total) }}</div>
          <div class="pos-cart-item-qty">
            <v-btn
              icon="mdi-minus"
              size="x-small"
              variant="outlined"
              density="comfortable"
              :disabled="item.serials.length > 0"
              @click.stop="emit('decrement', index)"
            />
            <span class="pos-cart-qty-value">{{ formatQty(item.quantity) }}</span>
            <v-btn
              icon="mdi-plus"
              size="x-small"
              variant="outlined"
              density="comfortable"
              :disabled="item.serials.length > 0"
              @click.stop="emit('increment', index)"
            />
            <v-btn
              icon="mdi-tag-off"
              size="x-small"
              variant="text"
              color="success"
              @click.stop="emit('openDiscount', index)"
            />
            <v-btn
              icon="mdi-close"
              size="x-small"
              variant="text"
              color="error"
              @click.stop="emit('removeItem', index)"
            />
          </div>
        </div>
      </div>
    </div>
    <v-divider class="py-1"></v-divider>
    <!-- Totals -->
    <div class="pos-totals">
      <div class="pos-total-row">
        <span>Subtotal</span>
        <span>{{ formatAmount(subtotal) }}</span>
      </div>
      <div class="pos-total-row">
        <span>Discount</span>
        <span>{{ formatAmount(discount) }}</span>
      </div>
      <v-divider class="my-2" />
      <v-sheet color="primary" rounded="lg" class="pa-2 mb-2 pos-total-due-sheet">
        <div class="pos-total-row pos-total-due text-white">
          <span>Total amount due</span>
          <span>{{ formatAmount(total) }}</span>
        </div>
      </v-sheet>
    </div>

    <div v-if="activePaymentTypes.length" class="mb-2">
      <div class="text-subtitle-2 mb-2 d-flex align-center ga-2 text-primary font-weight-bold">
        <v-icon size="20" color="primary">mdi-wallet</v-icon>
        Payment Method
      </div>
      <v-divider class="mb-2" />
      <v-row dense>
        <v-col
          v-for="pt in activePaymentTypes"
          :key="pt.id"
          cols="4"
        >
          <v-card
            flat
            class="pos-payment-method-card d-flex flex-column align-center justify-center text-center"
            :color="paymentTypeId === pt.id ? 'primary' : 'grey-lighten-4'"
            :class="{ 'text-white': paymentTypeId === pt.id }"
            @click="selectPaymentType(pt.id)"
          >
            <v-icon size="16" class="pos-payment-method-icon">{{ paymentIcon(pt.name) }}</v-icon>
            <span class="pos-payment-method-name">{{ pt.name }}</span>
          </v-card>
        </v-col>
      </v-row>
    </div>

    <v-btn
      color="success"
      block
      height="40"
      class="pos-proceed-btn"
      :disabled="cart.length === 0 || paymentTypeId == null"
      @click="emit('pay')"
    >
      Proceed to payment
    </v-btn>

    <AppDialog
      v-if="serialDialogItem"
      v-model="showSerialsDialog"
      title="Selected Serials"
      icon="mdi-barcode"
      max-width="720"
    >
      <v-card-text>
        <v-list density="compact" class="border rounded" style="max-height: 400px; overflow-y: auto;">
          <v-list-item
            v-for="serial in dialogSerials"
            :key="serial"
            prepend-icon="mdi-barcode-scan"
            :title="`Serial: ${serial}`"
            subtitle="Added to cart"
          >
            <template #append>
              <v-btn
                icon="mdi-close"
                size="small"
                variant="text"
                color="error"
                @click="emit('removeSerial', serialDialogIndex!, serial)"
              />
            </template>
          </v-list-item>
          <v-list-item v-if="!dialogSerials.length" class="text-center text-medium-emphasis">
            No serials selected
          </v-list-item>
        </v-list>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="closeSerialsDialog">Close</v-btn>
      </v-card-actions>
    </AppDialog>
  </div>
</template>
