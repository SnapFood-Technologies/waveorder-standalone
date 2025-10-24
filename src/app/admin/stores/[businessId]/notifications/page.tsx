// src/app/admin/stores/[businessId]/notifications/page.tsx
import { NotificationCenter } from '@/components/admin/notifications/NotificationCenter'

interface NotificationsPageProps {
  params: Promise<{ businessId: string }>
}

export default async function NotificationsPage({ params }: NotificationsPageProps) {
  const { businessId } = await params
  return <NotificationCenter businessId={businessId} />
}
