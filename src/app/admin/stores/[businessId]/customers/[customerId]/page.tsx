// src/app/admin/stores/[businessId]/customers/[customerId]/page.tsx
'use client'

import { use } from 'react'
import CustomerDetails from '@/components/admin/customers/CustomerDetails'

interface CustomerDetailsPageProps {
  params: Promise<{ businessId: string; customerId: string }>
}

export default function CustomerDetailsPage({ params }: CustomerDetailsPageProps) {
  const { businessId, customerId } = use(params)

  return <CustomerDetails businessId={businessId} customerId={customerId} />
}