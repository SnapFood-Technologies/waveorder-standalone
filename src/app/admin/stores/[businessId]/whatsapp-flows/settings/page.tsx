// WaveOrder Flows - Settings
// Business plan only

import { SubscriptionGuard } from '@/components/SubscriptionGuard'
import { WhatsAppFlowsSettings } from '@/components/admin/whatsapp-flows/WhatsAppFlowsSettings'

interface PageProps {
  params: Promise<{ businessId: string }>
}

export default async function WhatsAppFlowsSettingsPage({ params }: PageProps) {
  const { businessId } = await params
  return (
    <SubscriptionGuard requiredPlan="BUSINESS">
      <WhatsAppFlowsSettings businessId={businessId} />
    </SubscriptionGuard>
  )
}
