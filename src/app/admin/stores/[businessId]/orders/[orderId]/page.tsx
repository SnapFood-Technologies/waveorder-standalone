// src/app/admin/stores/[businessId]/orders/[orderId]/page.tsx
'use client'

import { use } from 'react'
import OrderDetails from '@/components/admin/orders/OrderDetails'

interface OrderDetailsPageProps {
  params: Promise<{ businessId: string; orderId: string }>
}

export default function OrderDetailsPage({ params }: OrderDetailsPageProps) {
  const { businessId, orderId } = use(params)

  return <OrderDetails businessId={businessId} orderId={orderId} />
}