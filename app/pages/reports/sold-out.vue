<script setup lang="ts">
import { useReports } from '~/composables/useReports'
import type { Product } from '~/types/product'

definePageMeta({
  middleware: 'auth'
})

const { loading, error, fetchSoldOutReport } = useReports()

const page = ref(1)
const perPage = ref(15)
const products = ref<Product[]>([])
const meta = ref({ total: 0 })

const search = ref('')

async function load () {
  const response = await fetchSoldOutReport({
    page: page.value,
    per_page: perPage.value
  })
  if (response) {
    products.value = response.data ?? []
    meta.value = { total: response.meta.total }
  }
}

watch([page, perPage], load)
onMounted(load)
</script>

<template>
  <div>
    <AppPageHeader title="Sold-Out / Out-of-Stock" subtitle="Products with low or zero inventory" />

    <AppCard class="rounded-lg" elevation="1">
      <v-toolbar color="surface" flat density="comfortable" class="rounded-t-lg">
        <v-text-field
          v-model="search"
          label="Search products..."
          prepend-inner-icon="mdi-magnify"
          clearable
          density="compact"
          variant="outlined"
          style="max-width: 320px"
          class="align-self-center me-3"
        />
        <v-spacer />
        <v-tooltip text="Refresh" location="top">
          <template #activator="{ props: tipProps }">
            <v-btn
              v-bind="tipProps"
              icon="mdi-refresh"
              variant="text"
              size="small"
              aria-label="Refresh"
              :loading="loading"
              @click="load"
            />
          </template>
        </v-tooltip>
      </v-toolbar>
      <v-divider />

      <AppDataTable
        v-model:page="page"
        v-model:items-per-page="perPage"
        :headers="[
          { title: 'Sequence', key: 'product_sequence', width: '120px' },
          { title: 'Barcode', key: 'barcode', width: '140px' },
          { title: 'Name', key: 'name' },
          { title: 'Stock', key: 'stock_quantity', align: 'end', width: '100px' },
          { title: 'Reorder Level', key: 'reorder_level', align: 'end', width: '140px' },
          { title: 'Category', key: 'category.name' },
          { title: 'Supplier', key: 'supplier.name' }
        ]"
        :items="products"
        :items-length="meta.total"
        :loading="loading"
        empty-text="No sold-out products found"
        class="mt-2"
      >
        <template #item.category.name="{ item }">
          {{ item.category?.name ?? '—' }}
        </template>
        <template #item.supplier.name="{ item }">
          {{ item.supplier?.name ?? '—' }}
        </template>
        <template #item.stock_quantity="{ item }">
          <span class="text-error font-weight-medium">{{ item.stock_quantity }}</span>
        </template>
      </AppDataTable>

      <v-alert v-if="error" type="error" class="ma-4">{{ error }}</v-alert>
    </AppCard>
  </div>
</template>
