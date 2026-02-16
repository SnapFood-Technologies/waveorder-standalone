// src/app/admin/stores/[businessId]/analytics/services/page.tsx
import ServiceAnalytics from '@/components/admin/analytics/ServiceAnalytics'
import { SubscriptionGuard } from '@/components/SubscriptionGuard'

interface ServiceAnalyticsPageProps {
  params: Promise<{ businessId: string }>
}

export default async function ServiceAnalyticsPage({ params }: ServiceAnalyticsPageProps) {
  const { businessId } = await params
  
  return <SubscriptionGuard requiredPlan="PRO">
    <ServiceAnalytics businessId={businessId} />
  </SubscriptionGuard>
}
