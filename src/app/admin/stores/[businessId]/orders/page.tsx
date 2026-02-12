// src/app/admin/stores/[businessId]/orders/page.tsx
'use client'

import { use } from 'react'
import OrdersList from '@/components/admin/orders/OrdersList'
import { BusinessTypeGuard } from '@/components/admin/BusinessTypeGuard'

interface OrdersPageProps {
  params: Promise<{ businessId: string }>
}

export default function OrdersPage({ params }: OrdersPageProps) {
  const { businessId } = use(params)

  return (
    <BusinessTypeGuard 
      businessId={businessId} 
      allowedTypes={['RESTAURANT', 'RETAIL', 'INSTAGRAM_SELLER', 'OTHER']}
      redirectTo={`/admin/stores/${businessId}/appointments`}
    >
      <OrdersList businessId={businessId} />
    </BusinessTypeGuard>
  )
}