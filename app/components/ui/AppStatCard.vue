<script setup lang="ts">
interface Props {
  title: string
  value: string | number
  subtitle?: string
  color?: string
  icon?: string
  to?: string
}

withDefaults(defineProps<Props>(), {
  color: 'primary'
})
</script>

<template>
  <v-card
    class="stat-card"
    :to="to"
    :style="{ borderLeftColor: `rgb(var(--v-theme-${color}))` }"
  >
    <v-card-text class="d-flex align-center py-3">
      <div class="flex-grow-1">
        <div class="text-caption text-medium-emphasis text-uppercase">{{ title }}</div>
        <div class="text-h5 font-weight-bold">{{ value }}</div>
        <div v-if="subtitle" class="text-caption text-medium-emphasis">{{ subtitle }}</div>
      </div>
      <v-icon
        v-if="icon"
        :icon="icon"
        :color="color"
        size="large"
        class="ml-2"
      />
    </v-card-text>
  </v-card>
</template>
