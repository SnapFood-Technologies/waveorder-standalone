// src/app/admin/stores/[businessId]/orders/create/page.tsx
'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { use } from 'react'
import AdminOrderForm from '@/components/admin/orders/AdminOrderForm'

interface CreateOrderPageProps {
  params: Promise<{ businessId: string }>
}

export default function CreateOrderPage({ params }: CreateOrderPageProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { businessId } = use(params)
  
  const preselectedCustomerId = searchParams.get('customerId') // Add this line

  const handleSuccess = () => {
    router.push(`/admin/stores/${businessId}/orders`)
  }

  const handleCancel = () => {
    router.back()
  }

  return (
    <AdminOrderForm
      businessId={businessId}
      preselectedCustomerId={preselectedCustomerId} // Add this prop
      onSuccess={handleSuccess}
      onCancel={handleCancel}
    />
  )
}