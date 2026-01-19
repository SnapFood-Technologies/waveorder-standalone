// hooks/useSubscription.ts
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

interface SubscriptionData {
  businessId: string
  businessName: string
  subscriptionPlan: 'STARTER' | 'PRO'
  subscriptionStatus: 'ACTIVE' | 'INACTIVE' | 'CANCELLED' | 'EXPIRED'
  hasProAccess: boolean
  userRole: 'OWNER' | 'MANAGER' | 'STAFF'
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
    isPro: subscription?.hasProAccess || false,
    isStarter: subscription?.subscriptionPlan === 'STARTER'
  }
}