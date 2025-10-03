'use client'

import { useState, useEffect } from 'react'
import { AdminSidebar } from '@/components/admin/layout/AdminSidebar'
import { AdminHeader } from '@/components/admin/layout/AdminHeader'
import { BusinessProvider, useBusiness } from '@/contexts/BusinessContext'
import { ImpersonationBanner } from '@/components/superadmin/ImpersonationBanner'

function AdminLayoutContent({
  children,
  businessId,
}: {
  children: React.ReactNode
  businessId: string
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { loading, accessChecked } = useBusiness()

  // Show loading only while checking access
  if (loading || !accessChecked) {
    return (
      <div className="flex h-screen bg-gray-50 items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
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
        {/* Impersonation Banner - appears above header */}
        <ImpersonationBanner />
        
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

export default function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ businessId: string }>
}) {
  const [businessId, setBusinessId] = useState<string | null>(null)

  useEffect(() => {
    const getParams = async () => {
      const resolvedParams = await params
      setBusinessId(resolvedParams.businessId)
    }
    getParams()
  }, [params])

  // Wait for businessId before rendering provider
  if (!businessId) {
    return (
      <div className="flex h-screen bg-gray-50 items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
      </div>
    )
  }

  return (
    <BusinessProvider currentBusinessId={businessId}>
      <AdminLayoutContent businessId={businessId}>
        {children}
      </AdminLayoutContent>
    </BusinessProvider>
  )
}