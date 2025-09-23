// src/app/admin/stores/[businessId]/orders/page.tsx
'use client'

import { use } from 'react'
import OrdersList from '@/components/admin/orders/OrdersList'

interface OrdersPageProps {
  params: Promise<{ businessId: string }>
}

export default function OrdersPage({ params }: OrdersPageProps) {
  const { businessId } = use(params)

  return <OrdersList businessId={businessId} />
}