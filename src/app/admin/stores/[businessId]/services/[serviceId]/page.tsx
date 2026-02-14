// app/admin/stores/[businessId]/services/[serviceId]/page.tsx
import { ServiceForm } from '@/components/admin/services/ServiceForm'
import { BusinessTypeGuard } from '@/components/admin/BusinessTypeGuard'

interface ServiceFormPageProps {
  params: Promise<{ businessId: string; serviceId: string }>
}

export default async function ServiceFormPage({ params }: ServiceFormPageProps) {
  const { businessId, serviceId } = await params
  return (
    <BusinessTypeGuard 
      businessId={businessId} 
      allowedTypes={['SALON']}
      redirectTo={`/admin/stores/${businessId}/products`}
    >
      <ServiceForm businessId={businessId} serviceId={serviceId} />
    </BusinessTypeGuard>
  )
}
