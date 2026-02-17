// app/admin/stores/[businessId]/staff/availability/page.tsx
import { SubscriptionGuard } from '@/components/SubscriptionGuard'
import { BusinessTypeGuard } from '@/components/admin/BusinessTypeGuard'
import StaffAvailabilityManagement from '@/components/admin/staff/StaffAvailabilityManagement'

interface StaffAvailabilityPageProps {
  params: Promise<{ businessId: string }>
}

export default async function StaffAvailabilityPage({ params }: StaffAvailabilityPageProps) {
  const { businessId } = await params
  
  return (
    <BusinessTypeGuard 
      businessId={businessId} 
      allowedTypes={['SALON']}
      redirectTo={`/admin/stores/${businessId}/dashboard`}
    >
      <SubscriptionGuard requiredPlan="BUSINESS">
        <StaffAvailabilityManagement businessId={businessId} />
      </SubscriptionGuard>
    </BusinessTypeGuard>
  )
}
