// src/app/admin/stores/[businessId]/layout.tsx - ONLY business access
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { AdminSidebar } from '@/components/admin/layout/AdminSidebar'
import { AdminHeader } from '@/components/admin/layout/AdminHeader'

export default function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ businessId: string }>
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [businessId, setBusinessId] = useState<string | null>(null)
  const [accessChecked, setAccessChecked] = useState(false)
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    const getParams = async () => {
      const resolvedParams = await params
      setBusinessId(resolvedParams.businessId)
    }
    getParams()
  }, [params])

  useEffect(() => {
    if (status === 'loading' || !businessId) return
    
    if (!session) {
      router.push('/auth/login')
      return
    }
    
    checkBusinessAccess()
  }, [session, status, businessId])

  const checkBusinessAccess = async () => {
    try {
      const response = await fetch('/api/user/businesses')
      if (!response.ok) {
        router.push('/auth/login')
        return
      }

      const data = await response.json()
      const userBusiness = data.businesses?.find((b: any) => b.id === businessId)
      
      if (!userBusiness) {
        if (data.businesses?.length > 0) {
          const firstBusiness = data.businesses[0]
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

      setAccessChecked(true)
    } catch (error) {
      router.push('/setup')
    }
  }

  if (businessId === null || !accessChecked) {
    return (
      <div className="flex h-screen bg-gray-50 items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-teal-600"></div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <AdminSidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)}
        businessId={businessId}
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminHeader 
          onMenuClick={() => setSidebarOpen(true)}
          businessId={businessId}
        />
        
        <main className="flex-1 overflow-auto p-4 lg:p-6">
          {children}
        </main>
        
        <footer className="bg-white border-t border-gray-200 px-4 lg:px-6 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-center text-sm text-gray-600">
            <div className="mb-2 sm:mb-0">© 2025 WaveOrder. All rights reserved.</div>
            <div className="flex space-x-4">
              <a href="/privacy" className="hover:text-teal-600 transition-colors">Privacy</a>
              <a href="/terms" className="hover:text-teal-600 transition-colors">Terms</a>
              <a href="/contact" className="hover:text-teal-600 transition-colors">Support</a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}