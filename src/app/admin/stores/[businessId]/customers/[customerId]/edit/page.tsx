// src/app/admin/stores/[businessId]/customers/[customerId]/edit/page.tsx
'use client'

import CustomerForm from '@/components/admin/customers/CustomerForm'
import { useRouter } from 'next/navigation'
import { use } from 'react'
import { useImpersonation } from '@/lib/impersonation'

interface EditCustomerPageProps {
  params: Promise<{
    businessId: string
    customerId: string
  }>
}

export default function EditCustomerPage({ params }: EditCustomerPageProps) {
  const router = useRouter()
  const { businessId, customerId } = use(params)
  const { addParams } = useImpersonation(businessId)

  const handleSuccess = () => {
    // Redirect back to customer details after successful edit
    router.push(addParams(`/admin/stores/${businessId}/customers/${customerId}`))
  }

  const handleCancel = () => {
    // Go back to customer details
    router.push(addParams(`/admin/stores/${businessId}/customers/${customerId}`))
  }

  return (
    <CustomerForm
      businessId={businessId}
      customerId={customerId} // This puts it in edit mode
      onSuccess={handleSuccess}
      onCancel={handleCancel}
    />
  )
}