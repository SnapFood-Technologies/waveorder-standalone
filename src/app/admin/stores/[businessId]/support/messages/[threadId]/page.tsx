// src/app/admin/stores/[businessId]/support/messages/[threadId]/page.tsx
import { MessageThread } from '@/components/admin/support/MessageThread'

interface MessageThreadPageProps {
  params: Promise<{ businessId: string; threadId: string }>
}

export default async function MessageThreadPage({ params }: MessageThreadPageProps) {
  const { businessId, threadId } = await params
  return <MessageThread businessId={businessId} threadId={threadId} />
}
