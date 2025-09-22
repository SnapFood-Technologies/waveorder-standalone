// app/admin/stores/[businessId]/inventory/adjustments/page.tsx
import StockAdjustmentsComponent from '@/components/admin/inventory/StockAdjustmentsComponent'

interface StockAdjustmentsPageProps {
  params: Promise<{ businessId: string }>
  searchParams: Promise<{ productId?: string }>
}

export default async function StockAdjustmentsPage({ 
  params, 
  searchParams 
}: StockAdjustmentsPageProps) {
  const { businessId } = await params
  const { productId } = await searchParams
  
  return (
    <StockAdjustmentsComponent 
      businessId={businessId} 
      initialProductId={productId}
    />
  )
}