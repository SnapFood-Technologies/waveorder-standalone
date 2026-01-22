// src/app/admin/stores/[businessId]/analytics/page.tsx
import Analytics from '@/components/admin/analytics/Analytics'
import { SubscriptionGuard } from '@/components/SubscriptionGuard'

interface AnalyticsPageProps {
  params: Promise<{ businessId: string }>
}

export default async function AnalyticsPage({ params }: AnalyticsPageProps) {
  const { businessId } = await params
  
  // Pro Guard
  return <SubscriptionGuard requiredPlan="PRO">
    <Analytics businessId={businessId} />
  </SubscriptionGuard>
}