<template>
  <v-app>
    <v-system-bar
      v-if="mdAndUp"
      color="primary"
      class="pos-system-bar px-2 px-md-4 d-none d-md-flex"
      height="32"
    >
      <span v-if="company?.company_name" class="text-truncate me-2" style="max-width: 160px;">{{ company.company_name }}</span>
      <span v-if="company?.company_name && company?.branch_name" class="me-2 d-none d-sm-inline">({{ company.branch_name }})</span>
      <span v-if="company?.company_name" class="me-2 d-none d-sm-inline">|</span>
      <span v-if="company?.pc_name" class="me-2 d-none d-sm-inline">{{ company.pc_name }}</span>
      <span v-if="company?.pc_name" class="me-2 d-none d-sm-inline">|</span>
      <span v-if="company?.terminal_id" class="me-2 d-none d-sm-inline">{{ company.terminal_id }}</span>

      <v-spacer />

      <span class="text-truncate me-2 d-none d-sm-inline">{{ auth.user?.name }}</span>
      <span class="me-2 d-none d-sm-inline">|</span>
      <span>{{ dateString }}</span>
    </v-system-bar>

    <!-- Top app bar: logo, theme toggle, user menu -->
    <v-app-bar
      v-if="auth.ready && auth.isLoggedIn && !hideAppChrome && !isPosPage"
      flat
      color="surface"
      class="app-bar border-b"
    >
      <template #prepend>
        <v-app-bar-nav-icon class="d-md-none" @click="mobileDrawer = !mobileDrawer" />
      </template>

      <v-app-bar-title class="d-flex align-center text-primary font-weight-bold min-w-0" style="flex: 1 1 auto; min-width: 0;">
        <span v-if="company?.company_name" class="text-truncate me-2" style="min-width: 0; max-width: 100%;">{{ company.company_name }}</span>
        <v-chip color="primary" variant="outlined" size="x-small" class="ml-2 d-none d-sm-inline-flex">
          v1.0.0
        </v-chip>
      </v-app-bar-title>

      <v-spacer class="d-none d-md-flex" />

      <div class="d-none d-md-flex align-center gap-2">
        <v-btn icon="mdi-home" to="/" color="primary" aria-label="Home" />
        <v-btn icon="mdi-cog" color="primary" aria-label="Settings" @click="settingsDialog = true" />

        <v-btn
          :icon="isDark ? 'mdi-weather-sunny' : 'mdi-weather-night'"
          color="primary"
          aria-label="Toggle theme"
          @click="toggle"
        />

        <v-menu location="bottom end" offset-y>
          <template #activator="{ props }">
            <v-btn
              v-bind="props"
              variant="text"
              color="primary"
              append-icon="mdi-chevron-down"
            >
              <v-avatar size="28" color="primary" class="mr-2">
                <span class="text-caption text-on-primary">{{ auth.user?.name?.[0] ?? 'U' }}</span>
              </v-avatar>
              <span class="d-none d-sm-inline">{{ auth.user?.name }}</span>
            </v-btn>
          </template>
          <v-card min-width="220" class="app-card">
            <v-list density="compact" nav>
              <v-list-item
                :title="auth.user?.name"
                :subtitle="auth.user?.role"
                prepend-icon="mdi-account"
              />
              <v-divider class="my-2" />
              <v-list-item prepend-icon="mdi-logout" title="Logout" @click="handleLogout" />
            </v-list>
          </v-card>
        </v-menu>
      </div>
    </v-app-bar>

    <!-- Horizontal nav bar (desktop only) -->
    <v-app-bar
    v-if="auth.ready && auth.isLoggedIn && !hideAppChrome && !isPosPage"
      flat
      color="primary"
      density="compact"
      class="top-nav-bar d-none d-md-flex"
    >
      <div class="d-flex align-center h-100 w-100 px-2">
        <template v-for="(entry, i) in filteredNav" :key="i">
          <!-- Flat link -->
          <v-btn
            v-if="'to' in entry"
            :to="entry.to"
            variant="text"
            color="white"
            class="top-nav-btn"
            :class="{ 'top-nav-btn--active': isFlatActive(entry) }"
            size="small"
          >
            <v-icon start size="18">{{ entry.icon }}</v-icon>
            {{ entry.title }}
          </v-btn>

          <!-- Dropdown group -->
          <v-menu
            v-else
            open-on-hover
            close-on-content-click
            location="bottom start"
          >
            <template #activator="{ props }">
              <v-btn
                v-bind="props"
                variant="text"
                color="white"
                class="top-nav-btn"
                :class="{ 'top-nav-btn--active': isGroupActive(entry) }"
                size="small"
                append-icon="mdi-chevron-down"
              >
                <v-icon start size="18">{{ entry.icon }}</v-icon>
                {{ entry.title }}
              </v-btn>
            </template>
            <v-list density="compact" class="top-nav-dropdown" nav>
              <v-list-item
                v-for="child in entry.children"
                :key="child.to"
                :to="child.to"
                :prepend-icon="child.icon"
                :title="child.title"
                :active="route.path === child.to"
                color="primary"
              />
            </v-list>
          </v-menu>
        </template>
      </div>
    </v-app-bar>

    <!-- Mobile drawer -->
    <v-navigation-drawer
      v-if="auth.ready && auth.isLoggedIn && !mdAndUp && !hideAppChrome && !isPosPage"
      v-model="mobileDrawer"
      temporary
      :width="260"
      color="background"
      class="mobile-nav-drawer"
    >
      <div class="d-flex align-center pa-4">
        <v-avatar color="primary" class="mr-3">
          <v-icon color="white" size="24">mdi-office-building</v-icon>
        </v-avatar>
        <div>
          <div class="text-subtitle-1 font-weight-bold">JmeTech</div>
          <div class="text-caption text-medium-emphasis">POS SYSTEM</div>
        </div>
      </div>
      <v-divider />

      <v-list nav density="compact" class="pa-2">
        <template v-for="(entry, i) in filteredNav" :key="i">
          <!-- Flat link -->
          <v-list-item
            v-if="'to' in entry"
            :to="entry.to"
            :prepend-icon="entry.icon"
            :title="entry.title"
            :active="route.path === entry.to"
            color="primary"
            class="mb-1"
          />

          <!-- Expandable group -->
          <v-list-group v-else>
            <template #activator="{ props }">
              <v-list-item
                v-bind="props"
                :prepend-icon="entry.icon"
                :title="entry.title"
              />
            </template>
            <v-list-item
              v-for="child in entry.children"
              :key="child.to"
              :to="child.to"
              :prepend-icon="child.icon"
              :title="child.title"
              :active="route.path === child.to"
              color="primary"
              class="pl-6 mb-1"
            />
          </v-list-group>
        </template>
      </v-list>

      <v-spacer />
      <v-divider />
      <v-list nav density="compact" class="pa-2">
        <v-list-item
          v-if="auth.user"
          :title="auth.user?.name"
          :subtitle="auth.user?.role"
          prepend-icon="mdi-account"
          color="primary"
          class="mb-1"
        />
        <v-list-item
          :prepend-icon="isDark ? 'mdi-weather-sunny' : 'mdi-weather-night'"
          :title="isDark ? 'Light mode' : 'Dark mode'"
          color="primary"
          class="mb-1"
          @click="toggle"
        />
        <v-list-item prepend-icon="mdi-cog" title="Settings" color="primary" class="mb-1" @click="settingsDialog = true" />
        <v-list-item prepend-icon="mdi-logout" title="Logout" color="error" @click="handleLogout" />
      </v-list>
    </v-navigation-drawer>

    <v-main>
      <v-container v-if="!auth.ready" fluid style="min-height: 80vh;">
        <v-progress-circular indeterminate color="primary" size="48" width="4" />
        <p class="text-body-2 mt-4 text-medium-emphasis">
          Loading session…
        </p>
      </v-container>
      <v-container
        v-else-if="auth.isLoggedIn"
        fluid
        :class="['text-start', { 'pa-0 ma-0 fill-height': hideAppChrome || isPosPage }]"
        :style="(hideAppChrome || isPosPage) ? { height: '100%' } : {}"
      >
        <slot />
      </v-container>
    </v-main>

    <v-footer v-if="auth.ready && auth.isLoggedIn && !hideAppChrome" class="justify-center bg-surface">
     <span  class="text-caption text-medium-emphasis" v-if="company?.company_name" >&copy; {{ new Date().getFullYear() }} {{ company.company_name }}</span>
    </v-footer>

    <AppNotification />
    <AppConfirmDialog />

    <SettingsDialog v-model="settingsDialog" />
  </v-app>
