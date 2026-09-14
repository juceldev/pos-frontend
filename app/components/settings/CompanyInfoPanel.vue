<script setup lang="ts">
import type { CompanySetting } from '~/types/settings'

interface Props {
  modelValue: CompanySetting
  canEdit: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: CompanySetting]
  save: []
}>()

const form = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

function verifyLicense () {
  form.value.license_status = 'Verified'
}
</script>

<template>
  <div class="d-flex flex-wrap ga-4">
    <v-card flat class="pos-settings-card border" title="Company Information">
      <v-card-text>
        <v-row dense>
          <v-col cols="12">
            <v-text-field v-model="form.company_name" label="Company / Store Name" variant="outlined" density="compact" hide-details :disabled="!canEdit" />
          </v-col>
          <v-col cols="12">
            <v-text-field v-model="form.branch_name" label="Branch Name" variant="outlined" density="compact" hide-details :disabled="!canEdit" />
          </v-col>
          <v-col cols="12">
            <v-textarea v-model="form.address" label="Address" rows="2" variant="outlined" density="compact" hide-details :disabled="!canEdit" />
          </v-col>
          <v-col cols="12">
            <v-textarea v-model="form.contact_numbers" label="Contact #'s" rows="2" variant="outlined" density="compact" hide-details :disabled="!canEdit" />
          </v-col>
          <v-col cols="12" sm="6">
            <v-text-field v-model="form.email" label="Email Address" variant="outlined" density="compact" hide-details :disabled="!canEdit" />
          </v-col>
          <v-col cols="12" sm="6">
            <v-text-field v-model="form.reg_permit_no" label="Reg. Permit Nos. / VAT #" variant="outlined" density="compact" hide-details :disabled="!canEdit" />
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <v-card flat class="pos-settings-card border" title="Computer | Terminal Details">
      <v-card-text>
        <v-row dense>
          <v-col cols="12">
            <v-text-field v-model="form.pc_name" label="PC Name" variant="outlined" density="compact" hide-details :disabled="!canEdit" />
          </v-col>
          <v-col cols="12" sm="6">
            <v-text-field v-model="form.serial_nos" label="Serial Nos." variant="outlined" density="compact" hide-details :disabled="!canEdit" />
          </v-col>
          <v-col cols="12" sm="6">
            <v-text-field v-model="form.terminal_id" label="Terminal ID" variant="outlined" density="compact" hide-details :disabled="!canEdit" />
          </v-col>
          <v-col cols="12">
            <div class="d-flex align-center ga-2">
              <v-text-field v-model="form.license_key" label="License Key" variant="outlined" density="compact" hide-details :disabled="!canEdit" class="flex-1" />
              <v-btn
                color="success"
                size="small"
                :disabled="!canEdit"
                @click="verifyLicense"
              >
                <v-icon start size="18">mdi-check</v-icon>
                Verify
              </v-btn>
            </div>
          </v-col>
          <v-col cols="12">
            <div class="d-flex align-center justify-space-between border rounded pa-3 mt-2 bg-grey-lighten-4">
              <div>
                <div class="text-caption text-medium-emphasis">Status</div>
                <div class="font-weight-bold" :class="form.license_status === 'Registered' || form.license_status === 'Verified' ? 'text-success' : 'text-error'">
                  {{ form.license_status ?? 'Unregistered' }}
                </div>
              </div>
              <div>
                <div class="text-caption text-medium-emphasis">License Expiry</div>
                <div class="font-weight-bold">{{ form.license_expiry ?? 'N/A' }}</div>
              </div>
            </div>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>
  </div>

  <div class="d-flex justify-end mt-4">
    <v-btn v-if="canEdit" color="primary" @click="emit('save')" class="px-8">
      Update
    </v-btn>
  </div>
</template>

<style scoped>
.pos-settings-card {
  flex: 1 1 320px;
  min-width: 320px;
}
</style>
