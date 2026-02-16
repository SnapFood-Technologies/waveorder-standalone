// src/app/admin/stores/[businessId]/affiliates/page.tsx
import { AffiliateDashboard } from '@/components/admin/affiliates/AffiliateDashboard'

interface AffiliatesPageProps {
  params: Promise<{ businessId: string }>
}

export default async function AffiliatesPage({ params }: AffiliatesPageProps) {
  const { businessId } = await params
  return <AffiliateDashboard businessId={businessId} />
}