</template>

<script setup lang="ts">
import '~/assets/styles/default-layout.css'

import { useAuthStore } from '~/stores/auth'
import { useDisplay } from 'vuetify'
import { useSettings } from '~/composables/useSettings'
import { usePermission } from '~/composables/usePermission'
import { onBeforeUnmount, onMounted } from 'vue'

interface NavItem {
  title: string
  icon: string
  to: string
  permission?: string
}

interface NavGroup {
  title: string
  icon: string
  permission?: string
  children: NavItem[]
}

type NavEntry = NavItem | NavGroup

const navEntries: NavEntry[] = [
  { title: 'Dashboard', icon: 'mdi-view-dashboard', to: '/', permission: 'reports.view' },
  {
    title: 'Transactions',
    icon: 'mdi-cash',
    children: [
      { title: 'Sales History', icon: 'mdi-cash', to: '/sales', permission: 'sales.view' },
      { title: 'Returns & Voids', icon: 'mdi-undo-variant', to: '/sales/returns-and-voids', permission: 'returns.view' },
    ]
  },
  { title: 'POS', icon: 'mdi-point-of-sale', to: '/pos', permission: 'sales.create' },
  {
    title: 'Products',
    icon: 'mdi-package-variant',
    children: [
      { title: 'Product Lists', icon: 'mdi-format-list-bulleted', to: '/products', permission: 'products.view' },
      { title: 'Products Inventory', icon: 'mdi-warehouse', to: '/products/inventory', permission: 'products.view' },
      { title: 'Categories', icon: 'mdi-folder', to: '/categories', permission: 'categories.view' },
      { title: 'Brands', icon: 'mdi-tag', to: '/brands', permission: 'brands.view' },
      { title: 'Units', icon: 'mdi-ruler', to: '/units', permission: 'units.view' }
    ]
  },
  {
    title: 'Stocks',
    icon: 'mdi-clipboard-list',
    children: [
      { title: 'Stock In Lists', icon: 'mdi-arrow-down-bold-box', to: '/stocks/in', permission: 'stock.view' },
      { title: 'Stock Out Lists', icon: 'mdi-arrow-up-bold-box', to: '/stocks/out', permission: 'stock.view' },
      { title: 'Stock Movements', icon: 'mdi-swap-horizontal', to: '/stocks/movements', permission: 'stock.view' },
      { title: 'Stocks Inventory', icon: 'mdi-warehouse', to: '/stocks/inventory', permission: 'stock.view' }
    ]
  },
  { title: 'Suppliers', icon: 'mdi-truck-delivery', to: '/suppliers', permission: 'suppliers.view' },
  { title: 'Customers', icon: 'mdi-account-multiple', to: '/customers', permission: 'customers.view' },
  { title: 'Expenses', icon: 'mdi-wallet', to: '/expenses' },
  {
    title: 'Reports',
    icon: 'mdi-file-chart',
    permission: 'reports.view',
    children: [
      { title: 'Sales Report', icon: 'mdi-file-chart', to: '/reports/sales', permission: 'reports.view' },
      { title: 'Stock-In Logs', icon: 'mdi-arrow-down-bold-box', to: '/reports/stock-in', permission: 'reports.view' },
      { title: 'Sold-Out Logs', icon: 'mdi-alert-box', to: '/reports/sold-out', permission: 'reports.view' },
      { title: 'Stock-Out Logs', icon: 'mdi-arrow-up-bold-box', to: '/reports/stock-out', permission: 'reports.view' }
    ]
  }
]

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()
const { mdAndUp } = useDisplay()
const { isDark, toggle, init: initTheme } = useAppTheme()
const { company, fetchSettings } = useSettings()
const { hasPermission } = usePermission()

