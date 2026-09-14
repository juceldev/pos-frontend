import type { Product } from '~/types/product'

export interface ScanResult {
  type: 'barcode' | 'serial' | 'not_found'
  product?: Product
  serial?: string
  serialStatus?: string
}

export function usePosScanner () {
  const { $api } = useNuxtApp()
  const scanning = ref(false)

  async function scan (input: string): Promise<ScanResult> {
    const value = input.trim()
    if (!value) {
      return { type: 'not_found' }
    }

    scanning.value = true
    try {
      // Try barcode / product_sequence lookup first
      const lookup = await $api<{ found: boolean; product?: Product }>('/api/products/lookup', {
        params: { barcode: value }
      }) as any

      if (lookup?.found && lookup.product) {
        return { type: 'barcode', product: lookup.product }
      }

      // Try serial verification
      const verify = await $api<{ found: boolean; serial?: any }>('/api/serials/verify', {
        params: { serial: value }
      }) as any

      if (verify?.found && verify.serial) {
        return {
          type: 'serial',
          serial: verify.serial.serial_number,
          serialStatus: verify.serial.status,
          product: verify.serial.product as Product
        }
      }

      return { type: 'not_found' }
    } catch {
      return { type: 'not_found' }
    } finally {
      scanning.value = false
    }
  }

  return { scan, scanning }
}
