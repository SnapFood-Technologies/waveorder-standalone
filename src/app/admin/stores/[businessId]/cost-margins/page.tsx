// src/app/admin/stores/[businessId]/cost-margins/page.tsx
import CostMargins from '@/components/admin/cost-margins/CostMargins'

interface CostMarginsPageProps {
  params: Promise<{ businessId: string }>
}

export default async function CostMarginsPage({ params }: CostMarginsPageProps) {
  const { businessId } = await params
  
  return <CostMargins businessId={businessId} />
}
