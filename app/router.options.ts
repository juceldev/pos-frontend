import type { RouterConfig } from '@nuxt/schema'

// Hash mode so SPA routes (/#/pos, /#/sales) never hit the server —
// required for static hosting without .htaccess rewrite support.
export default {
  hashMode: true
} satisfies RouterConfig
