// app/admin/stores/[businessId]/settings/delivery/page.tsx
import { DeliverySettings } from '@/components/admin/settings/DeliverySettings'

interface DeliverySettingsPageProps {
  params: Promise<{ businessId: string }>
}

export default async function DeliverySettingsPage({ params }: DeliverySettingsPageProps) {
  const { businessId } = await params
  return <DeliverySettings businessId={businessId} />
}