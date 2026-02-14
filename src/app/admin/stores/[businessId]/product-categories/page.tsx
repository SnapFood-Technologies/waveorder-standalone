// app/admin/stores/[businessId]/product-categories/page.tsx
import CategoriesManagement from '@/components/admin/categories/CategoriesManagement'
import { BusinessTypeGuard } from '@/components/admin/BusinessTypeGuard'

interface CategoriesPageProps {
  params: Promise<{ businessId: string }>
}

export default async function ProductCategoriesPage({ params }: CategoriesPageProps) {
  const { businessId } = await params
  return (
    <BusinessTypeGuard 
      businessId={businessId} 
      allowedTypes={['RESTAURANT', 'RETAIL', 'INSTAGRAM_SELLER', 'OTHER']}
      redirectTo={`/admin/stores/${businessId}/service-categories`}
    >
      <CategoriesManagement businessId={businessId} />
    </BusinessTypeGuard>
  )
}
