// src/app/admin/stores/[businessId]/orders/create/page.tsx
'use client'

import { useRouter } from 'next/navigation'
import { use } from 'react'
import AdminOrderForm from '@/components/admin/orders/AdminOrderForm'

interface CreateOrderPageProps {
  params: Promise<{ businessId: string }>
}

export default function CreateOrderPage({ params }: CreateOrderPageProps) {
  const router = useRouter()
  const { businessId } = use(params)

  const handleSuccess = () => {
    router.push(`/admin/stores/${businessId}/orders`)
  }

  const handleCancel = () => {
    router.back()
  }

  return (
    <AdminOrderForm
      businessId={businessId}
      onSuccess={handleSuccess}
      onCancel={handleCancel}
    />
  )
}