<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'
import { formatAmount, formatNumber } from '~/utils/format'
import type { Product } from '~/types/product'
import type { StockIn, StockInFormData } from '~/types/stock'

const props = defineProps<{
  modelValue: boolean
  loading?: boolean
  stockIn?: StockIn | null
  readOnly?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'save', data: StockInFormData): void
  (e: 'update', id: number, data: StockInFormData): void
}>()

const { $api } = useNuxtApp()
const { suppliers, fetchSuppliers } = useSuppliers()
const { purchaseOrders, fetchPurchaseOrders } = usePurchaseOrders()
const { fetchNextNumber } = useStockIn()
const { notify } = useNotification()
const auth = useAuthStore()

const isOpen = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value)
})

// ---------- Header ----------
const header = reactive({
  stock_in_no: '',
  purchase_order_id: null as number | null,
  source: '',
  dr_si_no: '',
  dr_date: '',
  supplier_id: null as number | null,
  payment_status: 'unpaid',
  payment_mode: null as string | null,
  payment_description: '',
  paid_date: '',
  requested_by: '',
  remarks: ''
})

const paymentStatusItems = [
  { title: 'Paid', value: 'paid' },
  { title: 'Unpaid', value: 'unpaid' },
  { title: 'Partial', value: 'partial' }
]
const paymentModeItems = [
  { title: 'Cash', value: 'cash' },
  { title: 'Bank Transfer', value: 'bank_transfer' },
  { title: 'Check', value: 'check' },
  { title: 'Credit', value: 'credit' },
  { title: 'E-Wallet', value: 'e_wallet' }
]
const paymentTermItems = [
  { title: 'Cash on Delivery', value: 'COD' },
  { title: '7 Days', value: '7 days' },
  { title: '15 Days', value: '15 days' },
  { title: '30 Days', value: '30 days' },
  { title: '45 Days', value: '45 days' },
  { title: '60 Days', value: '60 days' },
  { title: '90 Days', value: '90 days' }
]
const poItems = computed(() => (purchaseOrders.value ?? []).map(po => ({ title: po.po_number, value: po.id })))
const supplierItems = computed(() => (suppliers.value ?? []).map(s => ({ title: s.name, value: s.id })))

// ---------- Item entry ----------
interface EntryItem {
  product: Product
  quantity: number
  unit_cost: number
  markup_percent: number | null
  markup_amount: number | null
  retail_price: number | null
  serials: string[]
}

const items = ref<EntryItem[]>([])
const showProductDialog = ref(false)
const productSearch = ref('')
const productOptions = ref<Product[]>([])
const productSearchLoading = ref(false)
const editingItemIndex = ref<number | null>(null)

let searchTimer: ReturnType<typeof setTimeout> | null = null
watch(productSearch, (val) => {
  if (searchTimer) clearTimeout(searchTimer)
  if (!showProductDialog.value) return
  searchTimer = setTimeout(() => searchProducts(val || ''), 300)
})

function openProductDialog () {
  productSearch.value = ''
  clearSelection()
  editingItemIndex.value = null
  showProductDialog.value = true
  searchProducts('')
}

function editItem (index: number) {
  const item = items.value[index]
  if (!item) return
  editingItemIndex.value = index
  productSearch.value = ''
  entryProduct.value = item.product
  entry.quantity = item.quantity
  entry.unit_cost = item.unit_cost
  entry.markup_percent = item.markup_percent
  entry.markup_amount = item.markup_amount
  entry.retail_price = item.retail_price
  entrySerials.value = [...item.serials]
  showManualSerials.value = false
  manualSerialsText.value = ''
  showProductDialog.value = true
  searchProducts('')
}

// ---------- Item entry (right pane) ----------
const entryProduct = ref<Product | null>(null)
const serialInput = ref('')
const entrySerials = ref<string[]>([])
const showManualSerials = ref(false)
const manualSerialsText = ref('')
const entry = reactive({
  quantity: 1,
  unit_cost: 0,
  markup_percent: null as number | null,
  markup_amount: null as number | null,
  retail_price: null as number | null
})

