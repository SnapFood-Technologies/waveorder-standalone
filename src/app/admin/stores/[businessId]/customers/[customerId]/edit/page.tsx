// src/app/admin/stores/[businessId]/customers/[customerId]/edit/page.tsx
'use client'

import CustomerForm from '@/components/admin/customers/CustomerForm'
import { useRouter } from 'next/navigation'
import { use } from 'react'

interface EditCustomerPageProps {
  params: Promise<{
    businessId: string
    customerId: string
  }>
}

export default function EditCustomerPage({ params }: EditCustomerPageProps) {
  const router = useRouter()
  const { businessId, customerId } = use(params)

  const handleSuccess = () => {
    // Redirect back to customer details after successful edit
    router.push(`/admin/stores/${businessId}/customers/${customerId}`)
  }

  const handleCancel = () => {
    // Go back to customer details
    router.push(`/admin/stores/${businessId}/customers/${customerId}`)
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