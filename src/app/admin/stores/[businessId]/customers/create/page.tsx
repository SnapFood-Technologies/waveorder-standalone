// src/app/admin/stores/[businessId]/customers/create/page.tsx
'use client'

import { useRouter } from 'next/navigation'
import { use } from 'react'
import CustomerForm from '@/components/admin/customers/CustomerForm'

interface CreateCustomerPageProps {
  params: Promise<{ businessId: string }>
}

export default function CreateCustomerPage({ params }: CreateCustomerPageProps) {
  const router = useRouter()
  const { businessId } = use(params)

  const handleSuccess = () => {
    router.push(`/admin/stores/${businessId}/customers`)
  }

  const handleCancel = () => {
    router.back()
  }

  return (
    <CustomerForm
      businessId={businessId}
      onSuccess={handleSuccess}
      onCancel={handleCancel}
    />
  )
}