const isSerialProduct = computed(() => entryProduct.value?.product_type === 'with_serial')
const serialCountMismatch = computed(() => isSerialProduct.value && entrySerials.value.length !== Number(entry.quantity))
const requiredPositive = (v: number | null) => (v != null && Number(v) > 0) || 'Required'
const required = (v: unknown) => (v != null && v !== '') || 'Required'
const entryValid = computed(() =>
  entry.quantity > 0 && entry.unit_cost > 0 && (entry.retail_price ?? 0) > 0 && !serialCountMismatch.value
)

function clearSelection () {
  entryProduct.value = null
  entrySerials.value = []
  serialInput.value = ''
  showManualSerials.value = false
  manualSerialsText.value = ''
}

function selectProduct (product: Product) {
  clearSelection()
  entryProduct.value = product
  entry.quantity = 1
  entry.unit_cost = Number(product.cost_price) || 0
  entry.markup_percent = product.markup_percent != null ? Number(product.markup_percent) : null
  entry.markup_amount = product.markup_amount != null ? Number(product.markup_amount) : null
  entry.retail_price = product.regular_price != null ? Number(product.regular_price) : null
}

const verifyingSerial = ref(false)

function isSerialInCurrentItems (serial: string): boolean {
  const current = entrySerials.value
  const inOtherItems = items.value.some((i, idx) => idx !== editingItemIndex.value && i.serials?.some((s: string) => s.trim() === serial))
  return current.includes(serial) || inOtherItems
}

async function serialExists (serial: string): Promise<boolean> {
  verifyingSerial.value = true
  try {
    const res = await $api('/api/serials/verify', { query: { serial } }) as any
    return !!res?.found
  } catch {
    // If verify fails, block to be safe
    return true
  } finally {
    verifyingSerial.value = false
  }
}

async function addSerial () {
  const s = serialInput.value.trim()
  if (!s) return
  if (isSerialInCurrentItems(s)) {
    notify(`Serial "${s}" already added`, 'warning')
    serialInput.value = ''
    return
  }
  if (await serialExists(s)) {
    notify(`Serial "${s}" already exists. You cannot receive a duplicate serial number.`, 'error')
    serialInput.value = ''
    return
  }
  entrySerials.value.push(s)
  serialInput.value = ''
}

async function addManualSerials () {
  const lines = manualSerialsText.value.split('\n').map(s => s.trim()).filter(Boolean)
  if (lines.length === 0) return

  const toAdd: string[] = []
  const duplicates: string[] = []
  const existing: string[] = []

  // de-duplicate within current entry and across current items first
  for (const s of lines) {
    if (isSerialInCurrentItems(s) || toAdd.includes(s)) {
      duplicates.push(s)
    } else {
      toAdd.push(s)
    }
  }

  // verify each remaining serial against the database
  for (const s of toAdd) {
    if (await serialExists(s)) {
      existing.push(s)
    }
  }

  entrySerials.value.push(...toAdd.filter(s => !existing.includes(s)))

  if (duplicates.length) notify(`${duplicates.length} duplicate(s) skipped`, 'warning')
  if (existing.length) notify(`${existing.length} serial(s) already exist in stock and were not added`, 'error')
  if (toAdd.length - existing.length === 0) notify('No valid new serials to add', 'info')

  manualSerialsText.value = ''
  showManualSerials.value = false
}

async function searchProducts (query: string) {
  productSearchLoading.value = true
  try {
    const response = await $api('/api/products', {
      query: { search: query, per_page: 20, is_active: true }
    }) as any
    productOptions.value = response?.data ?? []
  } catch {
    productOptions.value = []
  } finally {
    productSearchLoading.value = false
  }
}


// markup % → retail price auto-compute (and vice versa)
let priceSync = false
watch(() => [entry.unit_cost, entry.markup_percent], () => {
  if (priceSync) return
  if (entry.markup_percent != null) {
    priceSync = true
    const amount = entry.unit_cost * (entry.markup_percent / 100)
    entry.markup_amount = Number(amount.toFixed(2))
    entry.retail_price = Number((entry.unit_cost + amount).toFixed(2))
    priceSync = false
  }
})

