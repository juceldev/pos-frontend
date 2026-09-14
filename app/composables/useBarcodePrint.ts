import { formatAmount } from '~/utils/format'

interface BarcodePrintItem {
  name: string
  barcode: string
  price?: string | number | null
}

// Code39 encoding table: 9 elements per char, n = narrow, w = wide
const CODE39: Record<string, string> = {
  '0': 'nnnwwnwnn', '1': 'wnnwnnnnw', '2': 'nnwwnnnnw', '3': 'wnwwnnnnn',
  '4': 'nnnwwnnnw', '5': 'wnnwwnnnn', '6': 'nnwwwnnnn', '7': 'nnnnwnwnw',
  '8': 'wnnnwnwnn', '9': 'nnwnnwnnn', 'A': 'wnnnnnwnw', 'B': 'nnwnnnwnw',
  'C': 'wnwnnnwnn', 'D': 'nnnnwwnnw', 'E': 'wnnnwwnnn', 'F': 'nnwnwwnnn',
  'G': 'nnnnnwwnw', 'H': 'wnnnnwwnn', 'I': 'nnwnnwwnn', 'J': 'nnnnnwwnn',
  'K': 'wnnnnnnww', 'L': 'nnwnnnnww', 'M': 'wnwnnnnwn', 'N': 'nnnnwnnww',
  'O': 'wnnnwnnwn', 'P': 'nnwnwnnwn', 'Q': 'nnnnnnwww', 'R': 'wnnnnnwwn',
  'S': 'nnwnnnwwn', 'T': 'nnnnwnwwn', 'U': 'wwnnnnnnw', 'V': 'nwwnnnnnw',
  'W': 'wwwnnnnnn', 'X': 'nwnnwnnnw', 'Y': 'wwnnwnnnn', 'Z': 'nwwnwnnnn',
  '-': 'nwnnnnwnw', '.': 'wwnnnnwnn', ' ': 'nwwnnnwnn', '$': 'nwnwnwnnn',
  '/': 'nwnwnnnwn', '+': 'nwnnnwnwn', '%': 'nnnwnwnwn', '*': 'nwnnwnwnn'
}

function barcodeSvg (value: string, height = 50): string {
  const text = `*${value.toUpperCase().replace(/[^0-9A-Z\-. $/+%]/g, '')}*`
  const narrow = 2
  const wide = 5
  let x = 0
  const bars: string[] = []

  for (const char of text) {
    const pattern = CODE39[char]
    if (!pattern) continue
    for (let i = 0; i < 9; i++) {
      const w = pattern[i] === 'w' ? wide : narrow
      if (i % 2 === 0) {
        bars.push(`<rect x="${x}" y="0" width="${w}" height="${height}" fill="#000"/>`)
      }
      x += w
    }
    x += narrow // inter-character gap
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${x}" height="${height}">${bars.join('')}</svg>`
}

export function useBarcodePrint () {
  function printBarcodes (items: BarcodePrintItem[]) {
    const printable = items.filter(i => i.barcode)
    if (printable.length === 0) return

    const labels = printable.map(item => `
      <div class="label">
        <div class="name">${item.name ?? ''}</div>
        ${barcodeSvg(item.barcode)}
        <div class="code">${item.barcode}</div>
        ${item.price != null ? `<div class="price">${formatAmount(item.price)}</div>` : ''}
      </div>
    `).join('')

    const win = window.open('', '_blank', 'width=800,height=600')
    if (!win) return

    win.document.write(`<!DOCTYPE html><html><head><title>Print Barcodes</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 10px; }
        .sheet { display: flex; flex-wrap: wrap; gap: 8px; }
        .label { border: 1px dashed #ccc; padding: 8px; text-align: center; page-break-inside: avoid; }
        .name { font-size: 11px; margin-bottom: 4px; max-width: 220px; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
        .code { font-size: 10px; letter-spacing: 2px; margin-top: 2px; }
        .price { font-size: 12px; font-weight: bold; margin-top: 2px; }
        @media print { .label { border: none; } }
      </style></head><body><div class="sheet">${labels}</div>
      <script>window.onload = () => { window.print(); window.close(); }<\/script>
      </body></html>`)
    win.document.close()
  }

  return { printBarcodes }
}
