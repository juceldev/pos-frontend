<script setup lang="ts">
const menu = defineModel<string>('menu', { default: 'company' })

const items = [
  { key: 'company', title: 'Company Info', subtitle: 'License and Credentials', icon: 'mdi-office-building' },
  { key: 'sales', title: 'Sales Transaction', subtitle: 'Default Auto/Settings', icon: 'mdi-cart' },
  { key: 'printer', title: 'POS Printers', subtitle: 'Receipt & Settings', icon: 'mdi-printer' },
  { key: 'users', title: 'Users | Operators', subtitle: 'List / Registered', icon: 'mdi-account' },
  { key: 'access', title: 'User Level Access', subtitle: 'Rights & Protection', icon: 'mdi-shield-account' },
  { key: 'photos', title: 'Photos & Logos', subtitle: 'Theme Designs', icon: 'mdi-image' },
  { key: 'hardware', title: 'Hardware & Other', subtitle: 'Setting Options', icon: 'mdi-desktop-tower' },
  { key: 'database', title: 'Master Database', subtitle: 'Backup and Resets (F10 to Reset)', icon: 'mdi-database' },
  { key: 'datetime', title: 'Date & Time', subtitle: 'Set Date & Time', icon: 'mdi-clock' },
  { key: 'backup', title: 'Back-up Settings', subtitle: 'Backup Manager', icon: 'mdi-backup-restore' }
]
</script>

<template>
  <v-list density="compact" nav class="pos-settings-menu border rounded" color="primary">
    <v-list-item
      v-for="item in items"
      :key="item.key"
      :value="item.key"
      :active="menu === item.key"
      @click="menu = item.key"
    >
      <template #prepend>
        <v-icon size="20">{{ item.icon }}</v-icon>
      </template>
      <v-list-item-title class="text-body-2 font-weight-medium">{{ item.title }}</v-list-item-title>
      <v-list-item-subtitle class="text-caption">{{ item.subtitle }}</v-list-item-subtitle>
    </v-list-item>
  </v-list>
</template>
