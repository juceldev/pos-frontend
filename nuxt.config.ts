// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  future: {
    compatibilityVersion: 4
  },
  modules: [
    '@pinia/nuxt'
  ],
  components: [
    { path: '~/components/ui', prefix: '' },
    { path: '~/components/products', prefix: '' },
    { path: '~/components', pathPrefix: false }
  ],
  runtimeConfig: {
    public: {
      apiBaseUrl: 'https://gratified-amount-rural.ngrok-free.dev'
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
  }
})
