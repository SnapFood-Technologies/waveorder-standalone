// src/app/admin/stores/[businessId]/analytics/campaigns/page.tsx
import { CampaignAnalytics } from '@/components/admin/analytics/CampaignAnalytics'

interface CampaignAnalyticsPageProps {
  params: Promise<{ businessId: string }>
}

export default async function CampaignAnalyticsPage({ params }: CampaignAnalyticsPageProps) {
  const { businessId } = await params
  return <CampaignAnalytics businessId={businessId} />
}
