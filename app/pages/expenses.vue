<script setup lang="ts">
import type { Expense } from '~/types/expense'
import { useExpenses } from '~/composables/useExpenses'
import { usePermission } from '~/composables/usePermission'
import { formatAmount, formatDate } from '~/utils/format'

definePageMeta({
  middleware: 'auth'
})

const { expenses, meta, loading, error, fetchExpenses, createExpense, updateExpense, deleteExpense, fetchExpenseTypes, createExpenseType } = useExpenses()
const { hasPermission } = usePermission()

const search = ref('')
const type = ref<string | null>(null)
const from = ref<string>('')
const to = ref<string>('')
const page = ref(1)
const perPage = ref(15)
const sortBy = ref<{ key: string; order: 'asc' | 'desc' }[]>([{ key: 'expense_date', order: 'desc' }])
const showFilterDrawer = ref(false)
const showForm = ref(false)
const showTypeForm = ref(false)
const selectedExpense = ref<Expense | null>(null)

const expenseTypeNames = ref<string[]>([])
const newTypeName = ref('')
const newTypeDescription = ref('')
const typeSaving = ref(false)

const expenseTypes = computed(() => [
  { title: 'All', value: null },
  ...expenseTypeNames.value.map(name => ({ title: name, value: name }))
])

async function loadExpenseTypes () {
  const types = await fetchExpenseTypes()
  expenseTypeNames.value = types.map((t: any) => t.name)
}

async function saveType () {
  if (!newTypeName.value.trim()) return
  typeSaving.value = true
  const created = await createExpenseType(newTypeName.value.trim(), newTypeDescription.value.trim() || undefined)
  typeSaving.value = false
  if (created) {
    await loadExpenseTypes()
    form.type = created.name
    newTypeName.value = ''
    newTypeDescription.value = ''
    showTypeForm.value = false
    snackbarText.value = 'Expense type added'
    snackbarColor.value = 'success'
    snackbar.value = true
  }
}

const headers = [
  { title: 'Date', key: 'expense_date', sortable: true },
  { title: 'Type', key: 'type', sortable: true },
  { title: 'Description', key: 'description', sortable: false },
  { title: 'Amount', key: 'amount', sortable: true, align: 'end' },
  { title: 'Actions', key: 'actions', sortable: false, align: 'end' }
]

const filters = computed(() => ({
  page: page.value,
  per_page: perPage.value,
  search: search.value || undefined,
  type: type.value || undefined,
  from: from.value || undefined,
  to: to.value || undefined,
  sort_by: sortBy.value[0]?.key ?? 'expense_date',
  sort_direction: sortBy.value[0]?.order ?? 'desc'
}))

const activeFilterCount = computed(() =>
  [type.value, from.value, to.value].filter(v => v !== null && v !== undefined && v !== '').length
)

const activeFilters = computed(() => {
  const list: { key: string, label: string, clear: () => void }[] = []
  if (type.value) {
    const item = expenseTypes.find(i => i.value === type.value)
    list.push({ key: 'type', label: `Type: ${item?.title ?? type.value}`, clear: () => { type.value = null } })
  }
  if (from.value) list.push({ key: 'from', label: `From: ${from.value}`, clear: () => { from.value = '' } })
  if (to.value) list.push({ key: 'to', label: `To: ${to.value}`, clear: () => { to.value = '' } })
  return list
})

const pageTotal = computed(() =>
  expenses.value.reduce((sum, e) => sum + Number(e.amount ?? 0), 0)
)

function clearAllFilters () {
  search.value = ''
  type.value = null
  from.value = ''
  to.value = ''
}

async function load () {
  if (!import.meta.client) return
  await fetchExpenses(filters.value)
}

const form = reactive({
  expense_date: new Date().toISOString().slice(0, 10),
  type: 'Other',
  description: '',
  amount: 0
})

