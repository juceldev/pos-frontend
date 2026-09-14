self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

// No fetch interception: this PWA is not configured in nuxt.config, so let the
// browser handle network requests normally. A previously installed worker that
// tried to proxy every request was causing uncaught "Failed to fetch" errors.
