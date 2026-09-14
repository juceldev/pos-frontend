<script setup lang="ts">
import CompanyInfoPanel from '~/components/settings/CompanyInfoPanel.vue'
import UserAccessPanel from '~/components/settings/UserAccessPanel.vue'
import SalesTransactionPanel from '~/components/settings/SalesTransactionPanel.vue'
import PrinterPanel from '~/components/settings/PrinterPanel.vue'
import UsersPanel from '~/components/settings/UsersPanel.vue'
import SettingsMenu from '~/components/settings/SettingsMenu.vue'
import { useCategories } from '~/composables/useCategories'
import { usePermission } from '~/composables/usePermission'
import { useSettings } from '~/composables/useSettings'

definePageMeta({
  middleware: 'auth'
})

const menu = ref('company')
const { company, salesTransaction, printer, loading, fetchSettings, saveCompany, saveSalesTransaction, savePrinter } = useSettings()
const { categories, fetchCategories } = useCategories()
const { hasPermission } = usePermission()
const canEdit = computed(() => hasPermission('settings.edit'))

const companyForm = ref<any>({})
const salesForm = ref<any>({})
const printerForm = ref<any>({})

function syncForms () {
  companyForm.value = { ...company.value }
  salesForm.value = { ...salesTransaction.value }
  printerForm.value = { ...printer.value }
}

onMounted(async () => {
  await Promise.all([fetchSettings(), fetchCategories()])
  syncForms()
})

watch([company, salesTransaction, printer], syncForms, { deep: true })

async function saveCompanySettings () {
  if (await saveCompany(companyForm.value)) {
    company.value = { ...companyForm.value }
  }
}

async function saveSalesSettings () {
  if (await saveSalesTransaction(salesForm.value)) {
    salesTransaction.value = { ...salesForm.value }
  }
}

async function savePrinterSettings () {
  if (await savePrinter(printerForm.value)) {
    printer.value = { ...printerForm.value }
  }
}
</script>

<template>
  <AppPageHeader title="Settings" subtitle="POS general settings" />

  <AppCard>
    <v-row>
      <v-col cols="12" sm="3" md="3">
        <SettingsMenu v-model:menu="menu" />
      </v-col>
      <v-col cols="12" sm="9" md="9">
        <v-progress-linear v-if="loading" indeterminate color="primary" class="mb-2" />

        <CompanyInfoPanel
          v-if="menu === 'company'"
          v-model="companyForm"
          :can-edit="canEdit"
          @save="saveCompanySettings"
        />

        <UserAccessPanel
          v-else-if="menu === 'access'"
          :company="companyForm"
          :can-edit="canEdit"
        />

        <SalesTransactionPanel
          v-else-if="menu === 'sales'"
          v-model="salesForm"
          :categories="categories"
          :can-edit="canEdit"
          @save="saveSalesSettings"
        />

        <PrinterPanel
          v-else-if="menu === 'printer'"
          v-model="printerForm"
          :company="companyForm"
          :can-edit="canEdit"
          @save="savePrinterSettings"
        />

        <UsersPanel
          v-else-if="menu === 'users'"
        />

        <div v-else class="text-center text-medium-emphasis py-10">
          <v-icon size="64" color="medium-emphasis">mdi-cog</v-icon>
          <p class="text-h6 mt-2">Settings panel under construction</p>
          <p class="text-body-2">This section will be available soon.</p>
        </div>
      </v-col>
    </v-row>
  </AppCard>
</template>
