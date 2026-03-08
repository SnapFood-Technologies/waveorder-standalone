// Team Payments Report PDF - Header matches invoice (no logo)
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

export interface TeamPaymentsReportData {
  business: {
    name: string
    logo?: string | null
    address?: string | null
    phone?: string | null
    email?: string | null
    currency: string
  }
  grandTotal: number
  totalsByMember: Array<{
    userName: string
    userEmail: string | null
    totalPaid: number
    paymentCount: number
  }>
  payments: Array<{
    recipientName: string
    recipientEmail: string | null
    amount: number
    paidAt: string | null
    paymentMethod: string
    paidFrom: string | null
    notes: string | null
  }>
  generatedAt: string
}

export async function generateTeamPaymentsReportPdf(report: TeamPaymentsReportData): Promise<void> {
  const doc = new jsPDF()
  const { business, grandTotal, totalsByMember, payments, generatedAt } = report
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
  doc.text('Team Payments Report', right, pad, { align: 'right' })
  doc.setFontSize(10)
  doc.setTextColor(GRAY_600[0], GRAY_600[1], GRAY_600[2])
  doc.text(`As of ${formatDate(generatedAt)}`, right, pad + 8, { align: 'right' })

  doc.setDrawColor(TEAL[0], TEAL[1], TEAL[2])
  doc.setLineWidth(0.5)
  doc.line(pad, y + 2, right, y + 2)
  y += 18

  // Summary
  doc.setFontSize(12)
  doc.setTextColor(GRAY_900[0], GRAY_900[1], GRAY_900[2])
  doc.text('Summary', pad, y)
  y += 8

  doc.setFontSize(10)
  const summaryLeft = pad + 5
  const summaryRight = right - 5
  doc.setTextColor(GRAY_600[0], GRAY_600[1], GRAY_600[2])
  doc.text('Total Paid to Team', summaryLeft, y)
  doc.setTextColor(GRAY_900[0], GRAY_900[1], GRAY_900[2])
  doc.text(formatCurrency(grandTotal, currency), summaryRight, y, { align: 'right' })
  y += 12

  // Totals by member (if any)
  if (totalsByMember.length > 0) {
    doc.setFontSize(12)
    doc.setTextColor(GRAY_900[0], GRAY_900[1], GRAY_900[2])
    doc.text('Totals by Team Member', pad, y)
    y += 8

    const memberTableData = totalsByMember.map((m) => [
      m.userName.slice(0, 35),
      m.paymentCount.toString(),
      formatCurrency(m.totalPaid, currency)
    ])

    autoTable(doc, {
      startY: y,
      head: [['Team Member', 'Payments', 'Total Paid']],
      body: memberTableData,
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
        0: { cellWidth: 100 },
        1: { cellWidth: 36, halign: 'center' },
        2: { cellWidth: 40, halign: 'right' }
      },
      tableLineColor: [229, 231, 235],
      tableLineWidth: 0.1,
      pageBreak: 'auto'
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
      p.recipientName.slice(0, 20),
      formatDate(p.paidAt),
      p.paymentMethod,
      formatCurrency(p.amount, currency),
      (p.paidFrom || '—').slice(0, 12),
      (p.notes || '—').slice(0, 20)
    ])

    autoTable(doc, {
      startY: y,
      head: [['Recipient', 'Date', 'Method', 'Amount', 'From', 'Notes']],
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
        0: { cellWidth: 38 },
        1: { cellWidth: 28 },
        2: { cellWidth: 24 },
        3: { cellWidth: 32, halign: 'right' },
        4: { cellWidth: 26 },
        5: { cellWidth: 28 }
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
  doc.save(`team-payments-report-${safeName}-${new Date(generatedAt).toISOString().split('T')[0]}.pdf`)
}

/** Fetch report from API and trigger PDF download */
export async function fetchAndDownloadTeamPaymentsReportPdf(businessId: string): Promise<void> {
  const res = await fetch(`/api/admin/stores/${businessId}/team-payments/report`)
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Failed to load team payments report')
  }
  const report = await res.json()
  await generateTeamPaymentsReportPdf(report)
}
