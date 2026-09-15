<script setup lang="ts">
const { state, close } = useConfirm()

function onConfirm () {
  close(true)
}

function onCancel () {
  close(false)
}
</script>

<template>
  <AppDialog
    v-model="state.show"
    :title="state.title"
    icon="mdi-help-circle"
    max-width="400"
    persistent
  >
    <v-card-text class="pa-4">
      {{ state.message }}
    </v-card-text>
    <template #actions>
      <v-card-actions class="w-100 ga-2">
        <v-btn class="flex-grow-1" color="error" variant="outlined" @click="onCancel">
          {{ state.cancelText }}
        </v-btn>
        <v-btn class="flex-grow-1" color="primary" variant="elevated" @click="onConfirm">
          {{ state.confirmText }}
        </v-btn>
      </v-card-actions>
    </template>
  </AppDialog>
</template>
