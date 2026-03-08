// Supplier Payments Report PDF - Business logo, all supplier payments
import { jsPDF } from 'jspdf'
import { autoTable } from 'jspdf-autotable'

const NOTO_SANS_URL = '/fonts/NotoSans-Regular.ttf'
const WAVEORDER_LOGO_URL = '/images/waveorderlogo.png'
let notoSansBase64: string | null = null

const MAX_LOGO_WIDTH = 50
const MAX_LOGO_HEIGHT = 14

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

async function loadLogo(logoUrl: string | null | undefined): Promise<{ base64: string; width: number; height: number } | null> {
  const urlsToTry = logoUrl ? [logoUrl, WAVEORDER_LOGO_URL] : [WAVEORDER_LOGO_URL]
  for (const url of urlsToTry) {
    try {
      const res = await fetch(url)
      if (!res.ok) continue
      const blob = await res.blob()
      const objectUrl = URL.createObjectURL(blob)
      const img = new Image()
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve()
        img.onerror = () => reject(new Error('Image load failed'))
        img.src = objectUrl
      })
      URL.revokeObjectURL(objectUrl)
      const w = img.naturalWidth
      const h = img.naturalHeight
      if (!w || !h) continue
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')
      if (!ctx) continue
      ctx.drawImage(img, 0, 0)
      const dataUrl = canvas.toDataURL('image/png')
      const base64 = dataUrl.split(',')[1]
      if (!base64) continue
      const scale = Math.min(MAX_LOGO_WIDTH / w, MAX_LOGO_HEIGHT / h)
      return { base64, width: w * scale, height: h * scale }
    } catch {
      continue
    }
  }
  return null
}

function formatCurrency(amount: number, currency = 'EUR'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency
  }).format(amount)
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const TEAL: [number, number, number] = [13, 148, 136]
const GRAY_600: [number, number, number] = [107, 114, 128]
const GRAY_900: [number, number, number] = [17, 24, 39]

export interface SupplierPaymentsReportData {
  business: {
    name: string
    logo?: string | null
    address?: string | null
    phone?: string | null
    email?: string | null
    currency: string
  }
  grandTotal: number
  totalsBySupplier: Array<{
    supplierName: string
    totalPaid: number
    paymentCount: number
  }>
  payments: Array<{
    supplierName: string
    amount: number
    paidAt: string | null
    paymentMethod: string | null
    reference: string | null
    notes: string | null
    periodStart: string | null
    periodEnd: string | null
  }>
  generatedAt: string
}

