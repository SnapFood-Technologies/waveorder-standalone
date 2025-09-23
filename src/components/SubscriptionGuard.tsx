// components/SubscriptionGuard.tsx
'use client'
import { useSubscription } from '@/hooks/useSubscription'
import { useRouter } from 'next/navigation'
import { useParams } from 'next/navigation'
import { useEffect } from 'react'

interface SubscriptionGuardProps {
  children: React.ReactNode
  requiredPlan: 'FREE' | 'PRO'
  fallback?: React.ReactNode
}

export function SubscriptionGuard({ children, requiredPlan, fallback }: SubscriptionGuardProps) {
  const { subscription, loading } = useSubscription()
  const router = useRouter()
  const params = useParams()
  const businessId = params?.businessId as string

  useEffect(() => {
    if (!loading && subscription) {
      const planHierarchy = { FREE: 0, PRO: 1 }
      const hasAccess = planHierarchy[subscription.subscriptionPlan] >= planHierarchy[requiredPlan]
      
      if (!hasAccess) {
        router.push(`/admin/stores/${businessId}/dashboard`)
      }
    }
  }, [loading, subscription, requiredPlan, router, businessId])

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
      </div>
    )
  }

  if (!subscription) {
    return fallback || <div>Error loading subscription data</div>
  }

  const planHierarchy = { FREE: 0, PRO: 1 }
  const hasAccess = planHierarchy[subscription.subscriptionPlan] >= planHierarchy[requiredPlan]

  if (!hasAccess) {
    return fallback || null
  }

  return <>{children}</>
}