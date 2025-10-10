'use client'

import { use } from 'react'
import DiscountsList from '@/components/admin/discounts/DiscountsList'

interface DiscountsPageProps {
  params: Promise<{ businessId: string }>
}

export default function DiscountsPage({ params }: DiscountsPageProps) {
  const { businessId } = use(params)

  return <DiscountsList businessId={businessId} />
}


