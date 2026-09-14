<script setup lang="ts">
import { formatAmount } from '~/utils/format'
import type { ServiceTicket } from '~/types/service'
import { useServiceTickets } from '~/composables/useServiceTickets'
import { useCustomers } from '~/composables/useCustomers'
import { useProducts } from '~/composables/useProducts'
import { usePermission } from '~/composables/usePermission'

definePageMeta({
  middleware: 'auth'
})

const { serviceTickets, meta, loading, error, fetchServiceTickets, createServiceTicket, updateServiceTicket, deleteServiceTicket } = useServiceTickets()
const { customers, fetchCustomers } = useCustomers()
const { products, fetchProducts } = useProducts()
const { hasPermission } = usePermission()

const search = ref('')
const status = ref<string | null>(null)
const page = ref(1)
const perPage = ref(15)
const showForm = ref(false)
const selectedTicket = ref<ServiceTicket | null>(null)

const headers = [
  { title: 'Ticket #', key: 'ticket_number', sortable: true },
  { title: 'Customer', key: 'customer.name', sortable: false },
  { title: 'Product', key: 'product.name', sortable: false },
  { title: 'Status', key: 'status', sortable: true },
  { title: 'Total', key: 'total', sortable: true, align: 'end' },
  { title: 'Date', key: 'created_at', sortable: true },
  { title: 'Actions', key: 'actions', sortable: false, align: 'end' }
]

const filters = computed(() => ({
  page: page.value,
  per_page: perPage.value,
  search: search.value || undefined,
  status: status.value || undefined,
  sort_by: 'created_at',
  sort_direction: 'desc'
}))

const activeFilterCount = computed(() =>
  [status.value].filter(v => v !== null && v !== undefined).length
)

function clearAllFilters () {
  search.value = ''
  status.value = null
}

async function load () {
  if (!import.meta.client) return
  await fetchServiceTickets(filters.value)
}

const form = reactive({
  customer_id: null as number | null,
  product_id: null as number | null,
  issue: '',
  diagnosis: '',
  status: 'pending' as ServiceTicket['status'],
  labor_cost: 0,
  parts_cost: 0,
  notes: '',
  is_warranty: false
})

const formTotal = computed(() => Number(((form.labor_cost ?? 0) + (form.parts_cost ?? 0)).toFixed(2)))

function openForm (ticket: ServiceTicket | null = null) {
  selectedTicket.value = ticket
  form.customer_id = ticket?.customer_id ?? null
  form.product_id = ticket?.product_id ?? null
  form.issue = ticket?.issue ?? ''
  form.diagnosis = ticket?.diagnosis ?? ''
  form.status = ticket?.status ?? 'pending'
  form.labor_cost = Number(ticket?.labor_cost ?? 0)
  form.parts_cost = Number(ticket?.parts_cost ?? 0)
  form.notes = ticket?.notes ?? ''
  form.is_warranty = ticket?.is_warranty ?? false
  showForm.value = true
}

function closeForm () {
  showForm.value = false
  selectedTicket.value = null
  form.customer_id = null
  form.product_id = null
  form.issue = ''
  form.diagnosis = ''
  form.status = 'pending'
  form.labor_cost = 0
  form.parts_cost = 0
  form.notes = ''
  form.is_warranty = false
}

async function saveTicket () {
  const payload = { ...form, total: formTotal.value }
  const ok = selectedTicket.value
    ? await updateServiceTicket(selectedTicket.value.id, payload)
    : await createServiceTicket(payload)
  if (ok) {
    closeForm()
    await load()
    snackbarText.value = selectedTicket.value ? 'Service ticket updated' : 'Service ticket created'
    snackbarColor.value = 'success'
    snackbar.value = true
  }
}

async function handleDelete (ticket: ServiceTicket) {
  if (!confirm(`Delete service ticket ${ticket.ticket_number}?`)) return
  const ok = await deleteServiceTicket(ticket.id)
  if (ok) {
    await load()
    snackbarText.value = 'Service ticket deleted'
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
  await Promise.all([fetchCustomers(), fetchProducts({ perPage: 100 }), load()])
})
watch(filters, load, { deep: true })
</script>

