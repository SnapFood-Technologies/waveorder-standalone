import { BusinessTypeGuard } from '@/components/admin/BusinessTypeGuard'
import ServiceRequestDetail from '@/components/admin/service-requests/ServiceRequestDetail'

interface ServiceRequestDetailPageProps {
  params: Promise<{ businessId: string; requestId: string }>
}

export default async function ServiceRequestDetailPage({ params }: ServiceRequestDetailPageProps) {
  const { businessId, requestId } = await params
  return (
    <BusinessTypeGuard businessId={businessId} allowedTypes={['SERVICES']}>
      <ServiceRequestDetail businessId={businessId} requestId={requestId} />
    </BusinessTypeGuard>
  )
}
