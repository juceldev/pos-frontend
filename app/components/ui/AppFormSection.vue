<script setup lang="ts">
interface Props {
  title: string
}

defineProps<Props>()
</script>

<template>
  <div class="form-section">
    <div class="form-section-title text-subtitle-1 font-weight-bold mb-4">{{ title }}</div>
    <slot />
  </div>
</template>