export async function generateSupplierPaymentsReportPdf(report: SupplierPaymentsReportData): Promise<void> {
  const doc = new jsPDF()
  const { business, grandTotal, totalsBySupplier, payments, generatedAt } = report
  const currency = business.currency || 'EUR'

  let fontName = 'helvetica'
  try {
    const fontBase64 = await loadNotoSansFont()
    doc.addFileToVFS('NotoSans-Regular.ttf', fontBase64)
    doc.addFont('NotoSans-Regular.ttf', 'NotoSans', 'normal')
    fontName = 'NotoSans'
    doc.setFont(fontName, 'normal')
  } catch {
    // Fallback to helvetica
  }

  const pad = 17
  const right = 193
  let y = pad

  // Business logo
  const logoData = await loadLogo(business.logo)
  if (logoData) {
    try {
      doc.addImage(logoData.base64, 'PNG', pad, y - 2, logoData.width, logoData.height)
    } catch {
      // Skip if image fails
    }
  }
  y += 14

  // Report title
  doc.setFontSize(18)
  doc.setTextColor(GRAY_900[0], GRAY_900[1], GRAY_900[2])
  doc.text('Supplier Payments Report', right, pad + 6, { align: 'right' })
  doc.setFontSize(10)
  doc.setTextColor(GRAY_600[0], GRAY_600[1], GRAY_600[2])
  doc.text(`As of ${formatDate(generatedAt)}`, right, pad + 12, { align: 'right' })

  // Business name
  doc.setFontSize(14)
  doc.setTextColor(TEAL[0], TEAL[1], TEAL[2])
  doc.text(business.name, pad, y)
  y += 6

  doc.setFontSize(10)
  doc.setTextColor(GRAY_600[0], GRAY_600[1], GRAY_600[2])
  if (business.address) {
    doc.text(business.address, pad, y)
    y += 5
  }
  if (business.phone) {
    doc.text(business.phone, pad, y)
    y += 5
  }
  if (business.email) {
    doc.text(business.email, pad, y)
    y += 5
  }
  y += 8

  // Divider
  doc.setDrawColor(TEAL[0], TEAL[1], TEAL[2])
  doc.setLineWidth(0.5)
  doc.line(pad, y, right, y)
  y += 12

  // Summary
  doc.setFontSize(12)
  doc.setTextColor(GRAY_900[0], GRAY_900[1], GRAY_900[2])
  doc.text('Summary', pad, y)
  y += 8

  doc.setFontSize(10)
  const summaryLeft = pad + 5
  const summaryRight = right - 5
  doc.setTextColor(GRAY_600[0], GRAY_600[1], GRAY_600[2])
  doc.text('Total Paid to Suppliers', summaryLeft, y)
  doc.setTextColor(GRAY_900[0], GRAY_900[1], GRAY_900[2])
  doc.text(formatCurrency(grandTotal, currency), summaryRight, y, { align: 'right' })
  y += 12

  // Totals by supplier
  if (totalsBySupplier.length > 0) {
    doc.setFontSize(12)
    doc.setTextColor(GRAY_900[0], GRAY_900[1], GRAY_900[2])
    doc.text('Totals by Supplier', pad, y)
    y += 8

    const supplierTableData = totalsBySupplier.map((s) => [
      s.supplierName.slice(0, 40),
      s.paymentCount.toString(),
      formatCurrency(s.totalPaid, currency)
    ])

    autoTable(doc, {
      startY: y,
      head: [['Supplier', 'Payments', 'Total Paid']],
      body: supplierTableData,
      theme: 'plain',
      tableWidth: right - pad,
      margin: { left: pad, right: pad },
      headStyles: {
        fillColor: [243, 244, 246] as [number, number, number],
        textColor: GRAY_600,
        fontStyle: 'normal',
        font: fontName,
        fontSize: 9,
        cellPadding: 3
      },
      styles: { fontSize: 8, textColor: GRAY_900, font: fontName, cellPadding: 2 },
      columnStyles: {
        0: { cellWidth: 95 },
        1: { cellWidth: 35, halign: 'center' },
        2: { cellWidth: 45, halign: 'right' }
      },
      tableLineColor: [229, 231, 235],
      tableLineWidth: 0.1
    })

    y = (doc as any).lastAutoTable?.finalY ?? y
    y += 12
  }

  // Payment history table
  if (payments.length > 0) {
    doc.setFontSize(12)
    doc.setTextColor(GRAY_900[0], GRAY_900[1], GRAY_900[2])
    doc.text('Payment History', pad, y)
    y += 8

    const tableData = payments.map((p) => [
      formatDate(p.paidAt),
      p.supplierName.slice(0, 25),
      formatCurrency(p.amount, currency),
      (p.paymentMethod || '—').replace('_', ' '),
      (p.reference || '—').slice(0, 15),
      (p.notes || '—').slice(0, 25)
    ])

    autoTable(doc, {
      startY: y,
      head: [['Date', 'Supplier', 'Amount', 'Method', 'Reference', 'Notes']],
      body: tableData,
      theme: 'plain',
      tableWidth: right - pad,
      margin: { left: pad, right: pad },
      headStyles: {
        fillColor: [243, 244, 246] as [number, number, number],
        textColor: GRAY_600,
        fontStyle: 'normal',
        font: fontName,
        fontSize: 9,
        cellPadding: 3
      },
      styles: { fontSize: 8, textColor: GRAY_900, font: fontName, cellPadding: 2 },
      columnStyles: {
        0: { cellWidth: 30 },
        1: { cellWidth: 42 },
        2: { cellWidth: 35, halign: 'right' },
        3: { cellWidth: 28 },
        4: { cellWidth: 30 },
        5: { cellWidth: 35 }
      },
      tableLineColor: [229, 231, 235],
      tableLineWidth: 0.1,
      pageBreak: 'auto'
    })

    y = (doc as any).lastAutoTable?.finalY ?? y
    y += 12
  }

  // Footer
  const pageHeight = doc.internal.pageSize.height
  doc.setDrawColor(229, 231, 235)
  doc.setLineWidth(0.2)
  doc.line(pad, pageHeight - 20, right, pageHeight - 20)
  doc.setFontSize(9)
  doc.setTextColor(GRAY_600[0], GRAY_600[1], GRAY_600[2])
  doc.text('This report is for internal record-keeping. Generated by WaveOrder.', 105, pageHeight - 14, { align: 'center' })
  doc.setTextColor(TEAL[0], TEAL[1], TEAL[2])
  doc.text(`Generated ${formatDate(generatedAt)}`, 105, pageHeight - 8, { align: 'center' })

  const safeName = business.name.replace(/[^a-z0-9]/gi, '-').slice(0, 30)
  doc.save(`supplier-payments-report-${safeName}-${new Date(generatedAt).toISOString().split('T')[0]}.pdf`)
}

/** Fetch report from API and trigger PDF download */
export async function fetchAndDownloadSupplierPaymentsReportPdf(businessId: string): Promise<void> {
  const res = await fetch(`/api/admin/stores/${businessId}/cost-margins/supplier-payments/report`)
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Failed to load supplier payments report')
  }
  const report = await res.json()
  await generateSupplierPaymentsReportPdf(report)
}
