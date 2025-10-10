// src/app/admin/stores/[businessId]/analytics/page.tsx
import AdvancedAnalytics from '@/components/admin/analytics/AdvancedAnalytics'

interface AnalyticsPageProps {
  params: Promise<{ businessId: string }>
}

export default async function AnalyticsPage({ params }: AnalyticsPageProps) {
  const { businessId } = await params
  
  return <AdvancedAnalytics businessId={businessId} />
}