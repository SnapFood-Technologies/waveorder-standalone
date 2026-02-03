// src/contexts/BusinessContext.tsx
'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'

interface Business {
  id: string
  name: string
  slug: string
  subscriptionPlan: 'STARTER' | 'PRO' | 'BUSINESS'
  setupWizardCompleted: boolean
  onboardingCompleted: boolean
  role: 'OWNER' | 'MANAGER' | 'STAFF'
  trialEndsAt: string | null
}

interface BusinessContextValue {
  businesses: Business[]
  subscription: { plan: 'STARTER' | 'PRO' | 'BUSINESS'; isActive: boolean }
  loading: boolean
  currentBusiness: Business | null
  accessChecked: boolean
  userRole: 'OWNER' | 'MANAGER' | 'STAFF' | null
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
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [subscription, setSubscription] = useState({ plan: 'STARTER' as const, isActive: true })
  const [loading, setLoading] = useState(true)
  const [accessChecked, setAccessChecked] = useState(false)
  const [userRole, setUserRole] = useState<'OWNER' | 'MANAGER' | 'STAFF' | null>(null)

  // Check if SuperAdmin is impersonating
  const isImpersonating = 
    session?.user?.role === 'SUPER_ADMIN' && 
    pathname.startsWith('/admin') &&
    (searchParams.get('impersonate') === 'true' || document.cookie.includes('impersonating='))

  const fetchData = async () => {
    if (status === 'loading') return
    
    if (!session) {
      router.push('/auth/login')
      return
    }

    try {
      setLoading(true)
      
      // If SuperAdmin is impersonating, fetch the business directly
      if (isImpersonating) {
        const businessRes = await fetch(`/api/superadmin/businesses/${currentBusinessId}`)
        if (businessRes.ok) {
          const data = await businessRes.json()
          const business = {
            id: data.business.id,
            name: data.business.name,
            slug: data.business.slug,
            subscriptionPlan: data.business.subscriptionPlan,
            setupWizardCompleted: data.business.setupWizardCompleted,
            onboardingCompleted: data.business.onboardingCompleted,
            role: 'OWNER' as const, // SuperAdmin impersonating has OWNER access
            trialEndsAt: data.business.trialEndsAt || null
          }
          setBusinesses([business])
          setUserRole('OWNER')
          setSubscription({ 
            plan: data.business.subscriptionPlan, 
            isActive: data.business.isActive 
          })
          setAccessChecked(true)
          setLoading(false)
          return
        }
      }

      // Normal flow for regular business owners
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

      // Set user role for current business
      const userBusiness = businesses.find((b: Business) => b.id === currentBusinessId)
      if (userBusiness) {
        setUserRole(userBusiness.role)
      }
      
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
      if (!isImpersonating) {
        router.push('/setup')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [currentBusinessId, isImpersonating])

  const currentBusiness = businesses.find(b => b.id === currentBusinessId) || null

  const value: BusinessContextValue = {
    businesses,
    subscription,
    loading,
    currentBusiness,
    accessChecked,
    userRole,
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