watch(() => entry.retail_price, (price) => {
  if (priceSync) return
  if (price != null && entry.unit_cost > 0) {
    priceSync = true
    const amount = price - entry.unit_cost
    entry.markup_amount = Number(amount.toFixed(2))
    entry.markup_percent = Number(((amount / entry.unit_cost) * 100).toFixed(2))
    priceSync = false
  }
})

function addItem (close = true) {
  const product = entryProduct.value
  if (!product) return
  if (entry.quantity <= 0) {
    notify('Quantity must be greater than 0', 'warning')
    return
  }
  if (serialCountMismatch.value) {
    notify(`Enter exactly ${entry.quantity} serial number(s)`, 'warning')
    return
  }

  if (editingItemIndex.value !== null) {
    items.value[editingItemIndex.value] = {
      product,
      quantity: entry.quantity,
      unit_cost: entry.unit_cost,
      markup_percent: entry.markup_percent,
      markup_amount: entry.markup_amount,
      retail_price: entry.retail_price,
      serials: [...entrySerials.value]
    }
    editingItemIndex.value = null
    clearSelection()
    showProductDialog.value = false
    return
  }

  const existing = items.value.find(i => i.product.id === product.id)
  if (existing) {
    existing.quantity += entry.quantity
    existing.unit_cost = entry.unit_cost
    existing.markup_percent = entry.markup_percent
    existing.markup_amount = entry.markup_amount
    existing.retail_price = entry.retail_price
    existing.serials = [...existing.serials, ...entrySerials.value]
  } else {
    items.value.push({
      product,
      quantity: entry.quantity,
      unit_cost: entry.unit_cost,
      markup_percent: entry.markup_percent,
      markup_amount: entry.markup_amount,
      retail_price: entry.retail_price,
      serials: [...entrySerials.value]
    })
  }
  clearSelection()
  if (close) showProductDialog.value = false
}

function removeItem (index: number) {
  items.value.splice(index, 1)
}

function closeProductDialog () {
  editingItemIndex.value = null
  clearSelection()
  showProductDialog.value = false
}

const grandTotal = computed(() =>
  items.value.reduce((sum, i) => sum + i.quantity * i.unit_cost, 0)
)


// ---------- Lifecycle ----------
const isEditing = computed(() => !!props.stockIn)

watch(isOpen, async (open) => {
  if (!open) return
  items.value = []
  productSearch.value = ''
  productOptions.value = []
  clearSelection()

  if (props.stockIn) {
    const si = props.stockIn
    header.stock_in_no = si.stock_in_no
    header.purchase_order_id = si.purchase_order_id ?? null
    header.source = si.source ?? ''
    header.dr_si_no = si.dr_si_no ?? ''
    header.dr_date = si.dr_date?.slice(0, 10) ?? ''
    header.supplier_id = si.supplier_id ?? null
    header.payment_status = si.payment_status ?? 'unpaid'
    header.payment_mode = si.payment_mode ?? null
    header.payment_description = si.payment_description ?? ''
    header.paid_date = si.paid_date?.slice(0, 10) ?? ''
    header.requested_by = si.requested_by ?? ''
    header.remarks = si.remarks ?? ''
    items.value = (si.items ?? [])
      .filter(i => i.product)
      .map(i => ({
        product: i.product as Product,
        quantity: Number(i.quantity),
        unit_cost: Number(i.unit_cost),
        markup_percent: i.markup_percent != null ? Number(i.markup_percent) : null,
        markup_amount: i.markup_amount != null ? Number(i.markup_amount) : null,
        retail_price: i.retail_price != null ? Number(i.retail_price) : null,
        serials: (i.serials ?? []).map((s: any) => (typeof s === 'string' ? s : s?.serial_number)).filter(Boolean) as string[]
      }))
  } else {
    header.stock_in_no = ''
    header.purchase_order_id = null
    header.source = ''
    header.dr_si_no = ''
    header.dr_date = ''
    header.supplier_id = null
    header.payment_status = 'unpaid'
    header.payment_mode = null
    header.payment_description = ''
    header.paid_date = ''
    header.requested_by = ''
    header.remarks = ''
    header.stock_in_no = await fetchNextNumber()
  }
  await Promise.all([fetchSuppliers(), fetchPurchaseOrders({ per_page: 100 })])
})

