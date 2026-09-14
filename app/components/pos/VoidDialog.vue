<script setup lang="ts">
import { formatAmount } from '~/utils/format'
import type { Sale } from '~/types/sale'

interface Props {
  modelValue: boolean
  sale: Sale | null
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  submit: [reason: string]
}>()

const dialog = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const reason = ref('')

const formattedDate = computed(() => {
  if (!props.sale?.created_at) return ''
  return new Date(props.sale.created_at).toLocaleString()
})

function submit () {
  emit('submit', reason.value)
  reason.value = ''
  dialog.value = false
}
</script>

<template>
  <AppDrawer
    v-model="dialog"
    title="Void Sale"
    icon="mdi-alert"
    header-color="error"
  >
    <v-card-text v-if="sale">
      <p class="text-body-1">
        Are you sure you want to void <strong>{{ sale.sale_number }}</strong>?
      </p>

      <v-row dense class="mt-2">
        <v-col cols="12" sm="6">
          <div class="text-caption text-medium-emphasis">Customer</div>
          <div class="font-weight-medium">{{ sale.customer?.name ?? 'Walk-in' }}</div>
        </v-col>
        <v-col cols="12" sm="6">
          <div class="text-caption text-medium-emphasis">Total</div>
          <div class="font-weight-medium text-error">{{ formatAmount(sale.total) }}</div>
        </v-col>
        <v-col cols="12" sm="6">
          <div class="text-caption text-medium-emphasis">Date</div>
          <div class="font-weight-medium">{{ formattedDate }}</div>
        </v-col>
        <v-col cols="12" sm="6">
          <div class="text-caption text-medium-emphasis">Status</div>
          <div class="font-weight-medium text-capitalize">{{ sale.status }}</div>
        </v-col>
      </v-row>

      <v-alert
        type="warning"
        variant="tonal"
        density="compact"
        class="mt-3"
      >
        This will reverse all stock movements and restore sold serials. This action cannot be undone.
      </v-alert>

      <v-textarea
        v-model="reason"
        label="Reason (optional)"
        rows="2"
        variant="outlined"
        density="compact"
        class="mt-3"
        hide-details
      />
    </v-card-text>

    <template #actions>
      <v-spacer />
      <v-btn variant="text" @click="dialog = false">Cancel</v-btn>
      <v-btn color="error" @click="submit">
        Void Sale
      </v-btn>
    </template>
  </AppDrawer>
</template>
