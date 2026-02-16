// src/app/admin/stores/[businessId]/affiliates/create/page.tsx
import { AffiliateForm } from '@/components/admin/affiliates/AffiliateForm'

interface CreateAffiliatePageProps {
  params: Promise<{ businessId: string }>
}

export default async function CreateAffiliatePage({ params }: CreateAffiliatePageProps) {
  const { businessId } = await params
  return <AffiliateForm businessId={businessId} />
}
