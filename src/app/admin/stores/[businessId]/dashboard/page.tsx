// src/app/admin/stores/[businessId]/dashboard/page.tsx
import { Dashboard } from '@/components/admin/dashboard/Dashboard'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Dashboard',
  robots: {
    index: false,
    follow: false,
  },
}

interface DashboardPageProps {
  params: Promise<{ businessId: string }>
}

export default async function DashboardPage({ params }: DashboardPageProps) {
  const { businessId } = await params
  return <Dashboard businessId={businessId} />
}