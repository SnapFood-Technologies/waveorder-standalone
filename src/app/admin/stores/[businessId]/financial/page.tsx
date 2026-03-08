// app/admin/stores/[businessId]/financial/page.tsx
import { FinancialOverview } from '@/components/admin/financial/FinancialOverview'

interface FinancialPageProps {
  params: Promise<{ businessId: string }>
}

export default async function FinancialPage({ params }: FinancialPageProps) {
  const { businessId } = await params
  return <FinancialOverview businessId={businessId} />
}