<template>
  <AppPageHeader title="Service Tickets" subtitle="Track repair and service jobs">
    <template #actions>
      <v-btn
        v-if="hasPermission('service_tickets.create')"
        color="primary"
        prepend-icon="mdi-plus"
        @click="openForm()"
      >
        New Ticket
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
            <div class="text-subtitle-2 mb-2">Filter by Status</div>
            <v-select
              v-model="status"
              label="Status"
              :items="[
                { title: 'All', value: null },
                { title: 'Pending', value: 'pending' },
                { title: 'In Progress', value: 'in_progress' },
                { title: 'Waiting Parts', value: 'waiting_parts' },
                { title: 'Completed', value: 'completed' },
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
      :items="serviceTickets"
      :items-length="meta.total"
      :loading="loading"
      empty-text="No service tickets found"
      class="mt-4"
    >
      <template #item.status="{ item }">
        <v-chip
          :color="
            item.status === 'completed' ? 'success' :
            item.status === 'in_progress' ? 'primary' :
            item.status === 'waiting_parts' ? 'warning' :
            item.status === 'cancelled' ? 'error' : 'default'
          "
        >
          {{ item.status }}
        </v-chip>
      </template>

      <template #item.customer.name="{ item }">
        {{ item.customer?.name ?? '-' }}
      </template>

      <template #item.product.name="{ item }">
        {{ item.product?.name ?? '-' }}
      </template>

      <template #item.total="{ item }">
        {{ formatAmount(item.total) }}
      </template>

      <template #item.created_at="{ item }">
        {{ new Date(item.created_at).toLocaleString() }}
      </template>

      <template #item.actions="{ item }">
        <v-btn
          v-if="hasPermission('service_tickets.edit')"
          icon="mdi-pencil"
          variant="text"
          size="small"
          class="action-btn"
          @click="openForm(item)"
        />
        <v-btn
          v-if="hasPermission('service_tickets.delete')"
          icon="mdi-delete"
          variant="text"
          size="small"
          color="error"
          class="action-btn"
          @click="handleDelete(item)"
        />
      </template>
    </AppDataTable>
  </AppCard>

  <AppFormDialog
    v-model="showForm"
    :title="selectedTicket ? 'Edit Service Ticket' : 'New Service Ticket'"
    :can-save="!!form.customer_id && !!form.issue.trim()"
    @save="saveTicket"
  >
    <AppFormSection title="Ticket Details">
      <v-row dense>
        <v-col cols="12" sm="6">
          <v-select
            v-model="form.customer_id"
            label="Customer"
            :items="customers"
            item-title="name"
            item-value="id"
            :rules="[v => !!v || 'Required']"
          />
        </v-col>
        <v-col cols="12" sm="6">
          <v-select
            v-model="form.product_id"
            label="Product"
            :items="products"
            item-title="name"
            item-value="id"
            clearable
          />
        </v-col>
        <v-col cols="12">
          <v-select
            v-model="form.status"
            label="Status"
            :items="[
              { title: 'Pending', value: 'pending' },
              { title: 'In Progress', value: 'in_progress' },
              { title: 'Waiting Parts', value: 'waiting_parts' },
              { title: 'Completed', value: 'completed' },
              { title: 'Cancelled', value: 'cancelled' }
            ]"
            item-title="title"
            item-value="value"
          />
        </v-col>
        <v-col cols="12">
          <v-textarea v-model="form.issue" label="Issue" rows="2" :rules="[v => !!v || 'Required']" />
        </v-col>
        <v-col cols="12">
          <v-textarea v-model="form.diagnosis" label="Diagnosis" rows="2" />
        </v-col>
        <v-col cols="12" sm="6">
          <v-text-field v-model.number="form.labor_cost" label="Labor Cost" type="number" prefix="₱" />
        </v-col>
        <v-col cols="12" sm="6">
          <v-text-field v-model.number="form.parts_cost" label="Parts Cost" type="number" prefix="₱" />
        </v-col>
        <v-col cols="12" sm="6" class="text-body-1">
          Total: {{ formatAmount(formTotal) }}
        </v-col>
        <v-col cols="12" sm="6">
          <v-switch v-model="form.is_warranty" label="Warranty" color="primary" hide-details />
        </v-col>
        <v-col cols="12">
          <v-textarea v-model="form.notes" label="Notes" rows="2" />
        </v-col>
      </v-row>
    </AppFormSection>
  </AppFormDialog>

  <v-snackbar v-model="snackbar" :color="snackbarColor" timeout="4000">
    {{ snackbarText }}
    <template #actions>
      <v-btn variant="text" @click="snackbar = false">Close</v-btn>
    </template>
  </v-snackbar>
</template>
