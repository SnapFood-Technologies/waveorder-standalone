// app/admin/stores/[businessId]/appointments/calendar/page.tsx
import { SubscriptionGuard } from '@/components/SubscriptionGuard'
import { BusinessTypeGuard } from '@/components/admin/BusinessTypeGuard'
import AppointmentsCalendar from '@/components/admin/appointments/AppointmentsCalendar'

interface AppointmentsCalendarPageProps {
  params: Promise<{ businessId: string }>
}

export default async function AppointmentsCalendarPage({ params }: AppointmentsCalendarPageProps) {
  const { businessId } = await params
  
  return (
    <BusinessTypeGuard 
      businessId={businessId} 
      allowedTypes={['SALON']}
      redirectTo={`/admin/stores/${businessId}/orders`}
    >
      <SubscriptionGuard requiredPlan="PRO">
        <div className="p-6">
          <AppointmentsCalendar businessId={businessId} />
        </div>
      </SubscriptionGuard>
    </BusinessTypeGuard>
  )
}
