// src/app/admin/stores/[businessId]/dashboard/page.tsx
import { Dashboard } from '@/components/admin/dashboard/Dashboard'

interface DashboardPageProps {
  params: Promise<{ businessId: string }>
}

export default async function DashboardPage({ params }: DashboardPageProps) {
  const { businessId } = await params
  return <Dashboard businessId={businessId} />
}