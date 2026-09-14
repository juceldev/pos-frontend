<script setup lang="ts">
import { useStock } from '~/composables/useStock'
import { useProducts } from '~/composables/useProducts'
import { usePermission } from '~/composables/usePermission'

definePageMeta({
  middleware: 'auth'
})

const { movements, meta, loading, error, fetchMovements, createMovement } = useStock()
const { products, fetchProducts } = useProducts()
const { hasPermission } = usePermission()

const search = ref('')
const movementType = ref<string | null>(null)
const page = ref(1)
const perPage = ref(15)
const showForm = ref(false)
const showProductSearch = ref(false)

const headers = [
  { title: 'Date', key: 'created_at', sortable: true },
  { title: 'Product', key: 'product.name', sortable: false },
  { title: 'Type', key: 'type', sortable: true },
  { title: 'Quantity', key: 'quantity', sortable: true, align: 'end' },
  { title: 'Reference', key: 'reference', sortable: false },
  { title: 'By', key: 'user.name', sortable: false }
]

const filters = computed(() => ({
  page: page.value,
  per_page: perPage.value,
  search: search.value || undefined,
  type: movementType.value || undefined,
  sort_by: 'created_at',
  sort_direction: 'desc'
}))

const activeFilterCount = computed(() =>
  [movementType.value].filter(v => v !== null && v !== undefined).length
)

function clearAllFilters () {
  search.value = ''
  movementType.value = null
}

async function load () {
  if (!import.meta.client) return
  await fetchMovements(filters.value)
}

const form = reactive({
  product_id: null as number | null,
  type: 'in' as 'in' | 'out' | 'adjustment',
  quantity: 0,
  unit_cost: null as number | null,
  reference: '',
  remarks: ''
})

const productName = computed(() => {
  const p = products.value.find(p => p.id === form.product_id)
  return p?.name ?? ''
})

const typeLabel = computed(() => ({
  in: 'Stock In',
  out: 'Stock Out',
  adjustment: 'Adjustment'
} as const))

function openForm () {
  showForm.value = true
  form.product_id = null
  form.type = 'in'
  form.quantity = 0
  form.unit_cost = null
  form.reference = ''
  form.remarks = ''
}

function closeForm () {
  showForm.value = false
}

async function openProductSearch () {
  showProductSearch.value = true
  await fetchProducts({ perPage: 100 })
}

function selectProduct (product: any) {
  form.product_id = product.id
  showProductSearch.value = false
}

async function saveMovement () {
  const ok = await createMovement({ ...form })
  if (ok) {
    closeForm()
    await load()
    snackbarText.value = 'Stock movement recorded'
    snackbarColor.value = 'success'
    snackbar.value = true
  }
}

const snackbar = ref(false)
const snackbarText = ref('')
const snackbarColor = ref('success')

watch(error, (msg) => {
  if (msg) {
    snackbarText.value = msg
    snackbarColor.value = 'error'
    snackbar.value = true
  }
})

onMounted(async () => {
  await load()
})
watch(filters, load, { deep: true })
</script>

<template>
  <AppPageHeader title="Stock Movements" subtitle="Track stock in, out, and adjustments">
    <template #actions>
      <v-btn
        v-if="hasPermission('stock.create')"
        color="primary"
        prepend-icon="mdi-plus"
        @click="openForm"
      >
        Record Movement
      </v-btn>
    </template>
  </AppPageHeader>

  <AppCard class="mb-4">
    <v-row dense align="center">
      <v-col cols="12" sm="6" md="5">
        <v-text-field
          v-model="search"
          label="Search"
          prepend-inner-icon="mdi-magnify"
          clearable
        />
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
            <div class="text-subtitle-2 mb-2">Filter by Type</div>
            <v-select
              v-model="movementType"
              label="Type"
              :items="[
                { title: 'All', value: null },
                { title: 'Stock In', value: 'in' },
                { title: 'Stock Out', value: 'out' },
                { title: 'Adjustment', value: 'adjustment' }
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
      :items="movements"
      :items-length="meta.total"
      :loading="loading"
      empty-text="No stock movements found"
      class="mt-4"
    >
      <template #item.type="{ item }">
        <v-chip :color="item.type === 'in' ? 'success' : item.type === 'out' ? 'error' : 'warning'">
          {{ typeLabel[item.type] }}
        </v-chip>
      </template>

      <template #item.quantity="{ item }">
        {{ item.quantity > 0 ? '+' : '' }}{{ item.quantity }}
      </template>

      <template #item.product.name="{ item }">
        {{ item.product?.name ?? '-' }}
      </template>

      <template #item.user.name="{ item }">
        {{ item.user?.name ?? '-' }}
      </template>

      <template #item.created_at="{ item }">
        {{ new Date(item.created_at).toLocaleString() }}
      </template>
    </AppDataTable>
  </AppCard>

  <AppFormDialog
    v-model="showForm"
    title="Record Stock Movement"
    :can-save="!!form.product_id && form.quantity > 0"
    @save="saveMovement"
  >
    <AppFormSection title="Movement Details">
      <v-row dense>
        <v-col cols="12">
          <v-text-field
            :model-value="productName"
            label="Product"
            :rules="[v => !!form.product_id || 'Select a product']"
            readonly
            append-inner-icon="mdi-magnify"
            @click:append-inner="openProductSearch"
          />
        </v-col>
        <v-col cols="12" sm="6">
          <v-select
            v-model="form.type"
            label="Type"
            :items="[
              { title: 'Stock In', value: 'in' },
              { title: 'Stock Out', value: 'out' },
              { title: 'Adjustment', value: 'adjustment' }
            ]"
            item-title="title"
            item-value="value"
          />
        </v-col>
        <v-col cols="12" sm="6">
          <v-text-field
            v-model.number="form.quantity"
            label="Quantity"
            type="number"
            :rules="[v => v > 0 || 'Required']"
          />
        </v-col>
        <v-col v-if="form.type === 'in'" cols="12" sm="6">
          <v-text-field
            v-model.number="form.unit_cost"
            label="Unit Cost"
            type="number"
            prefix="₱"
          />
        </v-col>
        <v-col cols="12" sm="6">
          <v-text-field v-model="form.reference" label="Reference" />
        </v-col>
        <v-col cols="12">
          <v-textarea v-model="form.remarks" label="Remarks" rows="2" />
        </v-col>
      </v-row>
    </AppFormSection>
  </AppFormDialog>

  <AppDialog
    v-model="showProductSearch"
    title="Select Product"
    icon="mdi-magnify"
    max-width="500"
  >
    <v-card-text>
      <v-list density="compact" height="300px" style="overflow-y: auto;">
        <v-list-item
          v-for="p in products"
          :key="p.id"
          :title="p.name"
          :subtitle="p.product_sequence"
          @click="selectProduct(p)"
        />
      </v-list>
    </v-card-text>
    <v-card-actions>
      <v-spacer />
      <v-btn variant="text" @click="showProductSearch = false">Cancel</v-btn>
    </v-card-actions>
  </AppDialog>

  <v-snackbar v-model="snackbar" :color="snackbarColor" timeout="4000">
    {{ snackbarText }}
    <template #actions>
      <v-btn variant="text" @click="snackbar = false">Close</v-btn>
    </template>
  </v-snackbar>
</template>