function cancel () {
  isOpen.value = false
}

function submit () {
  if (props.readOnly) return
  if (!header.supplier_id) {
    notify('Supplier is required', 'warning')
    return
  }
  if (!header.dr_si_no?.trim()) {
    notify('Supplier DR / SI No. is required', 'warning')
    return
  }
  if (!header.dr_date) {
    notify('DR Date is required', 'warning')
    return
  }
  if (!header.payment_status) {
    notify('Payment Status is required', 'warning')
    return
  }
  if (header.payment_status === 'paid' && !header.paid_date) {
    notify('Paid Date is required when payment status is Paid', 'warning')
    return
  }
  if (!header.payment_mode) {
    notify('Payment Mode is required', 'warning')
    return
  }
  if (!header.payment_description) {
    notify('Payment Terms is required', 'warning')
    return
  }
  if (!auth.user?.id) {
    notify('Received By is required', 'warning')
    return
  }
  if (items.value.length === 0) {
    notify('Add at least one item', 'warning')
    return
  }
  const payload: StockInFormData = {
    purchase_order_id: header.purchase_order_id ?? undefined,
    source: header.source || undefined,
    dr_si_no: header.dr_si_no || undefined,
    dr_date: header.dr_date || undefined,
    supplier_id: header.supplier_id ?? undefined,
    payment_status: header.payment_status,
    payment_mode: header.payment_mode ?? undefined,
    payment_description: header.payment_description || undefined,
    paid_date: header.paid_date || undefined,
    requested_by: header.requested_by || undefined,
    received_by: auth.user?.id,
    remarks: header.remarks || undefined,
    items: items.value.map(i => ({
      product_id: i.product.id,
      quantity: i.quantity,
      unit_cost: i.unit_cost,
      markup_percent: i.markup_percent ?? undefined,
      markup_amount: i.markup_amount ?? undefined,
      retail_price: i.retail_price ?? undefined,
      serials: i.serials.length
        ? i.serials.map((s: any) => (typeof s === 'string' ? s : s.serial_number)).filter((s: any) => s)
        : undefined
    }))
  }

  if (isEditing.value && props.stockIn) {
    emit('update', props.stockIn.id, payload)
  } else {
    emit('save', payload)
  }
}
</script>

