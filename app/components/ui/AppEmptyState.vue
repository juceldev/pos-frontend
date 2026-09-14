<script setup lang="ts">
interface Props {
  icon?: string
  title?: string
  subtitle?: string
}

withDefaults(defineProps<Props>(), {
  icon: 'mdi-inbox-outline',
  title: 'No records found',
  subtitle: 'Try adjusting your filters or add a new record.'
})
</script>

<template>
  <div class="empty-state">
    <v-icon :icon="icon" class="empty-state-icon" />
    <div class="text-h6">{{ title }}</div>
    <div class="text-body-2 text-medium-emphasis">{{ subtitle }}</div>
  </div>
</template>
