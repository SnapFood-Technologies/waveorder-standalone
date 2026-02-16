// src/app/admin/stores/[businessId]/affiliates/[affiliateId]/edit/page.tsx
import { AffiliateForm } from '@/components/admin/affiliates/AffiliateForm'

interface EditAffiliatePageProps {
  params: Promise<{ businessId: string; affiliateId: string }>
}

export default async function EditAffiliatePage({ params }: EditAffiliatePageProps) {
  const { businessId, affiliateId } = await params
  return <AffiliateForm businessId={businessId} affiliateId={affiliateId} />
}
