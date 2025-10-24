// src/app/superadmin/support/messages/[threadId]/page.tsx
'use client'

import { SuperAdminMessageThread } from '@/components/superadmin/support/SuperAdminMessageThread'

interface SuperAdminMessageThreadPageProps {
  params: Promise<{ threadId: string }>
}

export default async function SuperAdminMessageThreadPage({ params }: SuperAdminMessageThreadPageProps) {
  const { threadId } = await params

  return <SuperAdminMessageThread threadId={threadId} />
}
