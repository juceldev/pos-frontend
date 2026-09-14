<script setup lang="ts">
import { useAttrs } from 'vue'

defineOptions({ inheritAttrs: false })

interface Props {
  title?: string
  subtitle?: string
  icon?: string
  width?: string | number
  headerColor?: 'pos' | 'primary' | 'error' | 'warning'
  hideClose?: boolean
  closeIcon?: string
  noHeader?: boolean
  loading?: boolean
}

withDefaults(defineProps<Props>(), {
  width: 520,
  hideClose: false,
  closeIcon: 'mdi-close',
  headerColor: 'pos',
  noHeader: false,
  loading: false
})

const show = defineModel<boolean>({ default: false })
const emit = defineEmits<{
  close: []
}>()
const attrs = useAttrs()

function onClose () {
  show.value = false
  emit('close')
}
</script>

<template>
  <v-dialog
    v-model="show"
    :max-width="width"
    transition="dialog-bottom-transition"
    v-bind="attrs"
  >
    <v-card
      flat
      class="app-drawer-card d-flex flex-column"
      :loading="loading"
    >
      <v-card-title
        v-if="!noHeader"
        :class="`app-drawer-header app-drawer-header--${headerColor} d-flex align-center justify-space-between pa-3`"
      >
        <slot name="header">
          <div :class="['d-flex', 'ga-3', 'min-w-0', { 'align-start': !!subtitle, 'align-center': !subtitle }]">
            <v-avatar v-if="icon" color="rgba(255,255,255,0.15)" size="32" :class="{ 'mt-1': !!subtitle }">
              <v-icon color="white" size="20">{{ icon }}</v-icon>
            </v-avatar>
            <div class="min-w-0 flex-1">
              <div :class="['text-body-1 font-weight-bold text-truncate', { 'mt-0': !subtitle }]">
                {{ title }}
              </div>
              <div v-if="subtitle" class="text-caption app-drawer-header__subtitle">
                {{ subtitle }}
              </div>
            </div>
          </div>
          <slot name="title-append">
            <v-btn
              v-if="!hideClose"
              :icon="closeIcon"
              variant="text"
              color="white"
              size="small"
              :class="['flex-shrink-0 ml-4', { 'align-self-start': !!subtitle, 'align-self-center': !subtitle }]"
              @click="onClose"
            />
          </slot>
        </slot>
      </v-card-title>

      <div class="flex-1 overflow-y-auto app-drawer-body">
        <slot />
        <slot name="list" />
      </div>

      <div v-if="$slots.actions" class="pa-3 border-t d-flex align-center">
        <slot name="actions" />
      </div>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.app-drawer-card {
  border-radius: 12px;
  overflow: hidden;
  max-height: 90vh;
}

.app-drawer-body {
  min-height: 0;
}

.app-drawer-header {
  color: white;
}

.app-drawer-header--pos {
  background: #0c7eb4;
}

.app-drawer-header--primary {
  background: rgb(var(--v-theme-primary));
}

.app-drawer-header--error {
  background: rgb(var(--v-theme-error));
}

.app-drawer-header--warning {
  background: rgb(var(--v-theme-warning));
  color: rgba(0, 0, 0, 0.87);
}

.app-drawer-header__subtitle {
  color: rgba(255, 255, 255, 0.85);
}

.border-t {
  border-top: 1px solid #e5e7eb;
}
</style>