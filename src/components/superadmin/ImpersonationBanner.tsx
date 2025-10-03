// src/components/superadmin/ImpersonationBanner.tsx
'use client'

import { useSession } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
import { Eye, X } from 'lucide-react'
import { useEffect, useState } from 'react'

interface Business {
  id: string
  name: string
  owner: {
    name: string
    email: string
  }
}

export function ImpersonationBanner() {
  const { data: session } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const [business, setBusiness] = useState<Business | null>(null)
  const [loading, setLoading] = useState(true)

  const isImpersonating = session?.user?.role === 'SUPER_ADMIN' && pathname.startsWith('/admin')

  useEffect(() => {
    if (isImpersonating) {
      const pathParts = pathname.split('/')
      const businessId = pathParts[3]
      if (businessId) {
        fetchBusinessInfo(businessId)
      }
    }
  }, [isImpersonating, pathname])

  const fetchBusinessInfo = async (businessId: string) => {
    try {
      const response = await fetch(`/api/superadmin/businesses/${businessId}`)
      if (response.ok) {
        const data = await response.json()
        const owner = data.business?.owner;
        setBusiness({
          id: data.business.id,
          name: data.business.name,
          owner: owner ? {
            name: owner.name,
            email: owner.email
          } : { name: 'Unknown', email: 'N/A' }
        })
      }
    } catch (error) {
      console.error('Failed to fetch business info:', error)
    } finally {
      setLoading(false)
    }
  }

  const exitImpersonation = () => {
    document.cookie = 'impersonating=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;'
    router.push('/superadmin/dashboard')
  }

  if (!isImpersonating || loading) {
    return null
  }

  return (
    <div className="bg-teal-600 px-4 py-2 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <Eye className="w-4 h-4 text-teal-100 flex-shrink-0" />
          {business && (
            <div className="flex items-center gap-2 text-sm text-white min-w-0">
              <span className="font-medium truncate">{business.owner.name}</span>
              <span className="hidden md:inline text-teal-200">·</span>
              <span className="hidden md:inline truncate">{business.name}</span>
            </div>
          )}
        </div>
        
        <button
          onClick={exitImpersonation}
          className="flex items-center gap-2 px-3 py-1 bg-white text-teal-700 rounded hover:bg-teal-50 text-sm font-medium transition-colors flex-shrink-0"
        >
          <span>Exit</span>
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}