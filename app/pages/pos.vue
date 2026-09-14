<script setup lang="ts">
import '~/assets/styles/pos.css'
import type { Product, ProductSerial } from '~/types/product'
import type { Category } from '~/types/product'
import type { CartItem } from '~/types/cart'
import type { SaleItemInput } from '~/types/sale'
import { useProducts } from '~/composables/useProducts'
import { useCategories } from '~/composables/useCategories'
import { useCustomers } from '~/composables/useCustomers'
import { usePaymentTypes } from '~/composables/usePaymentTypes'
import { useSettings } from '~/composables/useSettings'
import { useSales } from '~/composables/useSales'
import { usePosScanner } from '~/composables/usePosScanner'
import { formatAmount, formatNumber } from '~/utils/format'
import { useDisplay } from 'vuetify'
import PosCartPanel from '~/components/pos/PosCartPanel.vue'
import ReceiptDialog from '~/components/pos/ReceiptDialog.vue'

definePageMeta({
  middleware: 'auth'
})

const { products, loading, fetchProducts, fetchSerials, serials } = useProducts()
const { categories, fetchCategories } = useCategories()
const { customers, fetchCustomers, createCustomer } = useCustomers()
const { paymentTypes, fetchPaymentTypes } = usePaymentTypes()
const { salesTransaction, fetchSettings } = useSettings()

const { createSale, voidSale, returnSale } = useSales()
const { scan, scanning } = usePosScanner()

let searchTimeout: ReturnType<typeof setTimeout> | null = null

const scanFieldRef = ref<any>(null)

// Product browser
const productSearch = ref('')
const selectedCategory = ref<string | number>('all')
const productViewMode = ref<'grid' | 'list'>('list')
const posMobileView = ref<'products' | 'cart'>('products')
const showCategoryDialog = ref(false)
const tempCategory = ref<string | number>('all')
const { smAndDown } = useDisplay()
const searchBy = ref<'name' | 'code' | 'barcode' | 'serial'>('name')
const searchByOptions = [
  { title: 'Product Name', value: 'name' },
  { title: 'Code', value: 'code' },
  { title: 'Barcode', value: 'barcode' },
  { title: 'Serial', value: 'serial' }
]

// Cart
const cart = ref<CartItem[]>([])
const orderNumber = ref('00000001')

// Checkout
const customerId = ref<number | null>(null)
const paymentTypeId = ref<number | null>(null)
const paymentReferenceNo = ref<string | null>(null)
const paymentApprovalCode = ref<string | null>(null)
const paidAmount = ref(0)

// Customer dialog
const showCustomerDialog = ref(false)
const customerAddMode = ref(false)
const customerFilter = ref<string | null>('')
const filteredCustomers = computed(() => {
  const q = String(customerFilter.value ?? '').trim().toLowerCase()
  if (!q) return customers.value
  return customers.value.filter(c => c.name.toLowerCase().includes(q) || (c.phone ?? '').toLowerCase().includes(q))
})
const customerForm = reactive({
  name: '',
  phone: '',
  email: '',
  address: '',
  id_number: '',
  is_active: true
})

// Discount dialog
const showDiscountDialog = ref(false)
const discountIndex = ref<number | null>(null)
const discountValue = ref(0)
const discountType = ref<'fixed' | 'percent'>('fixed')

// Receipt
const receipt = ref<any>(null)
const showReceiptDialog = ref(false)
const showTransactions = ref(false)
const showReturnFlow = ref(false)
const showSettings = ref(false)
const showPaymentDialog = ref(false)
const transactionSale = ref<any>(null)
const showReturn = ref(false)
const showVoid = ref(false)

// Serial/Batch selection dialog
const showBatchDialog = ref(false)
const batchProduct = ref<Product | null>(null)
const batchSearch = ref('')
const skipBatchQuantity = ref(1)
const availableSerials = ref<ProductSerial[]>([])
const serialsLoading = ref(false)

const filteredSerials = computed(() => {
  const q = batchSearch.value.trim().toLowerCase()
  if (!q) return availableSerials.value
  return availableSerials.value.filter(s => s.serial_number.toLowerCase().includes(q))
})

