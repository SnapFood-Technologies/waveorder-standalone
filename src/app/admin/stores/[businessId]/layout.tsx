// src/app/admin/stores/[businessId]/layout.tsx
'use client'

import { useState, useEffect } from 'react'
import { X, MessageCircle } from 'lucide-react'
import { AdminSidebar } from '@/components/admin/layout/AdminSidebar'
import { AdminHeader } from '@/components/admin/layout/AdminHeader'

export default function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { businessId: string }
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen bg-gray-50">
      <AdminSidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)}
        businessId={params.businessId}
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminHeader 
          onMenuClick={() => setSidebarOpen(true)}
          businessId={params.businessId}
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