<script setup lang="ts">
interface Props {
  url?: string | null
  title?: string
  subtitle?: string
}

const props = withDefaults(defineProps<Props>(), {
  url: null,
  title: 'Report Preview',
  subtitle: ''
})

const show = defineModel<boolean>({ default: false })

function openExternal () {
  if (props.url) window.open(props.url, '_blank')
}
</script>

<template>
  <AppDialog
    v-model="show"
    :title="title"
    :subtitle="subtitle"
    icon="mdi-file-pdf-box"
    max-width="1100"
  >
    <template #title-append>
      <div class="d-flex ga-2 flex-shrink-0 ml-4 align-self-center">
        <v-btn
          icon="mdi-open-in-new"
          variant="tonal"
          color="white"
          size="small"
          density="comfortable"
          aria-label="Open in new tab"
          @click="openExternal"
        />
        <v-btn
          icon="mdi-close"
          variant="tonal"
          color="white"
          size="small"
          density="comfortable"
          aria-label="Close"
          @click="show = false"
        />
      </div>
    </template>

    <div class="pdf-preview">
      <iframe
        v-if="show && url"
        :src="url"
        class="pdf-preview__frame"
        title="PDF preview"
      />
    </div>
  </AppDialog>
</template>

<style scoped>
.pdf-preview {
  height: 75vh;
  background: #525659;
}

.pdf-preview__frame {
  width: 100%;
  height: 100%;
  border: 0;
  display: block;
}
</style>
