// Direct PDF generation - no new page, no layout. Just download.
import { jsPDF } from 'jspdf'
import { autoTable } from 'jspdf-autotable'

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

export function generateInvoicePdf(invoice: any, business: any): void {
  const doc = new jsPDF()
  const order = invoice.order
  const primary: [number, number, number] = [13, 148, 136] // teal-600

  let y = 20

  // Business name
  doc.setFontSize(18)
  doc.setTextColor(primary[0], primary[1], primary[2])
  doc.text(business.name, 20, y)
  y += 8

  // Business details
  doc.setFontSize(10)
  doc.setTextColor(100, 100, 100)
  if (business.address) { doc.text(business.address, 20, y); y += 5 }
  if (business.phone) { doc.text(business.phone, 20, y); y += 5 }
  if (business.email) { doc.text(business.email, 20, y); y += 8 }

  // INVOICE # right-aligned
  doc.setFontSize(16)
  doc.setTextColor(0, 0, 0)
  doc.text('INVOICE', 190, 20, { align: 'right' })
  doc.setFontSize(12)
  doc.setTextColor(primary[0], primary[1], primary[2])
  doc.text(`#${invoice.invoiceNumber}`, 190, 28, { align: 'right' })
  y = 45

  // Bill to
  doc.setFontSize(9)
  doc.setTextColor(100, 100, 100)
  doc.text('BILL TO', 20, y)
  y += 6
  doc.setFontSize(11)
  doc.setTextColor(0, 0, 0)
  doc.text(order.customer?.name || '—', 20, y)
  y += 5
  doc.setFontSize(10)
  doc.setTextColor(100, 100, 100)
  if (order.customer?.phone) { doc.text(order.customer.phone, 20, y); y += 5 }
  if (order.customer?.email) { doc.text(order.customer.email, 20, y); y += 5 }
  if (order.deliveryAddress) { doc.text(order.deliveryAddress, 20, y); y += 8 }

  // Order info
  doc.setFontSize(10)
  doc.text(`Order #${order.orderNumber}`, 20, y)
  doc.text(`Date: ${formatDate(order.createdAt)}`, 120, y)
  y += 15

  // Line items table
  const tableData = (order.items || []).map((item: any) => {
    const itemName = item.variantName
      ? `${item.productName} (${item.variantName})`
      : item.productName
    const modifiers = item.modifiers?.length
      ? item.modifiers.map((m: { name: string }) => `+ ${m.name}`).join(', ')
      : ''
    const fullName = modifiers ? `${itemName}\n${modifiers}` : itemName
    return [
      fullName,
      String(item.quantity),
      formatCurrency(item.price, business.currency),
      formatCurrency(item.quantity * item.price, business.currency)
    ]
  })

  autoTable(doc, {
    startY: y,
    head: [['Item', 'Qty', 'Price', 'Amount']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: primary, textColor: 255 },
    styles: { fontSize: 9 },
    columnStyles: {
      0: { cellWidth: 90 },
      1: { cellWidth: 20, halign: 'right' },
      2: { cellWidth: 35, halign: 'right' },
      3: { cellWidth: 45, halign: 'right' }
    }
  })

  y = (doc as any).lastAutoTable.finalY + 15

  // Totals
  const totalsX = 140
  if (order.subtotal != null) {
    doc.setFontSize(10)
    doc.setTextColor(100, 100, 100)
    doc.text('Subtotal', totalsX, y)
    doc.text(formatCurrency(order.subtotal, business.currency), 190, y, { align: 'right' })
    y += 6
  }
  if (order.deliveryFee != null && order.deliveryFee > 0) {
    doc.text('Delivery', totalsX, y)
    doc.text(formatCurrency(order.deliveryFee, business.currency), 190, y, { align: 'right' })
    y += 6
  }
  if (order.tax != null && order.tax > 0) {
    doc.text('Tax', totalsX, y)
    doc.text(formatCurrency(order.tax, business.currency), 190, y, { align: 'right' })
    y += 6
  }
  if (order.discount != null && order.discount > 0) {
    doc.text('Discount', totalsX, y)
    doc.text(`-${formatCurrency(order.discount, business.currency)}`, 190, y, { align: 'right' })
    y += 6
  }
  y += 2
  doc.setFontSize(12)
  doc.setTextColor(0, 0, 0)
  doc.setFont('helvetica', 'bold')
  doc.text('Total', totalsX, y)
  doc.setTextColor(primary[0], primary[1], primary[2])
  doc.text(formatCurrency(order.total, business.currency), 190, y, { align: 'right' })
  y += 15

  // Payment
  if (order.paymentMethod) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(100, 100, 100)
    doc.text(`Payment: ${order.paymentMethod} • Paid`, 20, y)
    y += 10
  }

  // Note
  if (invoice.note && String(invoice.note).trim()) {
    doc.setFontSize(10)
    doc.text(String(invoice.note).trim(), 20, y, { maxWidth: 170 })
    y += 15
  }

  // Footer
  y = 275
  doc.setFontSize(9)
  doc.setTextColor(100, 100, 100)
  doc.text('This document is for internal record-keeping only. It is not a tax invoice.', 105, y, { align: 'center' })
  doc.text('Powered by WaveOrder', 105, y + 5, { align: 'center' })

  doc.save(`invoice-${invoice.invoiceNumber}.pdf`)
}

/** Fetch invoice from API and trigger direct PDF download */
export async function fetchAndDownloadInvoicePdf(
  businessId: string,
  invoiceId: string
): Promise<void> {
  const res = await fetch(`/api/admin/stores/${businessId}/invoices/${invoiceId}`)
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Failed to load invoice')
  }
  const { invoice, business } = await res.json()
  generateInvoicePdf(invoice, business)
}
