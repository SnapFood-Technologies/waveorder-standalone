// src/app/admin/stores/[businessId]/products/[productId]/analytics/page.tsx
import ProductAnalyticsDetail from '@/components/admin/products/ProductAnalyticsDetail'
import { SubscriptionGuard } from '@/components/SubscriptionGuard'

interface ProductAnalyticsDetailPageProps {
  params: Promise<{ businessId: string; productId: string }>
}

export default async function ProductAnalyticsDetailPage({ params }: ProductAnalyticsDetailPageProps) {
  const { businessId, productId } = await params
  
  return <SubscriptionGuard requiredPlan="PRO">
    <ProductAnalyticsDetail businessId={businessId} productId={productId} />
  </SubscriptionGuard>
}
