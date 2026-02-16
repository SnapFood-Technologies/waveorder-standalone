// src/app/admin/stores/[businessId]/appointments/create/page.tsx
'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { use } from 'react'
import AdminAppointmentForm from '@/components/admin/appointments/AdminAppointmentForm'
import { BusinessTypeGuard } from '@/components/admin/BusinessTypeGuard'

interface CreateAppointmentPageProps {
  params: Promise<{ businessId: string }>
}

export default function CreateAppointmentPage({ params }: CreateAppointmentPageProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { businessId } = use(params)
  
  const preselectedCustomerId = searchParams.get('customerId')

  const handleSuccess = () => {
    router.push(`/admin/stores/${businessId}/appointments`)
  }

  const handleCancel = () => {
    router.back()
  }

  return (
    <BusinessTypeGuard 
      businessId={businessId} 
      allowedTypes={['SALON']}
      redirectTo={`/admin/stores/${businessId}/orders`}
    >
      <AdminAppointmentForm
        businessId={businessId}
        preselectedCustomerId={preselectedCustomerId}
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    </BusinessTypeGuard>
  )
}
