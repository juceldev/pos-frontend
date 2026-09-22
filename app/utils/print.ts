export function printElementById (elementId: string, title = 'Receipt'): void {
  const source = document.getElementById(elementId)
  if (!source) {
    window.print()
    return
  }

  const clone = source.cloneNode(true) as HTMLElement
  clone.querySelectorAll('.v-card-title, .v-card-actions, .receipt-actions').forEach(node => node.remove())

  const head = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
    .map(node => node.outerHTML)
    .join('\n')

  const win = window.open('', '_blank', 'width=900,height=700')
  if (!win) {
    window.print()
    return
  }

  win.document.open()
  win.document.write(`<!doctype html>
<html>
<head>
  <title>${title}</title>
  ${head}
  <style>
    @page { margin: 10mm; }
    body { margin: 0; background: #fff; }
    .receipt-bond { width: 100% !important; max-width: 100% !important; min-height: 0 !important; border: none !important; box-shadow: none !important; }
    .receipt-thermal { width: 80mm !important; box-shadow: none !important; }
    .v-card-text { overflow: visible !important; max-height: none !important; }
  </style>
</head>
<body>${clone.outerHTML}</body>
</html>`)
  win.document.close()
  win.onload = () => {
    win.focus()
    win.print()
    win.close()
  }
}
