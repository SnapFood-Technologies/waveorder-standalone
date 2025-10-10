// src/app/admin/stores/[businessId]/analytics/page.tsx
import AdvancedAnalytics from '@/components/admin/analytics/AdvancedAnalytics'
import { SubscriptionGuard } from '@/components/SubscriptionGuard'

interface AnalyticsPageProps {
  params: Promise<{ businessId: string }>
}

export default async function AnalyticsPage({ params }: AnalyticsPageProps) {
  const { businessId } = await params
  
  // Pro Guard
  return <SubscriptionGuard requiredPlan="PRO">
    <AdvancedAnalytics businessId={businessId} />
  </SubscriptionGuard>
}