<template>
  <AppDialog
    v-model="isOpen"
    max-width="1100"
    persistent
    scrollable
    transition="dialog-top-transition"
    no-header
    class="d-flex flex-column stock-in-card"
  >
    <v-toolbar color="primary">
      <v-icon class="ml-3" color="white">mdi-arrow-down-bold-box</v-icon>
      <v-toolbar-title class="text-white ml-2">
        {{ readOnly ? `View Stock In ${header.stock_in_no}` : isEditing ? `Edit Stock In ${header.stock_in_no}` : 'Add New Stocks (IN)' }}
      </v-toolbar-title>
      <v-spacer />
      <span class="text-white font-weight-bold mr-4">{{ readOnly ? 'View Only (Paid)' : isEditing ? 'Edit Receiving' : 'Stock Receiving' }}</span>
      <v-btn icon="mdi-close" variant="text" color="white" @click="cancel" />
    </v-toolbar>

    <v-form @submit.prevent="submit" class="d-flex flex-column flex-grow-1 overflow-hidden">
    <v-card-text class="pa-3 flex-grow-1 overflow-y-auto">
        <v-alert
          type="info"
          variant="tonal"
          density="compact"
          class="mb-3 text-caption"
          :icon="readOnly ? 'mdi-lock-outline' : 'mdi-information-outline'"
        >
          <template v-if="readOnly">
            This stock-in is fully paid and shown in <strong>view-only</strong> mode. To make changes, its payment status must first be reverted from Paid.
          </template>
          <template v-else>
            Fill in the receiving details below, then click <strong>Select Item</strong> to add products.
            For serialized items, scan or type each serial number — the count must match the quantity.
            Review the items table, then click <strong>Save Stock In</strong>.
          </template>
        </v-alert>

        <!-- Header fields -->
        <v-row dense>
          <v-col cols="6" md="3">
            <v-select
              v-model="header.purchase_order_id"
              label="P.O. / Source (optional)"
              :items="poItems"
              variant="outlined"
              density="compact"
              clearable
              :disabled="readOnly"
            />
          </v-col>
          <v-col cols="6" md="3">
            <v-text-field v-model="header.source" label="Source (free text)" variant="outlined" density="compact" :readonly="readOnly" />
          </v-col>
          <v-col cols="6" md="3">
            <v-text-field v-model="header.dr_si_no" label="Supplier DR / SI No. *" variant="outlined" density="compact" :rules="[required]" :readonly="readOnly" />
          </v-col>
          <v-col cols="6" md="3">
            <v-text-field v-model="header.dr_date" label="DR Date *" type="date" variant="outlined" density="compact" :rules="[required]" :readonly="readOnly" />
          </v-col>
          <v-col cols="6" md="3">
            <v-select
              v-model="header.supplier_id"
              label="Supplier *"
              :items="supplierItems"
              variant="outlined"
              density="compact"
              :rules="[required]"
              :disabled="readOnly"
            />
          </v-col>
          <v-col cols="6" md="3">
            <v-text-field v-model="header.requested_by" label="Requested / Ordered By (optional)" variant="outlined" density="compact" :readonly="readOnly" />
          </v-col>
          <v-col cols="6" md="3">
            <v-select
              v-model="header.payment_status"
              label="Payment Status *"
              :items="paymentStatusItems"
              variant="outlined"
              density="compact"
              :rules="[required]"
              :disabled="readOnly"
            />
          </v-col>
          <v-col cols="6" md="3">
            <v-select
              v-model="header.payment_mode"
              label="Payment Mode *"
              :items="paymentModeItems"
              variant="outlined"
              density="compact"
              :rules="[required]"
              :disabled="readOnly"
            />
          </v-col>
          <v-col cols="12" md="3">
            <v-select
              v-model="header.payment_description"
              label="Payment Terms / Paid Via *"
              :items="paymentTermItems"
              variant="outlined"
              density="compact"
              :rules="[required]"
              :disabled="readOnly"
            />
          </v-col>
          <v-col cols="12" md="3">
            <v-text-field
              v-model="header.paid_date"
              :label="header.payment_status === 'paid' ? 'Paid Date *' : 'Paid Date'"
              type="date"
              variant="outlined"
              density="compact"
              :rules="header.payment_status === 'paid' ? [required] : []"
              :readonly="readOnly"
            />
          </v-col>
          <v-col cols="12" md="3">
            <v-text-field :model-value="auth.user?.name" label="Received By *" variant="outlined" density="compact" readonly :rules="[required]" />
          </v-col>
        </v-row>

        <v-divider class="my-3" />

        <!-- Product picker -->
        <v-row v-if="!readOnly" dense align="center">
          <v-col cols="12">
            <v-btn
              color="primary"
              variant="tonal"
              prepend-icon="mdi-package-variant-plus"
              @click="openProductDialog"
            >
              Select Item
            </v-btn>
          </v-col>
        </v-row>

        <!-- Selected items -->
        <div class="mt-3 border rounded stock-in-items">
        <v-table density="compact" fixed-header height="100%">
          <thead>
            <tr>
              <th class="col-seq">#</th>
              <th>Barcode</th>
              <th>Item Name</th>
              <th class="text-right col-qty">Qty</th>
              <th class="text-center">Serials</th>
              <th class="text-right">Cost</th>
              <th class="text-right">Markup %</th>
              <th class="text-right">Retail</th>
              <th class="text-right">Total</th>
              <th v-if="!readOnly" class="col-action" />
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, idx) in items" :key="item.product.id">
              <td>{{ idx + 1 }}</td>
              <td>{{ item.product.barcode }}</td>
              <td>{{ item.product.name }}</td>
              <td class="text-right">{{ item.quantity }}</td>
              <td class="text-center">
                <v-tooltip v-if="item.serials.length" location="top">
                  <template #activator="{ props: tipProps }">
                    <v-chip v-bind="tipProps" size="x-small" color="teal">{{ item.serials.length }}</v-chip>
                  </template>
                  <div v-for="(s, i) in item.serials" :key="i">{{ s }}</div>
                </v-tooltip>
                <span v-else>—</span>
              </td>
              <td class="text-right">{{ formatAmount(item.unit_cost) }}</td>
              <td class="text-right">{{ item.markup_percent ?? '—' }}</td>
              <td class="text-right">{{ formatAmount(item.retail_price) }}</td>
              <td class="text-right">{{ formatAmount(item.quantity * item.unit_cost) }}</td>
              <td v-if="!readOnly">
                <div class="d-flex ga-1">
                  <v-btn icon="mdi-pencil" variant="text" size="x-small" color="primary" aria-label="Edit item" @click="editItem(idx)" />
                  <v-btn icon="mdi-delete" variant="text" size="x-small" color="error" aria-label="Remove item" @click="removeItem(idx)" />
                </div>
              </td>
            </tr>
          </tbody>
          <tfoot v-if="items.length">
            <tr>
              <td colspan="8" class="text-right font-weight-bold">Grand Total</td>
              <td class="text-right font-weight-bold">{{ formatAmount(grandTotal) }}</td>
              <td v-if="!readOnly" />
            </tr>
          </tfoot>
        </v-table>
        <div v-if="!items.length" class="d-flex flex-column align-center justify-center text-medium-emphasis stock-in-empty">
          <v-icon size="48" color="grey-lighten-1" class="mb-2">mdi-package-variant-closed-remove</v-icon>
          <div class="text-body-2">No items added yet.</div>
          <div class="text-caption">Search or scan a product above to add items.</div>
        </div>
        </div>
      </v-card-text>

      <v-card-actions class="pa-3 flex-shrink-0 ga-2 border-t">
        <v-btn color="error" variant="elevated" prepend-icon="mdi-close" :disabled="loading" @click="cancel">
          Close
        </v-btn>
        <v-spacer />
        <v-btn
          v-if="!readOnly"
          type="submit"
          color="success"
          variant="elevated"
          prepend-icon="mdi-content-save"
          :loading="loading"
          :disabled="!items.length"
        >
          {{ isEditing ? 'Update Stock In' : 'Save Stock In' }}
        </v-btn>
      </v-card-actions>
      </v-form>

    <!-- Select Item dialog: product list (left) + entry form (right) -->
    <AppDialog
      v-model="showProductDialog"
      max-width="920"
      persistent
      scrollable
      no-header
      class="d-flex flex-column stock-in-card"
    >
      <v-toolbar color="primary" density="compact">
        <v-icon class="ml-3" color="white">mdi-magnify</v-icon>
        <v-toolbar-title class="text-white ml-2">
          {{ editingItemIndex !== null ? 'Edit Item' : 'Select Item' }}
        </v-toolbar-title>
        <v-spacer />
        <v-btn icon="mdi-close" variant="text" color="white" @click="closeProductDialog" />
        </v-toolbar>
        <v-card-text class="pa-3">
          <v-alert type="info" variant="tonal" density="compact" class="mb-3 text-caption" icon="mdi-information-outline">
            Search and pick a product on the <strong>left</strong>, then enter its serials, cost, markup,
            selling price, and quantity on the <strong>right</strong>. Click <strong>Add Item</strong> to add it to the list.
          </v-alert>
          <v-row dense>
            <!-- Left: product list -->
            <v-col cols="12" md="6">
              <v-text-field
                v-model="productSearch"
                label="Search product by name or barcode"
                prepend-inner-icon="mdi-magnify"
                variant="outlined"
                density="compact"
                hide-details="auto"
                clearable
                autofocus
                :loading="productSearchLoading"
              />
              <v-list density="compact" class="product-picker-list border rounded mt-2">
                <v-list-item
                  v-for="product in productOptions"
                  :key="product.id"
                  :title="product.name"
                  :subtitle="product.barcode || '—'"
                  prepend-icon="mdi-package-variant"
                  :active="entryProduct?.id === product.id"
                  active-color="primary"
                  @click="selectProduct(product)"
                />
                <v-list-item v-if="!productOptions.length && !productSearchLoading">
                  <div class="d-flex flex-column align-center text-medium-emphasis py-4 w-100">
                    <v-icon size="40" color="grey-lighten-1" class="mb-2">mdi-package-variant-closed-remove</v-icon>
                    <div class="text-body-2">No products found.</div>
                  </div>
                </v-list-item>
              </v-list>
            </v-col>

            <!-- Right: entry form -->
            <v-col cols="12" md="6">
              <template v-if="entryProduct">
                <v-alert type="info" variant="tonal" density="compact" class="mb-3 text-caption">
                  <div class="d-flex align-center">
                    <div class="flex-grow-1">
                      <div class="text-subtitle-2 font-weight-bold">{{ entryProduct.name }}</div>
                      <div class="text-caption">Barcode: {{ entryProduct.barcode || '—' }}</div>
                    </div>
                    <v-btn
                      icon="mdi-close-circle"
                      variant="text"
                      size="small"
                      color="error"
                      aria-label="Clear selection"
                      @click="clearSelection"
                    />
                  </div>
                </v-alert>
                <template v-if="isSerialProduct">
                  <v-text-field
                    v-model="serialInput"
                    :label="`Serial / Barcode (scan or type, Enter to add — ${entrySerials.length}/${entry.quantity})`"
                    prepend-inner-icon="mdi-barcode-scan"
                    variant="outlined"
                    density="compact"
                    hide-details="auto"
                    autofocus
                    @keyup.enter="addSerial"
                  >
                    <template #append-inner>
                      <v-btn
                        icon="mdi-clipboard-text-multiple"
                        variant="text"
                        size="small"
                        density="compact"
                        aria-label="Manual entry"
                        @click="showManualSerials = !showManualSerials"
                      />
                    </template>
                  </v-text-field>
                  <v-expand-transition>
                    <div v-if="showManualSerials" class="mt-2">
                      <v-textarea
                        v-model="manualSerialsText"
                        label="Manual entry — one serial per line"
                        rows="3"
                        variant="outlined"
                        density="compact"
                        hide-details="auto"
                      />
                      <v-btn
                        size="small"
                        variant="tonal"
                        color="primary"
                        class="mt-1"
                        prepend-icon="mdi-plus"
                        :disabled="!manualSerialsText.trim()"
                        @click="addManualSerials"
                      >
                        Add Serials
                      </v-btn>
                    </div>
                  </v-expand-transition>
                  <div class="d-flex flex-wrap ga-1 mt-2 mb-3">
                    <v-chip
                      v-for="(s, i) in entrySerials"
                      :key="i"
                      size="small"
                      color="teal"
                      closable
                      @click:close="entrySerials.splice(i, 1)"
                    >
                      {{ s }}
                    </v-chip>
                  </div>
                  <v-alert
                    v-if="serialCountMismatch && entrySerials.length > 0"
                    type="warning"
                    density="compact"
                    class="mb-3"
                  >
                    Serial count must equal quantity ({{ entry.quantity }})
                  </v-alert>
                </template>
                <v-row dense>
                  <v-col cols="6">
                    <v-text-field
                      class="mt-2"
                      v-model.number="entry.unit_cost"
                      label="Capital / Cost *"
                      type="number"
                      min="0"
                      prefix="₱"
                      variant="outlined"
                      density="compact"
                      :rules="[requiredPositive]"
                    />
                  </v-col>
                  <v-col cols="6">
                    <v-text-field
                      class="mt-2"
                      v-model.number="entry.quantity"
                      label="Quantity *"
                      type="number"
                      min="1"
                      variant="outlined"
                      density="compact"
                      :rules="[requiredPositive]"
                    />
                  </v-col>
                  <v-col cols="6">
                    <v-text-field
                      class="mt-2"
                      v-model.number="entry.markup_percent"
                      label="Markup %"
                      type="number"
                      min="0"
                      variant="outlined"
                      density="compact"
                    />
                  </v-col>
                  <v-col cols="6">
                    <v-text-field
                      class="mt-2"
                      :model-value="formatNumber(entry.markup_amount ?? 0)"
                      label="Markup Amount"
                      prefix="₱"
                      variant="outlined"
                      density="compact"
                      readonly
                    />
                  </v-col>
                  <v-col cols="6">
                    <v-text-field
                      class="mt-2"
                      v-model.number="entry.retail_price"
                      label="Selling Price (Retail) *"
                      type="number"
                      min="0"
                      prefix="₱"
                      variant="outlined"
                      density="compact"
                      :rules="[requiredPositive]"
                    />
                  </v-col>
                </v-row>
              </template>
              <div v-else class="d-flex flex-column align-center justify-center text-medium-emphasis entry-placeholder">
                <v-icon size="48" color="grey-lighten-1" class="mb-2">mdi-cursor-default-click</v-icon>
                <div class="text-body-2">Select a product on the left</div>
              </div>
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions class="pa-3 flex-shrink-0 ga-2 border-t">
          <v-btn color="error" variant="elevated" prepend-icon="mdi-close" @click="closeProductDialog">
            Close
          </v-btn>
          <v-spacer />
          <v-btn
            v-if="editingItemIndex === null"
            color="secondary"
            variant="elevated"
            prepend-icon="mdi-plus-box-multiple"
            :disabled="!entryProduct || !entryValid"
            @click="addItem(false)"
          >
            Add Other Item
          </v-btn>
          <v-btn
            color="primary"
            variant="elevated"
            :prepend-icon="editingItemIndex !== null ? 'mdi-content-save-edit' : 'mdi-plus'"
            :disabled="!entryProduct || !entryValid"
            @click="addItem(true)"
          >
            {{ editingItemIndex !== null ? 'Update Item' : 'Add Item & Close' }}
          </v-btn>
        </v-card-actions>
    </AppDialog>
  </AppDialog>
