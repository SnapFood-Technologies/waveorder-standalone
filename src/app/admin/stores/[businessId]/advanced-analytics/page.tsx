// src/app/admin/stores/[businessId]/advanced-analytics/page.tsx
import AdvancedAnalytics from '@/components/admin/analytics/AdvancedAnalytics'
import { SubscriptionGuard } from '@/components/SubscriptionGuard'

interface AdvancedAnalyticsPageProps {
  params: Promise<{ businessId: string }>
}

export default async function AdvancedAnalyticsPage({ params }: AdvancedAnalyticsPageProps) {
  const { businessId } = await params
  
  // Pro Guard
  return <SubscriptionGuard requiredPlan="PRO">
    <AdvancedAnalytics businessId={businessId} />
  </SubscriptionGuard>
}
