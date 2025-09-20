// src/components/admin/dashboard/QuickActionsWidget.tsx
'use client'

import Link from 'next/link'
import { Plus, Eye, Settings, Users } from 'lucide-react'

interface QuickActionsWidgetProps {
  businessId: string
}

export function QuickActionsWidget({ businessId }: QuickActionsWidgetProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <Link
        href={`/admin/stores/${businessId}/orders/create`}
        className="inline-flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors text-sm font-medium"
      >
        <Plus className="w-4 h-4 mr-2" />
        New Order
      </Link>
      
      <Link
        href={`/admin/stores/${businessId}/products/create`}
        className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
      >
        <Plus className="w-4 h-4 mr-2" />
        Add Product
      </Link>
      
      <Link
        href={`/admin/stores/${businessId}/customers/create`}
        className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
      >
        <Users className="w-4 h-4 mr-2" />
        Add Customer
      </Link>
      
      <Link
        href={`/admin/stores/${businessId}/settings`}
        className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
      >
        <Settings className="w-4 h-4 mr-2" />
        Settings
      </Link>
    </div>
  )
}