const vat = computed(() => 0)
const subtotal = computed(() => Number(cart.value.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0).toFixed(2)))
const itemDiscountTotal = computed(() => Number(cart.value.reduce((sum, item) => sum + ((item.quantity * item.unit_price) - item.total), 0).toFixed(2)))
const total = computed(() => Number((subtotal.value - itemDiscountTotal.value).toFixed(2)))
const change = computed(() => Math.max(0, Number((paidAmount.value - total.value).toFixed(2))))
const due = computed(() => Math.max(0, total.value - paidAmount.value))
const itemCount = computed(() => cart.value.reduce((sum, item) => sum + item.quantity, 0))
const isFullscreen = ref(false)
const fullscreenIcon = computed(() => isFullscreen.value ? 'mdi-fullscreen-exit' : 'mdi-fullscreen')

const categoryChips = computed<{ title: string; value: string | number }[]>(() => {
  const chips: { title: string; value: string | number }[] = [{ title: 'All', value: 'all' }]
  for (const c of categories.value) {
    chips.push({ title: c.name, value: c.id })
  }
  chips.push({ title: 'Services', value: 'service' })
  return chips
})

function isOutOfStock (product: Product): boolean {
  return Number(product.stock_quantity) <= 0 && product.product_type !== 'service'
}

async function loadProducts () {
  const filters: Record<string, any> = {
    search: productSearch.value || undefined,
    searchBy: searchBy.value,
    isActive: true
  }
  if (selectedCategory.value === 'service') {
    filters.productType = 'service'
  } else if (selectedCategory.value !== 'all') {
    filters.categoryId = selectedCategory.value
  }
  await fetchProducts(filters)
}

function openCategoryFilter () {
  tempCategory.value = selectedCategory.value
  showCategoryDialog.value = true
}

function applyCategoryFilter () {
  selectedCategory.value = tempCategory.value
  showCategoryDialog.value = false
  loadProducts()
}

function clearCategoryFilter () {
  tempCategory.value = 'all'
  selectedCategory.value = 'all'
  showCategoryDialog.value = false
  loadProducts()
}

watch(productSearch, (val) => {
  if (searchTimeout) clearTimeout(searchTimeout)
  if (!val) {
    loadProducts()
    return
  }

  searchTimeout = setTimeout(async () => {
    const input = val.trim()
    if (!input) return

    const result = await scan(input)
    if (result.type !== 'not_found' && result.product) {
      productSearch.value = ''
      focusScanField()

      if (result.type === 'serial') {
        addProductToCart(result.product, [result.serial!])
      } else {
        addProductToCart(result.product)
      }
      return
    }

    await loadProducts()
  }, 250)
})

watch(searchBy, () => {
  loadProducts()
})

function focusScanField () {
  nextTick(() => {
    scanFieldRef.value?.focus()
  })
}

function addProductToCart (product: Product, serials: string[] = [], quantity?: number) {
  if (product.product_type !== 'with_serial' && isOutOfStock(product)) {
    snackbarText.value = `${product.name} is out of stock`
    snackbarColor.value = 'error'
    snackbar.value = true
    return
  }

  if (product.product_type === 'with_serial' && serials.length === 0 && quantity === undefined) {
    openBatchDialog(product)
    return
  }

  if (product.product_type === 'with_serial' && serials.length > 0) {
    const cartSerials = new Set(cart.value.flatMap(item => item.serials ?? []))
    const alreadyInCart = serials.filter(serial => cartSerials.has(serial))
    if (alreadyInCart.length > 0) {
      snackbarText.value = `Serial already in cart: ${alreadyInCart[0]}`
      snackbarColor.value = 'warning'
      snackbar.value = true
      return
    }
  }

  const existing = cart.value.find(i => i.product_id === product.id && !i.is_service)
  if (existing) {
    if (product.product_type === 'with_serial') {
      const nextSerials = [...new Set([...existing.serials, ...serials])]
      existing.serials = nextSerials
      existing.quantity = nextSerials.length
      recalcItem(existing)
    } else if (product.product_type !== 'service' && existing.quantity >= Number(product.stock_quantity)) {
      snackbarText.value = `${product.name} is out of stock`
      snackbarColor.value = 'error'
      snackbar.value = true
      return
    } else {
      existing.quantity += 1
      recalcItem(existing)
    }
  } else {
    const price = Number(product.regular_price ?? product.cost_price ?? 0)
    const newItem: CartItem = {
      product,
      product_id: product.id,
      description: product.name,
      is_service: false,
      quantity: quantity ?? (serials.length || 1),
      unit_price: price,
      discount: 0,
      discount_type: 'fixed',
      total: 0,
      serials
    }
    recalcItem(newItem)
    cart.value.push(newItem)
  }
}

