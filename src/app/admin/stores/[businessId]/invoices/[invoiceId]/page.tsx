// app/admin/stores/[businessId]/invoices/[invoiceId]/page.tsx
import { InvoiceView } from '@/components/admin/invoices/InvoiceView'

interface InvoicePageProps {
  params: Promise<{ businessId: string; invoiceId: string }>
}

export default async function InvoicePage({ params }: InvoicePageProps) {
  const { businessId, invoiceId } = await params
  return <InvoiceView businessId={businessId} invoiceId={invoiceId} />
}
