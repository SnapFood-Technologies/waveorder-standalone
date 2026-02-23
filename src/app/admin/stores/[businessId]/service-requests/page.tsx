import { BusinessTypeGuard } from '@/components/admin/BusinessTypeGuard'
import ServiceRequestsList from '@/components/admin/service-requests/ServiceRequestsList'

interface ServiceRequestsPageProps {
  params: Promise<{ businessId: string }>
}

export default async function ServiceRequestsPage({ params }: ServiceRequestsPageProps) {
  const { businessId } = await params
  return (
    <BusinessTypeGuard businessId={businessId} allowedTypes={['SERVICES']}>
      <div className="space-y-4">
        <h1 className="text-xl font-semibold text-gray-900">Service requests</h1>
        <p className="text-sm text-gray-600">
          Form submissions from Request by email and Request by WhatsApp. For appointment-based requests, see Appointments.
        </p>
        <ServiceRequestsList businessId={businessId} />
      </div>
    </BusinessTypeGuard>
  )
}