function addToCart (product: Product) {
  addProductToCart(product)
}

function removeFromCart (index: number) {
  cart.value.splice(index, 1)
}

function incrementQty (index: number) {
  const item = cart.value[index]
  if (!item || item.serials.length > 0) return
  if (item.product && item.product.product_type !== 'service' && item.quantity >= Number(item.product.stock_quantity)) {
    snackbarText.value = `${item.product.name} is out of stock`
    snackbarColor.value = 'error'
    snackbar.value = true
    return
  }
  item.quantity += 1
  recalcItem(item)
}

function decrementQty (index: number) {
  const item = cart.value[index]
  if (!item || item.serials.length > 0) return
  if (item.quantity > 1) {
    item.quantity -= 1
    recalcItem(item)
  } else {
    removeFromCart(index)
  }
}

function updatePrice (index: number, price: number) {
  const item = cart.value[index]
  if (!item) return
  item.unit_price = Math.max(0, price)
  recalcItem(item)
}

function removeSerial (cartIndex: number, serial: string) {
  const item = cart.value[cartIndex]
  if (!item) return
  item.serials = item.serials.filter(s => s !== serial)
  item.quantity = item.serials.length || 1
  recalcItem(item)
  if (item.serials.length === 0 && item.product?.product_type === 'with_serial') {
    cart.value.splice(cartIndex, 1)
  }
}

async function openBatchDialog (product: Product) {
  batchProduct.value = product
  batchSearch.value = ''
  skipBatchQuantity.value = 1
  serialsLoading.value = true
  await fetchSerials(product.id)
  availableSerials.value = serials.value as ProductSerial[]
  serialsLoading.value = false
  showBatchDialog.value = true
}

function addSerialToCart (serial: ProductSerial) {
  if (!batchProduct.value) return
  if (serial.status !== 'in_stock') {
    snackbarText.value = 'Serial not available for sale'
    snackbarColor.value = 'error'
    snackbar.value = true
    return
  }
  addProductToCart(batchProduct.value, [serial.serial_number])
  availableSerials.value = availableSerials.value.filter(s => s.id !== serial.id)
  snackbarText.value = 'Item added'
  snackbarColor.value = 'success'
  snackbar.value = true
}

function formatSerialStatus (status: string): string {
  if (status === 'in_stock') return 'Valid'
  if (status === 'sold') return 'Sold'
  if (status === 'defective') return 'Defective'
  if (status === 'returned') return 'Returned'
  return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}

function skipBatchSelection () {
  if (!batchProduct.value) return
  addProductToCart(batchProduct.value, [], skipBatchQuantity.value)
  showBatchDialog.value = false
  batchProduct.value = null
  availableSerials.value = []
  batchSearch.value = ''
  skipBatchQuantity.value = 1
}

function closeBatchDialog () {
  showBatchDialog.value = false
  batchProduct.value = null
  availableSerials.value = []
  batchSearch.value = ''
  skipBatchQuantity.value = 1
}

function recalcItem (item: CartItem) {
  const gross = item.quantity * item.unit_price
  let discountAmount = 0
  if (item.discount_type === 'percent') {
    discountAmount = gross * (item.discount / 100)
  } else {
    discountAmount = item.discount
  }
  item.total = Number(Math.max(0, gross - discountAmount).toFixed(2))
}

async function clearCart () {
  cart.value = []
  customerId.value = null
  paymentTypeId.value = null
  paymentReferenceNo.value = null
  paymentApprovalCode.value = null
  paidAmount.value = 0
  await fetchSettings()
  orderNumber.value = generateOrderNumber()
}

function generateOrderNumber (): string {
  return salesTransaction.value?.transaction_sales_current_no ?? '00000001'
}

function openCustomerDialog () {
  customerForm.name = ''
  customerForm.phone = ''
  customerForm.email = ''
  customerForm.address = ''
  customerForm.id_number = ''
  customerForm.is_active = true
  customerAddMode.value = false
  customerFilter.value = ''
  showCustomerDialog.value = true
}

function selectCustomer (id: number) {
  customerId.value = id
  customerFilter.value = ''
  showCustomerDialog.value = false
}

