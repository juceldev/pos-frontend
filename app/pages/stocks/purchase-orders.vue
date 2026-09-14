<script setup lang="ts">
import { formatAmount } from '~/utils/format'
import { usePurchaseOrders, type PurchaseOrder } from '~/composables/usePurchaseOrders'
import { useSuppliers } from '~/composables/useSuppliers'
import { useProducts } from '~/composables/useProducts'
import { usePermission } from '~/composables/usePermission'

definePageMeta({ middleware: 'auth' })

const { purchaseOrders, meta, loading, error, fetchPurchaseOrders, createPurchaseOrder, deletePurchaseOrder, receivePurchaseOrder } = usePurchaseOrders()
const { suppliers, fetchSuppliers } = useSuppliers()
const { products, fetchProducts } = useProducts()
const { hasPermission } = usePermission()

const search = ref('')
const statusFilter = ref<string | null>(null)
const page = ref(1)
const perPage = ref(15)
const showForm = ref(false)
const showReceive = ref(false)
const selectedPO = ref<PurchaseOrder | null>(null)

const headers = [
  { title: 'PO #', key: 'po_number', sortable: true },
  { title: 'Supplier', key: 'supplier.name', sortable: false },
  { title: 'Status', key: 'status', sortable: true },
  { title: 'Expected', key: 'expected_date', sortable: true },
  { title: 'Total', key: 'total', sortable: true, align: 'end' },
  { title: 'Actions', key: 'actions', sortable: false, align: 'end' }
]

const statusColor = (s: string) => ({ draft: 'grey', ordered: 'info', partial: 'warning', received: 'success', cancelled: 'error' }[s] ?? 'grey')

const filters = computed(() => ({
  page: page.value,
  per_page: perPage.value,
  search: search.value || undefined,
  status: statusFilter.value || undefined,
  sort_by: 'created_at',
  sort_direction: 'desc'
}))

const activeFilterCount = computed(() =>
  [statusFilter.value].filter(v => v !== null && v !== undefined).length
)

function clearAllFilters () {
  search.value = ''
  statusFilter.value = null
}

async function load () {
  if (!import.meta.client) return
  await fetchPurchaseOrders(filters.value)
}

// --- Create PO form ---
const form = reactive({
  supplier_id: null as number | null,
  expected_date: '',
  notes: '',
  items: [] as { product_id: number | null; quantity: number; unit_cost: number }[]
})

async function openForm () {
  showForm.value = true
  form.supplier_id = null
  form.expected_date = ''
  form.notes = ''
  form.items = [{ product_id: null, quantity: 1, unit_cost: 0 }]
  await Promise.all([fetchSuppliers(), fetchProducts({ perPage: 200 })])
}

function addItem () {
  form.items.push({ product_id: null, quantity: 1, unit_cost: 0 })
}

const formTotal = computed(() =>
  form.items.reduce((s, i) => s + (i.quantity || 0) * (i.unit_cost || 0), 0)
)

async function save () {
  const ok = await createPurchaseOrder({
    supplier_id: form.supplier_id,
    expected_date: form.expected_date || null,
    notes: form.notes,
    status: 'ordered',
    items: form.items.filter(i => i.product_id && i.quantity > 0) as any
  })
  if (ok) {
    showForm.value = false
    await load()
    snackbarText.value = 'Purchase order created'
    snackbarColor.value = 'success'
    snackbar.value = true
  }
}

// --- Receive ---
const receiveItems = ref<{ item_id: number; quantity: number; serials: string }[]>([])

function openReceive (po: PurchaseOrder) {
  selectedPO.value = po
  receiveItems.value = (po.items ?? [])
    .filter(i => (i.received_quantity ?? 0) < i.quantity)
    .map(i => ({ item_id: i.id!, quantity: i.quantity - (i.received_quantity ?? 0), serials: '' }))
  showReceive.value = true
}

