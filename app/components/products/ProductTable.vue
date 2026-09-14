<script setup lang="ts">
import { formatAmount } from '~/utils/format'
import type { Product } from '~/types/product'

const props = defineProps<{
  items: Product[]
  loading: boolean
  totalItems: number
  page: number
  itemsPerPage: number
  sortBy: { key: string; order: 'asc' | 'desc' }[]
}>()

const emit = defineEmits<{
  (e: 'update:page', page: number): void
  (e: 'update:itemsPerPage', itemsPerPage: number): void
  (e: 'update:sortBy', sortBy: { key: string; order: 'asc' | 'desc' }[]): void
  (e: 'edit', product: Product): void
  (e: 'delete', product: Product): void
  (e: 'update:selection', products: Product[]): void
}>()

const { hasPermission } = usePermission()

const headers = [
  { title: 'Sequence', key: 'product_sequence', align: 'start', sortable: false, width: '110px' },
  { title: 'Barcode', key: 'barcode', align: 'start', sortable: true, minWidth: '10px', maxWidth: '220px'},
  { title: 'Name', key: 'name', align: 'start', sortable: true, minWidth: '220px', maxWidth: '320px' },
  { title: 'Brand', key: 'brand', align: 'start', sortable: false },
  { title: 'Unit', key: 'unit.abbreviation', align: 'start', sortable: false, width: '80px' },
  { title: 'Stocks', key: 'stocks', align: 'start', sortable: false, width: '90px' },
  { title: 'Cost', key: 'cost_price', align: 'start', sortable: true },
  { title: 'Retail', key: 'regular_price', align: 'start', sortable: true },
  { title: 'Wholesale', key: 'wholesale_price', align: 'start', sortable: true, width: '100px' },
  { title: 'Category', key: 'category.name', align: 'start', sortable: false },
  { title: 'Status', key: 'is_active', align: 'start', sortable: false, width: '100px' },
  { title: '', key: 'actions', align: 'center', sortable: false, width: '56px' }
] as const

const localPage = computed({
  get: () => props.page,
  set: value => emit('update:page', value)
})

const localSortBy = computed({
  get: () => props.sortBy,
  set: value => emit('update:sortBy', value)
})

const selected = ref<unknown[]>([])

watch(selected, (ids) => {
  const selectedProducts = props.items.filter(p => ids.includes(p.id))
  emit('update:selection', selectedProducts)
})

const localPerPage = computed({
  get: () => props.itemsPerPage,
  set: value => emit('update:itemsPerPage', value)
})

function onUpdateOptions (options: { sortBy?: { key: string; order: 'asc' | 'desc' }[] }) {
  const next = options.sortBy ?? []
  if (JSON.stringify(next) !== JSON.stringify(props.sortBy)) {
    emit('update:sortBy', next)
  }
}


function onRowClick (row: any, e: MouseEvent) {
  const target = e.target as HTMLElement
  if (target.closest('button, a, input')) return
  const id = row?.item?.id ?? row?.value
  if (id == null) return
  const idx = selected.value.indexOf(id)
  if (idx >= 0) {
    selected.value.splice(idx, 1)
  } else {
    selected.value.push(id)
  }
}

function getRowProps (row: any) {
  return {
    onClick: (e: MouseEvent) => onRowClick(row, e)
  }
}

function rawItem (item: any): any {
  return item?.raw ?? item
}

function itemValue<T = any> (item: any, key: string): T {
  const data = rawItem(item)
  if (!data) return undefined as T
  return key.split('.').reduce((obj, k) => obj?.[k], data) as T
}

function stockDisplay (product: any): string {
  if (!product) return '0'
  if (product.product_type === 'with_serial') {
    return String(product.in_stock_serials_count ?? 0)
  }
  const qty = Number(product.stock_quantity)
  return Number.isNaN(qty) ? '0' : String(qty)
}

const tableRef = ref<{ $el?: HTMLElement } | null>(null)
const isScrolledX = ref(false)
let tableWrapper: HTMLElement | null = null

