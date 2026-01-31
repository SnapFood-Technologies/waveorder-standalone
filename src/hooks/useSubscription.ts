// hooks/useSubscription.ts
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

type TrialStatus = 'PAID' | 'TRIAL_ACTIVE' | 'GRACE_PERIOD' | 'EXPIRED' | 'STARTER_LIMITED'

interface SubscriptionData {
  businessId: string
  businessName: string
  subscriptionPlan: 'STARTER' | 'PRO' | 'BUSINESS'
  subscriptionStatus: 'ACTIVE' | 'INACTIVE' | 'CANCELLED' | 'EXPIRED' | 'TRIALING' | 'TRIAL_EXPIRED'
  hasProAccess: boolean
  hasBusinessAccess: boolean
  userRole: 'OWNER' | 'MANAGER' | 'STAFF'
  // Trial info
  trialStatus: TrialStatus
  trialDaysRemaining: number
  graceDaysRemaining: number
  isTrialActive: boolean
  isGracePeriod: boolean
  isExpired: boolean
  isStarterLimited: boolean
  isPaid: boolean
  canAccessFeatures: boolean
  effectivePlan: 'STARTER' | 'PRO' | 'BUSINESS' // The plan features they have access to
  showTrialWarning: boolean
  showGraceWarning: boolean
  showExpiredWarning: boolean
}

export function useSubscription() {
  const params = useParams()
  const businessId = params?.businessId as string
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!businessId) return

    const fetchSubscription = async () => {
      try {
        const response = await fetch(`/api/admin/stores/${businessId}/subscription`)
        if (response.ok) {
          const data = await response.json()
          setSubscription(data)
        } else {
          setError('Failed to fetch subscription data')
        }
      } catch (err) {
        setError('Error fetching subscription data')
      } finally {
        setLoading(false)
      }
    }

    fetchSubscription()
  }, [businessId])

  return {
    subscription,
    loading,
    error,
    // Plan access checks
    isPro: subscription?.hasProAccess || false,
    isBusiness: subscription?.hasBusinessAccess || false,
    isStarter: subscription?.subscriptionPlan === 'STARTER',
    // Effective plan (what features they can actually use)
    effectivePlan: subscription?.effectivePlan || subscription?.subscriptionPlan || 'STARTER',
    // Trial status
    trialStatus: subscription?.trialStatus || 'PAID',
    trialDaysRemaining: subscription?.trialDaysRemaining || 0,
    graceDaysRemaining: subscription?.graceDaysRemaining || 0,
    isTrialActive: subscription?.isTrialActive || false,
    isGracePeriod: subscription?.isGracePeriod || false,
    isExpired: subscription?.isExpired || subscription?.isStarterLimited || false,
    isStarterLimited: subscription?.isStarterLimited || false,
    canAccessFeatures: subscription?.canAccessFeatures ?? true,
    // Warning flags for UI
    showTrialWarning: subscription?.showTrialWarning || false,
    showGraceWarning: subscription?.showGraceWarning || false,
    showExpiredWarning: subscription?.showExpiredWarning || subscription?.isStarterLimited || false
  }
}