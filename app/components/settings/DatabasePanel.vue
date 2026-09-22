<script setup lang="ts">
import type { DatabaseBackup } from '~/types/backup'
import { useBackups } from '~/composables/useBackups'
import { usePermission } from '~/composables/usePermission'
import { useConfirm } from '~/composables/useConfirm'

const { backups, meta, loading, creating, error, fetchBackups, createBackup, deleteBackup, downloadBackup } = useBackups()
const { hasPermission } = usePermission()
const { confirm } = useConfirm()

const canEdit = computed(() => hasPermission('settings.edit'))

const page = ref(1)
const perPage = ref(15)

const headers = [
  { title: 'Filename', key: 'filename', sortable: false, minWidth: '240px' },
  { title: 'Size', key: 'size_bytes', sortable: false, minWidth: '100px' },
  { title: 'Created', key: 'created_at', sortable: false, minWidth: '160px' },
  { title: 'Created By', key: 'user', sortable: false, minWidth: '140px' },
  { title: 'Actions', key: 'actions', sortable: false, align: 'end', width: '100px' }
]

async function load () {
  if (!import.meta.client) return
  await fetchBackups({ page: page.value, per_page: perPage.value })
}

async function handleCreate () {
  const backup = await createBackup()
  if (backup) {
    await load()
    snackbarText.value = `Backup created: ${backup.filename}`
    snackbarColor.value = 'success'
    snackbar.value = true
  }
}

async function handleDelete (backup: DatabaseBackup) {
  const ok = await confirm({
    title: 'Delete Backup',
    message: `Delete backup ${backup.filename}? This cannot be undone.`,
    confirmText: 'Delete'
  })
  if (!ok) return
  if (await deleteBackup(backup.id)) {
    await load()
    snackbarText.value = 'Backup deleted'
    snackbarColor.value = 'success'
    snackbar.value = true
  }
}

const snackbar = ref(false)
const snackbarText = ref('')
const snackbarColor = ref('success')

watch(error, (msg) => {
  if (msg) {
    snackbarText.value = msg
    snackbarColor.value = 'error'
    snackbar.value = true
  }
})

onMounted(load)
watch([page, perPage], load)
</script>

<template>
  <v-card flat class="border" title="Master Database" subtitle="Backup and Database">
    <v-card-text>
      <v-row dense class="mb-3" align="center">
        <v-col cols="12" sm="8">
          <p class="text-body-2 text-medium-emphasis mb-0">
            Create a full backup of the POS database. Backups are stored on the server
            and can be downloaded or deleted here.
          </p>
        </v-col>
        <v-col cols="12" sm="4" class="d-flex justify-end">
          <v-btn
            v-if="canEdit"
            color="primary"
            prepend-icon="mdi-database-plus"
            :loading="creating"
            :disabled="loading"
            @click="handleCreate"
          >
            Backup Now
          </v-btn>
        </v-col>
      </v-row>

      <AppDataTable
        v-model:page="page"
        v-model:items-per-page="perPage"
        :headers="headers"
        :items="backups"
        :items-length="meta.total"
        :loading="loading"
        empty-text="No backups found"
      >
        <template #item.size_bytes="{ item }">
          {{ formatBytes(item.size_bytes) }}
        </template>

        <template #item.created_at="{ item }">
          {{ new Date(item.created_at).toLocaleString() }}
        </template>

        <template #item.user="{ item }">
          {{ item.user?.name ?? '—' }}
        </template>

        <template #item.actions="{ item }">
          <div class="d-flex justify-end">
            <v-menu location="bottom end">
              <template #activator="{ props }">
                <v-btn
                  v-bind="props"
                  icon="mdi-dots-vertical"
                  variant="text"
                  size="small"
                  aria-label="Actions"
                />
              </template>
              <v-list density="compact" min-width="160">
                <v-list-item
                  prepend-icon="mdi-download"
                  title="Download"
                  @click="downloadBackup(item)"
                />
                <v-list-item
                  v-if="canEdit"
                  prepend-icon="mdi-delete"
                  title="Delete"
                  base-color="error"
                  @click="handleDelete(item)"
                />
              </v-list>
            </v-menu>
          </div>
        </template>
      </AppDataTable>
    </v-card-text>

    <v-snackbar v-model="snackbar" :color="snackbarColor" timeout="4000" location="bottom right">
      {{ snackbarText }}
      <template #actions>
        <v-btn variant="text" @click="snackbar = false">Close</v-btn>
      </template>
    </v-snackbar>
  </v-card>
</template>