function navEntryVisible (entry: NavEntry): boolean {
  if ('children' in entry) {
    if (entry.permission && !hasPermission(entry.permission)) return false
    return entry.children.some(child => !child.permission || hasPermission(child.permission))
  }
  return !entry.permission || hasPermission(entry.permission)
}

function navItemVisible (item: NavItem): boolean {
  return !item.permission || hasPermission(item.permission)
}

const filteredNav = computed<NavEntry[]>(() =>
  navEntries
    .filter(navEntryVisible)
    .map(entry => 'children' in entry
      ? { ...entry, children: entry.children.filter(navItemVisible) }
      : entry
    )
)

const now = ref<Date | null>(null)
const timeString = computed(() => now.value?.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) ?? '')
const dateString = computed(() => now.value?.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) ?? '')
let clockInterval: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  now.value = new Date()
  clockInterval = setInterval(() => { now.value = new Date() }, 1000)
  fetchSettings()
})

onBeforeUnmount(() => {
  if (clockInterval) clearInterval(clockInterval)
})

const hideAppChrome = computed(() => !!route.meta.hideAppChrome)
const isPosPage = computed(() => route.path === '/pos' || route.path.startsWith('/pos/'))

initTheme()

const mobileDrawer = ref(false)
const settingsDialog = ref(false)

// Close mobile drawer on route change
watch(() => route.path, () => {
  mobileDrawer.value = false
})

watchEffect(() => {
  if (auth.ready && !auth.isLoggedIn) {
    router.push('/login')
  }
})

function isFlatActive (entry: NavItem): boolean {
  return route.path === entry.to
}

function isGroupActive (group: NavGroup): boolean {
  return group.children.some(c => route.path === c.to || route.path.startsWith(c.to + '/'))
}

async function handleLogout () {
  await auth.logout()
  await router.push('/login')
}
</script>

<style scoped>
.nav-logo {
  width: 32px;
  height: 32px;
  object-fit: contain;
  border-radius: 4px;
}
</style>
