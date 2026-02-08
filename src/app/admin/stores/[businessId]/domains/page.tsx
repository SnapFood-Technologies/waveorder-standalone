// src/app/admin/stores/[businessId]/domains/page.tsx
import { DomainManagement } from '@/components/admin/domain/DomainManagement'
import { SubscriptionGuard } from '@/components/SubscriptionGuard'

interface DomainManagementPageProps {
  params: Promise<{ businessId: string }>
}

export default async function DomainManagementPage({ params }: DomainManagementPageProps) {
  const { businessId } = await params

  // Business plan required for custom domains
  return (
    <SubscriptionGuard requiredPlan="BUSINESS">
      <DomainManagement businessId={businessId} />
    </SubscriptionGuard>
  )
}
