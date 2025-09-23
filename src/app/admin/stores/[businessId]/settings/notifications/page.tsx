// app/admin/stores/[businessId]/settings/notifications/page.tsx
import { OrderNotificationSettings } from '@/components/admin/settings/OrderNotificationSettings'

interface OrderNotificationSettingsPageProps {
  params: Promise<{ businessId: string }>
}

export default async function OrderNotificationSettingsPage({ 
  params 
}: OrderNotificationSettingsPageProps) {
  const { businessId } = await params
  return <OrderNotificationSettings businessId={businessId} />
}

export const metadata = {
  title: 'Order Notifications - WaveOrder',
  description: 'Configure email notifications for new orders and status updates'
}