import type { $Fetch } from 'ofetch'

declare module '#app' {
  interface RuntimeNuxtApp {
    $api: $Fetch
  }
}

export {}
