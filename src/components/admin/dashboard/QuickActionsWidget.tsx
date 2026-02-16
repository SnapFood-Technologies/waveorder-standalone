// src/components/admin/dashboard/QuickActionsWidget.tsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Settings, Users } from 'lucide-react'
import { useImpersonation } from '@/lib/impersonation'

interface QuickActionsWidgetProps {
  businessId: string
}

export function QuickActionsWidget({ businessId }: QuickActionsWidgetProps) {
  const { addParams } = useImpersonation(businessId)
  const [businessType, setBusinessType] = useState<string>('RESTAURANT')
  
  useEffect(() => {
    const fetchBusinessType = async () => {
      try {
        const response = await fetch(`/api/admin/stores/${businessId}`)
        if (response.ok) {
          const data = await response.json()
          setBusinessType(data.business.businessType || 'RESTAURANT')
        }
      } catch (error) {
        console.error('Error fetching business type:', error)
      }
    }
    fetchBusinessType()
  }, [businessId])
  
  const isSalon = businessType === 'SALON'
  
  return (
    <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 w-full sm:w-auto">
      <Link
        href={addParams(isSalon 
          ? `/admin/stores/${businessId}/appointments/create`
          : `/admin/stores/${businessId}/orders/create`)}
        className="flex items-center justify-center px-3 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors text-sm font-medium"
      >
        <Plus className="w-4 h-4 sm:mr-2" />
        <span className="hidden sm:inline ml-2 sm:ml-0">{isSalon ? 'New Appointment' : 'New Order'}</span>
        <span className="sm:hidden ml-1">{isSalon ? 'Appt' : 'Order'}</span>
      </Link>
      
      <Link
        href={addParams(isSalon 
          ? `/admin/stores/${businessId}/services`
          : `/admin/stores/${businessId}/products`)}
        className="flex items-center justify-center px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
      >
        <Plus className="w-4 h-4 sm:mr-2" />
        <span className="hidden sm:inline ml-2 sm:ml-0">{isSalon ? 'Add Service' : 'Add Product'}</span>
        <span className="sm:hidden ml-1">{isSalon ? 'Service' : 'Product'}</span>
      </Link>
      
      <Link
        href={addParams(`/admin/stores/${businessId}/customers/create`)}
        className="flex items-center justify-center px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
      >
        <Users className="w-4 h-4 sm:mr-2" />
        <span className="hidden sm:inline ml-2 sm:ml-0">Add Customer</span>
        <span className="sm:hidden ml-1">Customer</span>
      </Link>
      
      <Link
        href={addParams(`/admin/stores/${businessId}/settings/business`)}
        className="flex items-center justify-center px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
      >
        <Settings className="w-4 h-4 sm:mr-2" />
        <span className="hidden sm:inline ml-2 sm:ml-0">Settings</span>
        <span className="sm:hidden ml-1">Settings</span>
      </Link>
    </div>
  )
}