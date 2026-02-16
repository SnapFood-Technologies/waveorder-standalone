// src/app/admin/stores/[businessId]/affiliates/earnings/page.tsx
import { AffiliateEarnings } from '@/components/admin/affiliates/AffiliateEarnings'

interface AffiliateEarningsPageProps {
  params: Promise<{ businessId: string }>
}

export default async function AffiliateEarningsPage({ params }: AffiliateEarningsPageProps) {
  const { businessId } = await params
  return <AffiliateEarnings businessId={businessId} />
}