async function saveCustomer () {
  if (!customerForm.name.trim()) return
  const customer = await createCustomer(customerForm)
  if (customer) {
    await fetchCustomers()
    customerId.value = customer.id
    customerAddMode.value = false
    customerFilter.value = ''
    showCustomerDialog.value = false
    snackbarText.value = 'Customer added'
    snackbarColor.value = 'success'
    snackbar.value = true
  }
}

function openDiscountDialog (index: number) {
  const item = cart.value[index]
  if (!item) return
  discountIndex.value = index
  discountValue.value = item.discount
  discountType.value = item.discount_type
  showDiscountDialog.value = true
}

function applyDiscount () {
  if (discountIndex.value === null) return
  const item = cart.value[discountIndex.value]
  if (!item) return
  item.discount = Number(discountValue.value) || 0
  item.discount_type = discountType.value
  recalcItem(item)
  showDiscountDialog.value = false
  discountIndex.value = null
}

function formatCategory (product: Product): string {
  if (product.product_type === 'service') return 'Services'
  return product.category?.name ?? 'Uncategorized'
}

function openPaymentDialog () {
  showPaymentDialog.value = true
}

function onPaymentConfirm (payload: { payment_type_id: number | null; payment_reference_no: string | null; payment_approval_code: string | null; paid_amount: number; change: number }) {
  paymentTypeId.value = payload.payment_type_id
  paymentReferenceNo.value = payload.payment_reference_no
  paymentApprovalCode.value = payload.payment_approval_code
  paidAmount.value = payload.paid_amount
  completeSale()
}

async function completeSale () {
  if (cart.value.length === 0) return

  const items: SaleItemInput[] = cart.value.map(item => ({
    product_id: item.product_id,
    description: item.is_service ? item.description : undefined,
    is_service: item.is_service,
    quantity: item.quantity,
    unit_price: item.unit_price,
    discount: item.discount,
    discount_type: item.discount_type,
    total: item.total,
    serials: item.serials.length > 0 ? item.serials : undefined
  }))

  const sale = await createSale({
    customer_id: customerId.value,
    payment_type_id: paymentTypeId.value,
    payment_reference_no: paymentReferenceNo.value,
    payment_approval_code: paymentApprovalCode.value,
    items,
    subtotal: Number(subtotal.value.toFixed(2)),
    tax: 0,
    discount: Number(itemDiscountTotal.value.toFixed(2)),
    total: Number(total.value.toFixed(2)),
    paid_amount: Number(paidAmount.value.toFixed(2)),
    change: Number(change.value.toFixed(2)),
    notes: ''
  })

  if (sale) {
    receipt.value = sale
    showReceiptDialog.value = true
    await clearCart()
    await loadProducts()
    snackbarText.value = `Sale ${sale.sale_number} completed`
    snackbarColor.value = 'success'
    snackbar.value = true
  }
}

function printReceipt () {
  window.print()
}

function newSale () {
  receipt.value = null
  showReceiptDialog.value = false
  focusScanField()
}

const snackbar = ref(false)
const snackbarText = ref('')
const snackbarColor = ref('success')

function updateFullscreenState () {
  isFullscreen.value = Boolean(document.fullscreenElement)
}

function toggleFullscreen () {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(() => {})
  } else {
    document.exitFullscreen().catch(() => {})
  }
}

onMounted(async () => {
  document.addEventListener('fullscreenchange', updateFullscreenState)
  updateFullscreenState()
  await Promise.all([fetchCustomers(), fetchPaymentTypes({ per_page: 1000, is_active: 1 }), fetchSettings(), fetchCategories(), loadProducts()])
  const cash = paymentTypes.value.find(pt => pt.name.toLowerCase() === 'cash')
  paymentTypeId.value = cash?.id ?? paymentTypes.value[0]?.id ?? null
  orderNumber.value = generateOrderNumber()
  focusScanField()
})

onUnmounted(() => {
  document.removeEventListener('fullscreenchange', updateFullscreenState)
})
</script>