</template>

<style scoped>
.stock-in-card {
  max-height: 100%;
}

.stock-in-items {
  height: 280px;
  overflow-y: auto;
}

.stock-in-items :deep(thead th) {
  background-color: rgb(var(--v-theme-primary));
  color: #fff;
}

.stock-in-empty {
  height: 200px;
}

.product-picker-list {
  height: 340px;
  overflow-y: auto;
}

.entry-placeholder {
  height: 340px;
}

/* Make read-only and disabled inputs fully legible in view mode */
.stock-in-card :deep(.v-field--disabled .v-field__input),
.stock-in-card :deep(.v-field--readonly .v-field__input),
.stock-in-card :deep(.v-field--disabled .v-field-label),
.stock-in-card :deep(.v-field--readonly .v-field-label) {
  color: rgba(var(--v-theme-on-surface), 1) !important;
  opacity: 1 !important;
  -webkit-text-fill-color: rgba(var(--v-theme-on-surface), 1) !important;
}

.stock-in-card :deep(.v-field--disabled .v-field__outline),
.stock-in-card :deep(.v-field--readonly .v-field__outline) {
  opacity: 0.6;
}
.col-barcode { width: 110px; }
.col-qty { width: 70px; }
.col-serials { width: 70px; }
.col-cost { width: 90px; }
.col-markup { width: 70px; }
.col-retail { width: 90px; }
.col-total { width: 100px; }
.col-action { width: 72px; }
</style>
