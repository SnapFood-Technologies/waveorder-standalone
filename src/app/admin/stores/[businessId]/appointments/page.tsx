// app/admin/stores/[businessId]/appointments/page.tsx
import AppointmentsList from '@/components/admin/appointments/AppointmentsList'
import { BusinessTypeGuard } from '@/components/admin/BusinessTypeGuard'

interface AppointmentsPageProps {
  params: Promise<{ businessId: string }>
}

export default async function AppointmentsPage({ params }: AppointmentsPageProps) {
  const { businessId } = await params
  return (
    <BusinessTypeGuard 
      businessId={businessId} 
      allowedTypes={['SALON']}
      redirectTo={`/admin/stores/${businessId}/orders`}
    >
      <AppointmentsList businessId={businessId} />
    </BusinessTypeGuard>
  )
}
