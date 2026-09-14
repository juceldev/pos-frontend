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
  selectStrategy?: string
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
      flat
      :border="true"
    >
      <slot name="mobile-item" :item="item">
        <v-card-text class="pb-1">
          <div
            v-for="header in displayHeaders.slice(0, 5)"
            :key="header.key"
            class="d-flex align-start gap-2 mb-1 mobile-data-row"
          >
            <span class="font-weight-medium text-medium-emphasis" style="min-width: 80px;">
              {{ header.title }}:
            </span>
            <span class="flex-grow-1 text-end text-break">
              <slot v-if="$slots['item.' + header.key]" :name="'item.' + header.key" :item="item" />
              <template v-else>{{ item[header.key] }}</template>
            </span>
          </div>
        </v-card-text>
        <v-card-actions v-if="$slots['item.actions']" class="justify-end pt-0 pb-2">
          <slot name="item.actions" :item="item" />
        </v-card-actions>
      </slot>
    </v-card>
  </div>
</template>

<style scoped>
.mobile-data-list {
  padding-top: 8px;
}

.mobile-data-card {
  margin-bottom: 8px;
}

.mobile-data-row {
  font-size: 0.85rem;
}
</style>
