<script setup lang="ts">
import { computed, useAttrs, useSlots } from 'vue'
import { useDisplay } from 'vuetify'
import AppEmptyState from './AppEmptyState.vue'

interface Props {
  headers: any[]
  items: any[]
  itemsLength: number
  loading?: boolean
  emptyText?: string
  emptyIcon?: string
  page?: number
  itemsPerPage?: number
  density?: string
  fixedHeader?: boolean
  height?: string | number
  itemValue?: string
  showSelect?: boolean
  selectStrategy?: 'page' | 'all' | 'single'
  rowProps?: (item: any) => Record<string, any>
  sortBy?: { key: string; order: 'asc' | 'desc' }[]
  modelValue?: any[]
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  emptyText: 'No records found',
  emptyIcon: 'mdi-inbox-outline',
  page: 1,
  itemsPerPage: 15,
  density: 'compact',
  fixedHeader: true,
  height: '480',
  itemValue: 'id',
  showSelect: false,
  selectStrategy: 'page',
  sortBy: () => [],
  modelValue: () => []
})

const emit = defineEmits<{
  'update:page': [page: number]
  'update:itemsPerPage': [itemsPerPage: number]
  'update:modelValue': [value: any[]]
  'update:sortBy': [value: { key: string; order: 'asc' | 'desc' }[]]
}>()

const { mobile } = useDisplay()
const attrs = useAttrs()

const slotNames = computed(() => Object.keys(useSlots()))
const displayHeaders = computed(() => props.headers.filter(h => h.key !== 'actions' && h.title))
</script>

<template>
  <v-data-table-server
    v-if="!mobile"
    v-bind="attrs"
    class="app-table mt-4"
    :headers="props.headers"
    :items="props.items"
    :items-length="props.itemsLength"
    :loading="props.loading"
    :page="props.page"
    :items-per-page="props.itemsPerPage"
    :density="props.density"
    :fixed-header="props.fixedHeader"
    :height="props.height"
    :item-value="props.itemValue"
    :show-select="props.showSelect"
    :select-strategy="props.selectStrategy"
    :row-props="props.rowProps"
    :sort-by="props.sortBy"
    :model-value="props.modelValue"
    @update:page="(p) => emit('update:page', p)"
    @update:items-per-page="(pp) => emit('update:itemsPerPage', pp)"
    @update:sort-by="(value) => emit('update:sortBy', value as any)"
    @update:model-value="(value) => emit('update:modelValue', value)"
  >
    <template v-for="name in slotNames" :key="name" #[name]="scope">
      <slot :name="name" v-bind="scope" />
    </template>
    <template v-if="!$slots['no-data']" #no-data>
      <AppEmptyState
        :icon="props.emptyIcon"
        :title="props.emptyText"
        subtitle="Try adjusting your filters"
      />
    </template>
  </v-data-table-server>

  <div v-else class="mobile-data-list">
    <v-progress-linear v-if="loading" indeterminate color="primary" class="my-4" />

    <AppEmptyState
      v-else-if="!items.length"
      :icon="emptyIcon"
      :title="emptyText"
      subtitle="Try adjusting your filters"
    />

    <v-card
      v-for="item in items"
      :key="item[itemValue]"
      class="mb-2 mobile-data-card"
      variant="outlined"
    >
      <slot name="mobile-item" :item="item">
        <div class="mobile-data-header d-flex align-center justify-space-between pa-3">
          <div class="flex-grow-1 min-w-0 me-2">
            <div class="text-caption text-medium-emphasis mobile-data-header-label">
              {{ displayHeaders[0]?.title }}
            </div>
            <div class="font-weight-bold text-primary text-break">
              <slot v-if="displayHeaders[0] && $slots['item.' + displayHeaders[0].key]" :name="'item.' + displayHeaders[0].key" :item="item" />
              <template v-else>{{ displayHeaders[0] ? item[displayHeaders[0].key] : '' }}</template>
            </div>
          </div>
          <v-icon icon="mdi-chevron-right" color="primary" />
        </div>

        <v-divider />

        <v-card-text class="pa-2 pb-1">
          <div
            v-for="header in displayHeaders.slice(1, 7)"
            :key="header.key"
            class="d-flex align-start gap-2 mb-1 mobile-data-row"
          >
            <span class="mobile-data-label" style="min-width: 100px;">
              {{ header.title }}:
            </span>
            <span class="flex-grow-1 text-break mobile-data-value">
              <slot v-if="$slots['item.' + header.key]" :name="'item.' + header.key" :item="item" />
              <template v-else>{{ item[header.key] }}</template>
            </span>
          </div>
        </v-card-text>
        <div v-if="$slots['item.actions']" class="mobile-data-actions d-flex justify-end align-center flex-wrap ga-2 px-3 py-2">
          <slot name="item.actions" :item="item" />
        </div>
      </slot>
    </v-card>

    <v-pagination
      v-if="itemsLength > itemsPerPage"
      :model-value="page"
      :length="Math.ceil(itemsLength / itemsPerPage)"
      :total-visible="5"
      density="compact"
      class="mt-2"
      @update:model-value="(p) => emit('update:page', p)"
    />
  </div>
</template>

<style scoped>
.mobile-data-list {
  padding-top: 8px;
}

.mobile-data-card {
  margin-bottom: 8px;
}

.mobile-data-header {
  background: rgba(var(--v-theme-primary), 0.08);
}

.mobile-data-header-label {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.mobile-data-row {
  font-size: 0.9rem;
  line-height: 1.35;
}

.mobile-data-label {
  font-weight: 500;
  color: rgba(var(--v-theme-on-surface), 0.7);
}

.mobile-data-value {
  word-break: break-word;
}

.mobile-data-actions {
  border-top: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  background: rgba(var(--v-theme-on-surface), 0.02);
}

.mobile-data-actions :deep(.v-btn--icon) {
  min-width: 40px;
  min-height: 40px;
}
</style>
