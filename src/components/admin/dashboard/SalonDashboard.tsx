// src/components/admin/dashboard/SalonDashboard.tsx
'use client'

import { SalonDashboardMetrics } from '@/components/admin/dashboard/SalonDashboardMetrics'
import { BusinessStatusWidget } from '@/components/admin/dashboard/BusinessStatusWidget'
import { RecentAppointmentsWidget } from '@/components/admin/dashboard/RecentAppointmentsWidget'
import { RecentCustomersWidget } from '@/components/admin/dashboard/RecentCustomersWidget'
import { QuickActionsWidget } from '@/components/admin/dashboard/QuickActionsWidget'
import { BusinessStorefrontViewsChart } from '@/components/admin/dashboard/BusinessStorefrontViewsChart'
import { useSubscription } from '@/hooks/useSubscription'

interface SalonDashboardProps {
  businessId: string
}

export function SalonDashboard({ businessId }: SalonDashboardProps) {
  const { isPro, loading: subscriptionLoading } = useSubscription()

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Welcome back! Here's what's happening with your salon.
          </p>
        </div>
        <div className="mt-4 lg:mt-0">
          <QuickActionsWidget businessId={businessId} />
        </div>
      </div>

      {/* Metrics */}
      <SalonDashboardMetrics businessId={businessId} />

      {/* Business Status */}
      <BusinessStatusWidget businessId={businessId} />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
        {/* Recent Appointments */}
        <RecentAppointmentsWidget businessId={businessId} />

        {/* Recent Customers */}
        <RecentCustomersWidget businessId={businessId} />

        {/* Storefront Page Views - Only for PRO plans */}
        {!subscriptionLoading && isPro && (
          <BusinessStorefrontViewsChart businessId={businessId} />
        )}
      </div>
    </div>
  )
}
