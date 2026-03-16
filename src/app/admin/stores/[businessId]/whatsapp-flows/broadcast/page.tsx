// WaveOrder Flows - Broadcast & Campaigns
// Business plan only

import { SubscriptionGuard } from '@/components/SubscriptionGuard'
import { WhatsAppBroadcast } from '@/components/admin/whatsapp-flows/WhatsAppBroadcast'

interface PageProps {
  params: Promise<{ businessId: string }>
}

export default async function BroadcastPage({ params }: PageProps) {
  const { businessId } = await params
  return (
    <SubscriptionGuard requiredPlan="PRO">
      <WhatsAppBroadcast businessId={businessId} />
    </SubscriptionGuard>
  )
}
