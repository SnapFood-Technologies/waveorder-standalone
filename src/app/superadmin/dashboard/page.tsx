import { SuperAdminDashboard } from '@/components/superadmin/SuperAdminDashboard'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Super Admin Dashboard',
  robots: {
    index: false,
    follow: false,
  },
}

export default function SuperAdminDashboardPage() {
  return <SuperAdminDashboard />
}
