// src/components/admin/dashboard/QuickActionsWidget.tsx
'use client'

import Link from 'next/link'
import { Plus, Eye, Settings, Users } from 'lucide-react'

interface QuickActionsWidgetProps {
  businessId: string
}

export function QuickActionsWidget({ businessId }: QuickActionsWidgetProps) {
  return (
    <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 w-full sm:w-auto">
      <Link
        href={`/admin/stores/${businessId}/orders/create`}
        className="flex items-center justify-center px-3 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors text-sm font-medium"
      >
        <Plus className="w-4 h-4 sm:mr-2" />
        <span className="hidden sm:inline ml-2 sm:ml-0">New Order</span>
        <span className="sm:hidden ml-1">Order</span>
      </Link>
      
      <Link
        href={`/admin/stores/${businessId}/products/create`}
        className="flex items-center justify-center px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
      >
        <Plus className="w-4 h-4 sm:mr-2" />
        <span className="hidden sm:inline ml-2 sm:ml-0">Add Product</span>
        <span className="sm:hidden ml-1">Product</span>
      </Link>
      
      <Link
        href={`/admin/stores/${businessId}/customers/create`}
        className="flex items-center justify-center px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
      >
        <Users className="w-4 h-4 sm:mr-2" />
        <span className="hidden sm:inline ml-2 sm:ml-0">Add Customer</span>
        <span className="sm:hidden ml-1">Customer</span>
      </Link>
      
      <Link
        href={`/admin/stores/${businessId}/settings`}
        className="flex items-center justify-center px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
      >
        <Settings className="w-4 h-4 sm:mr-2" />
        <span className="hidden sm:inline ml-2 sm:ml-0">Settings</span>
        <span className="sm:hidden ml-1">Settings</span>
      </Link>
    </div>
  )
}