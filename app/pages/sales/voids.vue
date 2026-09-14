<script setup lang="ts">
import { useSales } from '~/composables/useSales'
import { formatAmount } from '~/utils/format'

definePageMeta({
  middleware: 'auth'
})

const { sales, meta, loading, error, fetchSales } = useSales()

const search = ref('')
const page = ref(1)
const perPage = ref(15)
const sortBy = ref<{ key: string; order: 'asc' | 'desc' }[]>([{ key: 'voided_at', order: 'desc' }])

const filters = computed(() => ({
  page: page.value,
  per_page: perPage.value,
  search: search.value || undefined,
  status: 'voided',
  sort_by: sortBy.value[0]?.key ?? 'voided_at',
  sort_direction: sortBy.value[0]?.order ?? 'desc'
}))

const headers = [
  { title: 'Sale #', key: 'sale_number', sortable: false },
  { title: 'Customer', key: 'customer.name', sortable: false },
  { title: 'Voided By', key: 'voidedBy.name', sortable: false },
  { title: 'Total', key: 'total', sortable: true, align: 'end' },
  { title: 'Reason', key: 'notes', sortable: false },
  { title: 'Voided At', key: 'voided_at', sortable: true }
]

const { error: showError } = useNotification()

async function load () {
  if (!import.meta.client) return
  await fetchSales(filters.value)
}

onMounted(load)
watch(filters, load, { deep: true })

watch(error, (msg) => {
  if (msg) showError(msg)
})
</script>

<template>
  <AppPageHeader title="Voided Sales" subtitle="Review voided transactions" />

  <AppCard>
    <v-toolbar color="surface" flat density="comfortable" class="rounded-t-lg">
      <v-text-field
        v-model="search"
        label="Search voids..."
        prepend-inner-icon="mdi-magnify"
        clearable
        density="compact"
        variant="outlined"
        style="max-width: 400px"
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
      v-model:sort-by="sortBy"
      :headers="headers"
      :items="sales"
      :items-length="meta.total"
      :loading="loading"
      empty-text="No voided sales found"
    >
      <template #item.customer.name="{ item }">
        {{ item.customer?.name ?? 'Walk-in' }}
      </template>

      <template #item.voidedBy.name="{ item }">
        {{ item.voidedBy?.name ?? '-' }}
      </template>

      <template #item.total="{ item }">
        {{ formatAmount(item.total) }}
      </template>

      <template #item.notes="{ item }">
        <span class="text-truncate d-inline-block" style="max-width: 240px">
          {{ item.notes ? item.notes.replace(/^Void reason: /, '') : '-' }}
        </span>
      </template>

      <template #item.voided_at="{ item }">
        {{ item.voided_at ? new Date(item.voided_at).toLocaleString() : '-' }}
      </template>
    </AppDataTable>
  </AppCard>
</template>
