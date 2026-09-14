<script setup lang="ts">
const { notification } = useNotification()

const icon = computed(() => ({
  success: 'mdi-check-circle',
  error: 'mdi-alert-circle',
  info: 'mdi-information',
  warning: 'mdi-alert'
}[notification.color] ?? 'mdi-information'))
</script>

<template>
  <v-snackbar
    v-model="notification.show"
    :color="notification.color"
    :timeout="notification.timeout"
    location="top right"
  >
    <div class="d-flex align-center">
      <v-icon size="18" class="mr-2">{{ icon }}</v-icon>
      {{ notification.message }}
    </div>
    <template #actions>
      <v-btn icon="mdi-close" variant="text" size="small" @click="notification.show = false" />
    </template>
  </v-snackbar>
</template>
