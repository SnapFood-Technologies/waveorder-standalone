// src/app/admin/stores/[businessId]/analytics/products/page.tsx
import ProductAnalytics from '@/components/admin/analytics/ProductAnalytics'
import { SubscriptionGuard } from '@/components/SubscriptionGuard'

interface ProductAnalyticsPageProps {
  params: Promise<{ businessId: string }>
}

export default async function ProductAnalyticsPage({ params }: ProductAnalyticsPageProps) {
  const { businessId } = await params
  
  return <SubscriptionGuard requiredPlan="PRO">
    <ProductAnalytics businessId={businessId} />
  </SubscriptionGuard>
}
