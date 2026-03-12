// app/admin/stores/[businessId]/marketing/ads/page.tsx
import MarketingAdsComponent from '@/components/admin/marketing/MarketingAdsManagement'

interface MarketingAdsPageProps {
  params: Promise<{ businessId: string }>
}

export default async function MarketingAdsPage({ params }: MarketingAdsPageProps) {
  const { businessId } = await params
  return <MarketingAdsComponent businessId={businessId} />
}
