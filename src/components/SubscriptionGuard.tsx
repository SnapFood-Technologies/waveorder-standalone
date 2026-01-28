// components/SubscriptionGuard.tsx
'use client'
import { useSubscription } from '@/hooks/useSubscription'
import { useRouter } from 'next/navigation'
import { useParams } from 'next/navigation'
import { useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle, Lock, Clock, Sparkles } from 'lucide-react'

interface SubscriptionGuardProps {
  children: React.ReactNode
  requiredPlan: 'STARTER' | 'PRO' | 'BUSINESS'
  fallback?: React.ReactNode
}

const PLAN_HIERARCHY = { STARTER: 1, PRO: 2, BUSINESS: 3 }

export function SubscriptionGuard({ children, requiredPlan, fallback }: SubscriptionGuardProps) {
  const { 
    subscription, 
    loading, 
    canAccessFeatures, 
    isExpired, 
    isStarterLimited,
    isTrialActive,
    showGraceWarning, 
    showTrialWarning,
    graceDaysRemaining,
    trialDaysRemaining,
    effectivePlan
  } = useSubscription()
  const router = useRouter()
  const params = useParams()
  const businessId = params?.businessId as string

  useEffect(() => {
    if (!loading && subscription) {
      // Use effective plan (which accounts for trial status)
      const planLevel = PLAN_HIERARCHY[effectivePlan as keyof typeof PLAN_HIERARCHY] || 0
      const requiredLevel = PLAN_HIERARCHY[requiredPlan] || 0
      const hasPlanAccess = planLevel >= requiredLevel
      
      // Check if user has plan access (don't redirect during trial or grace period)
      if (!hasPlanAccess && !isTrialActive && !showGraceWarning) {
        router.push(`/admin/stores/${businessId}/dashboard`)
      }
    }
  }, [loading, subscription, requiredPlan, router, businessId, effectivePlan, isTrialActive, showGraceWarning])

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

  // Use effective plan for access checks
  const planLevel = PLAN_HIERARCHY[effectivePlan as keyof typeof PLAN_HIERARCHY] || 0
  const requiredLevel = PLAN_HIERARCHY[requiredPlan] || 0
  const hasAccess = planLevel >= requiredLevel

  // Show trial expired / starter limited message for Pro+ features
  if ((isExpired || isStarterLimited) && requiredPlan !== 'STARTER') {
    return (
      <div className="flex flex-col items-center justify-center p-8 max-w-md mx-auto text-center">
        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4">
          <Lock className="w-8 h-8 text-amber-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Pro Feature</h2>
        <p className="text-gray-600 mb-2">
          Your free trial has ended. You're now on the Starter plan.
        </p>
        <p className="text-gray-500 text-sm mb-6">
          Upgrade to Pro or Business to access this feature again.
        </p>
        <div className="flex gap-3">
          <Link
            href={`/admin/stores/${businessId}/settings/billing`}
            className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
          >
            Upgrade Now
          </Link>
          <Link
            href={`/admin/stores/${businessId}/dashboard`}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  if (!hasAccess) {
    return fallback || null
  }

  // Show trial warning banner (3 days or less remaining)
  if (showTrialWarning && isTrialActive) {
    return (
      <>
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
          <div className="flex items-center">
            <Sparkles className="w-5 h-5 text-blue-600 mr-3 flex-shrink-0" />
            <div>
              <p className="text-blue-800 font-medium">
                {trialDaysRemaining} day{trialDaysRemaining !== 1 ? 's' : ''} left in your Pro trial
              </p>
              <p className="text-blue-700 text-sm mt-1">
                Subscribe to keep all Pro features after your trial ends.{' '}
                <Link href={`/admin/stores/${businessId}/settings/billing`} className="underline font-medium">
                  View plans
                </Link>
              </p>
            </div>
          </div>
        </div>
        {children}
      </>
    )
  }

  // Show grace period warning if in grace period
  if (showGraceWarning) {
    return (
      <>
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
          <div className="flex items-center">
            <Clock className="w-5 h-5 text-yellow-600 mr-3 flex-shrink-0" />
            <div>
              <p className="text-yellow-800 font-medium">
                Trial ended - {graceDaysRemaining} day{graceDaysRemaining !== 1 ? 's' : ''} to subscribe
              </p>
              <p className="text-yellow-700 text-sm mt-1">
                Your account is now limited to Starter features. Subscribe to restore full access.{' '}
                <Link href={`/admin/stores/${businessId}/settings/billing`} className="underline font-medium">
                  Subscribe now
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