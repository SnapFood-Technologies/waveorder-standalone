// src/app/admin/stores/[businessId]/affiliates/list/page.tsx
import { AffiliatesList } from '@/components/admin/affiliates/AffiliatesList'

interface AffiliatesListPageProps {
  params: Promise<{ businessId: string }>
}

export default async function AffiliatesListPage({ params }: AffiliatesListPageProps) {
  const { businessId } = await params
  return <AffiliatesList businessId={businessId} />
}
