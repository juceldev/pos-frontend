<script setup lang="ts">
interface Props {
  title: string
  subtitle?: string
}

defineProps<Props>()
</script>

<template>
  <div class="d-flex flex-column flex-sm-row align-sm-center justify-space-between gap-2 mb-2 mt-1">
    <div>
      <h1 class="page-title">{{ title }}</h1>
      <p v-if="subtitle" class="page-subtitle text-medium-emphasis mb-0">{{ subtitle }}</p>
    </div>
    <div class="d-flex align-center flex-wrap gap-2">
      <slot name="actions" />
    </div>
  </div>
</template>