onMounted(() => {
  tableWrapper = tableRef.value?.$el?.querySelector('.v-table__wrapper') ?? null
  tableWrapper?.addEventListener('scroll', onTableScroll, { passive: true })
})

onBeforeUnmount(() => {
  tableWrapper?.removeEventListener('scroll', onTableScroll)
})

function onTableScroll () {
  isScrolledX.value = (tableWrapper?.scrollLeft ?? 0) > 0
}
</script>

<template>
  <v-data-table-server
    ref="tableRef"
    v-model:page="localPage"
    v-model:items-per-page="localPerPage"
    v-model:sort-by="localSortBy"
    v-model="selected"
    :headers="headers"
    :items="items"
    :items-length="totalItems"
    :loading="loading"
    class="app-table product-table mt-2"
    :class="{ 'is-scrolled-x': isScrolledX }"
    density="compact"
    fixed-header
    height="480"
    show-select
    select-strategy="page"
    item-value="id"
    empty-text="No products found"
    :row-props="getRowProps"
    @update:options="onUpdateOptions"
  >
    <template #item.name="{ item }">
      <v-tooltip :text="itemValue(item, 'name')" location="top" open-delay="400">
        <template #activator="{ props: tipProps }">
          <span v-bind="tipProps" class="product-name-cell">{{ itemValue(item, 'name') }}</span>
        </template>
      </v-tooltip>
    </template>
    <template #item.brand="{ item }">
      {{ itemValue(item, 'brand_name') || itemValue(item, 'brand_data.name') || itemValue(item, 'brand') || '—' }}
    </template>
    <template #item.cost_price="{ item }">
      {{ formatAmount(itemValue(item, 'cost_price')) }}
    </template>
    <template #item.regular_price="{ item }">
      {{ formatAmount(itemValue(item, 'regular_price')) }}
    </template>
    <template #item.wholesale_price="{ item }">
      {{ formatAmount(itemValue(item, 'wholesale_price')) }}
    </template>
    <template #item.stocks="{ item }">
      {{ stockDisplay(rawItem(item)) }}
    </template>
    <template #item.is_active="{ item }">
      <span class="status-indicator" :class="itemValue(item, 'is_active') ? 'text-success' : 'text-medium-emphasis'">
        <span class="status-dot" :class="itemValue(item, 'is_active') ? 'bg-success' : 'bg-grey'" />
        {{ itemValue(item, 'is_active') ? 'Active' : 'Inactive' }}
      </span>
    </template>
    <template #item.actions="{ item }">
      <v-menu v-if="hasPermission('products.edit') || hasPermission('products.delete')" location="bottom end">
        <template #activator="{ props: menuProps }">
          <v-btn
            v-bind="menuProps"
            icon="mdi-dots-vertical"
            variant="text"
            size="small"
            density="compact"
            aria-label="Row actions"
          />
        </template>
        <v-list density="compact">
          <v-list-item
            v-if="hasPermission('products.edit')"
            prepend-icon="mdi-pencil"
            title="Edit"
            @click="emit('edit', rawItem(item))"
          />
          <v-list-item
            v-if="hasPermission('products.delete')"
            prepend-icon="mdi-delete"
            title="Delete"
            base-color="error"
            @click="emit('delete', rawItem(item))"
          />
        </v-list>
      </v-menu>
    </template>
    <template #no-data>
      <AppEmptyState title="No products found" subtitle="Try adjusting your filters" />
    </template>
  </v-data-table-server>
</template>

<style scoped>
.status-indicator {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-weight: 500;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex: none;
}

.product-name-cell {
  display: inline-block;
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  vertical-align: bottom;
  margin-right: 12px;
}


.product-table :deep(tbody tr) {
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.product-table :deep(tbody tr:hover) {
  background-color: rgba(var(--v-theme-primary), 0.04);
}

.product-table :deep(tbody tr.v-data-table__tr--selected) {
  background-color: rgba(var(--v-theme-primary), 0.08);
}
</style>
