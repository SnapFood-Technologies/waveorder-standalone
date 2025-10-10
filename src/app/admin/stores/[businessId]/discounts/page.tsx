'use client'

import { use } from 'react'
import DiscountsList from '@/components/admin/discounts/DiscountsList'
import { SubscriptionGuard } from '@/components/SubscriptionGuard'

interface DiscountsPageProps {
  params: Promise<{ businessId: string }>
}

export default function DiscountsPage({ params }: DiscountsPageProps) {
  const { businessId } = use(params)

  return (
    <SubscriptionGuard requiredPlan="PRO">
      <DiscountsList businessId={businessId} />
    </SubscriptionGuard>
  )
}


