// src/components/admin/BusinessTypeGuard.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { AlertTriangle } from 'lucide-react'
import Link from 'next/link'

interface BusinessTypeGuardProps {
  businessId: string
  allowedTypes: string[]
  redirectTo?: string
  children: React.ReactNode
}

/** Add impersonation query params to a path when currently impersonating. */
function withImpersonationParams(path: string, searchParams: URLSearchParams | null): string {
  if (!searchParams || searchParams.get('impersonate') !== 'true' || !searchParams.get('businessId')) return path
  const bid = searchParams.get('businessId')!
  const sep = path.includes('?') ? '&' : '?'
  return `${path}${sep}impersonate=true&businessId=${encodeURIComponent(bid)}`
}

export function BusinessTypeGuard({ 
  businessId, 
  allowedTypes, 
  redirectTo,
  children 
}: BusinessTypeGuardProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [businessType, setBusinessType] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchBusinessType = async () => {
      try {
        const response = await fetch(`/api/admin/stores/${businessId}`)
        if (response.ok) {
          const data = await response.json()
          setBusinessType(data.business?.businessType || null)
        }
      } catch (error) {
        console.error('Error fetching business type:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchBusinessType()
  }, [businessId])

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
      </div>
    )
  }

  if (!businessType || !allowedTypes.includes(businessType)) {
    if (redirectTo) {
      router.push(withImpersonationParams(redirectTo, searchParams))
      return null
    }

    const dashboardHref = withImpersonationParams(`/admin/stores/${businessId}/dashboard`, searchParams)
    return (
      <div className="flex flex-col items-center justify-center p-8 max-w-md mx-auto text-center">
        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4">
          <AlertTriangle className="w-8 h-8 text-amber-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Page Not Available</h2>
        <p className="text-gray-600 mb-6">
          This page is not available for {businessType === 'SALON' || businessType === 'SERVICES' ? 'this type of' : 'this'} business.
        </p>
        <Link
          href={dashboardHref}
          className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
        >
          Go to Dashboard
        </Link>
      </div>
    )
  }

  return <>{children}</>
}
