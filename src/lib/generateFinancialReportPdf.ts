// Financial Report PDF - Header matches invoice (no logo)
import { jsPDF } from 'jspdf'
import { autoTable } from 'jspdf-autotable'

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

export interface FinancialReportData {
  business: { name: string; logo?: string | null; address?: string | null; phone?: string | null; email?: string | null; currency: string }
  overview: {
    orderRevenue: number
    netOrderRevenue: number
    affiliatePayable: number
    deliveryPayable: number
    supplierOutstanding: number
    totalExpenses: number
    totalInjections: number
    netCashFlow: number
    features: {
      internalExpensesEnabled: boolean
      enableAffiliateSystem: boolean
      enableDeliveryManagement: boolean
      enableTeamPaymentTracking: boolean
      showCostPrice: boolean
    }
    totalTeamPayments?: number
  }
  cashMovements: Array<{
    type: string
    amount: number
    date: string | null
    category: string
    notes: string | null
  }>
  teamPayments?: Array<{
    recipientName: string
    amount: number
    paidAt: string | null
    paymentMethod: string
    notes: string | null
  }>
  generatedAt: string
}

export async function generateFinancialReportPdf(report: FinancialReportData): Promise<void> {
  const doc = new jsPDF()
  const { business, overview, cashMovements, teamPayments = [], generatedAt } = report
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
  const tableWidth = right - pad // 176 - match invoice
  let y = pad

  // Header - match invoice: business left, report title right, no logo
  doc.setFontSize(18)
  doc.setTextColor(TEAL[0], TEAL[1], TEAL[2])
  doc.text(business.name, pad, y)
  y += 6

  doc.setFontSize(10)
  doc.setTextColor(GRAY_600[0], GRAY_600[1], GRAY_600[2])
  if (business.address) { doc.text(business.address, pad, y); y += 5 }
  if (business.phone) { doc.text(business.phone, pad, y); y += 5 }
  if (business.email) { doc.text(business.email, pad, y); y += 6 }

  doc.setFontSize(18)
  doc.setTextColor(GRAY_900[0], GRAY_900[1], GRAY_900[2])
  doc.text('Financial Report', right, pad, { align: 'right' })
  doc.setFontSize(10)
  doc.setTextColor(GRAY_600[0], GRAY_600[1], GRAY_600[2])
  doc.text(`As of ${formatDate(generatedAt)}`, right, pad + 8, { align: 'right' })

  doc.setDrawColor(TEAL[0], TEAL[1], TEAL[2])
  doc.setLineWidth(0.5)
  doc.line(pad, y + 2, right, y + 2)
  y += 18

  // Summary section
  doc.setFontSize(12)
  doc.setTextColor(GRAY_900[0], GRAY_900[1], GRAY_900[2])
  doc.text('Summary', pad, y)
  y += 8

  doc.setFontSize(10)
  const summaryLeft = pad + 5
  const summaryRight = right - 5

  doc.setTextColor(GRAY_600[0], GRAY_600[1], GRAY_600[2])
  doc.text('Order Revenue (gross)', summaryLeft, y)
  doc.setTextColor(GRAY_900[0], GRAY_900[1], GRAY_900[2])
  doc.text(formatCurrency(overview.orderRevenue, currency), summaryRight, y, { align: 'right' })
  y += 6

  doc.setTextColor(GRAY_600[0], GRAY_600[1], GRAY_600[2])
  doc.text('Net Order Revenue', summaryLeft, y)
  doc.setTextColor(GRAY_900[0], GRAY_900[1], GRAY_900[2])
  doc.text(formatCurrency(overview.netOrderRevenue, currency), summaryRight, y, { align: 'right' })
  y += 6

  if (overview.features.enableAffiliateSystem) {
    doc.setTextColor(GRAY_600[0], GRAY_600[1], GRAY_600[2])
    doc.text('Affiliate Payable', summaryLeft, y)
    doc.setTextColor(GRAY_900[0], GRAY_900[1], GRAY_900[2])
    doc.text(formatCurrency(overview.affiliatePayable, currency), summaryRight, y, { align: 'right' })
    y += 6
  }

  if (overview.features.enableDeliveryManagement) {
    doc.setTextColor(GRAY_600[0], GRAY_600[1], GRAY_600[2])
    doc.text('Delivery Payable', summaryLeft, y)
    doc.setTextColor(GRAY_900[0], GRAY_900[1], GRAY_900[2])
    doc.text(formatCurrency(overview.deliveryPayable, currency), summaryRight, y, { align: 'right' })
    y += 6
  }

  if (overview.features.showCostPrice) {
    doc.setTextColor(GRAY_600[0], GRAY_600[1], GRAY_600[2])
    doc.text('Supplier Outstanding', summaryLeft, y)
    doc.setTextColor(GRAY_900[0], GRAY_900[1], GRAY_900[2])
    doc.text(formatCurrency(overview.supplierOutstanding, currency), summaryRight, y, { align: 'right' })
    y += 6
  }

  if (overview.features.enableTeamPaymentTracking && overview.totalTeamPayments != null) {
    doc.setTextColor(GRAY_600[0], GRAY_600[1], GRAY_600[2])
    doc.text('Team Payments (total)', summaryLeft, y)
    doc.setTextColor(GRAY_900[0], GRAY_900[1], GRAY_900[2])
    doc.text(formatCurrency(overview.totalTeamPayments, currency), summaryRight, y, { align: 'right' })
    y += 6
  }

  if (overview.features.internalExpensesEnabled) {
    doc.setTextColor(GRAY_600[0], GRAY_600[1], GRAY_600[2])
    doc.text('Internal Expenses', summaryLeft, y)
    doc.setTextColor(GRAY_900[0], GRAY_900[1], GRAY_900[2])
    doc.text(formatCurrency(overview.totalExpenses, currency), summaryRight, y, { align: 'right' })
    y += 6

    doc.setTextColor(GRAY_600[0], GRAY_600[1], GRAY_600[2])
    doc.text('Cash Injections', summaryLeft, y)
    doc.setTextColor(GRAY_900[0], GRAY_900[1], GRAY_900[2])
    doc.text(formatCurrency(overview.totalInjections, currency), summaryRight, y, { align: 'right' })
    y += 6

    doc.setTextColor(GRAY_600[0], GRAY_600[1], GRAY_600[2])
    doc.text('Net Cash Flow', summaryLeft, y)
    doc.setTextColor(overview.netCashFlow >= 0 ? 22 : 220, overview.netCashFlow >= 0 ? 163 : 38, overview.netCashFlow >= 0 ? 74 : 38)
    doc.text(formatCurrency(overview.netCashFlow, currency), summaryRight, y, { align: 'right' })
    y += 12
  } else {
    y += 6
  }

  // Cash movements table
  if (overview.features.internalExpensesEnabled && cashMovements.length > 0) {
    doc.setFontSize(12)
    doc.setTextColor(GRAY_900[0], GRAY_900[1], GRAY_900[2])
    doc.text('Cash Movements', pad, y)
    y += 8

    const tableData = cashMovements.map((m) => [
      m.type === 'INJECTION' ? 'Injection' : 'Expense',
      formatDate(m.date),
      m.category.slice(0, 18),
      (m.type === 'INJECTION' ? '+' : '') + formatCurrency(m.amount, currency),
      (m.notes || '—').slice(0, 30)
    ])

    autoTable(doc, {
      startY: y,
      head: [['Type', 'Date', 'Category', 'Amount', 'Notes']],
      body: tableData,
      theme: 'plain',
      tableWidth,
      margin: { left: pad, right: pad },
      headStyles: {
        fillColor: [255, 255, 255],
        textColor: [55, 65, 81],
        fontStyle: 'normal',
        font: fontName,
        lineWidth: 0.1,
        lineColor: [229, 231, 235],
        cellPadding: 2
      },
      styles: { fontSize: 9, textColor: [17, 24, 39], font: fontName, cellPadding: 2 },
      columnStyles: {
        0: { cellWidth: 28 },
        1: { cellWidth: 32 },
        2: { cellWidth: 38 },
        3: { cellWidth: 38, halign: 'right' },
        4: { cellWidth: 40 }
      },
      tableLineColor: [229, 231, 235],
      tableLineWidth: 0.1,
      pageBreak: 'auto'
    })

    y = (doc as any).lastAutoTable?.finalY ?? y
    y += 12
  }

  // Team payments table
  if (overview.features.enableTeamPaymentTracking && teamPayments.length > 0) {
    doc.setFontSize(12)
    doc.setTextColor(GRAY_900[0], GRAY_900[1], GRAY_900[2])
    doc.text('Team Payments', pad, y)
    y += 8

    const teamTableData = teamPayments.map((p) => [
      p.recipientName.slice(0, 22),
      formatDate(p.paidAt),
      p.paymentMethod,
      formatCurrency(p.amount, currency),
      (p.notes || '—').slice(0, 25)
    ])

    autoTable(doc, {
      startY: y,
      head: [['Recipient', 'Date', 'Method', 'Amount', 'Notes']],
      body: teamTableData,
      theme: 'plain',
      tableWidth,
      margin: { left: pad, right: pad },
      headStyles: {
        fillColor: [255, 255, 255],
        textColor: [55, 65, 81],
        fontStyle: 'normal',
        font: fontName,
        lineWidth: 0.1,
        lineColor: [229, 231, 235],
        cellPadding: 2
      },
      styles: { fontSize: 9, textColor: [17, 24, 39], font: fontName, cellPadding: 2 },
      columnStyles: {
        0: { cellWidth: 45 },
        1: { cellWidth: 32 },
        2: { cellWidth: 28 },
        3: { cellWidth: 35, halign: 'right' },
        4: { cellWidth: 36 }
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
  doc.save(`financial-report-${safeName}-${new Date(generatedAt).toISOString().split('T')[0]}.pdf`)
}

/** Fetch report from API and trigger PDF download */
export async function fetchAndDownloadFinancialReportPdf(businessId: string): Promise<void> {
  const res = await fetch(`/api/admin/stores/${businessId}/financial/report`)
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Failed to load financial report')
  }
  const report = await res.json()
  await generateFinancialReportPdf(report)
}