<template>
  <div class="pos-page">
    <!-- 2-panel layout -->
    <div class="pos-panels">
      <!-- Left: Product grid -->
      <div v-if="!smAndDown || posMobileView === 'products'" class="pos-left-panel">
        <div class="pos-left-header bg-primary rounded-t-lg">
          <div class="pos-left-title">
            <v-btn
              icon="mdi-home"
              color="white"
              variant="tonal"
              size="small"
              to="/"
              class="mr-2"
            />
            <div>
              <div class="text-h6 font-weight-bold text-white">Point of Sale</div>
              <div class="text-caption text-white" style="opacity: 0.85">Process sales quickly</div>
            </div>
          </div>
          <div class="pos-left-actions">
            <template v-if="!smAndDown">
              <v-btn
                color="white"
                variant="outlined"
                size="small"
                prepend-icon="mdi-account"
                class="ml-1"
                @click="openCustomerDialog"
              >
                Customer
              </v-btn>
              <v-btn
                color="white"
                variant="outlined"
                size="small"
                prepend-icon="mdi-receipt-text"
                @click="showTransactions = true"
              >
                Transactions
              </v-btn>
            </template>
            <v-menu v-else location="bottom end">
              <template #activator="{ props }">
                <v-btn
                  v-bind="props"
                  icon="mdi-dots-vertical"
                  color="white"
                  variant="outlined"
                  size="small"
                  class="ml-1"
                />
              </template>
              <v-list density="compact" min-width="180">
                <v-list-item prepend-icon="mdi-account" title="Customer" @click="openCustomerDialog" />
                <v-list-item prepend-icon="mdi-receipt-text" title="Transactions" @click="showTransactions = true" />
                <v-list-item prepend-icon="mdi-undo-variant" title="Returns" @click="showReturnFlow = true" />
              </v-list>
            </v-menu>
          </div>
        </div>

        <div class="pos-product-toolbar">
          <v-select
            v-model="searchBy"
            :items="searchByOptions"
            item-title="title"
            item-value="value"
            variant="outlined"
            density="compact"
            hide-details
            class="pos-search-by-input"
          />

          <v-text-field
            ref="scanFieldRef"
            v-model="productSearch"
            placeholder="Search product name, code, barcode or serial...."
            prepend-inner-icon="mdi-magnify"
            variant="outlined"
            density="compact"
            clearable
            hide-details
            :loading="scanning"
            class="pos-search-input"
          />

          <v-btn
            variant="outlined"
            prepend-icon="mdi-filter-variant"
            @click="openCategoryFilter"
          >
            Filter
          </v-btn>

          <v-btn-toggle
            v-model="productViewMode"
            mandatory
            density="compact"
            variant="tonal"
            color="primary"
            class="pos-view-toggle"
          >
            <v-btn value="grid" icon="mdi-view-grid" size="small" aria-label="Grid view" />
            <v-btn value="list" icon="mdi-view-list" size="small" aria-label="List view" />
          </v-btn-toggle>
        </div>

        <div class="pos-product-area">
          <!-- Grid skeleton -->
          <div v-if="loading && productViewMode === 'grid'" class="pos-product-grid pos-skeleton-grid">
            <div v-for="n in 8" :key="n" class="pos-skeleton-card" />
          </div>

          <!-- List skeleton -->
          <div v-else-if="loading" class="pos-product-list">
            <div v-for="n in 8" :key="n" class="pos-skeleton-list-item" />
          </div>

          <!-- Empty state -->
          <div v-else-if="products.length === 0" class="pos-empty-grid">
            <v-icon size="64" color="medium-emphasis">mdi-package-variant</v-icon>
            <p class="text-h6 text-medium-emphasis mt-2">No products found</p>
          </div>

          <!-- Grid view -->
          <div v-else-if="productViewMode === 'grid'" class="pos-product-grid">
            <div
              v-for="product in products"
              :key="product.id"
              :class="['pos-product-card']"
              @click="addToCart(product)"
            >
              <div class="pos-product-image">
                <v-img
                  v-if="product.image_url"
                  :src="product.image_url"
                  height="100"
                  cover
                  class="pos-img"
                />
                <div v-else class="pos-img-placeholder">
                  <v-icon size="40" color="medium-emphasis">
                    {{ product.product_type === 'service' ? 'mdi-wrench' : 'mdi-package-variant' }}
                  </v-icon>
                </div>
              </div>
              <div class="pos-product-category">{{ formatCategory(product) }}</div>
              <div class="d-flex justify-space-between align-start">
                <div class="pos-product-name flex-grow-1">{{ product.name }}</div>
                <div class="pos-product-price flex-shrink-0">{{ formatAmount(product.regular_price) }}</div>
              </div>
              <div v-if="product.product_type === 'service'" class="d-flex flex-wrap ga-1 mt-1">
                <v-chip size="x-small" color="info" variant="tonal">Service</v-chip>
              </div>
              <div v-else class="d-flex flex-wrap ga-1 mt-1">
                <v-chip v-if="product.product_sequence" size="x-small" variant="flat" color="grey-lighten-3">
                  Code: {{ product.product_sequence }}
                </v-chip>
                <v-chip v-if="product.barcode" size="x-small" variant="flat" color="grey-lighten-3">
                  Barcode: {{ product.barcode }}
                </v-chip>
                <v-chip v-if="product.unit" size="x-small" variant="flat" color="grey-lighten-3">
                  Unit: {{ product.unit.name }}
                </v-chip>
                <v-chip
                  size="x-small"
                  variant="flat"
                  :color="isOutOfStock(product) ? 'error' : (Number(product.stock_quantity) <= 5 ? 'warning' : 'grey-lighten-3')"
                >
                  Stock: {{ formatNumber(product.stock_quantity) }}
                </v-chip>
              </div>
              <div v-if="product.product_type === 'service'" class="pos-product-type-badge">
                Service
              </div>
            </div>
          </div>

          <!-- List view -->
          <div v-else class="pos-product-list">
            <div
              v-for="product in products"
              :key="product.id"
              :class="['pos-product-list-item']"
              @click="addToCart(product)"
            >
              <div class="pos-list-image">
                <v-img
                  v-if="product.image_url"
                  :src="product.image_url"
                  width="56"
                  height="56"
                  cover
                  class="pos-img"
                />
                <div v-else class="pos-img-placeholder-list">
                  <v-icon size="28" color="medium-emphasis">
                    {{ product.product_type === 'service' ? 'mdi-wrench' : 'mdi-package-variant' }}
                  </v-icon>
                </div>
              </div>
              <div class="pos-list-info">
                <div class="d-flex justify-space-between align-start">
                  <div class="pos-list-name flex-grow-1">{{ product.name }}</div>
                  <div class="pos-list-price">{{ formatAmount(product.regular_price) }}</div>
                </div>
                <div class="pos-list-category">{{ formatCategory(product) }}</div>
                <div v-if="product.product_type === 'service'" class="d-flex flex-wrap ga-1 mt-1">
                  <v-chip size="x-small" color="info" variant="tonal">Service</v-chip>
                </div>
                <div v-else class="d-flex flex-wrap ga-1 mt-1">
                  <v-chip v-if="product.product_sequence" size="x-small" variant="flat" color="grey-lighten-3">
                    Code: {{ product.product_sequence }}
                  </v-chip>
                  <v-chip v-if="product.barcode" size="x-small" variant="flat" color="grey-lighten-3">
                    Barcode: {{ product.barcode }}
                  </v-chip>
                  <v-chip v-if="product.unit" size="x-small" variant="flat" color="grey-lighten-3">
                    Unit: {{ product.unit.name }}
                  </v-chip>
                  <v-chip
                    size="x-small"
                    variant="flat"
                    :color="isOutOfStock(product) ? 'error' : (Number(product.stock_quantity) <= 5 ? 'warning' : 'grey-lighten-3')"
                  >
                    Stock: {{ formatNumber(product.stock_quantity) }}
                  </v-chip>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Right: Cart + checkout -->
      <PosCartPanel
        v-if="!smAndDown || posMobileView === 'cart'"
        :order-number="orderNumber"
        :cart="cart"
        :customer-id="customerId"
        :customers="customers"
        :payment-types="paymentTypes"
        :payment-type-id="paymentTypeId"
        :subtotal="subtotal"
        :discount="itemDiscountTotal"
        :total="total"
        @update:payment-type-id="paymentTypeId = $event"
        @clear="clearCart"
        @remove-item="removeFromCart"
        @decrement="decrementQty"
        @increment="incrementQty"
        @open-discount="openDiscountDialog"
        @remove-serial="removeSerial"
        @pay="openPaymentDialog"
      />

      <div v-if="smAndDown" class="pos-mobile-tabs">
        <v-btn
          :color="posMobileView === 'products' ? 'primary' : undefined"
          :variant="posMobileView === 'products' ? 'flat' : 'text'"
          prepend-icon="mdi-view-grid"
          @click="posMobileView = 'products'"
        >
          Products
        </v-btn>
        <v-btn
          :color="posMobileView === 'cart' ? 'primary' : undefined"
          :variant="posMobileView === 'cart' ? 'flat' : 'text'"
          prepend-icon="mdi-cart"
          @click="posMobileView = 'cart'"
        >
          Cart ({{ cart.length }})
        </v-btn>
      </div>

    </div>

    <!-- Batch/Serial Selection Dialog -->
    <AppDialog
      v-if="batchProduct"
      v-model="showBatchDialog"
      :title="batchProduct.name"
      subtitle="Choose an inventory serial to add to the cart"
      icon="mdi-package-variant-closed"
      max-width="720"
      scrollable
    >

        <v-card-text class="pt-4 pb-2">
          <v-row dense class="pos-batch-info mb-3">
            <v-col cols="4" sm="3">
              <div class="text-caption text-medium-emphasis">Unit</div>
              <div class="font-weight-medium">{{ (batchProduct as any).unit?.name || 'Piece' }}</div>
            </v-col>
            <v-col cols="4" sm="3">
              <div class="text-caption text-medium-emphasis">Selling Price</div>
              <div class="font-weight-medium text-success">{{ formatAmount(batchProduct.regular_price) }}</div>
            </v-col>
            <v-col cols="12" sm="6" class="text-sm-right">
              <v-chip color="success" variant="flat" class="mt-1 mt-sm-0">{{ formatNumber(batchProduct.stock_quantity) }} on hand</v-chip>
            </v-col>
          </v-row>

          <v-text-field
            v-model="batchSearch"
            placeholder="Search by serial number..."
            prepend-inner-icon="mdi-magnify"
            variant="outlined"
            density="compact"
            hide-details
            class="mb-3"
          />

          <div class="text-caption text-uppercase font-weight-bold text-medium-emphasis mb-2">
            {{ serialsLoading ? 'Loading serials...' : `${filteredSerials.length} SERIAL${filteredSerials.length !== 1 ? 'S' : ''} AVAILABLE` }}
          </div>

          <div v-if="serialsLoading" class="pos-batch-list">
            <div v-for="n in 6" :key="n" class="pos-skeleton-list-item" />
          </div>

          <div v-else-if="filteredSerials.length > 0" class="pos-batch-list">
            <PosListItem
              v-for="serial in filteredSerials"
              :key="serial.id"
              :title="`Serial: ${serial.serial_number}`"
              subtitle="Stock: 1.0"
              :chip-text="formatSerialStatus(serial.status)"
              :chip-color="serial.status === 'in_stock' ? 'success' : 'error'"
              :unavailable="serial.status !== 'in_stock'"
              :add-disabled="serial.status !== 'in_stock'"
              hide-qty
              @add="addSerialToCart(serial)"
            />
          </div>

          <div v-else class="text-center py-6 text-medium-emphasis">
            No available serials for this product
          </div>
        </v-card-text>

        <v-card-actions class="pa-4 bg-grey-lighten-4">
          <div class="d-flex align-center ga-3">
            <v-text-field
              v-model.number="skipBatchQuantity"
              type="number"
              min="1"
              label="Qty"
              variant="outlined"
              density="compact"
              hide-details
              style="width: 90px"
            />
            <v-btn
              variant="text"
              prepend-icon="mdi-cart-arrow-down"
              :disabled="!batchProduct || Number(batchProduct.stock_quantity) <= 0"
              @click="skipBatchSelection"
            >
              Skip Serial Selection
            </v-btn>
          </div>
          <v-spacer />
          <v-btn variant="text" @click="closeBatchDialog">Close</v-btn>
        </v-card-actions>
    </AppDialog>

    <!-- Customer Dialog -->
    <AppDialog
      v-model="showCustomerDialog"
      :title="customerAddMode ? 'Add Customer' : 'Customer'"
      :icon="customerAddMode ? 'mdi-account-plus' : 'mdi-account'"
      max-width="450"
    >
      <v-card-text v-if="!customerAddMode">
        <div class="d-flex align-center ga-2 mb-3">
          <v-text-field
            v-model="customerFilter"
            placeholder="Filter customer..."
            prepend-inner-icon="mdi-magnify"
            variant="outlined"
            density="compact"
            hide-details
            clearable
            class="flex-grow-1"
          />
          <v-btn
            icon="mdi-plus"
            variant="tonal"
            color="primary"
            height="40"
            min-width="48"
            @click="customerAddMode = true"
          />
        </div>
        <v-list class="pos-customer-list" density="compact">
          <v-list-item
            v-for="customer in filteredCustomers"
            :key="customer.id"
            @click="selectCustomer(customer.id)"
          >
            <template #prepend>
              <v-icon>mdi-account</v-icon>
            </template>
            <v-list-item-title>{{ customer.name }}</v-list-item-title>
            <v-list-item-subtitle v-if="customer.phone">
              {{ customer.phone }}
            </v-list-item-subtitle>
          </v-list-item>
          <v-list-item v-if="filteredCustomers.length === 0">
            <template #prepend>
              <v-icon color="medium-emphasis">mdi-account-off</v-icon>
            </template>
            <v-list-item-title class="text-medium-emphasis">No customers found</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-card-text>
      <v-card-text v-else>
        <v-text-field v-model="customerForm.name" label="Name *" variant="outlined" density="compact" class="mb-3" />
        <v-text-field v-model="customerForm.phone" label="Phone" variant="outlined" density="compact" class="mb-3" />
        <v-text-field v-model="customerForm.email" label="Email" variant="outlined" density="compact" class="mb-3" />
        <v-text-field v-model="customerForm.id_number" label="ID Number" variant="outlined" density="compact" class="mb-3" />
        <v-textarea v-model="customerForm.address" label="Address" rows="2" variant="outlined" density="compact" />
      </v-card-text>
      <v-card-actions>
        <v-spacer v-if="customerAddMode" />
        <v-spacer v-else />
        <v-btn variant="text" @click="customerAddMode ? customerAddMode = false : showCustomerDialog = false">
          {{ customerAddMode ? 'Back' : 'Close' }}
        </v-btn>
        <v-btn
          v-if="customerAddMode"
          color="primary"
          :disabled="!customerForm.name.trim()"
          @click="saveCustomer"
        >
          Save
        </v-btn>
      </v-card-actions>
    </AppDialog>

    <!-- Discount Dialog -->
    <AppDialog
      v-model="showDiscountDialog"
      title="Apply Discount"
      icon="mdi-tag"
      max-width="350"
    >
      <v-card-text>
        <v-text-field
          v-model.number="discountValue"
          :label="discountType === 'percent' ? 'Discount %' : 'Discount amount'"
          type="number"
          :prefix="discountType === 'percent' ? '' : ''"
          :suffix="discountType === 'percent' ? '%' : ''"
          variant="outlined"
          density="compact"
          hide-details
          class="mb-3"
        />
        <v-radio-group v-model="discountType" inline hide-details>
          <v-radio label="Fixed" value="fixed" />
          <v-radio label="Percent" value="percent" />
        </v-radio-group>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="showDiscountDialog = false">Cancel</v-btn>
        <v-btn color="primary" @click="applyDiscount">Apply</v-btn>
      </v-card-actions>
    </AppDialog>

    <!-- Receipt Dialog -->
    <ReceiptDialog
      v-model="showReceiptDialog"
      :sale="receipt"
      @print="printReceipt"
      @new-sale="newSale"
    />

    <v-btn
      icon
      size="large"
      color="primary"
      variant="elevated"
      class="pos-fullscreen-fab"
      @click="toggleFullscreen"
    >
      <v-icon :icon="fullscreenIcon" color="white" />
    </v-btn>

    <v-snackbar v-model="snackbar" :color="snackbarColor" timeout="3000" location="top right">
      {{ snackbarText }}
      <template #actions>
        <v-btn variant="text" @click="snackbar = false">Close</v-btn>
      </template>
    </v-snackbar>

    <PosTransactionsPanel v-model="showTransactions" />
    <PosReturnFlow v-model="showReturnFlow" @processed="showReturnFlow = false" />
    <SettingsDialog v-model="showSettings" />
    <PosPaymentDialog
      v-model="showPaymentDialog"
      :total="total"
      :payment-types="paymentTypes"
      :default-payment-type-id="paymentTypeId"
      @confirm="onPaymentConfirm"
    />

    <AppDialog
      v-model="showCategoryDialog"
      title="Filter by Category"
      icon="mdi-filter-variant"
      max-width="400"
    >
      <v-card-text>
        <v-select
          v-model="tempCategory"
          :items="categoryChips"
          item-title="title"
          item-value="value"
          label="Category"
          variant="outlined"
          density="compact"
          hide-details
        />
      </v-card-text>
      <v-card-actions class="pa-4 pt-0">
        <v-spacer />
        <v-btn variant="text" color="error" @click="clearCategoryFilter">Clear</v-btn>
        <v-btn color="primary" @click="applyCategoryFilter">Apply</v-btn>
      </v-card-actions>
    </AppDialog>
  </div>
</template>
