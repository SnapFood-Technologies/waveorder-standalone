// app/admin/stores/[businessId]/settings/billing/page.tsx
import { BillingPanel } from '@/components/admin/billing/BillingPanel'

interface BillingPageProps {
  params: Promise<{ businessId: string }>
}

export default async function BillingPage({ params }: BillingPageProps) {
  const { businessId } = await params
  
  return <BillingPanel businessId={businessId} />
}