function openForm (expense: Expense | null = null) {
  selectedExpense.value = expense
  form.expense_date = expense?.expense_date ? new Date(expense.expense_date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10)
  form.type = expense?.type ?? 'Other'
  form.description = expense?.description ?? ''
  form.amount = expense?.amount ?? 0
  showForm.value = true
}

function closeForm () {
  showForm.value = false
  selectedExpense.value = null
  form.expense_date = new Date().toISOString().slice(0, 10)
  form.type = 'Other'
  form.description = ''
  form.amount = 0
}

async function saveExpense () {
  const data = {
    expense_date: form.expense_date,
    type: form.type,
    description: form.description,
    amount: Number(form.amount)
  }
  const ok = selectedExpense.value
    ? await updateExpense(selectedExpense.value.id, data)
    : await createExpense(data)
  if (ok) {
    closeForm()
    await load()
    snackbarText.value = selectedExpense.value ? 'Expense updated' : 'Expense created'
    snackbarColor.value = 'success'
    snackbar.value = true
  }
}

const { confirm } = useConfirm()

async function handleDelete (expense: Expense) {
  const ok = await confirm({
    title: 'Delete Expense',
    message: `Delete expense "${expense.description}"?`,
    confirmText: 'Delete'
  })
  if (!ok) return
  const deleted = await deleteExpense(expense.id)
  if (deleted) {
    await load()
    snackbarText.value = 'Expense deleted'
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
  await loadExpenseTypes()
  await load()
})
watch(filters, load, { deep: true })
</script>

