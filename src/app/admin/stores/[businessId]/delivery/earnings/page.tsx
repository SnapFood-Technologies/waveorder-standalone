// src/app/admin/stores/[businessId]/delivery/earnings/page.tsx
import { DeliveryEarnings } from '@/components/admin/delivery/DeliveryEarnings'

interface DeliveryEarningsPageProps {
  params: Promise<{ businessId: string }>
}

export default async function DeliveryEarningsPage({ params }: DeliveryEarningsPageProps) {
  const { businessId } = await params
  return <DeliveryEarnings businessId={businessId} />
}
