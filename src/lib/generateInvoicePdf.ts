// Direct PDF generation - matches InvoiceDocument design
import { jsPDF } from 'jspdf'
import { autoTable } from 'jspdf-autotable'

// Local font in public/fonts/ - avoids external CDN dependency
const NOTO_SANS_URL = '/fonts/NotoSans-Regular.ttf'
let notoSansBase64: string | null = null

async function loadNotoSansFont(): Promise<string> {
  if (notoSansBase64) return notoSansBase64
  const res = await fetch(NOTO_SANS_URL)
  if (!res.ok) throw new Error('Failed to load font')
  const buffer = await res.arrayBuffer()
  const bytes = new Uint8Array(buffer)
  let binary = ''
  const chunkSize = 8192
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length))
    binary += String.fromCharCode.apply(null, Array.from(chunk))
  }
  notoSansBase64 = btoa(binary)
  return notoSansBase64
}

function formatCurrency(amount: number, currency = 'EUR'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency
  }).format(amount)
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
    : [13, 148, 136] // teal-600 default
}

export async function generateInvoicePdf(invoice: any, business: any): Promise<void> {
  const doc = new jsPDF()
  const order = invoice.order
  const primary = hexToRgb(business.primaryColor || '#0d9488') as [number, number, number]

  // Load Noto Sans for Greek/Unicode support
  let fontName = 'helvetica'
  try {
    const fontBase64 = await loadNotoSansFont()
    doc.addFileToVFS('NotoSans-Regular.ttf', fontBase64)
    doc.addFont('NotoSans-Regular.ttf', 'NotoSans', 'normal')
    fontName = 'NotoSans'
    doc.setFont(fontName, 'normal')
  } catch {
    // Fallback to helvetica if font load fails
  }

  const pad = 17 // Slightly reduced from 20 (2-3px less)
  let y = pad

  // Header - match InvoiceDocument: business left, INVOICE # right, border-b-2
  doc.setFontSize(18)
  doc.setTextColor(primary[0], primary[1], primary[2])
  const right = 193
  doc.text(business.name, pad, y)
  y += 6

  doc.setFontSize(10)
  doc.setTextColor(107, 114, 128) // gray-600
  if (business.address) { doc.text(business.address, pad, y); y += 5 }
  if (business.phone) { doc.text(business.phone, pad, y); y += 5 }
  if (business.email) { doc.text(business.email, pad, y); y += 6 }

  // INVOICE # right-aligned (same line as business name)
  doc.setFontSize(18)
  doc.setTextColor(17, 24, 39) // gray-900
  doc.text('INVOICE', right, pad, { align: 'right' })
  doc.setFontSize(12)
  doc.setTextColor(primary[0], primary[1], primary[2])
  doc.text(`#${invoice.invoiceNumber}`, right, pad + 8, { align: 'right' })

  // Border line under header (border-b-2)
  doc.setDrawColor(primary[0], primary[1], primary[2])
  doc.setLineWidth(0.5)
  doc.line(pad, y + 2, right, y + 2)
  y += 18

  // Bill to - match InvoiceDocument labels
  doc.setFontSize(9)
  doc.setTextColor(107, 114, 128)
  doc.text('Bill to', pad, y)
  y += 6
  doc.setFontSize(11)
  doc.setTextColor(17, 24, 39)
  doc.text(order.customer?.name || '—', pad, y)
  y += 5
  doc.setFontSize(10)
  doc.setTextColor(107, 114, 128)
  if (order.customer?.phone) { doc.text(order.customer.phone, pad, y); y += 5 }
  if (order.customer?.email) { doc.text(order.customer.email, pad, y); y += 5 }
  if (order.deliveryAddress) { doc.text(order.deliveryAddress, pad, y); y += 8 }

  // Order info - match InvoiceDocument
  doc.setFontSize(10)
  doc.setTextColor(17, 24, 39)
  doc.text(`Order # ${order.orderNumber}`, pad, y)
  doc.text(`Date ${formatDate(order.createdAt)}`, 97, y)
  y += 12

  // Line items table - match InvoiceDocument: header with primary border, no fill
  const tableData = (order.items || []).map((item: any) => {
    let itemText = item.variantName
      ? `${item.productName} (${item.variantName})`
      : item.productName
    if (item.modifiers?.length) {
      itemText += '\n' + item.modifiers
        .map((m: { name: string; price: number }) => `+ ${m.name} (${formatCurrency(m.price, business.currency)})`)
        .join('\n')
    }
    const amount = formatCurrency(item.quantity * item.price, business.currency)
    return [itemText, String(item.quantity), formatCurrency(item.price, business.currency), amount]
  })

  const tableWidth = right - pad // 176
  autoTable(doc, {
    startY: y,
    head: [['Item', 'Qty', 'Price', 'Amount']],
    body: tableData,
    theme: 'plain',
    tableWidth,
    margin: { left: pad, right: pad },
    cellPadding: 2,
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: [55, 65, 81],
      fontStyle: 'normal',
      font: fontName,
      lineWidth: 0.1,
      lineColor: [229, 231, 235]
    },
    styles: { fontSize: 9, textColor: [17, 24, 39], font: fontName },
    columnStyles: {
      0: { cellWidth: 85 },
      1: { cellWidth: 18, halign: 'right' },
      2: { cellWidth: 35, halign: 'right' },
      3: { cellWidth: 38, halign: 'right' }
    },
    tableLineColor: [229, 231, 235],
    tableLineWidth: 0.1,
    pageBreak: 'auto'
  })

  y = (doc as any).lastAutoTable.finalY + 10

  // Totals - match InvoiceDocument: right-aligned w-64, border-t-2 primary
  const totalsLeft = 123
  const totalsRight = right
  if (order.subtotal != null) {
    doc.setFontSize(10)
    doc.setTextColor(107, 114, 128)
    doc.text('Subtotal', totalsLeft, y)
    doc.text(formatCurrency(order.subtotal, business.currency), totalsRight, y, { align: 'right' })
    y += 6
  }
  if (order.deliveryFee != null && order.deliveryFee > 0) {
    doc.text('Delivery', totalsLeft, y)
    doc.text(formatCurrency(order.deliveryFee, business.currency), totalsRight, y, { align: 'right' })
    y += 6
  }
  if (order.tax != null && order.tax > 0) {
    doc.text('Tax', totalsLeft, y)
    doc.text(formatCurrency(order.tax, business.currency), totalsRight, y, { align: 'right' })
    y += 6
  }
  if (order.discount != null && order.discount > 0) {
    doc.text('Discount', totalsLeft, y)
    doc.text(`-${formatCurrency(order.discount, business.currency)}`, totalsRight, y, { align: 'right' })
    y += 6
  }
  y += 4
  doc.setDrawColor(primary[0], primary[1], primary[2])
  doc.setLineWidth(0.5)
  doc.line(totalsLeft, y - 2, totalsRight, y - 2)
  doc.setFontSize(12)
  doc.setFont(fontName, 'normal')
  doc.setTextColor(17, 24, 39)
  doc.text('Total', totalsLeft, y + 4)
  doc.setTextColor(primary[0], primary[1], primary[2])
  doc.text(formatCurrency(order.total, business.currency), totalsRight, y + 4, { align: 'right' })
  y += 18

  // Payment - match InvoiceDocument
  if (order.paymentMethod) {
    doc.setFont(fontName, 'normal')
    doc.setFontSize(10)
    doc.setTextColor(107, 114, 128)
    doc.text(`Payment: ${order.paymentMethod} • Paid`, pad, y)
    y += 12
  }

  // Note - match InvoiceDocument (gray box)
  if (invoice.note && String(invoice.note).trim()) {
    doc.setFillColor(249, 250, 251) // gray-50
    doc.rect(pad, y - 2, tableWidth, 18, 'F')
    doc.setFontSize(10)
    doc.setTextColor(55, 65, 81)
    doc.text(String(invoice.note).trim(), pad + 5, y + 5, { maxWidth: tableWidth - 10 })
    y += 24
  }

  // Footer - match InvoiceDocument
  y = 275
  doc.setDrawColor(229, 231, 235)
  doc.setLineWidth(0.2)
  doc.line(pad, y - 8, right, y - 8)
  doc.setFontSize(9)
  doc.setTextColor(107, 114, 128)
  doc.text('This document is for internal record-keeping only. It is not a tax invoice.', 105, y, { align: 'center' })
  doc.setTextColor(primary[0], primary[1], primary[2])
  doc.setFont(fontName, 'normal')
  doc.text('Powered by WaveOrder', 105, y + 6, { align: 'center' })

  doc.save(`invoice-${invoice.invoiceNumber}.pdf`)
}

/** Fetch invoice from API and trigger direct PDF download */
export async function fetchAndDownloadInvoicePdf(
  businessId: string,
  invoiceId: string,
  options?: { asSuperAdmin?: boolean }
): Promise<void> {
  const url = options?.asSuperAdmin
    ? `/api/superadmin/businesses/${businessId}/invoices/${invoiceId}`
    : `/api/admin/stores/${businessId}/invoices/${invoiceId}`
  const res = await fetch(url)
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Failed to load invoice')
  }
  const { invoice, business } = await res.json()
  await generateInvoicePdf(invoice, business)
}
