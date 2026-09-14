<script setup lang="ts">
import { useProducts } from '~/composables/useProducts'

definePageMeta({ middleware: 'auth' })

const { verifySerial } = useProducts()

const serial = ref('')
const result = ref<any>(null)
const searching = ref(false)

async function verify () {
  if (!serial.value.trim()) return
  searching.value = true
  result.value = await verifySerial(serial.value.trim())
  searching.value = false
}

const statusColor = (s: string) => ({ in_stock: 'success', sold: 'info', defective: 'error', returned: 'warning' }[s] ?? 'grey')
</script>

<template>
  <AppPageHeader title="Serial Nos. Verificator" subtitle="Look up a serial number" />

  <AppCard>
    <div class="d-flex ga-2 mb-4" style="max-width: 500px">
      <v-text-field
        v-model="serial"
        label="Serial Number"
        prepend-inner-icon="mdi-barcode-scan"
        variant="outlined"
        density="comfortable"
        autofocus
        hide-details
        @keyup.enter="verify"
      />
      <v-btn color="primary" :loading="searching" :disabled="!serial.trim()" @click="verify">
        Verify
      </v-btn>
    </div>

    <v-alert v-if="result && !result.found" type="warning">
      Serial number not found in the system.
    </v-alert>

    <v-card v-if="result?.found && result.serial" variant="outlined" max-width="500">
      <v-card-text>
        <div class="d-flex align-center mb-3">
          <v-icon size="40" color="primary" class="mr-3">mdi-barcode</v-icon>
          <div>
            <div class="text-h6">{{ result.serial.serial_number }}</div>
            <v-chip :color="statusColor(result.serial.status)" size="small">{{ result.serial.status.replace('_', ' ') }}</v-chip>
          </div>
        </div>
        <v-divider class="mb-3" />
        <div class="text-body-2"><strong>Product:</strong> {{ result.serial.product?.name ?? '-' }}</div>
        <div class="text-body-2"><strong>Barcode:</strong> {{ result.serial.product?.barcode ?? '-' }}</div>
        <div class="text-body-2"><strong>Registered:</strong> {{ result.serial.created_at ? new Date(result.serial.created_at).toLocaleString() : '-' }}</div>
      </v-card-text>
    </v-card>
  </AppCard>
</template>
