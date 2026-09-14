<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'
import { formatAmount } from '~/utils/format'
import type { Product } from '~/types/product'
import type { StockOut, StockOutFormData } from '~/types/stock'

const props = defineProps<{
  modelValue: boolean
  loading?: boolean
  stockOut?: StockOut | null
  readOnly?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'save', data: StockOutFormData): void
  (e: 'update', id: number, data: StockOutFormData): void
}>()

const { $api } = useNuxtApp()
const { fetchNextNumber } = useStockOut()
const { notify } = useNotification()
const auth = useAuthStore()

const isOpen = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value)
})

// ---------- Header ----------
const header = reactive({
  stock_out_no: '',
  stock_out_date: '',
  stock_out_type: 'transfer',
  reference_no: '',
  encode_date: '',
  destination_type: 'other',
  destination_name: '',
  checked_by: '',
  approved_by: '',
  remarks: ''
})

const stockOutTypeItems = [
  { title: 'Transfer', value: 'transfer' },
  { title: 'Return to Supplier', value: 'return' },
  { title: 'Sale', value: 'sale' },
  { title: 'Damage', value: 'damage' },
  { title: 'Other', value: 'other' }
]
const destinationTypeItems = [
  { title: 'Supplier', value: 'supplier' },
  { title: 'Customer', value: 'customer' },
  { title: 'Branch', value: 'branch' },
  { title: 'Stockroom', value: 'stockroom' },
  { title: 'Other', value: 'other' }
]

// ---------- Item entry ----------
interface EntryItem {
  product: Product
  quantity: number
  unit_cost: number
  serials: string[]
}

const items = ref<EntryItem[]>([])
const showProductDialog = ref(false)
const productSearch = ref('')
const productOptions = ref<Product[]>([])
const productSearchLoading = ref(false)
const editingItemIndex = ref<number | null>(null)

const availableProductOptions = computed(() =>
  productOptions.value.filter(p => Number(p.stock_quantity) > 0)
)

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
  entrySerials.value = [...item.serials]
  showProductDialog.value = true
  searchProducts('')
  if (item.product.product_type === 'with_serial') {
    fetchInStockSerials(item.product.id)
  }
}

// ---------- Item entry (right pane) ----------
const entryProduct = ref<Product | null>(null)
const entrySerials = ref<string[]>([])
const inStockSerials = ref<string[]>([])
const serialsLoading = ref(false)
const entry = reactive({
  quantity: 1,
  unit_cost: 0
})

const isSerialProduct = computed(() => entryProduct.value?.product_type === 'with_serial')
const serialCountMismatch = computed(() => isSerialProduct.value && entrySerials.value.length !== Number(entry.quantity))
const requiredPositive = (v: number | null) => (v != null && Number(v) > 0) || 'Required'
const entryValid = computed(() =>
  entry.quantity > 0 && entry.unit_cost >= 0 && !serialCountMismatch.value
)

function clearSelection () {
  entryProduct.value = null
  entrySerials.value = []
  inStockSerials.value = []
}

async function fetchInStockSerials (productId: number) {
  serialsLoading.value = true
  try {
    const res = await $api(`/api/products/${productId}/serials`) as any
    const fetched = (res?.data ?? res ?? [])
      .filter((s: any) => s.status === 'in_stock')
      .map((s: any) => s.serial_number)
    // Merge any serials already in entrySerials (e.g. when editing an item whose
    // serials may already be marked 'out' in the DB) so they still appear as chips.
    const selected = entrySerials.value
    const merged = [...fetched]
    for (const s of selected) {
      if (!merged.includes(s)) merged.push(s)
    }
    inStockSerials.value = merged
  } catch {
    inStockSerials.value = [...entrySerials.value]
  } finally {
    serialsLoading.value = false
  }
}

function selectProduct (product: Product) {
  clearSelection()
  entryProduct.value = product
  entry.quantity = 1
  entry.unit_cost = Number(product.cost_price) || 0
  if (product.product_type === 'with_serial') {
    fetchInStockSerials(product.id)
  }
}

