// src/app/admin/stores/[businessId]/api/page.tsx
import { ApiKeyManagement } from '@/components/admin/api/ApiKeyManagement'
import { SubscriptionGuard } from '@/components/SubscriptionGuard'

interface ApiKeyManagementPageProps {
  params: Promise<{ businessId: string }>
}

export default async function ApiKeyManagementPage({ params }: ApiKeyManagementPageProps) {
  const { businessId } = await params

  // Business plan required for API access
  return (
    <SubscriptionGuard requiredPlan="BUSINESS">
      <ApiKeyManagement businessId={businessId} />
    </SubscriptionGuard>
  )
}
