// WaveOrder Flows - Flows management (Phase 2 placeholder)
// Business plan only

import { SubscriptionGuard } from '@/components/SubscriptionGuard'
import { WhatsAppFlowsList } from '@/components/admin/whatsapp-flows/WhatsAppFlowsList'

interface PageProps {
  params: Promise<{ businessId: string }>
}

export default async function FlowsPage({ params }: PageProps) {
  const { businessId } = await params
  return (
    <SubscriptionGuard requiredPlan="PRO">
      <WhatsAppFlowsList businessId={businessId} />
    </SubscriptionGuard>
  )
}
