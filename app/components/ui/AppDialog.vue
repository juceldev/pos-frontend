<script setup lang="ts">
import { useAttrs } from 'vue'
import { useDisplay } from 'vuetify'

defineOptions({ inheritAttrs: false })

interface Props {
  title?: string
  subtitle?: string
  icon?: string
  maxWidth?: string | number
  persistent?: boolean
  scrollable?: boolean
  fullscreen?: boolean
  transition?: string
  hideClose?: boolean
  closeIcon?: string
  headerColor?: 'pos' | 'primary' | 'error' | 'warning'
  noHeader?: boolean
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  maxWidth: 500,
  persistent: false,
  scrollable: false,
  fullscreen: false,
  transition: 'dialog-transition',
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
const { smAndDown } = useDisplay()

function onClose () {
  show.value = false
  emit('close')
}
</script>

<template>
  <v-dialog
    v-model="show"
    :max-width="maxWidth"
    :persistent="persistent"
    :scrollable="scrollable"
    :fullscreen="smAndDown || fullscreen"
    :transition="transition"
  >
    <template v-if="$slots.activator" #activator="activatorProps">
      <slot name="activator" v-bind="activatorProps" />
    </template>

    <v-card
      :class="['app-dialog-card', { 'app-dialog-card--fullscreen': fullscreen }]"
      :loading="loading"
      v-bind="attrs"
    >
      <v-card-title
        v-if="!noHeader"
        :class="['app-dialog-header', `app-dialog-header--${headerColor}`, 'd-flex', 'align-center', 'justify-space-between', smAndDown ? 'pa-2' : 'pa-3']"
      >
        <slot name="header">
          <div :class="['d-flex', 'ga-3', 'min-w-0', 'flex-1', { 'align-start': !!subtitle, 'align-center': !subtitle }]">
            <v-avatar v-if="icon" color="rgba(255,255,255,0.15)" :size="smAndDown ? 28 : 32" :class="{ 'mt-1': !!subtitle }">
              <v-icon color="white" :size="smAndDown ? 16 : 20">{{ icon }}</v-icon>
            </v-avatar>
            <div class="min-w-0 flex-1">
              <div :class="['text-body-1 font-weight-bold', { 'mt-0': !subtitle }]">
                {{ title }}
              </div>
              <div v-if="subtitle" class="text-caption app-dialog-header__subtitle">
                {{ subtitle }}
              </div>
            </div>
          </div>
          <slot name="title-append">
            <v-btn
              v-if="!hideClose"
              :icon="closeIcon"
              variant="tonal"
              color="white"
              size="small"
              density="comfortable"
              :class="['flex-shrink-0 ml-4', { 'align-self-start': !!subtitle, 'align-self-center': !subtitle }]"
              @click="onClose"
            />
          </slot>
        </slot>
      </v-card-title>

      <slot />
      <slot name="list" />
      <slot name="actions" />
    </v-card>
  </v-dialog>
</template>

<style scoped>
.app-dialog-card {
  border-radius: 12px;
  overflow: hidden;
}

.app-dialog-card--fullscreen {
  border-radius: 0;
}

.app-dialog-header {
  color: white;
}

.app-dialog-header--pos {
  background: #0c7eb4;
}

.app-dialog-header--primary {
  background: rgb(var(--v-theme-primary));
}

.app-dialog-header--error {
  background: rgb(var(--v-theme-error));
}

.app-dialog-header--warning {
  background: rgb(var(--v-theme-warning));
  color: rgba(0, 0, 0, 0.87);
}

.app-dialog-header__subtitle {
  color: rgba(255, 255, 255, 0.85);
}
</style>
