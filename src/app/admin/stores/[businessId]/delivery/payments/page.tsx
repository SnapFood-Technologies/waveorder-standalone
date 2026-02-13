// src/app/admin/stores/[businessId]/delivery/payments/page.tsx
import DeliveryPayments from '@/components/admin/delivery/DeliveryPayments'

interface DeliveryPaymentsPageProps {
  params: Promise<{ businessId: string }>
}

export default async function DeliveryPaymentsPage({ params }: DeliveryPaymentsPageProps) {
  const { businessId } = await params
  return <DeliveryPayments businessId={businessId} />
}
