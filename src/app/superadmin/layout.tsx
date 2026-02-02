'use client'

import { useState, useEffect } from 'react'
import { SuperAdminHeader } from '@/components/superadmin/layout/SuperAdminHeader'
import { SuperAdminSidebar } from '@/components/superadmin/layout/SuperAdminSidebar'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Toaster } from 'react-hot-toast'

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('dashboard')
  const { data: session, status } = useSession()
  const router = useRouter()

  // Protect route - only SUPER_ADMIN can access
  useEffect(() => {
    if (status === 'loading') return

    if (!session) {
      router.push('/auth/login')
      return
    }

    if (session.user.role !== 'SUPER_ADMIN') {
      router.push('/auth/login')
      return
    }
  }, [session, status, router])

  // Show loading while checking auth
  if (status === 'loading' || !session || session.user.role !== 'SUPER_ADMIN') {
    return (
      <div className="flex h-screen bg-gray-50 items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <Toaster position="top-right" />
      <div className="flex h-screen bg-gray-50">
        <SuperAdminSidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)}
        // @ts-ignore
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <SuperAdminHeader 
          onMenuClick={() => setSidebarOpen(true)}
        />
        
        <main className="flex-1 overflow-auto p-4 lg:p-6">
          {children}
        </main>
        
        <footer className="bg-white border-t border-gray-200 px-4 lg:px-6 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-center text-sm text-gray-600">
            <div className="mb-2 sm:mb-0">© 2026 WaveOrder SuperAdmin. All rights reserved.</div>
            <div className="flex space-x-4">
              <span className="text-red-600 font-medium">System Status: Operational</span>
            </div>
          </div>
        </footer>
      </div>
      </div>
    </>
  )
}