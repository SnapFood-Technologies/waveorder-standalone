// app/admin/stores/[businessId]/products/page.tsx
import ProductsManagement from '@/components/admin/products/ProductsManagement'
import { BusinessTypeGuard } from '@/components/admin/BusinessTypeGuard'

interface ProductsPageProps {
  params: Promise<{ businessId: string }>
}

export default async function ProductsPage({ params }: ProductsPageProps) {
  const { businessId } = await params
  return (
    <BusinessTypeGuard 
      businessId={businessId} 
      allowedTypes={['RESTAURANT', 'RETAIL', 'INSTAGRAM_SELLER', 'OTHER']}
      redirectTo={`/admin/stores/${businessId}/services`}
    >
      <ProductsManagement businessId={businessId} />
    </BusinessTypeGuard>
  )
}