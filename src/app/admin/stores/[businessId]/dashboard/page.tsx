// src/app/admin/stores/[businessId]/dashboard/page.tsx
import { Dashboard } from '@/components/admin/dashboard/Dashboard'
import { SalonDashboard } from '@/components/admin/dashboard/SalonDashboard'
import { prisma } from '@/lib/prisma'
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
  
  // Check business type to show appropriate dashboard
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { businessType: true }
  })

  if (business?.businessType === 'SALON') {
    return <SalonDashboard businessId={businessId} />
  }

  return <Dashboard businessId={businessId} />
}