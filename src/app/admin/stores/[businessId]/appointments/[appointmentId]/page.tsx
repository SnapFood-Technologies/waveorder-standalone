// app/admin/stores/[businessId]/appointments/[appointmentId]/page.tsx
import AppointmentDetails from '@/components/admin/appointments/AppointmentDetails'
import { BusinessTypeGuard } from '@/components/admin/BusinessTypeGuard'

interface AppointmentDetailsPageProps {
  params: Promise<{ businessId: string; appointmentId: string }>
}

export default async function AppointmentDetailsPage({ params }: AppointmentDetailsPageProps) {
  const { businessId, appointmentId } = await params
  return (
    <BusinessTypeGuard 
      businessId={businessId} 
      allowedTypes={['SALON']}
      redirectTo={`/admin/stores/${businessId}/orders`}
    >
      <AppointmentDetails businessId={businessId} appointmentId={appointmentId} />
    </BusinessTypeGuard>
  )
}
