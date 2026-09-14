<script setup lang="ts">
import { computed, useAttrs } from 'vue'

interface Props {
  title?: string
}

defineOptions({
  inheritAttrs: false
})

defineProps<Props>()

const attrs = useAttrs()
const cardClass = computed(() => ['app-card', attrs.class].filter(Boolean).join(' '))
const cardAttrs = computed(() => {
  const { class: _c, ...rest } = attrs
  return rest
})
</script>

<template>
  <v-card v-bind="cardAttrs" :class="cardClass">
    <v-card-title
      v-if="title || $slots.title || $slots.actions"
      class="app-card-title d-flex align-center"
    >
      <slot name="title">
        <span>{{ title }}</span>
      </slot>
      <v-spacer />
      <slot name="actions" />
    </v-card-title>
    <slot />
  </v-card>
</template>