function toggleSerial (serial: string) {
  const idx = entrySerials.value.indexOf(serial)
  if (idx >= 0) {
    entrySerials.value.splice(idx, 1)
  } else {
    if (entrySerials.value.length >= Number(entry.quantity)) {
      notify(`You can only select ${entry.quantity} serial(s)`, 'warning')
      return
    }
    entrySerials.value.push(serial)
  }
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

function addItem (close = true) {
  const product = entryProduct.value
  if (!product) return
  if (entry.quantity <= 0) {
    notify('Quantity must be greater than 0', 'warning')
    return
  }
  if (serialCountMismatch.value) {
    notify(`Select exactly ${entry.quantity} serial number(s)`, 'warning')
    return
  }
  if (!isSerialProduct.value && (Number(product.stock_quantity) ?? 0) > 0 && entry.quantity > (Number(product.stock_quantity) ?? 0)) {
    notify(`Quantity exceeds available stock (${product.stock_quantity})`, 'warning')
    return
  }

  if (editingItemIndex.value !== null) {
    items.value[editingItemIndex.value] = {
      product,
      quantity: entry.quantity,
      unit_cost: entry.unit_cost,
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
    existing.serials = [...existing.serials, ...entrySerials.value]
  } else {
    items.value.push({
      product,
      quantity: entry.quantity,
      unit_cost: entry.unit_cost,
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
const isEditing = computed(() => !!props.stockOut)

watch(isOpen, async (open) => {
  if (!open) return
  items.value = []
  productSearch.value = ''
  productOptions.value = []
  clearSelection()

  if (props.stockOut) {
    const so = props.stockOut
    header.stock_out_no = so.stock_out_no
    header.stock_out_date = so.stock_out_date?.slice(0, 16) ?? ''
    header.stock_out_type = so.stock_out_type ?? 'transfer'
    header.reference_no = so.reference_no ?? ''
    header.encode_date = so.encode_date?.slice(0, 10) ?? ''
    header.destination_type = so.destination_type ?? 'other'
    header.destination_name = so.destination_name ?? ''
    header.checked_by = so.checked_by ?? ''
    header.approved_by = so.approved_by ?? ''
    header.remarks = so.remarks ?? ''
    items.value = (so.items ?? [])
      .filter(i => i.product)
      .map(i => ({
        product: i.product as Product,
        quantity: Number(i.quantity),
        unit_cost: Number(i.unit_cost),
        serials: (i.serials ?? []).filter(Boolean) as string[]
      }))
  } else {
    header.stock_out_no = ''
    header.stock_out_date = new Date().toISOString().slice(0, 16)
    header.stock_out_type = 'transfer'
    header.reference_no = ''
    header.encode_date = new Date().toISOString().slice(0, 10)
    header.destination_type = 'other'
    header.destination_name = ''
    header.checked_by = auth.user?.name ?? ''
    header.approved_by = auth.user?.name ?? ''
    header.remarks = ''
    header.stock_out_no = await fetchNextNumber()
  }
})

function cancel () {
  isOpen.value = false
}

function submit () {
  if (props.readOnly) return
  if (!header.stock_out_type) {
    notify('Stock Out Type is required', 'warning')
    return
  }
  if (!header.stock_out_date) {
    notify('Date is required', 'warning')
    return
  }
  if (items.value.length === 0) {
    notify('Add at least one item', 'warning')
    return
  }
  const payload: StockOutFormData = {
    stock_out_date: header.stock_out_date || undefined,
    stock_out_type: header.stock_out_type,
    reference_no: header.reference_no || undefined,
    encode_date: header.encode_date || undefined,
    destination_type: header.destination_type,
    destination_name: header.destination_name || undefined,
    checked_by: header.checked_by || auth.user?.name || undefined,
    approved_by: header.approved_by || auth.user?.name || undefined,
    remarks: header.remarks || undefined,
    items: items.value.map(i => ({
      product_id: i.product.id,
      quantity: i.quantity,
      unit_cost: i.unit_cost,
      serials: i.serials.length ? i.serials : undefined
    }))
  }

  if (isEditing.value && props.stockOut) {
    emit('update', props.stockOut.id, payload)
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
    class="d-flex flex-column stock-out-card"
  >
    <v-toolbar color="primary">
      <v-icon class="ml-3" color="white">mdi-arrow-up-bold-box</v-icon>
      <v-toolbar-title class="text-white ml-2">
        {{ readOnly ? `View Stock Out ${header.stock_out_no}` : isEditing ? `Edit Stock Out ${header.stock_out_no}` : 'Add New Stocks (OUT)' }}
      </v-toolbar-title>
      <v-spacer />
      <span class="text-white font-weight-bold mr-4">{{ readOnly ? 'View Only' : isEditing ? 'Edit Stock Out' : 'Stock Out' }}</span>
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
            This stock-out is shown in <strong>view-only</strong> mode and cannot be modified.
          </template>
          <template v-else>
            Fill in the stock-out details below, then click <strong>Select Item</strong> to add products.
            For serialized items, pick serial numbers that are currently in stock.
            Review the items table, then click <strong>Save Stock Out</strong>.
          </template>
        </v-alert>

        <!-- Header fields -->
        <v-row dense>
          <v-col cols="6" md="3">
            <v-select
              v-model="header.stock_out_type"
              label="Stock Out Type *"
              :items="stockOutTypeItems"
              variant="outlined"
              density="compact"
              :disabled="readOnly"
            />
          </v-col>
          <v-col cols="6" md="3">
            <v-text-field
              v-model="header.stock_out_date"
              label="Date *"
              type="datetime-local"
              variant="outlined"
              density="compact"
              :readonly="readOnly"
            />
          </v-col>
          <v-col cols="6" md="3">
            <v-text-field
              v-model="header.reference_no"
              label="Reference No."
              variant="outlined"
              density="compact"
              :readonly="readOnly"
            />
          </v-col>
          <v-col cols="6" md="3">
            <v-text-field
              v-model="header.encode_date"
              label="Encode Date"
              type="date"
              variant="outlined"
              density="compact"
              :readonly="readOnly"
            />
          </v-col>
          <v-col cols="6" md="3">
            <v-select
              v-model="header.destination_type"
              label="Destination Type"
              :items="destinationTypeItems"
              variant="outlined"
              density="compact"
              :disabled="readOnly"
            />
          </v-col>
          <v-col cols="6" md="3">
            <v-text-field
              v-model="header.destination_name"
              label="Destination (Branch/Stockroom/Supplier/Customer)"
              variant="outlined"
              density="compact"
              :readonly="readOnly"
            />
          </v-col>
          <v-col cols="6" md="3">
            <v-text-field
              :model-value="readOnly ? header.checked_by : (header.checked_by || auth.user?.name || '')"
              label="Checked By"
              variant="outlined"
              density="compact"
              readonly
            />
          </v-col>
          <v-col cols="6" md="3">
            <v-text-field
              :model-value="readOnly ? header.approved_by : (header.approved_by || auth.user?.name || '')"
              label="Approved By"
              variant="outlined"
              density="compact"
              readonly
            />
          </v-col>
          <v-col cols="12">
            <v-textarea
              v-model="header.remarks"
              label="Remarks"
              rows="1"
              variant="outlined"
              density="compact"
              :readonly="readOnly"
            />
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
        <div class="mt-3 border rounded stock-out-items">
        <v-table density="compact" fixed-header height="100%">
          <thead>
            <tr>
              <th class="col-seq">#</th>
              <th>Barcode</th>
              <th>Item Name</th>
              <th class="text-right col-qty">Qty</th>
              <th class="text-center">Serials</th>
              <th class="text-right">Cost</th>
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
              <td colspan="6" class="text-right font-weight-bold">Grand Total</td>
              <td class="text-right font-weight-bold">{{ formatAmount(grandTotal) }}</td>
              <td v-if="!readOnly" />
            </tr>
          </tfoot>
        </v-table>
        <div v-if="!items.length" class="d-flex flex-column align-center justify-center text-medium-emphasis stock-out-empty">
          <v-icon size="48" color="grey-lighten-1" class="mb-2">mdi-package-variant-closed-remove</v-icon>
          <div class="text-body-2">No items added yet.</div>
          <div class="text-caption">Click Select Item to add products to release.</div>
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
          {{ isEditing ? 'Update Stock Out' : 'Save Stock Out' }}
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
      class="d-flex flex-column stock-out-card"
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
            Search and pick a product on the <strong>left</strong>, then enter quantity and cost on the <strong>right</strong>.
            For serialized items, select in-stock serial numbers. Click <strong>Add Item</strong> to add it to the list.
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
                  v-for="product in availableProductOptions"
                  :key="product.id"
                  :title="product.name"
                  :subtitle="`${product.barcode || '—'} · Stock: ${product.stock_quantity ?? 0}`"
                  prepend-icon="mdi-package-variant"
                  :active="entryProduct?.id === product.id"
                  active-color="primary"
                  @click="selectProduct(product)"
                />
                <v-list-item v-if="!availableProductOptions.length && !productSearchLoading">
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
                      <div class="text-caption">Barcode: {{ entryProduct.barcode || '—' }} · Available: {{ entryProduct.stock_quantity ?? 0 }}</div>
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
                  <div class="text-subtitle-2 mb-1">In-Stock Serials ({{ entrySerials.length }}/{{ entry.quantity }})</div>
                  <v-progress-circular v-if="serialsLoading" indeterminate size="20" class="mb-2" />
                  <div v-else class="serial-picker border rounded pa-2 mb-3">
                    <div v-if="!inStockSerials.length" class="text-caption text-medium-emphasis pa-2">No in-stock serials available.</div>
                    <v-chip
                      v-for="s in inStockSerials"
                      :key="s"
                      size="small"
                      class="ma-1"
                      :color="entrySerials.includes(s) ? 'primary' : 'default'"
                      :variant="entrySerials.includes(s) ? 'flat' : 'outlined'"
                      @click="toggleSerial(s)"
                    >
                      <v-icon start size="x-small">{{ entrySerials.includes(s) ? 'mdi-check-circle' : 'mdi-circle-outline' }}</v-icon>
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
                      v-model.number="entry.unit_cost"
                      label="Unit Cost *"
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
.stock-out-card {
  max-height: 100%;
}

.stock-out-items {
  height: 280px;
  overflow-y: auto;
}

.stock-out-items :deep(thead th) {
  background-color: rgb(var(--v-theme-primary));
  color: #fff;
}

.stock-out-empty {
  height: 200px;
}

.product-picker-list {
  height: 340px;
  overflow-y: auto;
}

.entry-placeholder {
  height: 340px;
}

.serial-picker {
  max-height: 180px;
  overflow-y: auto;
}

.col-seq { width: 40px; }
.col-qty { width: 70px; }
.col-action { width: 72px; }

/* Make read-only and disabled inputs fully legible in view mode */
.stock-out-card :deep(.v-field--disabled .v-field__input),
.stock-out-card :deep(.v-field--readonly .v-field__input),
.stock-out-card :deep(.v-field--disabled .v-field-label),
.stock-out-card :deep(.v-field--readonly .v-field-label) {
  color: rgba(var(--v-theme-on-surface), 1) !important;
  opacity: 1 !important;
  -webkit-text-fill-color: rgba(var(--v-theme-on-surface), 1) !important;
}

.stock-out-card :deep(.v-field--disabled .v-field__outline),
.stock-out-card :deep(.v-field--readonly .v-field__outline) {
  opacity: 0.6;
}
</style>
