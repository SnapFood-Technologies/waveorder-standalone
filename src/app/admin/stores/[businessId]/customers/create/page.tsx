// src/app/admin/stores/[businessId]/customers/create/page.tsx
'use client'

import { useRouter } from 'next/navigation'
import { use } from 'react'
import CustomerForm from '@/components/admin/customers/CustomerForm'
import { useImpersonation } from '@/lib/impersonation'

interface CreateCustomerPageProps {
  params: Promise<{ businessId: string }>
}

export default function CreateCustomerPage({ params }: CreateCustomerPageProps) {
  const router = useRouter()
  const { businessId } = use(params)
  const { addParams } = useImpersonation(businessId)

  const handleSuccess = () => {
    router.push(addParams(`/admin/stores/${businessId}/customers`))
  }

  const handleCancel = () => {
    router.push(addParams(`/admin/stores/${businessId}/customers`))
  }

  return (
    <CustomerForm
      businessId={businessId}
      onSuccess={handleSuccess}
      onCancel={handleCancel}
    />
  )
}