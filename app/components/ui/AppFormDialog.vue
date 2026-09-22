<script setup lang="ts">
interface Props {
  title: string
  loading?: boolean
  canSave?: boolean
  maxWidth?: string | number
}

withDefaults(defineProps<Props>(), {
  loading: false,
  canSave: true,
  maxWidth: 720
})

const show = defineModel<boolean>({ default: false })

defineEmits<{
  (e: 'save'): void
}>()
</script>

<template>
  <AppDialog
    v-model="show"
    :title="title"
    :max-width="maxWidth"
    persistent
    scrollable
  >
    <v-card-text class="py-4 py-sm-4 px-3 px-sm-4">
      <slot />
    </v-card-text>

    <v-card-actions>
      <v-spacer />
      <v-btn variant="text" :disabled="loading" @click="show = false">
        Cancel
      </v-btn>
      <v-btn
        color="primary"
        :loading="loading"
        :disabled="!canSave || loading"
        @click="$emit('save')"
      >
        <slot name="save-text">Save</slot>
      </v-btn>
    </v-card-actions>
  </AppDialog>
</template>
