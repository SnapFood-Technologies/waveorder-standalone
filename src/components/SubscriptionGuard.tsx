// components/SubscriptionGuard.tsx
'use client'
import { useSubscription } from '@/hooks/useSubscription'
import { useRouter } from 'next/navigation'
import { useParams } from 'next/navigation'
import { useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle, Lock } from 'lucide-react'

interface SubscriptionGuardProps {
  children: React.ReactNode
  requiredPlan: 'STARTER' | 'PRO' | 'BUSINESS'
  fallback?: React.ReactNode
}

const PLAN_HIERARCHY = { STARTER: 1, PRO: 2, BUSINESS: 3 }

export function SubscriptionGuard({ children, requiredPlan, fallback }: SubscriptionGuardProps) {
  const { subscription, loading, canAccessFeatures, isExpired, showGraceWarning, graceDaysRemaining } = useSubscription()
  const router = useRouter()
  const params = useParams()
  const businessId = params?.businessId as string

  useEffect(() => {
    if (!loading && subscription) {
      const planLevel = PLAN_HIERARCHY[subscription.subscriptionPlan] || 0
      const requiredLevel = PLAN_HIERARCHY[requiredPlan] || 0
      const hasPlanAccess = planLevel >= requiredLevel
      
      // Check if user has plan access AND can access features (not expired)
      if (!hasPlanAccess || !canAccessFeatures) {
        router.push(`/admin/stores/${businessId}/dashboard`)
      }
    }
  }, [loading, subscription, requiredPlan, router, businessId, canAccessFeatures])

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

  // Show expired trial message
  if (isExpired) {
    return (
      <div className="flex flex-col items-center justify-center p-8 max-w-md mx-auto text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
          <Lock className="w-8 h-8 text-red-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Trial Expired</h2>
        <p className="text-gray-600 mb-6">
          Your free trial has ended. Upgrade to continue using this feature.
        </p>
        <Link
          href={`/admin/stores/${businessId}/settings/billing`}
          className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
        >
          Upgrade Now
        </Link>
      </div>
    )
  }

  const planLevel = PLAN_HIERARCHY[subscription.subscriptionPlan] || 0
  const requiredLevel = PLAN_HIERARCHY[requiredPlan] || 0
  const hasAccess = planLevel >= requiredLevel

  if (!hasAccess) {
    return fallback || null
  }

  // Show grace period warning if in grace period
  if (showGraceWarning) {
    return (
      <>
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-yellow-600 mr-3" />
            <div>
              <p className="text-yellow-800 font-medium">
                Your trial has ended - {graceDaysRemaining} days remaining in grace period
              </p>
              <p className="text-yellow-700 text-sm mt-1">
                Add a payment method to continue using all features.{' '}
                <Link href={`/admin/stores/${businessId}/settings/billing`} className="underline font-medium">
                  Upgrade now
                </Link>
              </p>
            </div>
          </div>
        </div>
        {children}
      </>
    )
  }

  return <>{children}</>
}