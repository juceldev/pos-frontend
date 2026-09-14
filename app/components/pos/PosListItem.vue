<script setup lang="ts">
interface Props {
  title: string
  subtitle?: string
  icon?: string
  iconColor?: string
  chipText?: string
  chipColor?: string
  qty?: number
  qtyReadonly?: boolean
  qtyDisabled?: boolean
  addDisabled?: boolean
  addIcon?: string
  hideQty?: boolean
  hideAdd?: boolean
  unavailable?: boolean
  selected?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  icon: 'mdi-barcode-scan',
  iconColor: 'primary',
  qty: 1,
  qtyReadonly: true,
  addIcon: 'mdi-cart-plus',
  hideQty: false,
  hideAdd: false
})

const emit = defineEmits<{
  add: []
  remove: []
  'update:qty': [value: number]
}>()

const localQty = computed({
  get: () => props.qty,
  set: (value) => emit('update:qty', Number(value) || 1)
})
</script>

<template>
  <v-card
    flat
    class="pos-list-item border"
    :class="{
      'pos-list-item--unavailable': unavailable,
      'pos-list-item--selected': selected
    }"
  >
    <v-card-text class="py-2 px-3">
      <v-row align="center" no-gutters>
        <v-col cols="12" sm="8">
          <div class="d-flex align-center ga-2">
            <v-icon size="22" :color="unavailable ? 'grey' : iconColor">{{ icon }}</v-icon>
            <div>
              <div class="font-weight-bold">
                <slot name="title">{{ title }}</slot>
                <v-chip
                  v-if="chipText"
                  size="small"
                  :color="chipColor || (unavailable ? 'error' : 'success')"
                  variant="flat"
                  class="font-weight-bold ml-1"
                >
                  {{ chipText }}
                </v-chip>
              </div>
              <div v-if="subtitle" class="d-flex align-center ga-2 text-caption text-medium-emphasis">
                <slot name="subtitle">
                  <v-icon size="14">mdi-package-variant</v-icon>
                  <span>{{ subtitle }}</span>
                </slot>
              </div>
            </div>
          </div>
        </v-col>
        <v-col cols="12" sm="4" class="d-flex align-center justify-start justify-sm-end ga-2 mt-2 mt-sm-0">
          <slot name="actions">
            <v-text-field
              v-if="!hideQty"
              v-model.number="localQty"
              type="number"
              min="1"
              :max="qtyReadonly ? qty : undefined"
              variant="outlined"
              density="compact"
              hide-details
              class="pos-list-item-qty"
              :readonly="qtyReadonly"
              :disabled="qtyDisabled"
            />
            <v-btn
              v-if="!hideAdd"
              :icon="addIcon"
              size="small"
              color="primary"
              variant="elevated"
              :disabled="addDisabled || unavailable"
              @click="emit('add')"
            />
          </slot>
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>

<style scoped>
.pos-list-item {
  border-radius: 12px;
  background-color: #ffffff;
  border: 1px solid #e5e7eb;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  margin-bottom:8px;
  transition: box-shadow 0.2s ease, border-color 0.2s ease;
}

.pos-list-item:hover {
  border-color: #0c7eb4;
  box-shadow: 0 4px 10px rgba(12, 126, 180, 0.12);
}

.pos-list-item--unavailable {
  opacity: 0.55;
  background-color: #f3f4f6;
}

.pos-list-item--selected {
  border-color: #0c7eb4;
  background-color: #f0f9ff;
}

.pos-list-item-qty {
  max-width: 70px;
  min-width: 56px;
}
</style>
