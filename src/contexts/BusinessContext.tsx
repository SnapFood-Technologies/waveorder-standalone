// src/contexts/BusinessContext.tsx
'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

interface Business {
  id: string
  name: string
  slug: string
  subscriptionPlan: 'FREE' | 'PRO'
  setupWizardCompleted: boolean
  onboardingCompleted: boolean
}

interface BusinessContextValue {
  businesses: Business[]
  subscription: { plan: 'FREE' | 'PRO'; isActive: boolean }
  loading: boolean
  currentBusiness: Business | null
  accessChecked: boolean
  refetch: () => void
}

const BusinessContext = createContext<BusinessContextValue | undefined>(undefined)

interface BusinessProviderProps {
  children: ReactNode
  currentBusinessId: string
}

export function BusinessProvider({ children, currentBusinessId }: BusinessProviderProps) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [subscription, setSubscription] = useState({ plan: 'FREE' as const, isActive: true })
  const [loading, setLoading] = useState(true)
  const [accessChecked, setAccessChecked] = useState(false)

  const fetchData = async () => {
    if (status === 'loading') return
    
    if (!session) {
      router.push('/auth/login')
      return
    }

    try {
      setLoading(true)
      
      // Single API call for both businesses and subscription
      const [businessesRes, subscriptionRes] = await Promise.all([
        fetch('/api/user/businesses'),
        fetch('/api/user/subscription')
      ])
      
      if (!businessesRes.ok) {
        router.push('/auth/login')
        return
      }

      const businessData = await businessesRes.json()
      const businesses = businessData.businesses || []
      setBusinesses(businesses)

      // Check access to current business
      const userBusiness = businesses.find((b: Business) => b.id === currentBusinessId)
      
      if (!userBusiness) {
        if (businesses.length > 0) {
          const firstBusiness = businesses[0]
          if (!firstBusiness.setupWizardCompleted || !firstBusiness.onboardingCompleted) {
            router.push('/setup')
            return
          }
          router.push(`/admin/stores/${firstBusiness.id}/dashboard`)
          return
        } else {
          router.push('/setup')
          return
        }
      }

      if (!userBusiness.setupWizardCompleted || !userBusiness.onboardingCompleted) {
        router.push('/setup')
        return
      }

      // Handle subscription
      if (subscriptionRes.ok) {
        const subscriptionData = await subscriptionRes.json()
        setSubscription(subscriptionData)
      }

      setAccessChecked(true)
    } catch (error) {
      console.error('Error fetching business data:', error)
      router.push('/setup')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [ currentBusinessId])

  const currentBusiness = businesses.find(b => b.id === currentBusinessId) || null

  const value: BusinessContextValue = {
    businesses,
    subscription,
    loading,
    currentBusiness,
    accessChecked,
    refetch: fetchData
  }

  return (
    <BusinessContext.Provider value={value}>
      {children}
    </BusinessContext.Provider>
  )
}

export function useBusiness() {
  const context = useContext(BusinessContext)
  if (context === undefined) {
    throw new Error('useBusiness must be used within a BusinessProvider')
  }
  return context
}