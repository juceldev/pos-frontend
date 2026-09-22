// https://nuxt.com/docs/api/configuration/nuxt-config
import process from 'node:process'
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  ssr: false,
  devtools: { enabled: true },
  future: {
    compatibilityVersion: 4
  },
  modules: [
    '@pinia/nuxt',
    '@vite-pwa/nuxt'
  ],
  components: [
    { path: '~/components/ui', prefix: '' },
    { path: '~/components/products', prefix: '' },
    { path: '~/components', pathPrefix: false }
  ],
  app: {
    head: {
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
        { name: 'theme-color', content: '#0c7eb4' },
        { name: 'mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
        { name: 'apple-mobile-web-app-title', content: 'POS' }
      ],
      link: [
        { rel: 'manifest', href: '/manifest.webmanifest' },
        { rel: 'apple-touch-icon', href: '/pwa-192x192.png' }
      ]
    }
  },
  runtimeConfig: {
    public: {
      apiBaseUrl: process.env.NUXT_PUBLIC_API_BASE_URL || ''
    }
  },
  routeRules: {
    '/api/**': {
      proxy: `${(process.env.NUXT_API_PROXY_URL || '').replace(/\/+$/, '')}/api/**`
    }
  },
  css: [
    'vuetify/styles',
    '@mdi/font/css/materialdesignicons.css',
    '~/assets/styles/main.css'
  ],
  build: {
    transpile: ['vuetify']
  },
  vite: {
    ssr: {
      noExternal: ['vuetify']
    }
  },
  pwa: {
    registerType: 'autoUpdate',
    manifest: {
      name: 'MADOXX QWE IT SOLUTIONS POS',
      short_name: 'POS',
      description: 'Point of Sale',
      theme_color: '#0c7eb4',
      background_color: '#ffffff',
      display: 'standalone',
      start_url: '/',
      icons: [
        { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
        { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
        { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
      ]
    },
    workbox: {
      navigateFallback: '/',
      navigateFallbackDenylist: [/^\/api/, /^\/backend/]
    },
    devOptions: {
      enabled: true
    }
  }
})
