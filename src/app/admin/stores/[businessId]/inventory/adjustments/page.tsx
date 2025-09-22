// app/admin/stores/[businessId]/inventory/adjustments/page.tsx
import StockAdjustmentsComponent from '@/components/admin/inventory/StockAdjustmentsComponent'

interface StockAdjustmentsPageProps {
  params: Promise<{ businessId: string }>
}

export default async function StockAdjustmentsPage({ params }: StockAdjustmentsPageProps) {
  const { businessId } = await params
  return <StockAdjustmentsComponent businessId={businessId} />
}
