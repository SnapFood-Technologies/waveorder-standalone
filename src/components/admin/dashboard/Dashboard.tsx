// src/components/admin/dashboard/Dashboard.tsx
import { DashboardMetrics } from '@/components/admin/dashboard/DashboardMetrics'
import { BusinessStatusWidget } from '@/components/admin/dashboard/BusinessStatusWidget'
import { RecentOrdersWidget } from '@/components/admin/dashboard/RecentOrdersWidget'
import { RecentCustomersWidget } from '@/components/admin/dashboard/RecentCustomersWidget'
import { QuickActionsWidget } from '@/components/admin/dashboard/QuickActionsWidget'

interface DashboardProps {
  businessId: string
}

export function Dashboard({ businessId }: DashboardProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Welcome back! Here's what's happening with your business.
          </p>
        </div>
        <div className="mt-4 lg:mt-0">
          <QuickActionsWidget businessId={businessId} />
        </div>
      </div>

      {/* Metrics */}
      <DashboardMetrics businessId={businessId} />

      {/* Business Status */}
      <BusinessStatusWidget businessId={businessId} />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
        {/* Recent Orders */}
        <RecentOrdersWidget businessId={businessId} />

        {/* Recent Customers */}
        <RecentCustomersWidget businessId={businessId} />
      </div>
    </div>
  )
}