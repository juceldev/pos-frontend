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

  const iframe = document.createElement('iframe')
  iframe.style.position = 'fixed'
  iframe.style.right = '0'
  iframe.style.bottom = '0'
  iframe.style.width = '0'
  iframe.style.height = '0'
  iframe.style.border = '0'
  iframe.setAttribute('aria-hidden', 'true')
  document.body.appendChild(iframe)

  const win = iframe.contentWindow
  const doc = win?.document
  if (!win || !doc) {
    iframe.remove()
    window.print()
    return
  }

  doc.open()
  doc.write(`<!doctype html>
<html>
<head>
  <base href="${document.baseURI}">
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
  doc.close()

  const cleanup = () => iframe.remove()
  win.addEventListener('afterprint', cleanup)
  setTimeout(cleanup, 60000)

  let printed = false
  const doPrint = () => {
    if (printed) return
    printed = true
    win.focus()
    win.print()
  }
  win.addEventListener('load', doPrint)
  if (doc.readyState === 'complete') {
    setTimeout(doPrint, 250)
  } else {
    setTimeout(doPrint, 3000)
  }
}
