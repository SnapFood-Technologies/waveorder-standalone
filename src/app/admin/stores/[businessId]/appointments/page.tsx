// app/admin/stores/[businessId]/appointments/page.tsx
import AppointmentsList from '@/components/admin/appointments/AppointmentsList'

interface AppointmentsPageProps {
  params: Promise<{ businessId: string }>
}

export default async function AppointmentsPage({ params }: AppointmentsPageProps) {
  const { businessId } = await params
  return <AppointmentsList businessId={businessId} />
}
