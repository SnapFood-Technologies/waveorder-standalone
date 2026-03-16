// WaveOrder Flows - Conversations inbox
// Business plan only

import { SubscriptionGuard } from '@/components/SubscriptionGuard'
import { WhatsAppConversations } from '@/components/admin/whatsapp-flows/WhatsAppConversations'

interface PageProps {
  params: Promise<{ businessId: string }>
}

export default async function ConversationsPage({ params }: PageProps) {
  const { businessId } = await params
  return (
    <SubscriptionGuard requiredPlan="PRO">
      <WhatsAppConversations businessId={businessId} />
    </SubscriptionGuard>
  )
}
