// src/app/admin/stores/[businessId]/team-payments/page.tsx
import { TeamPayments } from '@/components/admin/team/TeamPayments'
import { SubscriptionGuard } from '@/components/SubscriptionGuard'

interface TeamPaymentsPageProps {
  params: Promise<{ businessId: string }>
}

export default async function TeamPaymentsPage({ params }: TeamPaymentsPageProps) {
  const { businessId } = await params
  return (
    <SubscriptionGuard requiredPlan="BUSINESS">
      <TeamPayments businessId={businessId} />
    </SubscriptionGuard>
  )
}
