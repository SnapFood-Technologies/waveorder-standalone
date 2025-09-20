// src/app/admin/stores/[businessId]/customers/page.tsx
'use client'

import { use } from 'react'
import CustomersList from '@/components/admin/customers/CustomersList'

interface CustomersPageProps {
  params: Promise<{ businessId: string }>
}

export default function CustomersPage({ params }: CustomersPageProps) {
  const { businessId } = use(params)

  return <CustomersList businessId={businessId} />
}