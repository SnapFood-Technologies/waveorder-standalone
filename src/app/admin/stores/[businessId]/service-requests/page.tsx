import { BusinessTypeGuard } from '@/components/admin/BusinessTypeGuard'
import ServiceRequestsList from '@/components/admin/service-requests/ServiceRequestsList'

interface ServiceRequestsPageProps {
  params: Promise<{ businessId: string }>
}

export default async function ServiceRequestsPage({ params }: ServiceRequestsPageProps) {
  const { businessId } = await params
  return (
    <BusinessTypeGuard businessId={businessId} allowedTypes={['SERVICES']}>
      <ServiceRequestsList businessId={businessId} />
    </BusinessTypeGuard>
  )
}
