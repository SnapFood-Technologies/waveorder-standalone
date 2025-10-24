// src/app/admin/stores/[businessId]/support/messages/page.tsx
import { MessageThreadList } from '@/components/admin/support/MessageThreadList'

interface MessagesPageProps {
  params: Promise<{ businessId: string }>
}

export default async function MessagesPage({ params }: MessagesPageProps) {
  const { businessId } = await params
  return <MessageThreadList businessId={businessId} />
}
