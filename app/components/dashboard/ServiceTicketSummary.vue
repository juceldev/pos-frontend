<script setup lang="ts">
import type { ServiceTicketSummary } from '~/types/report'

interface Props {
  data: ServiceTicketSummary
}

const props = defineProps<Props>()

const cards = computed(() => [
  { label: 'Pending', value: props.data.pending, color: 'warning', icon: 'mdi-clock-outline' },
  { label: 'In Progress', value: props.data.in_progress, color: 'info', icon: 'mdi-progress-wrench' },
  { label: 'Completed', value: props.data.completed, color: 'success', icon: 'mdi-check-circle' }
])
</script>

<template>
  <AppCard title="Service Tickets">
    <v-card-text>
      <v-row dense>
        <v-col v-for="c in cards" :key="c.label" cols="4">
          <div class="text-center pa-3 rounded border">
            <v-icon :color="c.color" size="32">{{ c.icon }}</v-icon>
            <div class="text-h5 font-weight-bold mt-1">{{ c.value }}</div>
            <div class="text-caption text-medium-emphasis">{{ c.label }}</div>
          </div>
        </v-col>
      </v-row>
    </v-card-text>
  </AppCard>
</template>