<template>
  <AppPageHeader title="Expenses" subtitle="Track business expenses">
    <template #actions>
      <v-btn
        v-if="hasPermission('expenses.create')"
        color="primary"
        prepend-icon="mdi-plus"
        @click="openForm()"
      >
        Add Expense
      </v-btn>
    </template>
  </AppPageHeader>

  <AppCard>
    <v-toolbar color="surface" flat density="comfortable" class="rounded-t-lg">
      <v-text-field
        v-model="search"
        label="Search expenses..."
        prepend-inner-icon="mdi-magnify"
        clearable
        density="compact"
        variant="outlined"
        style="max-width: 400px"
        class="align-self-center me-3"
      />
      <v-select
        v-model="type"
        label="Type"
        :items="expenseTypes"
        item-title="title"
        item-value="value"
        clearable
        density="compact"
        variant="outlined"
        style="max-width: 180px"
        class="align-self-center me-4"
      />
      <v-text-field
        v-model="from"
        label="From"
        type="date"
        clearable
        density="compact"
        variant="outlined"
        style="max-width: 200px"
        class="align-self-center me-3 d-none d-md-flex"
      />
      <v-text-field
        v-model="to"
        label="To"
        type="date"
        clearable
        density="compact"
        variant="outlined"
        style="max-width: 200px"
        class="align-self-center me-4 d-none d-md-flex"
      />
      <v-badge
        :content="activeFilterCount"
        :model-value="activeFilterCount > 0"
        color="primary"
        offset-x="8"
        offset-y="8"
        class="d-lg-none"
      >
        <v-tooltip text="Filters" location="top">
          <template #activator="{ props: tipProps }">
            <v-btn
              v-bind="tipProps"
              icon="mdi-filter-variant"
              variant="outlined"
              size="small"
              aria-label="Filters"
              @click="showFilterDrawer = true"
            />
          </template>
        </v-tooltip>
      </v-badge>
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
    <div v-if="activeFilters.length" class="d-flex flex-wrap ga-1 px-4 pb-2">
      <v-chip
        v-for="f in activeFilters"
        :key="f.key"
        size="small"
        color="primary"
        variant="tonal"
        closable
        @click:close="f.clear"
      >
        {{ f.label }}
      </v-chip>
    </div>
    <v-divider />
    <AppDataTable
      v-model:page="page"
      v-model:items-per-page="perPage"
      v-model:sort-by="sortBy"
      :headers="headers"
      :items="expenses"
      :items-length="meta.total"
      :loading="loading"
      empty-text="No expenses found"
    >
      <template #item.expense_date="{ item }">
        {{ formatDate(item.expense_date) }}
      </template>

      <template #item.type="{ item }">
        {{ item.type }}
      </template>

      <template #item.amount="{ item }">
        {{ formatAmount(item.amount) }}
      </template>

      <template #item.actions="{ item }">
        <v-btn
          v-if="hasPermission('expenses.edit')"
          icon="mdi-pencil"
          variant="text"
          size="small"
          class="action-btn"
          @click="openForm(item)"
        />
        <v-btn
          v-if="hasPermission('expenses.delete')"
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

  <v-navigation-drawer v-model="showFilterDrawer" location="right" temporary width="320">
    <v-toolbar color="surface" flat density="comfortable">
      <v-toolbar-title class="text-subtitle-1">Filters</v-toolbar-title>
      <v-spacer />
      <v-btn icon="mdi-close" variant="text" size="small" @click="showFilterDrawer = false" />
    </v-toolbar>
    <v-divider />
    <div class="pa-4">
      <v-select
        v-model="type"
        label="Type"
        :items="expenseTypes"
        item-title="title"
        item-value="value"
        clearable
        class="mb-4"
      />
      <v-text-field
        v-model="from"
        label="From"
        type="date"
        class="mb-4 d-md-none"
      />
      <v-text-field
        v-model="to"
        label="To"
        type="date"
        class="mb-4 d-md-none"
      />
      <v-btn
        block
        size="small"
        variant="tonal"
        color="error"
        prepend-icon="mdi-filter-remove"
        :disabled="activeFilterCount === 0 && !search"
        @click="clearAllFilters"
      >
        Clear All
      </v-btn>
    </div>
  </v-navigation-drawer>

  <AppFormDialog
    v-model="showForm"
    :title="selectedExpense ? 'Edit Expense' : 'Add Expense'"
    :max-width="500"
    :can-save="!!form.description.trim() && Number(form.amount) > 0"
    @save="saveExpense"
  >
    <AppFormSection title="Expense Details">
      <v-row dense>
        <v-col cols="12">
          <v-text-field
            v-model="form.expense_date"
            label="Date"
            type="date"
            density="compact"
            variant="outlined"
            hide-details
          />
        </v-col>
        <v-col cols="12">
          <v-select
            v-model="form.type"
            label="Type"
            :items="expenseTypeNames.map(n => ({ title: n, value: n }))"
            item-title="title"
            item-value="value"
            density="compact"
            variant="outlined"
            hide-details
            append-inner-icon="mdi-plus"
            @click:append-inner="showTypeForm = true"
          />
        </v-col>
        <v-col cols="12">
          <v-text-field
            v-model="form.description"
            label="Description"
            density="compact"
            variant="outlined"
            hide-details
          />
        </v-col>
        <v-col cols="12">
          <v-text-field
            v-model.number="form.amount"
            label="Amount"
            type="number"
            prefix="₱"
            density="compact"
            variant="outlined"
            hide-details
          />
        </v-col>
      </v-row>
    </AppFormSection>
  </AppFormDialog>

  <AppFormDialog
    v-model="showTypeForm"
    title="Add Expense Type"
    :max-width="400"
    :can-save="!!newTypeName.trim()"
    :loading="typeSaving"
    @save="saveType"
  >
    <v-row dense>
      <v-col cols="12">
        <v-text-field
          v-model="newTypeName"
          label="Type Name"
          density="compact"
          variant="outlined"
          hide-details
        />
      </v-col>
      <v-col cols="12">
        <v-text-field
          v-model="newTypeDescription"
          label="Description (optional)"
          density="compact"
          variant="outlined"
          hide-details
        />
      </v-col>
    </v-row>
  </AppFormDialog>

  <v-snackbar v-model="snackbar" :color="snackbarColor" timeout="4000">
    {{ snackbarText }}
    <template #actions>
      <v-btn variant="text" @click="snackbar = false">Close</v-btn>
    </template>
  </v-snackbar>
</template>
