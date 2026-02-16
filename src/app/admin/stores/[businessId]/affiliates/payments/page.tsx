// src/app/admin/stores/[businessId]/affiliates/payments/page.tsx
import { AffiliatePayments } from '@/components/admin/affiliates/AffiliatePayments'

interface AffiliatePaymentsPageProps {
  params: Promise<{ businessId: string }>
}

export default async function AffiliatePaymentsPage({ params }: AffiliatePaymentsPageProps) {
  const { businessId } = await params
  return <AffiliatePayments businessId={businessId} />
}
