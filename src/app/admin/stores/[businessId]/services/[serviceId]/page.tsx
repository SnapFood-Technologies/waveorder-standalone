// app/admin/stores/[businessId]/services/[serviceId]/page.tsx
import { ServiceForm } from '@/components/admin/services/ServiceForm'

interface ServiceFormPageProps {
  params: Promise<{ businessId: string; serviceId: string }>
}

export default async function ServiceFormPage({ params }: ServiceFormPageProps) {
  const { businessId, serviceId } = await params
  return <ServiceForm businessId={businessId} serviceId={serviceId} />
}
