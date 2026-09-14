<script setup lang="ts">
interface StatItem {
  label: string
  value: string | number
}

defineProps<{
  stats: StatItem[]
}>()
</script>

<template>
  <v-row dense class="mb-4">
    <v-col
      v-for="(stat, index) in stats"
      :key="index"
      cols="6"
      sm="6"
      md="3"
    >
      <v-card class="app-stat-card pa-3" variant="outlined">
        <div class="text-caption text-medium-emphasis">{{ stat.label }}</div>
        <div class="text-h6 font-weight-bold mt-1">{{ stat.value }}</div>
      </v-card>
    </v-col>
  </v-row>
</template>