async function saveReceive () {
  if (!selectedPO.value) return
  const payload = receiveItems.value
    .filter(i => i.quantity > 0)
    .map(i => ({
      item_id: i.item_id,
      quantity: i.quantity,
      serials: i.serials.split('\n').map(s => s.trim()).filter(Boolean)
    }))
  const ok = await receivePurchaseOrder(selectedPO.value.id, payload)
  if (ok) {
    showReceive.value = false
    await load()
    snackbarText.value = 'Purchase order received'
    snackbarColor.value = 'success'
    snackbar.value = true
  }
}

async function handleDelete (po: PurchaseOrder) {
  if (!confirm(`Delete ${po.po_number}?`)) return
  const ok = await deletePurchaseOrder(po.id)
  if (ok) await load()
}

const snackbar = ref(false)
const snackbarText = ref('')
const snackbarColor = ref('success')
watch(error, (msg) => { if (msg) { snackbarText.value = msg; snackbarColor.value = 'error'; snackbar.value = true } })

onMounted(load)
watch(filters, load, { deep: true })
</script>

<template>
  <AppPageHeader title="P.O. Purchase Order List" subtitle="Manage supplier purchase orders">
    <template #actions>
      <v-btn v-if="hasPermission('purchase_orders.create')" color="primary" prepend-icon="mdi-plus" @click="openForm">
        Create New P.O.
      </v-btn>
    </template>
  </AppPageHeader>

  <AppCard class="mb-4">
    <v-row dense align="center">
      <v-col cols="12" sm="6" md="5">
        <v-text-field v-model="search" label="Search" prepend-inner-icon="mdi-magnify" clearable />
      </v-col>
      <v-col cols="12" sm="6" md="7" class="d-flex align-center justify-start ga-2">
        <v-menu :close-on-content-click="false" location="bottom end">
          <template #activator="{ props: menuProps }">
            <v-badge
              :content="activeFilterCount"
              :model-value="activeFilterCount > 0"
              color="primary"
              offset-x="4"
              offset-y="4"
            >
              <v-btn variant="outlined" prepend-icon="mdi-filter-variant" v-bind="menuProps">
                Filters
              </v-btn>
            </v-badge>
          </template>
          <v-card min-width="280" class="pa-3">
            <div class="text-subtitle-2 mb-2">Filter by Status</div>
            <v-select
              v-model="statusFilter"
              label="Status"
              :items="[
                { title: 'All', value: null },
                { title: 'Draft', value: 'draft' },
                { title: 'Ordered', value: 'ordered' },
                { title: 'Partial', value: 'partial' },
                { title: 'Received', value: 'received' },
                { title: 'Cancelled', value: 'cancelled' }
              ]"
              clearable
              class="mb-2"
            />
            <v-btn
              block
              class="mt-2"
              size="small"
              variant="tonal"
              color="error"
              prepend-icon="mdi-filter-remove"
              :disabled="activeFilterCount === 0 && !search"
              @click="clearAllFilters"
            >
              Clear All
            </v-btn>
          </v-card>
        </v-menu>
        <v-btn
          icon="mdi-refresh"
          variant="text"
          aria-label="Refresh"
          :loading="loading"
          @click="load"
        />
      </v-col>
    </v-row>
  </AppCard>

  <AppCard>
    <AppDataTable
      v-model:page="page"
      v-model:items-per-page="perPage"
      :headers="headers"
      :items="purchaseOrders"
      :items-length="meta.total"
      :loading="loading"
      empty-text="No purchase orders found"
    >
      <template #item.supplier.name="{ item }">{{ item.supplier?.name ?? '-' }}</template>
      <template #item.status="{ item }">
        <v-chip :color="statusColor(item.status)">{{ item.status }}</v-chip>
      </template>
      <template #item.total="{ item }">{{ formatAmount(item.total) }}</template>
      <template #item.actions="{ item }">
        <v-btn
          v-if="hasPermission('purchase_orders.receive') && !['received', 'cancelled'].includes(item.status)"
          icon="mdi-truck-check"
          variant="text"
          color="success"
          title="Receive"
          @click="openReceive(item)"
        />
        <v-btn
          v-if="hasPermission('purchase_orders.delete')"
          icon="mdi-delete"
          variant="text"
          color="error"
          @click="handleDelete(item)"
        />
      </template>
    </AppDataTable>
  </AppCard>

  <!-- Create PO Dialog -->
  <AppDialog
    v-model="showForm"
    title="Create New P.O."
    icon="mdi-file-document-plus"
    max-width="700"
    persistent
    scrollable
  >
    <v-card-text>
      <v-row dense>
        <v-col cols="12" sm="6">
          <v-select v-model="form.supplier_id" label="Supplier" :items="suppliers" item-title="name" item-value="id" variant="outlined" density="compact" clearable />
        </v-col>
        <v-col cols="12" sm="6">
          <v-text-field v-model="form.expected_date" label="Expected Date" type="date" variant="outlined" density="compact" />
        </v-col>
      </v-row>
      <v-textarea v-model="form.notes" label="Notes" rows="2" variant="outlined" density="compact" class="mb-3" />

      <div class="text-subtitle-2 mb-2 d-flex align-center">
        Items
        <v-spacer />
        <v-btn color="primary" prepend-icon="mdi-plus" @click="addItem">Add Item</v-btn>
      </div>
      <v-row v-for="(item, idx) in form.items" :key="idx" dense align="center">
        <v-col cols="6">
          <v-select v-model="item.product_id" label="Product" :items="products" item-title="name" item-value="id" variant="outlined" density="compact" hide-details="auto" />
        </v-col>
        <v-col cols="2">
          <v-text-field v-model.number="item.quantity" label="Qty" type="number" variant="outlined" density="compact" hide-details="auto" />
        </v-col>
        <v-col cols="3">
          <v-text-field v-model.number="item.unit_cost" label="Cost" type="number" prefix="₱" variant="outlined" density="compact" hide-details="auto" />
        </v-col>
        <v-col cols="1" class="text-right">
          <v-btn icon="mdi-delete" variant="text" color="error" @click="form.items.splice(idx, 1)" />
        </v-col>
      </v-row>
      <div class="text-right text-subtitle-1 font-weight-bold mt-2">Total: {{ formatAmount(formTotal) }}</div>
    </v-card-text>
    <v-card-actions class="border-t pa-3">
      <v-spacer />
      <v-btn variant="text" @click="showForm = false">Cancel</v-btn>
      <v-btn color="primary" :disabled="!form.items.some(i => i.product_id && i.quantity > 0)" @click="save">Create</v-btn>
    </v-card-actions>
  </AppDialog>

  <!-- Receive PO Dialog -->
  <AppDialog
    v-model="showReceive"
    title="Receive"
    :subtitle="selectedPO?.po_number"
    icon="mdi-truck-check"
    max-width="600"
    persistent
    scrollable
  >
    <v-card-text>
      <v-row v-for="(ri, idx) in receiveItems" :key="idx" dense align="center">
        <v-col cols="12">
          <div class="text-body-2 font-weight-medium mb-1">
            {{ selectedPO?.items?.find(i => i.id === ri.item_id)?.product?.name ?? `Item #${ri.item_id}` }}
          </div>
        </v-col>
        <v-col cols="4">
          <v-text-field v-model.number="ri.quantity" label="Qty Received" type="number" variant="outlined" density="compact" hide-details="auto" />
        </v-col>
        <v-col cols="8">
          <v-textarea v-model="ri.serials" label="Serials (optional, one per line)" rows="1" variant="outlined" density="compact" hide-details="auto" auto-grow />
        </v-col>
      </v-row>
    </v-card-text>
    <v-card-actions class="border-t pa-3">
      <v-spacer />
      <v-btn variant="text" @click="showReceive = false">Cancel</v-btn>
      <v-btn color="success" :disabled="!receiveItems.some(i => i.quantity > 0)" @click="saveReceive">Receive</v-btn>
    </v-card-actions>
  </AppDialog>

  <v-snackbar v-model="snackbar" :color="snackbarColor" timeout="4000">
    {{ snackbarText }}
    <template #actions>
      <v-btn variant="text" @click="snackbar = false">Close</v-btn>
    </template>
  </v-snackbar>
</template>
