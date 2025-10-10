// src/app/admin/stores/[businessId]/team/page.tsx
import { TeamManagement } from '@/components/admin/team/TeamManagement'
import { SubscriptionGuard } from '@/components/SubscriptionGuard'

interface TeamManagementPageProps {
  params: Promise<{ businessId: string }>
}

export default async function TeamManagementPage({ params }: TeamManagementPageProps) {
  const { businessId } = await params

  // Pro Guard
  return <SubscriptionGuard requiredPlan="PRO">
    <TeamManagement businessId={businessId} />
  </SubscriptionGuard>
}
