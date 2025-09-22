// app/admin/stores/[businessId]/products/[productId]/inventory/activities/page.tsx
import { InventoryActivity } from '@/components/admin/inventory/InventoryActivity'

interface ProductInventoryActivitiesPageProps {
  params: Promise<{ businessId: string; productId: string }>
}

export default async function ProductInventoryActivitiesPage({ params }: ProductInventoryActivitiesPageProps) {
  const { businessId, productId } = await params
  
  return (
    <div>
      <InventoryActivity 
        businessId={businessId} 
        productId={productId}
      />
    </div>
  )
}